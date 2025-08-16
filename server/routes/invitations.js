const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { isSuperAdmin, isInstitutionAdminOrHigher } = require('../middleware/auth');

// Models
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const Course = require('../models/Course');
const Institution = require('../models/Institution');

// Mail Service
const { sendInvitationEmail } = require('../services/mailService');

// @desc    Create and send a new invitation
// @route   POST /api/invitations
router.post('/', isInstitutionAdminOrHigher, async (req, res) => {
    const { email, role, institutionId, courseId } = req.body;
    const inviter = req.user;

    try {
        // Validation
        if (!email || !role) {
            return res.status(400).json({ message: 'Email and role are required.' });
        }

        let finalInstitutionId;

        // If inviting a professor, derive institution from the course
        if (role === 'profesor') {
            if (!courseId) return res.status(400).json({ message: 'Course is required to invite a professor.' });
            const course = await Course.findById(courseId);
            if (!course) return res.status(404).json({ message: 'Course not found.' });
            finalInstitutionId = course.institution;
        } else {
            finalInstitutionId = institutionId || inviter.institution;
        }

        if (!finalInstitutionId) {
            return res.status(400).json({ message: 'Institution is required for this role.' });
        }

        // Security Check: Ensure admin-institucion invites only to their own institution
        if (inviter.role === 'admin-institucion' && inviter.institution._id.toString() !== finalInstitutionId.toString()) {
            return res.status(403).json({ message: 'You can only invite users to your own institution.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }

        // Delete any previous pending invitation for this email
        await Invitation.findOneAndDelete({ email });

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        const newInvitation = new Invitation({
            email,
            role,
            institution: finalInstitutionId,
            course: courseId,
            token,
            expiresAt
        });

        await newInvitation.save();

        await sendInvitationEmail(email, token);

        res.status(201).json({ message: `Invitation sent to ${email}` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while sending invitation.' });
    }
});

// @desc    Verify an invitation token
// @route   GET /api/invitations/verify/:token
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const invitation = await Invitation.findOne({
            token: token,
            expiresAt: { $gt: Date.now() }
        });

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found or has expired.' });
        }

        res.json({ email: invitation.email, role: invitation.role });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// @desc    Complete registration from an invitation
// @route   POST /api/invitations/complete
router.post('/complete', async (req, res) => {
    const { token, name, password } = req.body;

    try {
        const invitation = await Invitation.findOne({
            token: token,
            expiresAt: { $gt: Date.now() }
        });

        if (!invitation) {
            return res.status(400).json({ message: 'Invitation not found or has expired.' });
        }

        const existingUser = await User.findOne({ email: invitation.email });
        if (existingUser) {
            await Invitation.findByIdAndDelete(invitation._id);
            return res.status(400).json({ message: 'This user has already been registered.' });
        }

        const newUser = new User({
            name,
            email: invitation.email,
            password,
            role: invitation.role,
            institution: invitation.institution
        });

        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);
        
        await newUser.save();

        // If the invitation was for a specific course, add the new user to it
        if (invitation.course) {
            await Course.findByIdAndUpdate(invitation.course, {
                $addToSet: { professors: newUser._id } // $addToSet prevents duplicates
            });
        }

        await Invitation.findByIdAndDelete(invitation._id);

        res.status(201).json({ message: 'Registration successful! You can now log in.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

module.exports = router;

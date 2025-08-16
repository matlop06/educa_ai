const express = require('express');
const router = express.Router();
const passport = require('passport');

// Middleware
const { ensureAuth } = require('../middleware/auth');

// Models
const User = require('../models/User');
const Course = require('../models/Course');

// Login Route
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ message: info.message || 'Credenciales incorrectas.' });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            // Return user info on successful login, which is useful for the client
            return res.status(200).json({
                message: 'Inicio de sesión exitoso.',
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    institution: user.institution
                }
            });
        });
    })(req, res, next);
});

// @desc    Join a course as a student
// @route   POST /api/auth/join-course
// SECURED: Now requires user to be authenticated
router.post('/join-course', ensureAuth, async (req, res) => {
    try {
        const { enrollmentCode } = req.body;
        
        // req.user is available from the ensureAuth middleware.
        // It's better to fetch the user again to ensure we have the latest document.
        const user = await User.findById(req.user.id);

        if (!enrollmentCode) {
            return res.status(400).json({ message: 'El código de inscripción es requerido.' });
        }

        const course = await Course.findOne({ enrollmentCode });
        if (!course) {
            return res.status(404).json({ message: 'Código de curso no válido.' });
        }

        // Add course to user's list if not already present
        if (!user.courses.includes(course._id)) {
            user.courses.push(course._id);
            await user.save();
            res.status(200).json({ message: 'Inscripción al curso exitosa.' });
        } else {
            res.status(200).json({ message: 'Ya estás inscrito en este curso.' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error del servidor.' });
    }
});

// Logout Route
// IMPROVED: Returns JSON and properly destroys the session.
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.session.destroy((err) => {
            if (err) {
                // Even if session destruction fails, proceed with clearing cookie and sending response
                console.error("Session destruction failed:", err);
            }
            res.clearCookie('connect.sid'); // Default session cookie name
            return res.status(200).json({ message: 'Cierre de sesión exitoso.' });
        });
    });
});

module.exports = router;
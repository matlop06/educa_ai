const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isSuperAdmin } = require('../middleware/auth');

// Load Models
const Institution = require('../models/Institution');
const User = require('../models/User');
const Course = require('../models/Course');
const Assistant = require('../models/Assistant');
const Invitation = require('../models/Invitation');

// Protect all routes in this file
router.use(isSuperAdmin);

// @desc    Get all institutions
// @route   GET /api/institutions
router.get('/', async (req, res) => {
    try {
        const institutions = await Institution.find().sort({ name: 1 });
        res.json(institutions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// @desc    Create a new institution and its administrator
// @route   POST /api/institutions
router.post('/', async (req, res) => {
    const { institutionName, adminName, adminEmail } = req.body;

    // Basic validation
    if (!institutionName || !adminName || !adminEmail) {
        return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Check if institution or admin email already exists
        const existingInstitution = await Institution.findOne({ name: institutionName }).session(session);
        if (existingInstitution) {
            throw new Error('La institución ya existe.');
        }

        const existingAdmin = await User.findOne({ email: adminEmail }).session(session);
        if (existingAdmin) {
            throw new Error('El correo electrónico del administrador ya está en uso.');
        }

        // Create the institution
        const newInstitution = new Institution({ name: institutionName });
        await newInstitution.save({ session });

        // Generate a random password for the admin
        const genericPassword = Math.random().toString(36).slice(-8);

        // Create the admin user
        const newAdmin = new User({
            name: adminName,
            email: adminEmail,
            password: genericPassword, // The password will be hashed by the pre-save hook
            role: 'admin-institucion',
            institution: newInstitution._id
        });
        await newAdmin.save({ session });
        
        await session.commitTransaction();
        session.endSession();

        // TODO: Send an email to the new admin with their credentials
        // For now, we'll return the password in the response for testing purposes.
        // In a real-world scenario, this is a security risk.
        res.status(201).json({
            message: 'Institución y administrador creados con éxito.',
            institution: newInstitution,
            admin: {
                _id: newAdmin._id,
                name: newAdmin.name,
                email: newAdmin.email,
                role: newAdmin.role
            },
            // REMOVE IN PRODUCTION
            generatedPassword: genericPassword 
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error(err);
        // Send a more specific error message if it's one of our custom errors
        if (err.message === 'La institución ya existe.' || err.message === 'El correo electrónico del administrador ya está en uso.') {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// @desc    Update an institution's name
// @route   PUT /api/institutions/:id
router.put('/:id', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'El nombre es requerido.' });
        }

        // Check if another institution already has the new name
        const existingInstitution = await Institution.findOne({ name: name, _id: { $ne: req.params.id } });
        if (existingInstitution) {
            return res.status(400).json({ message: 'Ya existe otra institución con ese nombre.' });
        }

        const institution = await Institution.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true, runValidators: true }
        );

        if (!institution) {
            return res.status(404).json({ message: 'Institución no encontrada.' });
        }

        res.json(institution);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// @desc    Delete an institution and all related data
// @route   DELETE /api/institutions/:id
router.delete('/:id', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const institutionId = req.params.id;

        const institution = await Institution.findById(institutionId).session(session);
        if (!institution) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Institución no encontrada.' });
        }

        // Delete related data
        await Assistant.deleteMany({ institution: institutionId }).session(session);
        await Course.deleteMany({ institution: institutionId }).session(session);
        await User.deleteMany({ institution: institutionId }).session(session);
        await Invitation.deleteMany({ institution: institutionId }).session(session);
        
        // Finally, delete the institution itself
        await Institution.findByIdAndDelete(institutionId).session(session);

        await session.commitTransaction();
        session.endSession();

        res.status(204).send();
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

module.exports = router;

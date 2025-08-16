const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { ensureAuth, isSuperAdmin } = require('../middleware/auth');

// Models
const User = require('../models/User');
const Course = require('../models/Course');
const Assistant = require('../models/Assistant');

// @desc    Get all users
// @route   GET /api/users
router.get('/', isSuperAdmin, async (req, res) => {
    try {
        const users = await User.find().populate('institution', 'name').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete a user
// @route   DELETE /api/users/:id
router.delete('/:id', isSuperAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Clean up associations
        await Course.updateMany({ professors: userId }, { $pull: { professors: userId } });
        await Course.updateMany({ students: userId }, { $pull: { students: userId } });
        await Assistant.deleteMany({ user: userId });

        await User.findByIdAndDelete(userId);

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Change user password
// @route   PUT /api/users/change-password
router.put('/change-password', ensureAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Por favor, proporciona la contraseña actual y la nueva.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Check if current password matches
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'La contraseña actual es incorrecta.' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Contraseña actualizada exitosamente.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor.' });
    }
});

module.exports = router;

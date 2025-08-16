const Course = require('../models/Course');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getCourses = async (req, res) => {
    try {
        let query = {};
        if (req.user) {
            if (req.user.role === 'admin-institucion') {
                query.institution = req.user.institution;
            } else if (req.user.role === 'profesor') {
                query.professors = req.user.id;
            }
        }
        
        const courses = await Course.find(query)
            .populate('institution', 'name')
            .populate('professors', 'name email')
            .sort({ name: 1 });

        res.json(courses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

const mongoose = require('mongoose');

exports.createCourse = async (req, res) => {
    const { courseName, professorName, professorEmail, institutionId } = req.body;
    
    if (!courseName || !professorName || !professorEmail) {
        return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let finalInstitutionId;
        if (req.user.role === 'super-admin') {
            if (!institutionId) {
                throw new Error('La institución es requerida para el super-admin.');
            }
            finalInstitutionId = institutionId;
        } else {
            finalInstitutionId = req.user.institution;
        }

        const existingProfessor = await User.findOne({ email: professorEmail }).session(session);
        if (existingProfessor) {
            throw new Error('El correo electrónico del profesor ya está en uso.');
        }

        const genericPassword = Math.random().toString(36).slice(-8);

        const newProfessor = new User({
            name: professorName,
            email: professorEmail,
            password: genericPassword,
            role: 'profesor',
            institution: finalInstitutionId,
        });
        await newProfessor.save({ session });

        const enrollmentCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const newCourse = new Course({
            name: courseName,
            institution: finalInstitutionId,
            professors: [newProfessor._id],
            enrollmentCode,
        });
        await newCourse.save({ session });

        // Add course to professor's list of courses
        newProfessor.courses.push(newCourse._id);
        await newProfessor.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            message: 'Curso y profesor creados con éxito.',
            course: newCourse,
            professor: {
                _id: newProfessor._id,
                name: newProfessor.name,
                email: newProfessor.email,
            },
            generatedPassword: genericPassword,
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error(err);
        if (err.message.includes('La institución es requerida') || err.message.includes('El correo electrónico del profesor ya está en uso')) {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'El nombre es requerido.' });
        }

        const course = req.course;
        course.name = name;
        await course.save();
        res.json(course);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.assignProfessor = async (req, res) => {
    try {
        const { professorId } = req.body;
        const course = req.course;

        if (!professorId) {
            return res.status(404).json({ message: 'Profesor no encontrado.' });
        }

        if (!course.professors.includes(professorId)) {
            course.professors.push(professorId);
            await course.save();
        }
        
        res.json(course);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.createProfessor = async (req, res) => {
    const { name, email, password } = req.body;
    const course = req.course;

    try {
        let professor = await User.findOne({ email });
        if (professor) {
            return res.status(400).json({ message: 'Un usuario con este correo ya existe.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        professor = new User({
            name,
            email,
            password: hashedPassword,
            role: 'profesor',
            institution: course.institution,
            courses: [course._id]
        });
        
        await professor.save();

        course.professors.push(professor._id);
        await course.save();

        res.status(201).json(professor);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.removeProfessor = async (req, res) => {
    try {
        const { professorId } = req.params;
        const course = req.course;

        await Course.findByIdAndUpdate(course._id, {
            $pull: { professors: professorId }
        });
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

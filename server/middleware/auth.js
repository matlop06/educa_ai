module.exports = {
    ensureAuth: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.status(401).json({ message: 'No autorizado. Por favor, inicia sesión.' });
    },
    ensureGuest: function (req, res, next) {
        if (req.isAuthenticated()) {
            return res.redirect('/admin.html');
        }
        return next();
    },
    isSuperAdmin: function (req, res, next) {
        if (req.isAuthenticated() && req.user.role === 'super-admin') {
            return next();
        }
        res.status(403).json({ message: 'Acceso denegado. Se requiere rol de Super Administrador.' });
    },
    isInstitutionAdminOrHigher: function (req, res, next) {
        if (req.isAuthenticated() && (req.user.role === 'admin-institucion' || req.user.role === 'super-admin')) {
            return next();
        }
        res.status(403).json({ message: 'Acceso denegado. Se requiere rol de Administrador de Institución o superior.' });
    },
    isProfessorOrHigher: function (req, res, next) {
        if (req.isAuthenticated() && (req.user.role === 'profesor' || req.user.role === 'admin-institucion' || req.user.role === 'super-admin')) {
            return next();
        }
        res.status(403).json({ message: 'Acceso denegado. Se requiere rol de Profesor o superior.' });
    },

    ensureCourseOwnership: async function (req, res, next) {
        try {
            const courseId = req.params.id || req.params.courseId;
            const course = await require('../models/Course').findById(courseId);

            if (!course) {
                return res.status(404).json({ message: 'Curso no encontrado.' });
            }

            // Only perform ownership check for non-super-admins
            if (req.user.role === 'admin-institucion') {
                if (!req.user.institution || course.institution.toString() !== req.user.institution._id.toString()) {
                    return res.status(403).json({ message: 'No autorizado para acceder a este curso.' });
                }
            }

            // Attach the course for all roles
            req.course = course;
            return next();
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
    }
};

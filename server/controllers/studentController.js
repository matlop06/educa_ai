const User = require('../models/User');
const Assistant = require('../models/Assistant');

// @desc    Get all assistants for the logged-in student based on their courses
// @route   GET /api/student/assistants
// @access  Private (Students only)
exports.getStudentAssistants = async (req, res) => {
    try {
        // Find the logged-in user and populate their courses
        const student = await User.findById(req.user.id).populate('courses');
        if (!student || student.role !== 'estudiante') {
            return res.status(403).json({ message: 'Acceso denegado.' });
        }

        const courseIds = student.courses.map(course => course._id);

        if (courseIds.length === 0) {
            return res.json([]); // Return empty array if student is not in any courses
        }

        // Find all assistants that belong to any of the student's courses
        const assistants = await Assistant.find({ course: { $in: courseIds } })
            .populate('course', 'name')
            .populate('institution', 'name')
            .lean(); // Use lean for better performance

        // For each assistant, find the last interaction
        const assistantsWithLastInteraction = await Promise.all(assistants.map(async (assistant) => {
            const conversation = await require('../models/Conversation').findOne({
                user: req.user.id,
                assistant: assistant._id
            }).sort({ updatedAt: -1 });

            return {
                ...assistant,
                lastInteraction: conversation ? conversation.history.slice(-1)[0] : null, // Get the last message
                lastInteractionDate: conversation ? conversation.updatedAt : null
            };
        }));

        res.json(assistantsWithLastInteraction);
    } catch (error) {
        console.error('Error fetching student assistants:', error);
        res.status(500).json({ message: 'Error del servidor.' });
    }
};

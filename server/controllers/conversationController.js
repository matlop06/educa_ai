const Conversation = require('../models/Conversation');

// @desc    Get a conversation for a user and assistant
// @route   GET /api/student/conversations/:assistantId
// @access  Private
exports.getConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            user: req.user.id,
            assistant: req.params.assistantId
        });

        if (!conversation) {
            return res.status(404).json({ message: 'No se encontró ninguna conversación.' });
        }

        res.json(conversation);
    } catch (error) {
        console.error('Error getting conversation:', error);
        res.status(500).json({ message: 'Error del servidor.' });
    }
};

// @desc    Update a conversation history
// @route   PUT /api/student/conversations/:assistantId
// @access  Private
exports.saveConversation = async (req, res) => {
    try {
        const { history } = req.body;

        const conversation = await Conversation.findOneAndUpdate(
            { user: req.user.id, assistant: req.params.assistantId },
            { history: history },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json(conversation);
    } catch (error) {
        console.error('Error saving conversation:', error);
        res.status(500).json({ message: 'Error del servidor.' });
    }
};

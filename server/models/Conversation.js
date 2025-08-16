const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    assistant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assistant',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    history: [{
        role: {
            type: String, // 'user' or 'model'
            required: true
        },
        parts: [{
            text: {
                type: String,
                required: true
            }
        }]
    }]
}, {
    timestamps: true
});

// Create a compound index to ensure each user-assistant pair has only one conversation
ConversationSchema.index({ user: 1, assistant: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', ConversationSchema);

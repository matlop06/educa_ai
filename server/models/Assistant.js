const mongoose = require('mongoose');

const AssistantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    instructions: {
        type: String,
        required: true
    },
    style: {
        type: String,
        required: true
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution'
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vectorStorePath: {
        type: String
    },
    evaluations: [{
        title: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        questions: [{
            text: { type: String, required: true },
            options: { type: [String], default: [] }, // For multiple choice
            correctAnswer: { type: String, required: true }
        }]
    }]
}, {
    timestamps: true // Añade automáticamente los campos createdAt y updatedAt
});

module.exports = mongoose.model('Assistant', AssistantSchema);

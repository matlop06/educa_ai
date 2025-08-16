const mongoose = require('mongoose');

const EvaluationResultSchema = new mongoose.Schema({
    evaluation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evaluation',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: [{
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        },
        answer: String,
        isCorrect: Boolean
    }],
    score: {
        type: Number,
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EvaluationResult', EvaluationResultSchema);

const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    professors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    enrollmentCode: {
        type: String,
        unique: true,
        sparse: true // Allows multiple documents to have a null value for this field
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Course', CourseSchema);

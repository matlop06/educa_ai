const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
    assistant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assistant',
        required: true
    },
    user: { // Para futura implementación de cuentas de alumnos
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    question: {
        type: String,
        required: true
    },
    response: {
        type: String,
        required: true
    },
    // Podríamos añadir más campos en el futuro, como un feedback del alumno
    // isHelpful: Boolean 
}, {
    timestamps: true
});

module.exports = mongoose.model('Interaction', InteractionSchema);

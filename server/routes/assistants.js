const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    getAssistants,
    getAssistantById,
    createAssistant,
    updateAssistant,
    deleteAssistant,
    addEvaluation,
    updateEvaluation,
    deleteEvaluation,
    generateEvaluationDraft,
    generateEvaluationSummary, // Added
    generateAnswers
} = require('../controllers/assistantController');
const { isProfessorOrHigher } = require('../middleware/auth');

router.post('/generate-evaluation-draft', isProfessorOrHigher, generateEvaluationDraft);
router.post('/generate-summary', generateEvaluationSummary); // No auth needed for students
router.post('/generate-answers', isProfessorOrHigher, generateAnswers);

// Configuración de Multer para la subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dest = path.resolve(__dirname, '..', '..', 'uploads');
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

router.route('/')
    .get(isProfessorOrHigher, getAssistants)
    .post(isProfessorOrHigher, upload.single('knowledgeFile'), createAssistant);

router.route('/:id')
    .get(getAssistantById) // isProfessorOrHigher removed to make assistants public
    .put(isProfessorOrHigher, upload.single('knowledgeFile'), updateAssistant)
    .delete(isProfessorOrHigher, deleteAssistant);

router.route('/:id/evaluations')
    .post(isProfessorOrHigher, addEvaluation);

router.route('/:id/evaluations/:evalId')
    .put(isProfessorOrHigher, updateEvaluation)
    .delete(isProfessorOrHigher, deleteEvaluation);

module.exports = router;

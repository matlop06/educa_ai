const express = require('express');
const router = express.Router();
const { submitEvaluation, getEvaluationResult } = require('../controllers/evaluationController');
const { ensureAuth } = require('../middleware/auth');

// @desc    Submit an evaluation
// @route   POST /api/evaluations/:evaluationId/submit
router.post('/:evaluationId/submit', ensureAuth, submitEvaluation);

// @desc    Get evaluation results
// @route   GET /api/evaluations/results/:resultId
router.get('/results/:resultId', ensureAuth, getEvaluationResult);

module.exports = router;

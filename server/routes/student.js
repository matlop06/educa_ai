const express = require('express');
const router = express.Router();
const { getStudentAssistants } = require('../controllers/studentController');
const { ensureAuth } = require('../middleware/auth');

// @route   GET /api/student/assistants
// @desc    Get all assistants for the logged-in student
// @access  Private
router.get('/assistants', ensureAuth, getStudentAssistants);

module.exports = router;

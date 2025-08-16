const express = require('express');
const router = express.Router();
const { getConversation, saveConversation } = require('../controllers/conversationController');
const { ensureAuth } = require('../middleware/auth');

// @route   GET /api/student/conversations/:assistantId
// @desc    Get a conversation for a user and assistant
// @access  Private
router.get('/:assistantId', ensureAuth, getConversation);

// @route   PUT /api/student/conversations/:assistantId
// @desc    Update a conversation history
// @access  Private
router.put('/:assistantId', ensureAuth, saveConversation);

module.exports = router;

const express = require('express');
const { protect } = require('../middleware/auth');
const { createComment, getCommentsByPost, updateComment, deleteComment } = require('../controllers/commentController');

const router = express.Router();

router.post('/', protect, createComment);
router.get('/post/:postId', protect, getCommentsByPost);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');

const router = express.Router();

const createValidation = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ min: 2, max: 500 })
    .withMessage('Comment must be between 2 and 500 characters'),
  body('author').notEmpty().withMessage('Author is required').isMongoId().withMessage('Author must be a valid user id'),
  body('post').notEmpty().withMessage('Post is required').isMongoId().withMessage('Post must be a valid post id'),
];

const updateValidation = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ min: 2, max: 500 })
    .withMessage('Comment must be between 2 and 500 characters'),
];

router.post('/', createValidation, validate, createComment);
router.get('/post/:postId', getCommentsByPost);
router.put('/:id', updateValidation, validate, updateComment);
router.delete('/:id', deleteComment);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  createPost,
  getAllPosts,
  getAllPostsAdmin,
  getPostById,
  updatePost,
  likePost,
  togglePublish,
  deletePost,
} = require('../controllers/postController');

const router = express.Router();

const CATEGORIES = ['Tech', 'Lifestyle', 'Education', 'Business', 'Other'];

const createValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 150 })
    .withMessage('Title must be between 5 and 150 characters'),
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 20 })
    .withMessage('Content must be at least 20 characters long'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('tags')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Tags must be an array with a maximum of 5 items'),
  body('author').notEmpty().withMessage('Author is required').isMongoId().withMessage('Author must be a valid user id'),
];

const updateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 150 })
    .withMessage('Title must be between 5 and 150 characters'),
  body('content')
    .optional()
    .isLength({ min: 20 })
    .withMessage('Content must be at least 20 characters long'),
  body('category')
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('tags')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Tags must be an array with a maximum of 5 items'),
  body('isPublished').optional().isBoolean().withMessage('isPublished must be true or false'),
];

// IMPORTANT: /all must be declared before /:id, otherwise Express
// treats "all" as an :id value and routes it to getPostById instead.
router.post('/', createValidation, validate, createPost);
router.get('/', getAllPosts);
router.get('/all', getAllPostsAdmin);
router.get('/:id', getPostById);
router.put('/:id', updateValidation, validate, updatePost);
router.patch('/:id/like', likePost);
router.patch('/:id/publish', togglePublish);
router.delete('/:id', deletePost);

module.exports = router;

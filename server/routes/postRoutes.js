const express = require('express');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createPost,
  getFeed,
  getAllPosts,
  getPostById,
  updatePost,
  likePost,
  deletePost,
} = require('../controllers/postController');

const router = express.Router();

router.post('/', protect, upload.single('image'), createPost);
router.get('/feed', protect, getFeed);
router.get('/', protect, getAllPosts);
router.get('/:id', protect, getPostById);
router.put('/:id', protect, upload.single('image'), updatePost);
router.patch('/:id/like', protect, likePost);
router.delete('/:id', protect, deletePost);

module.exports = router;

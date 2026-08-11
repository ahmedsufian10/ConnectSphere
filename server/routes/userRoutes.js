const express = require('express');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getAllUsers, getUserById, updateProfile, followUser, deleteUser } = require('../controllers/userController');

const router = express.Router();

router.get('/', protect, getAllUsers);
router.get('/:id', protect, getUserById);
router.put(
  '/profile',
  protect,
  upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'coverPhoto', maxCount: 1 }]),
  updateProfile
);
router.post('/:id/follow', protect, followUser);
router.delete('/:id', protect, deleteUser);

module.exports = router;

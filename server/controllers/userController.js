const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// @desc    Get all users / search users
// @route   GET /api/users?search=name
// @access  Private
const getAllUsers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    const users = await User.find(filter).select('name email bio avatar followers following');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'name avatar')
      .populate('following', 'name avatar');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const posts = await Post.find({ author: user._id, isPublished: true })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar');

    res.status(200).json({
      success: true,
      data: { ...user.toObject(), posts },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user's profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;

    // Handle uploaded images
    if (req.files) {
      if (req.files.avatar) user.avatar = `/uploads/${req.files.avatar[0].filename}`;
      if (req.files.coverPhoto) user.coverPhoto = `/uploads/${req.files.coverPhoto[0].filename}`;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        coverPhoto: user.coverPhoto,
        role: user.role,
        followers: user.followers,
        following: user.following,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
const followUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    const isFollowing = currentUser.following.includes(targetUser._id);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUser._id.toString()
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUser._id.toString()
      );
    } else {
      // Follow
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);

      // Create notification
      await Notification.create({
        recipient: targetUser._id,
        sender: currentUser._id,
        type: 'follow',
      });

      // Emit socket event if available
      if (req.app.get('io')) {
        const io = req.app.get('io');
        const onlineUsers = req.app.get('onlineUsers');
        const recipientSocketId = onlineUsers && onlineUsers.get(targetUser._id.toString());
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('newNotification', {
            type: 'follow',
            sender: { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar },
          });
        }
      }
    }

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      data: { isFollowing: !isFollowing },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (admin or self)
// @route   DELETE /api/users/:id
// @access  Private
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Only admin or the user themselves can delete
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const Comment = require('../models/Comment');
    const userPosts = await Post.find({ author: user._id }).select('_id');
    const postIds = userPosts.map((p) => p._id);

    await Comment.deleteMany({ post: { $in: postIds } });
    await Comment.deleteMany({ author: user._id });
    await Post.deleteMany({ author: user._id });
    await user.deleteOne();

    res.status(200).json({ success: true, message: 'User deleted', data: null });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateProfile, followUser, deleteUser };

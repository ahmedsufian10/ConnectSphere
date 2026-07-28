const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// @route   POST /api/users/register
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, bio, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email is already registered',
      });
    }

    const user = await User.create({ name, email, password, bio, role });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/users/login
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/users
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('name email bio role');

    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const publishedPosts = await Post.find({
      author: user._id,
      isPublished: true,
    }).select('title category tags likes createdAt');

    res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: {
        ...user.toObject(),
        publishedPosts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { name, bio, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (role !== undefined) user.role = role;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/users/:id
// Deleting a user cascades: all their posts are removed, all comments
// they authored are removed, and their id is pulled from any other
// post's comments array so no dangling references remain.
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const userPosts = await Post.find({ author: user._id }).select('_id');
    const postIds = userPosts.map((p) => p._id);

    // Remove comments that belong to this user's own posts
    await Comment.deleteMany({ post: { $in: postIds } });
    // Remove comments this user wrote on other people's posts
    await Comment.deleteMany({ author: user._id });
    // Remove this user's posts
    await Post.deleteMany({ author: user._id });
    // Finally remove the user
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User and all associated posts and comments deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};

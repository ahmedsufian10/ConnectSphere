const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper to emit socket notifications
const emitNotification = (req, recipientId, payload) => {
  const io = req.app.get('io');
  const onlineUsers = req.app.get('onlineUsers');
  if (io && onlineUsers) {
    const socketId = onlineUsers.get(recipientId.toString());
    if (socketId) io.to(socketId).emit('newNotification', payload);
  }
};

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res, next) => {
  try {
    const { content, category, tags } = req.body;
    let image = '';
    if (req.file) image = `/uploads/${req.file.filename}`;

    const post = await Post.create({
      content,
      category,
      tags: tags ? JSON.parse(tags) : [],
      author: req.user._id,
      image,
    });

    const populated = await post.populate('author', 'name avatar');

    res.status(201).json({ success: true, message: 'Post created', data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get feed (posts from people you follow + your own)
// @route   GET /api/posts/feed
// @access  Private
const getFeed = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id).select('following');
    const ids = [...currentUser.following, req.user._id];

    const posts = await Post.find({ author: { $in: ids }, isPublished: true })
      .populate('author', 'name avatar')
      .populate({ path: 'comments', populate: { path: 'author', select: 'name avatar' } })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all published posts (explore)
// @route   GET /api/posts
// @access  Private
const getAllPosts = async (req, res, next) => {
  try {
    const { category, tag, search, sort } = req.query;
    const filter = { isPublished: true };

    if (category) filter.category = new RegExp(`^${category}$`, 'i');
    if (tag) filter.tags = { $in: [new RegExp(`^${tag}$`, 'i')] };
    if (search) filter.content = new RegExp(search, 'i');

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') sortOption = { 'likes.length': -1 };

    const posts = await Post.find(filter)
      .populate('author', 'name avatar')
      .populate({ path: 'comments', populate: { path: 'author', select: 'name avatar' } })
      .sort(sortOption);

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Private
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar bio')
      .populate({ path: 'comments', populate: { path: 'author', select: 'name avatar' } });

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { content, category, tags, isPublished } = req.body;
    if (content !== undefined) post.content = content;
    if (category !== undefined) post.category = category;
    if (tags !== undefined) post.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    if (isPublished !== undefined) post.isPublished = isPublished;
    if (req.file) post.image = `/uploads/${req.file.filename}`;

    await post.save();
    const populated = await post.populate('author', 'name avatar');
    res.status(200).json({ success: true, message: 'Post updated', data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Like or unlike a post
// @route   PATCH /api/posts/:id/like
// @access  Private
const likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const userId = req.user._id.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(req.user._id);

      // Notify post author (if not liking own post)
      if (post.author.toString() !== userId) {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          post: post._id,
        });
        emitNotification(req, post.author, {
          type: 'like',
          sender: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar },
          post: post._id,
        });
      }
    }

    await post.save();
    res.status(200).json({
      success: true,
      message: alreadyLiked ? 'Post unliked' : 'Post liked',
      data: { likes: post.likes, isLiked: !alreadyLiked },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    res.status(200).json({ success: true, message: 'Post deleted', data: null });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPost, getFeed, getAllPosts, getPostById, updatePost, likePost, deletePost };

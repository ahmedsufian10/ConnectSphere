const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// @desc    Add a comment to a post
// @route   POST /api/comments
// @access  Private
const createComment = async (req, res, next) => {
  try {
    const { text, post } = req.body;

    const parentPost = await Post.findById(post);
    if (!parentPost) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = await Comment.create({ text, author: req.user._id, post });
    parentPost.comments.push(comment._id);
    await parentPost.save();

    const populated = await comment.populate('author', 'name avatar');

    // Notify post author if not commenting on own post
    if (parentPost.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: parentPost.author,
        sender: req.user._id,
        type: 'comment',
        post: parentPost._id,
      });

      const io = req.app.get('io');
      const onlineUsers = req.app.get('onlineUsers');
      if (io && onlineUsers) {
        const socketId = onlineUsers.get(parentPost.author.toString());
        if (socketId) {
          io.to(socketId).emit('newNotification', {
            type: 'comment',
            sender: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar },
            post: parentPost._id,
          });
        }
      }
    }

    res.status(201).json({ success: true, message: 'Comment added', data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Private
const getCommentsByPost = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
const updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    comment.text = req.body.text;
    await comment.save();

    res.status(200).json({ success: true, message: 'Comment updated', data: comment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } });
    await comment.deleteOne();

    res.status(200).json({ success: true, message: 'Comment deleted', data: null });
  } catch (error) {
    next(error);
  }
};

module.exports = { createComment, getCommentsByPost, updateComment, deleteComment };

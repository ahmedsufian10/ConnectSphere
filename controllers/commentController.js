const Comment = require('../models/Comment');
const Post = require('../models/Post');

// @route   POST /api/comments
// Also pushes the new comment's id into the parent post's comments array
// so Post.find().populate('comments') stays in sync.
const createComment = async (req, res, next) => {
  try {
    const { text, author, post } = req.body;

    const parentPost = await Post.findById(post);
    if (!parentPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const comment = await Comment.create({ text, author, post });

    parentPost.comments.push(comment._id);
    await parentPost.save();

    const populatedComment = await comment.populate('author', 'name');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/comments/post/:postId
const getCommentsByPost = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Comments fetched successfully',
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/comments/:id
const updateComment = async (req, res, next) => {
  try {
    const { text } = req.body;

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    comment.text = text;
    await comment.save();

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/comments/:id
// Also pulls the comment's id out of the parent post's comments array.
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id },
    });

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
};

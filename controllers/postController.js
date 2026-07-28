const Post = require('../models/Post');
const Comment = require('../models/Comment');

// @route   POST /api/posts
const createPost = async (req, res, next) => {
  try {
    const { title, content, category, tags, author, isPublished } = req.body;

    const post = await Post.create({
      title,
      content,
      category,
      tags,
      author,
      isPublished,
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/posts
// Public listing — published posts only. Supports:
//   ?category=Tech      case-insensitive exact match
//   ?tag=javascript      matches posts whose tags array contains this tag
//   ?search=keyword       regex search across title and content
//   ?sort=latest|popular   createdAt desc (default) or likes desc
const getAllPosts = async (req, res, next) => {
  try {
    const { category, tag, search, sort } = req.query;

    const filter = { isPublished: true };

    if (category) {
      filter.category = new RegExp(`^${category}$`, 'i');
    }

    if (tag) {
      filter.tags = { $in: [new RegExp(`^${tag}$`, 'i')] };
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') },
      ];
    }

    let sortOption = { createdAt: -1 }; // default: latest first
    if (sort === 'popular') sortOption = { likes: -1 };
    if (sort === 'latest') sortOption = { createdAt: -1 };

    const posts = await Post.find(filter)
      .populate('author', 'name email')
      .sort(sortOption);

    res.status(200).json({
      success: true,
      message: 'Posts fetched successfully',
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/posts/all
// Admin use — returns every post regardless of publish state
const getAllPostsAdmin = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'All posts fetched successfully',
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/posts/:id
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'name' },
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Post fetched successfully',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/posts/:id
const updatePost = async (req, res, next) => {
  try {
    const { title, content, category, tags, isPublished } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (category !== undefined) post.category = category;
    if (tags !== undefined) post.tags = tags;
    if (isPublished !== undefined) post.isPublished = isPublished;

    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/posts/:id/like
const likePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Post liked successfully',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/posts/:id/publish
const togglePublish = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    post.isPublished = !post.isPublished;
    await post.save();

    res.status(200).json({
      success: true,
      message: `Post is now ${post.isPublished ? 'published' : 'unpublished'}`,
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/posts/:id
// Cascades: deleting a post removes all comments attached to it.
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Post and its comments deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getAllPostsAdmin,
  getPostById,
  updatePost,
  likePost,
  togglePublish,
  deletePost,
};

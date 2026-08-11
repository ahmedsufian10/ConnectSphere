import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import AvatarImg from '../components/AvatarImg';

const API_BASE = 'http://localhost:5000';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState([]);

  const fetchPost = async () => {
    try {
      const { data } = await api.get(`/posts/${id}`);
      setPost(data.data);
      setComments(data.data.comments || []);
      setLikes(data.data.likes || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPost(); }, [id]);

  const isLiked = likes.some((l) => (l._id || l) === user?._id);

  const handleLike = async () => {
    const { data } = await api.patch(`/posts/${id}/like`);
    setLikes(data.data.likes);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    const { data } = await api.post('/comments', { text: commentInput, post: id });
    setComments((prev) => [data.data, ...prev]);
    setCommentInput('');
  };

  const handleDeleteComment = async (commentId) => {
    await api.delete(`/comments/${commentId}`);
    setComments((prev) => prev.filter((c) => c._id !== commentId));
  };

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />;
  if (!post) return <div className="page-container"><p>Post not found</p></div>;

  const imageUrl = post.image
    ? (post.image.startsWith('http') ? post.image : `${API_BASE}${post.image}`)
    : null;

  return (
    <div className="page-container">
      <div className="card fade-in" style={{ overflow: 'hidden' }}>
        {/* Post header */}
        <div style={{ padding: '20px 20px 12px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <AvatarImg user={post.author} size="md" />
          <div>
            <Link to={`/profile/${post.author?._id}`} style={{ fontWeight: 600, textDecoration: 'none', color: 'var(--gray-800)' }}>
              {post.author?.name}
            </Link>
            <div style={{ fontSize: '.78rem', color: 'var(--gray-400)' }}>{timeAgo(post.createdAt)}</div>
          </div>
          <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>{post.category}</span>
        </div>

        <div style={{ padding: '0 20px 16px' }}>
          <p style={{ fontSize: '1rem', color: 'var(--gray-700)', lineHeight: 1.7 }}>{post.content}</p>
        </div>

        {imageUrl && (
          <img src={imageUrl} alt="Post" style={{ width: '100%', maxHeight: 480, objectFit: 'cover' }} />
        )}

        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '12px 20px 0' }}>
            {post.tags.map((t) => <span key={t} className="badge badge-gray">#{t}</span>)}
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, padding: '16px 20px', borderTop: '1px solid var(--gray-100)', marginTop: 12 }}>
          <button
            id={`detail-like-btn-${id}`}
            className={`action-btn${isLiked ? ' liked' : ''}`}
            onClick={handleLike}
          >
            ❤️ {likes.length} {likes.length === 1 ? 'Like' : 'Likes'}
          </button>
          <span style={{ fontSize: '.875rem', color: 'var(--gray-500)' }}>
            💬 {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </span>
        </div>
      </div>

      {/* Comments */}
      <div className="card" style={{ marginTop: 16, padding: 20 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, color: 'var(--gray-700)' }}>
          Comments
        </h2>

        <form className="comment-form" onSubmit={handleComment} style={{ marginBottom: 16 }}>
          <input
            type="text"
            id="post-detail-comment-input"
            placeholder="Add a comment..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm" id="post-detail-comment-btn">Post</button>
        </form>

        {comments.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <p>No comments yet. Be the first!</p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="comment-item">
              <AvatarImg user={c.author} size="sm" />
              <div className="comment-body" style={{ flex: 1 }}>
                <div className="comment-author">
                  <Link to={`/profile/${c.author?._id}`}>{c.author?.name || 'User'}</Link>
                </div>
                <div className="comment-text">{c.text}</div>
                <div className="comment-meta">{timeAgo(c.createdAt)}</div>
              </div>
              {(c.author?._id === user?._id || user?.role === 'admin') && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--danger)', fontSize: '.75rem' }}
                  onClick={() => handleDeleteComment(c._id)}
                  id={`delete-comment-${c._id}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

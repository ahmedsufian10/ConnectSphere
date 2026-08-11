import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import AvatarImg from './AvatarImg';

const API_BASE = 'http://localhost:5000';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function PostCard({ post, onDelete, onLike }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [commentInput, setCommentInput] = useState('');
  const [likes, setLikes] = useState(post.likes || []);

  const isLiked = likes.some((l) => (l._id || l) === user?._id);
  const isOwner = post.author?._id === user?._id || post.author === user?._id;

  const handleLike = async () => {
    try {
      const { data } = await api.patch(`/posts/${post._id}/like`);
      setLikes(data.data.likes);
      onLike && onLike(post._id, data.data.likes);
    } catch {}
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    try {
      const { data } = await api.post('/comments', { text: commentInput, post: post._id });
      setComments((prev) => [data.data, ...prev]);
      setCommentInput('');
    } catch {}
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${post._id}`);
      onDelete && onDelete(post._id);
    } catch {}
  };

  const imageUrl = post.image
    ? (post.image.startsWith('http') ? post.image : `${API_BASE}${post.image}`)
    : null;

  return (
    <div className="card post-card fade-in">
      <div className="post-card-header">
        <AvatarImg user={post.author} size="md" />
        <div className="post-card-author">
          <Link to={`/profile/${post.author?._id}`}>{post.author?.name || 'Unknown'}</Link>
          <div className="time">{timeAgo(post.createdAt)}</div>
        </div>
        <span className="badge badge-blue">{post.category}</span>
        {isOwner && (
          <button
            onClick={handleDelete}
            className="btn btn-ghost btn-sm"
            id={`delete-post-${post._id}`}
            title="Delete post"
            style={{ color: 'var(--danger)' }}
          >🗑</button>
        )}
      </div>

      <div className="post-card-body">
        <p className="content">{post.content}</p>
      </div>

      {imageUrl && (
        <img
          src={imageUrl}
          alt="Post"
          className="post-card-image"
          onClick={() => navigate(`/posts/${post._id}`)}
        />
      )}

      {post.tags?.length > 0 && (
        <div className="post-card-tags">
          {post.tags.map((t) => <span key={t} className="badge badge-gray">#{t}</span>)}
        </div>
      )}

      <div className="post-card-actions">
        <button
          id={`like-btn-${post._id}`}
          className={`action-btn${isLiked ? ' liked' : ''}`}
          onClick={handleLike}
        >
          ❤️ <span>{likes.length}</span>
        </button>
        <button
          id={`comment-btn-${post._id}`}
          className="action-btn"
          onClick={() => setShowComments((v) => !v)}
        >
          💬 <span>{comments.length}</span>
        </button>
        <div className="spacer" />
        <Link to={`/posts/${post._id}`} className="action-btn">View</Link>
      </div>

      {showComments && (
        <div style={{ padding: '0 16px 16px' }}>
          <form className="comment-form" onSubmit={handleComment}>
            <input
              type="text"
              id={`comment-input-${post._id}`}
              placeholder="Write a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">Post</button>
          </form>
          <div style={{ marginTop: 12 }}>
            {comments.slice(0, 5).map((c) => (
              <div key={c._id} className="comment-item">
                <AvatarImg user={c.author} size="sm" />
                <div className="comment-body">
                  <div className="comment-author">
                    <Link to={`/profile/${c.author?._id}`}>{c.author?.name || 'User'}</Link>
                  </div>
                  <div className="comment-text">{c.text}</div>
                  <div className="comment-meta">{timeAgo(c.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

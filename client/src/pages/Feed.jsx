import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import PostCard from '../components/PostCard';
import CreatePostForm from '../components/CreatePostForm';
import AvatarImg from '../components/AvatarImg';
import { Link } from 'react-router-dom';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    try {
      const { data } = await api.get('/posts/feed');
      setPosts(data.data || []);
    } catch {
      // try public explore as fallback
      const { data } = await api.get('/posts');
      setPosts(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeed(); }, []);

  const handlePostCreated = (newPost) => setPosts((prev) => [newPost, ...prev]);
  const handleDelete = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));

  return (
    <div className="page-container">
      <CreatePostForm onPostCreated={handlePostCreated} />

      {loading ? (
        <div className="spinner" />
      ) : posts.length === 0 ? (
        <div className="card empty-state" style={{ marginTop: 16 }}>
          <h3>Your feed is empty</h3>
          <p>Follow some people or create your first post!</p>
          <Link to="/explore" className="btn btn-primary" style={{ marginTop: 12 }}>Explore People</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          {posts.map((post) => (
            <PostCard key={post._id} post={post} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

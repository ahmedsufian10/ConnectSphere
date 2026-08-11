import { useState, useEffect } from 'react';
import api from '../utils/api';
import PostCard from '../components/PostCard';

const CATEGORIES = ['All', 'Tech', 'Lifestyle', 'Education', 'Business', 'Other'];

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('latest');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'All') params.set('category', category);
      if (search) params.set('search', search);
      params.set('sort', sort);
      const { data } = await api.get(`/posts?${params}`);
      setPosts(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, [category, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleDelete = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));

  return (
    <div className="page-container">
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h2 style={{ marginBottom: 12, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          Explore
        </h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            id="explore-search"
            type="text"
            className="form-input"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" id="explore-search-btn" className="btn btn-primary btn-sm">Search</button>
        </form>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              id={`cat-filter-${c}`}
              className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
          <select
            id="explore-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="form-select"
            style={{ marginLeft: 'auto', width: 'auto', padding: '5px 10px' }}
          >
            <option value="latest">Latest</option>
            <option value="popular">Popular</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="spinner" />
      ) : posts.length === 0 ? (
        <div className="card empty-state">
          <h3>No posts found</h3>
          <p>Try a different search or category</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {posts.map((post) => (
            <PostCard key={post._id} post={post} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

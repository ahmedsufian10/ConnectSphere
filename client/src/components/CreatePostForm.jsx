import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import AvatarImg from './AvatarImg';

const CATEGORIES = ['Tech', 'Lifestyle', 'Education', 'Business', 'Other'];

export default function CreatePostForm({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Tech');
  const [tags, setTags] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => { setImageFile(null); setImagePreview(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('content', content);
      fd.append('category', category);
      if (tags.trim()) {
        const parsed = tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 5);
        fd.append('tags', JSON.stringify(parsed));
      }
      if (imageFile) fd.append('image', imageFile);

      const { data } = await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onPostCreated && onPostCreated(data.data);
      setContent(''); setTags(''); setImageFile(null); setImagePreview('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card create-post">
      <div className="create-post-top">
        <AvatarImg user={user} size="md" />
        <textarea
          id="create-post-textarea"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
      </div>
      {imagePreview && (
        <div style={{ paddingLeft: 54 }}>
          <div className="image-preview">
            <img src={imagePreview} alt="preview" />
            <button type="button" onClick={removeImage}>✕</button>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="create-post-controls">
          <select
            id="create-post-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, maxWidth: 180, padding: '6px 10px', fontSize: '.84rem' }}
            placeholder="Tags: react, node..."
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            id="create-post-tags"
          />
          <label htmlFor="create-post-image" className="file-label">📎 Photo</label>
          <input id="create-post-image" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            id="create-post-submit"
            disabled={loading || !content.trim()}
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function EditProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [avatar, setAvatar] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'avatar') { setAvatar(file); setAvatarPreview(url); }
    else { setCoverPhoto(file); setCoverPreview(url); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('bio', form.bio);
      if (avatar) fd.append('avatar', avatar);
      if (coverPhoto) fd.append('coverPhoto', coverPhoto);

      const { data } = await api.put('/users/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      updateUser(data.data);
      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate(`/profile/${user._id}`), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card" style={{ padding: 28 }}>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24, color: 'var(--gray-800)' }}>
          Edit Profile
        </h1>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="ep-name">Full Name</label>
            <input id="ep-name" name="name" type="text" className="form-input"
              value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ep-bio">Bio</label>
            <textarea id="ep-bio" name="bio" className="form-textarea"
              value={form.bio} onChange={handleChange} placeholder="Tell us about yourself..." rows={3} />
          </div>

          <div className="form-group">
            <label className="form-label">Profile Picture</label>
            {avatarPreview && (
              <img src={avatarPreview} alt="avatar preview"
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 8, border: '2px solid var(--gray-200)' }} />
            )}
            <label htmlFor="ep-avatar" className="file-label" style={{ alignSelf: 'flex-start' }}>
              📷 Choose Avatar
            </label>
            <input id="ep-avatar" type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => handleFile(e, 'avatar')} />
          </div>

          <div className="form-group">
            <label className="form-label">Cover Photo</label>
            {coverPreview && (
              <img src={coverPreview} alt="cover preview"
                style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8, border: '1px solid var(--gray-200)' }} />
            )}
            <label htmlFor="ep-cover" className="file-label" style={{ alignSelf: 'flex-start' }}>
              🖼 Choose Cover
            </label>
            <input id="ep-cover" type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => handleFile(e, 'cover')} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="submit" id="save-profile-btn" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-ghost"
              onClick={() => navigate(`/profile/${user._id}`)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

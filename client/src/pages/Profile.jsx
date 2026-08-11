import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import AvatarImg from '../components/AvatarImg';
import PostCard from '../components/PostCard';

const API_BASE = 'http://localhost:5000';

export default function Profile() {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  const isOwnProfile = user?._id === id;

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users/${id}`);
      setProfile(data.data);
      setPosts(data.data.posts || []);
      setFollowing(data.data.followers?.some((f) => (f._id || f) === user?._id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [id]);

  const handleFollow = async () => {
    try {
      const { data } = await api.post(`/users/${id}/follow`);
      setFollowing(data.data.isFollowing);
      setProfile((prev) => ({
        ...prev,
        followers: data.data.isFollowing
          ? [...(prev.followers || []), { _id: user._id, name: user.name }]
          : (prev.followers || []).filter((f) => (f._id || f) !== user._id),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = (postId) => setPosts((prev) => prev.filter((p) => p._id !== postId));

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />;
  if (!profile) return <div className="page-container"><p>User not found</p></div>;

  const coverSrc = profile.coverPhoto
    ? (profile.coverPhoto.startsWith('http') ? profile.coverPhoto : `${API_BASE}${profile.coverPhoto}`)
    : null;

  return (
    <div className="page-container">
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Cover photo */}
        {coverSrc ? (
          <img src={coverSrc} alt="cover" className="profile-cover" />
        ) : (
          <div className="profile-cover" />
        )}

        <div className="profile-header">
          <div className="profile-avatar-row">
            <AvatarImg user={profile} size="xl" />
            <div style={{ display: 'flex', gap: 8 }}>
              {isOwnProfile ? (
                <Link to="/profile/edit" className="btn btn-outline btn-sm" id="edit-profile-btn">Edit Profile</Link>
              ) : (
                <button
                  id={`follow-btn-${id}`}
                  className={`btn btn-sm ${following ? 'btn-outline' : 'btn-primary'}`}
                  onClick={handleFollow}
                >
                  {following ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          </div>

          <h1 className="profile-name">{profile.name}</h1>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}

          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-num">{posts.length}</div>
              <div className="profile-stat-label">Posts</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-num">{profile.followers?.length || 0}</div>
              <div className="profile-stat-label">Followers</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-num">{profile.following?.length || 0}</div>
              <div className="profile-stat-label">Following</div>
            </div>
          </div>
        </div>
      </div>

      {/* Followers sidebar layout */}
      <div className="two-col" style={{ marginTop: 20 }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, color: 'var(--gray-700)' }}>Posts</h2>
          {posts.length === 0 ? (
            <div className="card empty-state">
              <h3>No posts yet</h3>
              <p>{isOwnProfile ? 'Create your first post!' : 'This user has not posted anything yet.'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {posts.map((post) => (
                <PostCard key={post._id} post={post} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>

        <div className="sidebar">
          {profile.following?.length > 0 && (
            <div className="card sidebar-card" style={{ marginBottom: 16 }}>
              <h3>Following ({profile.following.length})</h3>
              {profile.following.slice(0, 5).map((u) => (
                <Link key={u._id || u} to={`/profile/${u._id || u}`} className="follow-list-item">
                  <AvatarImg user={u} size="sm" />
                  <span>{u.name || 'User'}</span>
                </Link>
              ))}
            </div>
          )}
          {profile.followers?.length > 0 && (
            <div className="card sidebar-card">
              <h3>Followers ({profile.followers.length})</h3>
              {profile.followers.slice(0, 5).map((u) => (
                <Link key={u._id || u} to={`/profile/${u._id || u}`} className="follow-list-item">
                  <AvatarImg user={u} size="sm" />
                  <span>{u.name || 'User'}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const API_BASE = 'http://localhost:5000';

export default function AvatarImg({ user, size = 'md' }) {
  if (!user) return <div className={`avatar avatar-${size}`}>?</div>;
  
  const initials = (user.name || '?')[0].toUpperCase();
  
  if (user.avatar) {
    const src = user.avatar.startsWith('http') ? user.avatar : `${API_BASE}${user.avatar}`;
    return <img src={src} alt={user.name} className={`avatar avatar-${size}`} />;
  }
  
  return <div className={`avatar avatar-${size}`}>{initials}</div>;
}

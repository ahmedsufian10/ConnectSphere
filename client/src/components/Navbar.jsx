import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import AvatarImg from './AvatarImg';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, setNotifications } = useSocket();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [serverNotifs, setServerNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Combine server + socket notifications
  const allNotifs = [...notifications, ...serverNotifs];
  const totalUnread = unread + notifications.length;

  useEffect(() => {
    api.get('/notifications').then(({ data }) => setServerNotifs(data.data || []));
    api.get('/notifications/unread-count').then(({ data }) => setUnread(data.data?.count || 0));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (val) => {
    setSearch(val);
    if (!val.trim()) { setResults([]); return; }
    const { data } = await api.get(`/users?search=${val}`);
    setResults(data.data || []);
    setShowSearch(true);
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setUnread(0);
    setNotifications([]);
    setServerNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/feed" className="navbar-brand-logo">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="20" fill="var(--primary)"/>
            <text x="20" y="28" fill="white" fontSize="26" fontWeight="bold" fontFamily="Arial, sans-serif" textAnchor="middle">C</text>
          </svg>
        </Link>
        <div className="navbar-search">
          <span className="search-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          </span>
          <input
            type="text"
            placeholder="Search ConnectSphere"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => results.length && setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 150)}
            id="navbar-search-input"
          />
          {showSearch && results.length > 0 && (
            <div className="navbar-search-results">
              {results.slice(0, 6).map((u) => (
                <Link
                  key={u._id}
                  to={`/profile/${u._id}`}
                  className="search-result-item"
                  onClick={() => { setSearch(''); setResults([]); setShowSearch(false); }}
                >
                  <AvatarImg user={u} size="sm" />
                  <span>{u.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="navbar-center">
        <NavLink to="/feed" className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`} title="Home">
          <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        </NavLink>
        <NavLink to="/explore" className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`} title="Explore">
          <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        </NavLink>
        <NavLink to={`/profile/${user?._id}`} className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`} title="Profile">
          <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        </NavLink>
      </div>

      <div className="navbar-right">
        <button className="icon-btn" onClick={toggleTheme} title="Toggle Dark Mode">
          {isDark ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06z"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4C12.92 3.04 12.46 3 12 3zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7c.18 0 .35.02.51.05-.2.52-.31 1.08-.31 1.65 0 2.76 2.24 5 5 5 .57 0 1.13-.11 1.65-.31.03.16.05.33.05.51 0 3.86-3.14 7-7 7z"/></svg>
          )}
        </button>
        
        {/* Notifications */}
        <div className="notif-wrapper" ref={notifRef}>
          <button
            className={`notif-btn${showNotif ? ' active' : ''}`}
            id="notification-bell"
            onClick={() => setShowNotif((v) => !v)}
            title="Notifications"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>
            {totalUnread > 0 && <span className="notif-badge">{totalUnread > 9 ? '9+' : totalUnread}</span>}
          </button>
          {showNotif && (
            <div className="notif-dropdown fade-in">
              <div className="notif-dropdown-header">
                <span>Notifications</span>
                <button onClick={markAllRead}>Mark all read</button>
              </div>
              <div className="notif-list">
                {allNotifs.length === 0 ? (
                  <div className="notif-empty">No notifications yet</div>
                ) : allNotifs.slice(0, 15).map((n, i) => (
                  <div key={i} className={`notif-item${!n.isRead ? ' unread' : ''}`}>
                    <AvatarImg user={n.sender} size="sm" />
                    <div>
                      <div className="notif-item-text">
                        <strong>{n.sender?.name || 'Someone'}</strong>{' '}
                        {n.type === 'like' && 'liked your post'}
                        {n.type === 'comment' && 'commented on your post'}
                        {n.type === 'follow' && 'started following you'}
                      </div>
                      {n.createdAt && <div className="notif-item-time">{timeAgo(n.createdAt)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Link to={`/profile/${user?._id}`} title="Profile" style={{marginLeft: '4px'}}>
          <AvatarImg user={user} size="sm" />
        </Link>

        <button onClick={handleLogout} className="icon-btn" title="Sign Out" id="logout-btn" style={{marginLeft: '4px'}}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
        </button>
      </div>
    </nav>
  );
}

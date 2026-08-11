import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const SLIDESHOW_IMAGES = [
  '/slideshow/slide1.png',
  '/slideshow/slide2.png',
  '/slideshow/slide3.jpg',
  '/slideshow/slide4.png',
  '/slideshow/slide5.png'
];

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.data);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper slideshow-bg">
      {SLIDESHOW_IMAGES.map((img, idx) => (
        <div 
          key={img} 
          className={`slideshow-image ${idx === currentSlide ? 'active' : ''}`}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}
      <div className="slideshow-overlay"></div>

      <header className="auth-header fade-in">
        <div className="auth-brand" style={{ margin: 0 }}>
          <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="20" fill="var(--primary)"/>
            <text x="20" y="28" fill="white" fontSize="26" fontWeight="bold" fontFamily="Arial, sans-serif" textAnchor="middle">C</text>
          </svg>
          <h1 className="smart-text">ConnectSphere</h1>
        </div>
      </header>

      <div className="auth-content">
        <div className="auth-card fade-in glass-panel">
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="Email or phone number"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
              {loading ? 'Signing in...' : 'Log In'}
            </button>
          </form>
          <div className="divider"></div>
          <div style={{ textAlign: 'center' }}>
            <Link to="/register" className="btn" style={{ background: '#42b72a', color: 'white', padding: '12px 24px' }}>Create new account</Link>
          </div>
        </div>
        
        <div className="auth-left fade-in">
          <p className="auth-motto smart-text" style={{ fontSize: '2.4rem' }}>
            Connect with friends and the world around you on ConnectSphere.
          </p>
        </div>
      </div>
    </div>
  );
}

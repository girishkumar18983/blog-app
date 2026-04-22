import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/login', formData);
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="form-page">
        <h1 className="form-page-title">Welcome Back</h1>
        <p className="form-page-subtitle">Log in to your account to start writing.</p>
        
        <form onSubmit={handleSubmit} className="form-card">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              className="form-input" 
              value={formData.username} 
              onChange={(e) => setFormData({...formData, username: e.target.value})} 
              placeholder="user123"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <p className="form-hint" style={{ marginTop: '1rem', textAlign: 'center' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--accent-violet)' }}>Register here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;

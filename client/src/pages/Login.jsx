import { useAuth } from '../context/AuthContext';

function Login() {
  const handleAppIdLogin = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Direct redirect to IBM App ID login route on backend
    window.location.href = `${API_URL}/api/auth/login`;
  };

  return (
    <div className="page-container">
      <div className="form-page">
        <h1 className="form-page-title">Welcome Back</h1>
        <p className="form-page-subtitle">Log in securely using IBM App ID.</p>
        
        <div className="form-card" style={{ textAlign: 'center', padding: '2rem' }}>
          <button 
            onClick={handleAppIdLogin} 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            Login with IBM App ID
          </button>
          <p className="form-hint">
            You will be redirected to IBM Cloud for secure authentication.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps a page to restrict access
 * @param {React.ReactNode} children - The page component to render
 * @param {string[]} roles - Optional array of allowed roles (e.g., ['admin'])
 */
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role check — if roles specified and user's role not included
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <h3>Access Denied</h3>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;

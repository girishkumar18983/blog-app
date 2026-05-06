import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiOutlinePencilSquare, HiOutlinePencil, HiOutlineUserCircle, HiOutlineArrowRightOnRectangle, HiOutlineBookmark, HiOutlineShieldCheck } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isAuthor } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <HiOutlinePencil className="navbar-logo-icon" />
          BlogVerse
        </Link>

        <div className="navbar-links">
          <Link
            to="/"
            className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/trending"
            className={`navbar-link ${location.pathname === '/trending' ? 'active' : ''}`}
          >
            Trending
          </Link>
          
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="navbar-link navbar-link-admin" title="Admin Dashboard">
                  <HiOutlineShieldCheck /> Admin
                </Link>
              )}
              <Link to="/bookmarks" className="navbar-link" title="Bookmarks">
                <HiOutlineBookmark />
              </Link>
              <NotificationBell />
              <Link to="/profile" className="navbar-link">
                <HiOutlineUserCircle /> {user.username}
              </Link>
              <button onClick={handleLogout} className="navbar-link btn-logout">
                <HiOutlineArrowRightOnRectangle /> Logout
              </button>
              {isAuthor && (
                <Link to="/create" className="btn-new-post" id="btn-create-post">
                  <HiOutlinePencilSquare />
                  New Post
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/register" className="btn-new-post">Join Now</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

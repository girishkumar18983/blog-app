import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiOutlinePencilSquare, HiOutlinePencil, HiOutlineUserCircle, HiOutlineArrowRightOnRectangle } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
          
          {user ? (
            <>
              <Link to="/profile" className="navbar-link">
                <HiOutlineUserCircle /> {user.username}
              </Link>
              <button onClick={handleLogout} className="navbar-link btn-logout">
                <HiOutlineArrowRightOnRectangle /> Logout
              </button>
              <Link to="/create" className="btn-new-post" id="btn-create-post">
                <HiOutlinePencilSquare />
                New Post
              </Link>
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

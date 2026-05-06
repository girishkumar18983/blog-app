import { useState, useEffect } from 'react';
import { getDashboardStats, getAllUsers, getAllPosts, updateUserRole, deleteUser, deletePostAdmin } from '../api/admin';
import { HiOutlineUsers, HiOutlineDocumentText, HiOutlineChatBubbleBottomCenterText, HiOutlineTrash, HiOutlineShieldCheck } from 'react-icons/hi2';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, postsRes] = await Promise.all([
        getDashboardStats(),
        getAllUsers(),
        getAllPosts(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setPosts(postsRes.data);
    } catch (err) {
      setMessage({ text: 'Failed to load dashboard data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
      showMessage('Role updated successfully', 'success');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to update role', 'error');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Delete user "${username}" and all their posts? This cannot be undone.`)) return;
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      showMessage('User deleted successfully', 'success');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  const handleDeletePost = async (postId, title) => {
    if (!confirm(`Delete post "${title}"? This cannot be undone.`)) return;
    try {
      await deletePostAdmin(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      showMessage('Post deleted successfully', 'success');
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to delete post', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container"><div className="spinner"></div><p className="loading-text">Loading dashboard...</p></div>
      </div>
    );
  }

  return (
    <div className="page-container" id="admin-dashboard">
      <div className="hero">
        <h1><HiOutlineShieldCheck /> Admin Dashboard</h1>
        <p>Manage users, posts, and monitor platform activity.</p>
      </div>

      {message.text && (
        <div className={`admin-message ${message.type === 'error' ? 'admin-message-error' : 'admin-message-success'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon"><HiOutlineUsers /></div>
            <div className="admin-stat-info">
              <span className="admin-stat-value">{stats.totalUsers}</span>
              <span className="admin-stat-label">Total Users</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon"><HiOutlineDocumentText /></div>
            <div className="admin-stat-info">
              <span className="admin-stat-value">{stats.totalPosts}</span>
              <span className="admin-stat-label">Total Posts</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon"><HiOutlineChatBubbleBottomCenterText /></div>
            <div className="admin-stat-info">
              <span className="admin-stat-value">{stats.totalComments}</span>
              <span className="admin-stat-label">Total Comments</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'overview' ? 'admin-tab-active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`admin-tab ${activeTab === 'users' ? 'admin-tab-active' : ''}`} onClick={() => setActiveTab('users')}>Users ({users.length})</button>
        <button className={`admin-tab ${activeTab === 'posts' ? 'admin-tab-active' : ''}`} onClick={() => setActiveTab('posts')}>Posts ({posts.length})</button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="admin-section">
          <h3>Role Distribution</h3>
          <div className="admin-role-grid">
            {stats.roleDistribution?.map((r) => (
              <div key={r._id} className="admin-role-card">
                <span className="admin-role-name">{r._id}</span>
                <span className="admin-role-count">{r.count}</span>
              </div>
            ))}
          </div>
          <h3 style={{ marginTop: '2rem' }}>Recent Users</h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr><th>Username</th><th>Role</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {stats.recentUsers?.map((u) => (
                  <tr key={u._id}>
                    <td>{u.username}</td>
                    <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                    <td>{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="admin-section">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr><th>Username</th><th>Name</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.username}</td>
                    <td>{u.name || '—'}</td>
                    <td>
                      <select
                        className="role-select"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      >
                        <option value="reader">reader</option>
                        <option value="author">author</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      <button className="btn-mini btn-mini-danger" onClick={() => handleDeleteUser(u._id, u.username)}>
                        <HiOutlineTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="admin-section">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr><th>Title</th><th>Author</th><th>Category</th><th>Views</th><th>Likes</th><th>Comments</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p._id}>
                    <td className="admin-table-title">{p.title}</td>
                    <td>{p.author?.username || '—'}</td>
                    <td>{p.category || 'General'}</td>
                    <td>{p.views || 0}</td>
                    <td>{p.likesCount || 0}</td>
                    <td>{p.commentsCount || 0}</td>
                    <td>
                      <button className="btn-mini btn-mini-danger" onClick={() => handleDeletePost(p._id, p.title)}>
                        <HiOutlineTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

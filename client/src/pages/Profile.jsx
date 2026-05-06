import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchUserProfile, searchUsers, addFriend, updateProfile, changeUsername } from '../api/users';
import { HiOutlineUserPlus, HiOutlineUsers, HiOutlineMagnifyingGlass, HiOutlineCog6Tooth } from 'react-icons/hi2';

function Profile() {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const profileId = id || user?._id;
  const isOwnProfile = !id || id === user?._id;
  
  // Profile Settings State
  const [profileForm, setProfileForm] = useState({ name: '', bio: '', avatar: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  
  // Account Settings State
  const [newUsername, setNewUsername] = useState('');
  const [settingsMessage, setSettingsMessage] = useState({ text: '', type: '' });
  const [updatingUsername, setUpdatingUsername] = useState(false);
 
  useEffect(() => {
    const loadProfile = async () => {
      if (!profileId) return;
      setLoading(true);
      setError('');
      try {
        const { data } = await fetchUserProfile(profileId);
        setProfile(data);
        if (isOwnProfile) {
          setProfileForm({
            name: data.name || '',
            bio: data.bio || '',
            avatar: data.avatar || ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
        setError(err.response?.data?.message || 'User not found or failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [profileId, isOwnProfile]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    try {
      const { data } = await searchUsers(search);
      // Filter out self and current friends
      const filtered = data.filter(u => u._id !== user._id && !profile?.friends?.some(f => f._id === u._id));
      setSearchResults(filtered);
    } catch (err) {
      console.error('Search failed');
    }
  };

  const handleAddFriend = async (friendId) => {
    try {
      await addFriend(friendId);
      setMessage('Friend added!');
      // Refresh profile
      const { data } = await fetchUserProfile(user._id);
      setProfile(data);
      setSearchResults(prev => prev.filter(u => u._id !== friendId));
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Failed to add friend');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setProfileMessage({ text: 'Image size should be less than 2MB', type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setProfileForm({ ...profileForm, avatar: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMessage({ text: '', type: '' });
    
    try {
      const { data } = await updateProfile(user._id, profileForm);
      setProfile({ ...profile, name: data.name, bio: data.bio, avatar: data.avatar });
      setProfileMessage({ text: 'Profile successfully updated!', type: 'success' });
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setProfileMessage({ text: err.response?.data?.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangeUsername = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    setUpdatingUsername(true);
    setSettingsMessage({ text: '', type: '' });
    
    try {
      const { data } = await changeUsername(user._id, newUsername.trim());
      updateUser(data);
      setNewUsername('');
      setSettingsMessage({ text: 'Username successfully updated!', type: 'success' });
      setTimeout(() => setSettingsMessage({ text: '', type: '' }), 5000);
    } catch (err) {
      setSettingsMessage({ 
        text: err.response?.data?.message || 'Failed to update username.', 
        type: 'error' 
      });
    } finally {
      setUpdatingUsername(false);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  if (error) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <h3>Profile Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.href = '/'} className="btn btn-primary" style={{ marginTop: '1rem' }}>Return Home</button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="page-container">
      <div className="hero" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        {profile?.avatar ? (
          <img src={profile.avatar} alt="Avatar" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--accent-primary)', boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)' }} />
        ) : (
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#fff', border: '4px solid var(--bg-secondary)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            {profile?.username ? profile.username[0].toUpperCase() : '?'}
          </div>
        )}
        <h1 style={{ margin: 0 }}>{profile?.name || profile?.username || 'Unknown User'}</h1>
        {profile?.name && <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-muted)' }}>@{profile?.username}</p>}
        {profile?.bio && <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>{profile.bio}</p>}
      </div>

      <div className="posts-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '2rem' }}>
        <div className="form-card" style={{ height: 'fit-content' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HiOutlineUsers /> Your Friends
          </h2>
          {profile?.friends?.length === 0 ? (
            <p className="text-muted">No friends added yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {profile?.friends?.map(friend => (
                <div key={friend._id} className="post-card-author" style={{ padding: '0.8rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="post-card-author-avatar">{friend.username ? friend.username[0].toUpperCase() : '?'}</div>
                  <span>{friend.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {isOwnProfile && (
          <div className="form-card">
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HiOutlineMagnifyingGlass /> Find Friends
            </h2>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input 
                className="form-input" 
                placeholder="Search by username..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </form>

            {message && <div style={{ color: 'var(--accent-green)', marginBottom: '1rem', fontWeight: 'bold' }}>{message}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {searchResults.map(u => (
                <div key={u._id} className="post-card-author" style={{ padding: '0.8rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="post-card-author-avatar">{u.username[0].toUpperCase()}</div>
                    <span>{u.username}</span>
                  </div>
                  <button onClick={() => handleAddFriend(u._id)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
                    <HiOutlineUserPlus /> Add
                  </button>
                </div>
              ))}
              {search && searchResults.length === 0 && <p className="text-muted">No new users found.</p>}
            </div>
          </div>
        )}

        {isOwnProfile && (
          <div className="form-card">
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HiOutlineCog6Tooth /> Profile Settings
            </h2>
            
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Display Name</label>
                <input className="form-input" value={profileForm.name} onChange={(e) => setProfileForm({...profileForm, name: e.target.value})} placeholder="Your full name" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Bio</label>
                <textarea className="form-textarea" style={{ minHeight: '100px' }} value={profileForm.bio} onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})} placeholder="Tell us about yourself (max 160 chars)" maxLength={160} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Avatar</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {profileForm.avatar && <img src={profileForm.avatar} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />}
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ color: 'var(--text-secondary)' }} />
                </div>
              </div>
              {profileMessage.text && <div style={{ color: profileMessage.type === 'error' ? '#ef4444' : 'var(--accent-primary)', fontWeight: 'bold' }}>{profileMessage.text}</div>}
              <button type="submit" className="btn btn-primary" disabled={updatingProfile}>
                {updatingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </form>

            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', color: '#ef4444' }}>Danger Zone</h3>
            <form onSubmit={handleChangeUsername} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="newUsername">Change Username</label>
                <input 
                  className="form-input" 
                  id="newUsername"
                  placeholder="Enter new username" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  disabled={updatingUsername}
                />
                <p className="form-hint" style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Warning: This will permanently change your name across all your existing articles, comments, and likes.
                </p>
              </div>
              {settingsMessage.text && (
                <div style={{ color: settingsMessage.type === 'error' ? '#ef4444' : 'var(--accent-primary)', fontWeight: 'bold' }}>
                  {settingsMessage.text}
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={updatingUsername || !newUsername.trim()}>
                {updatingUsername ? 'Updating...' : 'Update Username'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;

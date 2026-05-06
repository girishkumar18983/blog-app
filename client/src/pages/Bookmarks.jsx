import { useState, useEffect } from 'react';
import { getBookmarkedPosts } from '../api/posts';
import PostCard from '../components/PostCard';
import { HiOutlineBookmark } from 'react-icons/hi2';

function Bookmarks() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const { data } = await getBookmarkedPosts();
        setPosts(data);
      } catch (err) {
        console.error('Failed to load bookmarks');
      } finally {
        setLoading(false);
      }
    };
    loadBookmarks();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container"><div className="spinner"></div><p className="loading-text">Loading bookmarks...</p></div>
      </div>
    );
  }

  return (
    <div className="page-container" id="bookmarks-page">
      <div className="hero">
        <h1><HiOutlineBookmark /> Your Bookmarks</h1>
        <p>Posts you've saved for later reading.</p>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No bookmarks yet</h3>
          <p>Save posts you want to read later by clicking the bookmark button.</p>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Bookmarks;

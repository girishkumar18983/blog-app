import { useState, useEffect } from 'react';
import { fetchTrendingPosts } from '../api/posts';
import PostCard from '../components/PostCard';
import { HiOutlineFire } from 'react-icons/hi2';

function Trending() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const { data } = await fetchTrendingPosts(10);
        setPosts(data);
      } catch (err) {
        console.error('Failed to load trending posts');
      } finally {
        setLoading(false);
      }
    };
    loadTrending();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container"><div className="spinner"></div><p className="loading-text">Loading trending posts...</p></div>
      </div>
    );
  }

  return (
    <div className="page-container" id="trending-page">
      <div className="hero">
        <h1><HiOutlineFire style={{ color: '#ef4444' }} /> Trending Posts</h1>
        <p>The most viewed posts on BlogVerse right now.</p>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔥</div>
          <h3>No trending posts yet</h3>
          <p>Read some posts to get them trending!</p>
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

export default Trending;

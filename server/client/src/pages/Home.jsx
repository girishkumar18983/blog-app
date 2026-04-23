import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts } from '../api/posts';
import PostCard from '../components/PostCard';
import TagInfoModal from '../components/TagInfoModal';
import { HiOutlinePencilSquare } from 'react-icons/hi2';

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const { data } = await fetchPosts();
        setPosts(data);
      } catch (err) {
        setError('Failed to load posts. Make sure the server is running.');
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>Connection Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const allPosts = Array.isArray(posts) ? posts : [];
  const trendingPosts = allPosts
    .filter(p => (p.views || 0) > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);

  const filteredPosts = allPosts.filter(post => {
    const q = searchQuery.toLowerCase();
    const matchTitle = post.title?.toLowerCase().includes(q);
    const matchContent = post.content?.toLowerCase().includes(q);
    const matchTags = post.tags?.some(tag => tag.toLowerCase().includes(q));
    return matchTitle || matchContent || matchTags;
  });

  return (
    <div className="page-container" id="home-page">
      <div className="hero">
        <h1>Discover Stories & Ideas</h1>
        <p>A place to share knowledge, explore new perspectives, and connect through the art of writing.</p>
      </div>

      {trendingPosts.length > 0 && (
        <section className="trending-section">
          <div className="section-header">
            <h2 className="section-title">🔥 Trending Now</h2>
          </div>
          <div className="posts-grid trending-grid">
            {trendingPosts.map((post) => (
              <PostCard key={post._id} post={post} onTagClick={(tag) => setSelectedTag(tag)} />
            ))}
          </div>
        </section>
      )}

      <div className="section-header" style={{ marginTop: '3rem', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <h2 className="section-title">✨ All Stories</h2>
        </div>
        <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="🔍 Search stories by title, content, or tags..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              borderRadius: 'var(--radius-full)', 
              padding: '0.8rem 1.5rem', 
              background: 'var(--bg-secondary)', 
              boxShadow: 'var(--glass-shadow)',
              border: '1px solid var(--accent-primary)'
            }}
          />
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{searchQuery ? '🔍' : '✍️'}</div>
          <h3>{searchQuery ? 'No matching posts found' : 'No posts yet'}</h3>
          <p>{searchQuery ? 'Try adjusting your search terms.' : 'Be the first to share something amazing.'}</p>
          {!searchQuery && (
            <Link to="/create" className="btn-new-post">
              <HiOutlinePencilSquare /> Write Your First Post
            </Link>
          )}
        </div>
      ) : (
        <div className="posts-grid" id="posts-grid">
          {filteredPosts.map((post) => (
            <PostCard key={post._id} post={post} onTagClick={(tag) => setSelectedTag(tag)} />
          ))}
        </div>
      )}

      {selectedTag && (
        <TagInfoModal tag={selectedTag} onClose={() => setSelectedTag(null)} />
      )}
    </div>
  );
}

export default Home;

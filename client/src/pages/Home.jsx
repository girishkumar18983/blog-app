import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPosts, fetchCategories } from '../api/posts';
import PostCard from '../components/PostCard';
import TagInfoModal from '../components/TagInfoModal';
import { HiOutlinePencilSquare, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await fetchCategories();
        setCategories(data);
      } catch (err) {
        // Silently fail
      }
    };
    loadCategories();
  }, []);

  // Fetch posts when page, search, or category changes
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const { data } = await fetchPosts(page, 12, searchQuery, selectedCategory);
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      } catch (err) {
        setError('Failed to load posts. Make sure the server is running.');
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, [page, searchQuery, selectedCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setPage(1);
  };

  if (error && posts.length === 0) {
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

  return (
    <div className="page-container" id="home-page">
      <div className="hero">
        <h1>Discover Stories & Ideas</h1>
        <p>A place to share knowledge, explore new perspectives, and connect through the art of writing.</p>
      </div>

      {/* Search + Filter Bar */}
      <div className="search-filter-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input 
            type="text" 
            className="form-input search-input" 
            placeholder="🔍 Search stories by title, content, or tags..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-search">Search</button>
        </form>
        
        <div className="category-filter">
          <button 
            className={`category-chip ${selectedCategory === 'All' ? 'category-chip-active' : ''}`}
            onClick={() => handleCategoryChange('All')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button 
              key={cat}
              className={`category-chip ${selectedCategory === cat ? 'category-chip-active' : ''}`}
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results info */}
      {(searchQuery || selectedCategory !== 'All') && (
        <div className="search-results-info">
          <span>{total} {total === 1 ? 'result' : 'results'} found</span>
          {searchQuery && (
            <button className="btn-mini" onClick={() => { setSearchQuery(''); setSearchInput(''); setPage(1); }}>
              Clear search
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
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
        <>
          <div className="posts-grid" id="posts-grid">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} onTagClick={(tag) => setSelectedTag(tag)} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn" 
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <HiOutlineChevronLeft /> Prev
              </button>
              
              <div className="pagination-pages">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={`pagination-page ${page === pageNum ? 'pagination-page-active' : ''}`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button 
                className="pagination-btn" 
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <HiOutlineChevronRight />
              </button>
            </div>
          )}
        </>
      )}

      {selectedTag && (
        <TagInfoModal tag={selectedTag} onClose={() => setSelectedTag(null)} />
      )}
    </div>
  );
}

export default Home;

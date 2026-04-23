import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchPost, deletePost, toggleLike, addComment } from '../api/posts';
import { summarizePost } from '../api/ai';
import TagInfoModal from '../components/TagInfoModal';
import { useAuth } from '../context/AuthContext';
import { HiOutlineArrowLeft, HiOutlinePencil, HiOutlineTrash, HiOutlineUser, HiOutlineCalendar, HiOutlineEye, HiOutlineHeart, HiHeart, HiOutlineShare, HiOutlineChatBubbleBottomCenterText } from 'react-icons/hi2';

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const { data } = await fetchPost(id);
        setPost(data);
      } catch (err) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [id, navigate]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePost(id);
      navigate('/');
    } catch (err) {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleLike = async () => {
    if (!user) return alert('Please login to like this post.');
    if (isLiking) return;
    setIsLiking(true);
    try {
      const { data } = await toggleLike(id, user.username);
      setPost({ ...post, likes: data.likes });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please login to comment.');
    if (!commentText.trim()) return;
    setIsCommenting(true);
    try {
      const { data } = await addComment(id, { text: commentText, author: user.username });
      setPost({ ...post, comments: data });
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleSummarize = async () => {
    if (!post?.content || post.content.trim().length < 50) {
      alert('Post content is too short to summarize.');
      return;
    }
    setIsSummarizing(true);
    try {
      const { data } = await summarizePost(post.content);
      setAiSummary(data.summary);
    } catch (err) {
      console.error('Failed to summarize:', err);
      alert(err.response?.data?.message || 'Failed to generate AI summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container"><div className="spinner"></div><p className="loading-text">Loading post...</p></div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="post-detail-container">
      <article className="post-detail" id="post-detail-page">
        <header className="post-detail-header">
          <button className="post-detail-back" onClick={() => navigate('/')}>
            <HiOutlineArrowLeft /> Back
          </button>
          
          <h1 className="post-detail-title">{post.title}</h1>
          
          <div className="post-detail-meta">
            <span className="post-detail-meta-item">
              <HiOutlineUser /> {post.author && typeof post.author === 'object' ? post.author.username : post.author || 'Anonymous'}
            </span>
            <span className="post-detail-meta-item"><HiOutlineCalendar /> {formatDate(post.createdAt)}</span>
            <span className="post-detail-meta-item"><HiOutlineEye /> {post.views || 0} views</span>
          </div>
        </header>

        {post.coverImage && (
          <div className="post-detail-image-container">
            <img src={post.coverImage} alt={post.title} className="post-detail-image" />
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <button 
            className="btn-mini" 
            onClick={handleSummarize} 
            disabled={isSummarizing || aiSummary}
            style={{ 
              background: aiSummary ? 'var(--bg-primary)' : 'var(--gradient-primary)', 
              color: aiSummary ? 'var(--text-muted)' : '#fff',
              border: 'none',
              boxShadow: aiSummary ? 'none' : '0 4px 15px rgba(59, 130, 246, 0.4)'
            }}
          >
            {isSummarizing ? 'Generating Summary...' : aiSummary ? '✨ AI Summarized' : '✨ Summarize with AI'}
          </button>
        </div>

        {aiSummary && (
          <div style={{
            background: 'var(--bg-secondary)',
            borderLeft: '4px solid var(--accent-secondary)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '2rem',
            border: '1px solid var(--glass-border)'
          }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
              ✨ AI Summary
            </h4>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{aiSummary}</p>
          </div>
        )}

        <div className="post-detail-content">{post.content}</div>

        {post.tags && post.tags.length > 0 && (
          <div className="post-detail-tags">
            <h3 className="post-detail-tag-label">Tag Spotlight</h3>
            {post.tags.map((tag, i) => (
              <span 
                key={i} 
                className="tag tag-clickable" 
                onClick={() => setSelectedTag(tag)}
                title={`Learn about ${tag}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="engagement-bar">
          <div className="engagement-buttons">
            <button className={`btn-mini btn-like ${post.likes?.includes(user?.username) ? 'liked' : ''}`} onClick={handleLike} disabled={isLiking}>
              {post.likes?.includes(user?.username) ? <HiHeart /> : <HiOutlineHeart />} 
              {post.likes?.length || 0} Likes
            </button>
            <button className="btn-mini btn-share" onClick={handleShare}>
              <HiOutlineShare /> Share
            </button>
          </div>
        </div>

        <div className="post-detail-actions">
          <Link to={`/edit/${post._id}`} className="btn-mini" id="btn-edit-post">
            <HiOutlinePencil /> Edit Post
          </Link>
          <button className="btn-mini btn-mini-danger" onClick={() => setShowDeleteModal(true)} id="btn-delete-post">
            <HiOutlineTrash /> Delete Post
          </button>
        </div>

        <div className="comments-section">
          <div className="section-header" style={{ marginBottom: '1.5rem' }}>
            <h3 className="section-title"><HiOutlineChatBubbleBottomCenterText /> Comments ({post.comments?.length || 0})</h3>
          </div>
          
          <form className="comment-form" onSubmit={handleComment}>
            <textarea 
              className="form-textarea" 
              placeholder={user ? "Write a comment..." : "Please login to comment."}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={!user || isCommenting}
              style={{ minHeight: '100px' }}
            />
            <button type="submit" className="btn btn-primary btn-mini" disabled={!user || isCommenting || !commentText.trim()} style={{ marginTop: '1rem' }}>
              {isCommenting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          <div className="comments-list">
            {post.comments && post.comments.length > 0 ? (
              post.comments.slice().reverse().map((comment, i) => (
                <div key={i} className="comment-card">
                  <div className="comment-header">
                    <span className="comment-author">{comment.author}</span>
                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              ))
            ) : (
              <p className="no-comments-text">No comments yet. Be the first to share your thoughts!</p>
            )}
          </div>
        </div>
      </article>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Delete this post?</h3>
            <p>This action cannot be undone. The post will be permanently removed.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTag && (
        <TagInfoModal tag={selectedTag} onClose={() => setSelectedTag(null)} />
      )}
    </div>
  );
}

export default PostDetail;

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchPost, deletePost, toggleLike, addComment, editComment, deleteComment, addReply, bookmarkPost } from '../api/posts';
import { fetchUserProfile } from '../api/users';
import { summarizePost } from '../api/ai';
import TagInfoModal from '../components/TagInfoModal';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineArrowLeft, HiOutlinePencil, HiOutlineTrash, HiOutlineUser, 
  HiOutlineCalendar, HiOutlineEye, HiOutlineHeart, HiHeart, 
  HiOutlineShare, HiOutlineChatBubbleBottomCenterText, HiOutlineBookmark, HiBookmark 
} from 'react-icons/hi2';
import axios from 'axios';

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
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  // Comment editing state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Reply state
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

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

  // Check if post is bookmarked
  useEffect(() => {
    const checkBookmark = async () => {
      if (!user) return;
      try {
        const { data } = await fetchUserProfile(user._id);
        setIsBookmarked(data.bookmarks?.includes(id) || false);
      } catch (err) {
        // Silently fail
      }
    };
    checkBookmark();
  }, [user, id]);

  const getAuthorName = () => {
    if (!post?.author) return 'Anonymous';
    if (typeof post.author === 'object') return post.author.username || 'Anonymous';
    return post.author;
  };

  const isPostOwner = () => {
    if (!user || !post?.author) return false;
    const authorId = typeof post.author === 'object' ? post.author._id : post.author;
    return authorId === user._id || user.role === 'admin';
  };

  const isLiked = () => {
    if (!user || !post?.likes) return false;
    return post.likes.some((l) => {
      const likeId = typeof l === 'object' ? l._id || l : l;
      return likeId?.toString() === user._id?.toString();
    });
  };

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
      const { data } = await toggleLike(id);
      // Update likes array with raw IDs from response
      setPost((prev) => ({ ...prev, likes: data.likes }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) return alert('Please login to bookmark this post.');
    if (isBookmarking) return;
    setIsBookmarking(true);
    try {
      await bookmarkPost(id);
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBookmarking(false);
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
      const { data } = await addComment(id, { text: commentText });
      setPost({ ...post, comments: data });
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const { data } = await editComment(id, commentId, { text: editCommentText });
      setPost({ ...post, comments: data });
      setEditingCommentId(null);
      setEditCommentText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    try {
      const { data } = await deleteComment(id, commentId);
      setPost({ ...post, comments: data });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = async (commentId) => {
    if (!replyText.trim()) return;
    setIsReplying(true);
    try {
      const { data } = await addReply(id, commentId, { text: replyText });
      setPost({ ...post, comments: data });
      setReplyingToId(null);
      setReplyText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsReplying(false);
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

  const getCommentAuthorName = (comment) => {
    if (!comment?.author) return 'Anonymous';
    if (typeof comment.author === 'object') return comment.author.username || 'Anonymous';
    return comment.author;
  };

  const isCommentOwner = (comment) => {
    if (!user || !comment?.author) return false;
    const authorId = typeof comment.author === 'object' ? comment.author._id : comment.author;
    return authorId === user._id;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container"><div className="spinner"></div><p className="loading-text">Loading post...</p></div>
      </div>
    );
  }

  if (!post) return null;

  const authorName = getAuthorName();

  return (
    <div className="post-detail-container">
      <article className="post-detail" id="post-detail-page">
        <header className="post-detail-header">
          <button className="post-detail-back" onClick={() => navigate('/')}>
            <HiOutlineArrowLeft /> Back
          </button>
          
          {post.category && post.category !== 'General' && (
            <span className="category-badge" style={{ marginBottom: '0.5rem' }}>{post.category}</span>
          )}

          <h1 className="post-detail-title">{post.title}</h1>
          
          <div className="post-detail-meta">
            <span className="post-detail-meta-item">
              <HiOutlineUser /> {authorName}
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

        {/* Engagement bar */}
        <div className="engagement-bar">
          <div className="engagement-buttons">
            <button className={`btn-mini btn-like ${isLiked() ? 'liked' : ''}`} onClick={handleLike} disabled={isLiking}>
              {isLiked() ? <HiHeart /> : <HiOutlineHeart />} 
              {post.likes?.length || 0} Likes
            </button>
            <button className={`btn-mini btn-bookmark ${isBookmarked ? 'bookmarked' : ''}`} onClick={handleBookmark} disabled={isBookmarking}>
              {isBookmarked ? <HiBookmark /> : <HiOutlineBookmark />}
              {isBookmarked ? 'Saved' : 'Save'}
            </button>
            <button className="btn-mini btn-share" onClick={handleShare}>
              <HiOutlineShare /> Share
            </button>
          </div>
        </div>

        {/* Post actions — only for owner/admin */}
        {isPostOwner() && (
          <div className="post-detail-actions">
            <Link to={`/edit/${post._id}`} className="btn-mini" id="btn-edit-post">
              <HiOutlinePencil /> Edit Post
            </Link>
            <button className="btn-mini btn-mini-danger" onClick={() => setShowDeleteModal(true)} id="btn-delete-post">
              <HiOutlineTrash /> Delete Post
            </button>
          </div>
        )}

        {/* Comments Section */}
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
              post.comments.slice().reverse().map((comment) => {
                const cAuthor = getCommentAuthorName(comment);
                const cOwner = isCommentOwner(comment);
                return (
                  <div key={comment._id} className="comment-card">
                    <div className="comment-header">
                      <span className="comment-author">{cAuthor}</span>
                      <span className="comment-date">
                        {formatDate(comment.createdAt)}
                        {comment.updatedAt && <span className="comment-edited"> (edited)</span>}
                      </span>
                    </div>

                    {editingCommentId === comment._id ? (
                      <div className="comment-edit-form">
                        <textarea
                          className="form-textarea"
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          style={{ minHeight: '60px' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button className="btn-mini" onClick={() => handleEditComment(comment._id)}>Save</button>
                          <button className="btn-mini btn-mini-danger" onClick={() => { setEditingCommentId(null); setEditCommentText(''); }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p className="comment-text">{comment.text}</p>
                    )}

                    {/* Comment action buttons */}
                    <div className="comment-actions">
                      {user && (
                        <button className="comment-action-btn" onClick={() => { setReplyingToId(replyingToId === comment._id ? null : comment._id); setReplyText(''); }}>
                          ↩️ Reply
                        </button>
                      )}
                      {cOwner && editingCommentId !== comment._id && (
                        <>
                          <button className="comment-action-btn" onClick={() => { setEditingCommentId(comment._id); setEditCommentText(comment.text); }}>
                            ✏️ Edit
                          </button>
                          <button className="comment-action-btn comment-action-delete" onClick={() => handleDeleteComment(comment._id)}>
                            🗑️ Delete
                          </button>
                        </>
                      )}
                    </div>

                    {/* Reply form */}
                    {replyingToId === comment._id && (
                      <div className="reply-form">
                        <textarea
                          className="form-textarea"
                          placeholder={`Reply to ${cAuthor}...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          style={{ minHeight: '60px' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button className="btn-mini" onClick={() => handleReply(comment._id)} disabled={isReplying || !replyText.trim()}>
                            {isReplying ? 'Posting...' : 'Reply'}
                          </button>
                          <button className="btn-mini btn-mini-danger" onClick={() => setReplyingToId(null)}>Cancel</button>
                        </div>
                      </div>
                    )}

                    {/* Nested replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="replies-list">
                        {comment.replies.map((reply) => (
                          <div key={reply._id} className="reply-card">
                            <div className="comment-header">
                              <span className="comment-author">{getCommentAuthorName(reply)}</span>
                              <span className="comment-date">{formatDate(reply.createdAt)}</span>
                            </div>
                            <p className="comment-text">{reply.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="no-comments-text">No comments yet. Be the first to share your thoughts!</p>
            )}
          </div>
        </div>
      </article>

      {/* Delete Modal */}
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

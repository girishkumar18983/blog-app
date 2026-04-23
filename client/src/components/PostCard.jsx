import { useNavigate } from 'react-router-dom';
import { HiOutlineDocumentText, HiOutlineEye } from 'react-icons/hi2';

function PostCard({ post, onTagClick }) {
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown Date';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Unknown Date';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '??';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getExcerpt = (content, maxLen = 120) => {
    if (!content || typeof content !== 'string') return '';
    if (content.length <= maxLen) return content;
    return content.substring(0, maxLen).trim() + '...';
  };

  return (
    <article className="post-card" id={`post-card-${post._id}`} onClick={() => navigate(`/post/${post._id}`)}>
      {post.coverImage ? (
        <img src={post.coverImage} alt={post.title} className="post-card-image" />
      ) : (
        <div className="post-card-image-placeholder"><HiOutlineDocumentText /></div>
      )}
      <div className="post-card-body">
        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="post-card-tags">
            {post.tags.slice(0, 3).map((tag, i) => (
              <span 
                key={i} 
                className="tag tag-clickable" 
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick && onTagClick(tag);
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <h2 className="post-card-title">{post.title}</h2>
        <p className="post-card-excerpt">{getExcerpt(post.content)}</p>
        <div className="post-card-footer">
          <div className="post-card-author">
            <div className="post-card-author-avatar">
              {getInitials(post.author && typeof post.author === 'object' ? post.author.username : post.author || 'Anonymous')}
            </div>
            <span>{post.author && typeof post.author === 'object' ? post.author.username : post.author || 'Anonymous'}</span>
          </div>
          <div className="post-card-stats">
            <span className="post-card-date">{formatDate(post.createdAt)}</span>
            <span className="post-card-views">
              <HiOutlineEye /> {post.views || 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default PostCard;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { suggestTitles } from '../api/ai';

function PostForm({ initialData, onSubmit, isEdit }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ 
    title: '', 
    content: '', 
    author: user?.username || '', 
    tags: '', 
    coverImage: '' 
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        content: initialData.content || '',
        author: initialData.author || '',
        tags: initialData.tags ? initialData.tags.join(', ') : '',
        coverImage: initialData.coverImage || '',
      });
    } else if (user && !isEdit && !form.author) {
      setForm(prev => ({ ...prev, author: user.username }));
    }
  }, [initialData, user, isEdit, form.author]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, coverImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setForm({ ...form, coverImage: '' });
  };

  const handleSuggestTitles = async () => {
    if (!form.content || form.content.trim().length < 20) {
      setError('Please write at least 20 characters of content before asking for title suggestions.');
      return;
    }
    setError('');
    setIsSuggesting(true);
    setAiSuggestions([]);
    try {
      const { data } = await suggestTitles(form.content);
      setAiSuggestions(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate title suggestions.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const applyTitleSuggestion = (title) => {
    setForm({ ...form, title });
    setAiSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.content.trim() || !form.author.trim()) {
      setError('Title, content, and author are required.');
      return;
    }
    setSubmitting(true);
    try {
      const postData = {
        title: form.title.trim(),
        content: form.content.trim(),
        author: form.author.trim(),
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        coverImage: form.coverImage,
      };
      await onSubmit(postData);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-card" id="post-form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label className="form-label" htmlFor="title" style={{ marginBottom: 0 }}>Title</label>
          <button 
            type="button" 
            className="btn-mini" 
            onClick={handleSuggestTitles} 
            disabled={isSuggesting || submitting}
            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
          >
            {isSuggesting ? 'Thinking...' : '✨ AI Suggest'}
          </button>
        </div>
        <input className="form-input" id="title" name="title" value={form.title} onChange={handleChange} placeholder="Enter your post title..." />
        
        {aiSuggestions.length > 0 && (
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p className="form-hint" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>✨ Click a title to apply:</p>
            {aiSuggestions.map((title, idx) => (
              <button 
                key={idx} 
                type="button" 
                onClick={() => applyTitleSuggestion(title)}
                style={{ 
                  textAlign: 'left', 
                  padding: '0.6rem 1rem', 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--accent-primary)', 
                  borderRadius: '6px', 
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="content">Content</label>
        <textarea className="form-textarea" id="content" name="content" value={form.content} onChange={handleChange} placeholder="Write your blog post content..." />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="tags">Tags</label>
        <input className="form-input" id="tags" name="tags" value={form.tags} onChange={handleChange} placeholder="react, javascript, web dev" />
        <p className="form-hint">Separate tags with commas</p>
      </div>

      <div className="form-group">
        <label className="form-label">Cover Image</label>
        
        <div className="image-upload-wrapper">
          {form.coverImage ? (
            <div className="image-preview-container">
              <img src={form.coverImage} alt="Preview" className="image-preview" />
              <button type="button" className="btn-remove-image" onClick={removeImage}>✕</button>
            </div>
          ) : (
            <label className="file-upload-label">
              <div className="upload-icon">📷</div>
              <span>Click to upload image or drag and drop</span>
              <p>JPG, PNG, WebP (Max 5MB)</p>
              <input type="file" className="file-input-hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          )}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <label className="form-label" htmlFor="coverImage">Or use Image URL</label>
          <input className="form-input" id="coverImage" name="coverImage" value={form.coverImage.startsWith('data:') ? '' : form.coverImage} onChange={handleChange} placeholder="https://example.com/image.jpg" />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} id="btn-submit-post">
          {submitting ? 'Saving...' : isEdit ? 'Update Post' : 'Publish Post'}
        </button>
        <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </form>
  );
}

export default PostForm;

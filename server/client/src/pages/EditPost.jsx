import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPost, updatePost } from '../api/posts';
import PostForm from '../components/PostForm';

function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleSubmit = async (postData) => {
    await updatePost(id, postData);
    navigate(`/post/${id}`);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="form-page" id="edit-post-page">
        <h1 className="form-page-title">Edit Post</h1>
        <p className="form-page-subtitle">Make changes to your post below.</p>
        <PostForm initialData={post} onSubmit={handleSubmit} isEdit={true} />
      </div>
    </div>
  );
}

export default EditPost;

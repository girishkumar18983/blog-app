import { useNavigate } from 'react-router-dom';
import { createPost } from '../api/posts';
import PostForm from '../components/PostForm';

function CreatePost() {
  const navigate = useNavigate();

  const handleSubmit = async (postData) => {
    await createPost(postData);
    navigate('/');
  };

  return (
    <div className="page-container">
      <div className="form-page" id="create-post-page">
        <h1 className="form-page-title">Create New Post</h1>
        <p className="form-page-subtitle">Share your thoughts with the world.</p>
        <PostForm onSubmit={handleSubmit} isEdit={false} />
      </div>
    </div>
  );
}

export default CreatePost;

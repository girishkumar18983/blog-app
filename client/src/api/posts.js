import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const API = axios.create({
  baseURL: `${API_URL}/api/posts`,
  withCredentials: true,
});

// Posts — with pagination, search, and filters
export const fetchPosts = (page = 1, limit = 12, search = '', category = '', tag = '') => {
  const params = new URLSearchParams({ page, limit });
  if (search) params.append('search', search);
  if (category && category !== 'All') params.append('category', category);
  if (tag) params.append('tag', tag);
  return API.get(`/?${params.toString()}`);
};

export const fetchPost = (id) => API.get(`/${id}`);
export const createPost = (postData) => API.post('/', postData);
export const updatePost = (id, postData) => API.put(`/${id}`, postData);
export const deletePost = (id) => API.delete(`/${id}`);

// Likes
export const toggleLike = (id) => API.post(`/${id}/like`);

// Bookmarks
export const bookmarkPost = (id) => API.post(`/${id}/bookmark`);
export const getBookmarkedPosts = () => API.get('/bookmarks/me');

// Categories
export const fetchCategories = () => API.get('/categories');

// Trending
export const fetchTrendingPosts = (limit = 10) => API.get(`/trending?limit=${limit}`);

// Comments
export const addComment = (id, commentData) => API.post(`/${id}/comments`, commentData);
export const editComment = (postId, commentId, data) => API.put(`/${postId}/comments/${commentId}`, data);
export const deleteComment = (postId, commentId) => API.delete(`/${postId}/comments/${commentId}`);

// Replies
export const addReply = (postId, commentId, replyData) =>
  API.post(`/${postId}/comments/${commentId}/replies`, replyData);

// Upload image
export const uploadImage = (formData) => {
  return axios.post(`${API_URL}/api/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    withCredentials: true,
  });
};

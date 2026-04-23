import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/posts',
});

export const fetchPosts = () => API.get('/');
export const fetchPost = (id) => API.get(`/${id}`);
export const createPost = (postData) => API.post('/', postData);
export const updatePost = (id, postData) => API.put(`/${id}`, postData);
export const deletePost = (id) => API.delete(`/${id}`);
export const addComment = (id, commentData) => API.post(`/${id}/comments`, commentData);
export const toggleLike = (id, username) => API.post(`/${id}/like`, { username });

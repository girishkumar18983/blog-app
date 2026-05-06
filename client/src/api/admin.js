import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const API = axios.create({
  baseURL: `${API_URL}/api/admin`,
  withCredentials: true,
});

export const getDashboardStats = () => API.get('/stats');
export const getAllUsers = () => API.get('/users');
export const getAllPosts = () => API.get('/posts');
export const updateUserRole = (id, role) => API.put(`/users/${id}/role`, { role });
export const deleteUser = (id) => API.delete(`/users/${id}`);
export const deletePostAdmin = (id) => API.delete(`/posts/${id}`);

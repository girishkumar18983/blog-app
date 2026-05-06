import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const API = axios.create({
  baseURL: `${API_URL}/api/notifications`,
  withCredentials: true,
});

export const getNotifications = () => API.get('/');
export const getUnreadCount = () => API.get('/unread-count');
export const markAsRead = (id) => API.put(`/${id}/read`);
export const markAllAsRead = () => API.put('/read-all');

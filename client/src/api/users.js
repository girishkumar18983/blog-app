import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const API = axios.create({
  baseURL: `${API_URL}/api/users`,
  withCredentials: true,
});

export const fetchUserProfile = (id) => API.get(`/${id}`);
export const searchUsers = (username) => API.get(`?username=${username}`);
export const addFriend = (id) => API.post(`/add-friend/${id}`);
export const updateProfile = (id, profileData) => API.put(`/profile/${id}`, profileData);
export const changeUsername = (userId, newUsername) => axios.put(`${API_URL}/api/auth/username`, { userId, newUsername }, { withCredentials: true });

export default API;

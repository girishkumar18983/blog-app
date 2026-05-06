import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const API = axios.create({
  baseURL: `${API_URL}/api/ai`,
  withCredentials: true,
});

// Request AI blog title suggestions based on content
export const suggestTitles = (content) => API.post('/suggest-titles', { content });

// Request an AI summary of the blog content
export const summarizePost = (content) => API.post('/summarize', { content });

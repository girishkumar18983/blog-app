import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/ai',
});

// Request AI blog title suggestions based on content
export const suggestTitles = (content) => API.post('/suggest-title', { content });

// Request an AI summary of the blog content
export const summarizePost = (content) => API.post('/summarize', { content });

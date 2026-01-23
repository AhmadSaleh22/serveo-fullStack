import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (credentials) => api.post('/auth/login', credentials);
export const getMe = () => api.get('/auth/me');
export const changePassword = (data) => api.put('/auth/password', data);

// Profile
export const getProfile = () => api.get('/profile');
export const updateProfile = (data) => api.put('/profile', data);
export const uploadAvatar = (formData) => api.post('/profile/avatar', formData);

// Skills
export const getSkills = () => api.get('/skills');
export const createSkill = (data) => api.post('/skills', data);
export const updateSkill = (id, data) => api.put(`/skills/${id}`, data);
export const deleteSkill = (id) => api.delete(`/skills/${id}`);

// Projects
export const getProjects = () => api.get('/projects');
export const getAllProjects = () => api.get('/projects/all');
export const createProject = (formData) => api.post('/projects', formData);
export const updateProject = (id, formData) => api.put(`/projects/${id}`, formData);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

// Experience
export const getExperience = () => api.get('/experience');
export const getAllExperience = () => api.get('/experience/all');
export const createExperience = (data) => api.post('/experience', data);
export const updateExperience = (id, data) => api.put(`/experience/${id}`, data);
export const deleteExperience = (id) => api.delete(`/experience/${id}`);

// Testimonials
export const getTestimonials = () => api.get('/testimonials');
export const getAllTestimonials = () => api.get('/testimonials/all');
export const createTestimonial = (data) => api.post('/testimonials', data);
export const updateTestimonial = (id, data) => api.put(`/testimonials/${id}`, data);
export const deleteTestimonial = (id) => api.delete(`/testimonials/${id}`);

// Messages
export const sendMessage = (data) => api.post('/messages', data);
export const getMessages = (archived = false) => api.get(`/messages?archived=${archived}`);
export const getUnreadCount = () => api.get('/messages/unread-count');
export const markAsRead = (id) => api.put(`/messages/${id}/read`);
export const archiveMessage = (id) => api.put(`/messages/${id}/archive`);
export const deleteMessage = (id) => api.delete(`/messages/${id}`);

export default api;

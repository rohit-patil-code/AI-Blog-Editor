import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (username, email, password) => api.post('/auth/register', { username, email, password }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

// Blog API
export const blogAPI = {
  getBlogs: (params = {}) => api.get('/blogs', { params }),
  getBlog: (id) => api.get(`/blogs/${id}`),
  createBlog: (data) => api.post('/blogs', data),
  updateBlog: (id, data) => api.put(`/blogs/${id}`, data),
  deleteBlog: (id) => api.delete(`/blogs/${id}`),
  publishBlog: (id, status) => api.patch(`/blogs/${id}/publish`, { status }),
}

// AI API
export const aiAPI = {
  generate: (data) => api.post('/ai/generate', data),
  grammar: (data) => api.post('/ai/grammar', data),
  enhance: (data) => api.post('/ai/enhance', data),
  titles: (data) => api.post('/ai/titles', data),
  usage: (params = {}) => api.get('/ai/usage', { params }),
}

export default api


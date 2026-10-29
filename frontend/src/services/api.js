/**
 * Axios API service module for EzyCart.
 * 
 * - All requests go through this module.
 * - Access tokens are automatically attached from localStorage.
 * - Expired access tokens trigger automatic refresh via interceptor.
 * - On refresh failure, user is logged out and redirected to login.
 * 
 * SECURITY NOTE (Development):
 *   We store JWT tokens in localStorage for simplicity during development.
 *   In production, prefer HttpOnly, Secure cookies to mitigate XSS risks.
 *   The secret key is NEVER stored in the frontend.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach access token ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 and refresh token ───────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/accounts/login/') &&
      !originalRequest.url?.includes('/accounts/token/refresh/')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/accounts/token/refresh/`, {
          refresh: refreshToken,
        });
        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);
        api.defaults.headers['Authorization'] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Authentication API ────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/accounts/register/', data),
  login: (data) => api.post('/accounts/login/', data),
  logout: (refresh) => api.post('/accounts/logout/', { refresh }),
  refreshToken: (refresh) => api.post('/accounts/token/refresh/', { refresh }),
  getProfile: () => api.get('/accounts/profile/'),
  updateProfile: (data) => api.patch('/accounts/profile/', data),
  changePassword: (data) => api.post('/accounts/change-password/', data),
};

// ── Products API ──────────────────────────────────────────────────────────
export const productsAPI = {
  getProducts: (params) => api.get('/products/', { params }),
  getProduct: (id) => api.get(`/products/${id}/`),
  getCategories: () => api.get('/categories/'),
};

// ── Cart API ──────────────────────────────────────────────────────────────
export const cartAPI = {
  getCart: () => api.get('/cart/'),
  addItem: (data) => api.post('/cart/items/', data),
  updateItem: (itemId, data) => api.patch(`/cart/items/${itemId}/`, data),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}/`),
};

// ── Orders API ────────────────────────────────────────────────────────────
export const ordersAPI = {
  checkout: (data) => api.post('/orders/checkout/', data),
  getOrders: () => api.get('/orders/'),
  getOrder: (id) => api.get(`/orders/${id}/`),
};

// ── Payments API ──────────────────────────────────────────────────────────
export const paymentsAPI = {
  createOrder: (data) => api.post('/payments/create-order/', data),
  verifyPayment: (data) => api.post('/payments/verify/', data),
  getPayment: (orderId) => api.get(`/payments/${orderId}/`),
};

export default api;

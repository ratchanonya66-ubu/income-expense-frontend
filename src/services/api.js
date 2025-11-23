// ไฟล์สำหรับจัดการ API calls (ปรับปรุงความเสถียร)
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// สร้าง axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 วินาที
  headers: {
    'Content-Type': 'application/json',
  },
});

// ตัวแปรสำหรับเก็บ request ที่กำลังรอ
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// เพิ่ม token ในทุก request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// จัดการ response และ error
api.interceptors.response.use(
  (response) => {
    // ส่งข้อมูลออกไปเลย ไม่ต้อง wrap
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // ตรวจสอบ network error
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject({
        success: false,
        message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
        error: 'NETWORK_ERROR'
      });
    }

    // จัดการ 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // ถ้ากำลัง refresh อยู่ ให้เก็บ request ไว้ใน queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // ลบ token และ redirect ไป login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      processQueue(error, null);
      isRefreshing = false;
      
      // Redirect ไป login (ถ้าไม่ได้อยู่หน้า login อยู่แล้ว)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      
      return Promise.reject({
        success: false,
        message: 'กรุณาเข้าสู่ระบบใหม่',
        error: 'UNAUTHORIZED'
      });
    }

    // จัดการ timeout
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        success: false,
        message: 'คำขอใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง',
        error: 'TIMEOUT'
      });
    }

    // จัดการ error อื่นๆ
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'เกิดข้อผิดพลาดบางอย่าง';
    
    console.error('API Error:', {
      status: error.response?.status,
      message: errorMessage,
      url: error.config?.url
    });

    return Promise.reject({
      success: false,
      message: errorMessage,
      status: error.response?.status,
      error: error.response?.data
    });
  }
);

// ฟังก์ชัน helper สำหรับ retry
const retryRequest = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0 || error.error === 'UNAUTHORIZED') {
      throw error;
    }
    
    console.log(`Retrying... (${retries} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest(fn, retries - 1, delay * 2); // exponential backoff
  }
};

// ========== Auth APIs ==========
export const authAPI = {
  register: (data) => retryRequest(() => api.post('/auth/register', data)),
  login: (data) => retryRequest(() => api.post('/auth/login', data)),
  getMe: () => api.get('/auth/me'),
};

// ========== Category APIs ==========
export const categoryAPI = {
  getAll: (type) => retryRequest(() => api.get('/categories', { params: { type } })),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ========== Transaction APIs ==========
export const transactionAPI = {
  getAll: (params) => retryRequest(() => api.get('/transactions', { params })),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// ========== Dashboard APIs ==========
export const dashboardAPI = {
  getSummary: (params) => retryRequest(() => api.get('/dashboard/summary', { params })),
  getByCategory: (params) => retryRequest(() => api.get('/dashboard/by-category', { params })),
  getMonthlyTrend: (params) => retryRequest(() => api.get('/dashboard/monthly-trend', { params })),
  getRecentTransactions: (params) => retryRequest(() => api.get('/dashboard/recent-transactions', { params })),
  getTopCategories: (params) => retryRequest(() => api.get('/dashboard/top-categories', { params })),
};

// Health check
export const healthCheck = () => api.get('/health', { baseURL: API_URL.replace('/api', '') });

export default api;
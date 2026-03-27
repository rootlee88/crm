import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 错误处理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (username: string, password: string) => 
    api.post('/auth/login', { username, password }).then(res => res.data),
  getMe: () => api.get('/auth/me').then(res => res.data),
  createUser: (data: any) => api.post('/auth', data).then(res => res.data),
  getUsers: () => api.get('/auth').then(res => res.data),
  updateUser: (id: number, data: any) => api.put(`/auth/${id}`, data).then(res => res.data),
  deleteUser: (id: number) => api.delete(`/auth/${id}`).then(res => res.data),
  changePassword: (oldPassword: string, newPassword: string) => 
    api.put('/auth/password', { oldPassword, newPassword }).then(res => res.data),
};

// Department API
export const departmentApi = {
  getList: () => api.get('/departments').then(res => res.data),
  getById: (id: number) => api.get(`/departments/${id}`).then(res => res.data),
  create: (data: any) => api.post('/departments', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/departments/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/departments/${id}`).then(res => res.data),
};

// Customer API
export const customerApi = {
  getList: (params?: any) => api.get('/customers', { params }).then(res => res.data),
  getById: (id: number) => api.get(`/customers/${id}`).then(res => res.data),
  create: (data: any) => api.post('/customers', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/customers/${id}`).then(res => res.data),
};

// Lead API
export const leadApi = {
  getList: (params?: any) => api.get('/leads', { params }).then(res => res.data),
  getById: (id: number) => api.get(`/leads/${id}`).then(res => res.data),
  create: (data: any) => api.post('/leads', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/leads/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/leads/${id}`).then(res => res.data),
  convert: (id: number, customerId?: number) => 
    api.put(`/leads/${id}/convert`, { customerId }).then(res => res.data),
};

// Opportunity API
export const opportunityApi = {
  getList: (params?: any) => api.get('/opportunities', { params }).then(res => res.data),
  getById: (id: number) => api.get(`/opportunities/${id}`).then(res => res.data),
  create: (data: any) => api.post('/opportunities', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/opportunities/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/opportunities/${id}`).then(res => res.data),
};

// Contract API
export const contractApi = {
  getList: (params?: any) => api.get('/contracts', { params }).then(res => res.data),
  getById: (id: number) => api.get(`/contracts/${id}`).then(res => res.data),
  create: (data: any) => api.post('/contracts', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/contracts/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/contracts/${id}`).then(res => res.data),
};

// Task API
export const taskApi = {
  getList: (params?: any) => api.get('/tasks', { params }).then(res => res.data),
  getById: (id: number) => api.get(`/tasks/${id}`).then(res => res.data),
  create: (data: any) => api.post('/tasks', data).then(res => res.data),
  update: (id: number, data: any) => api.put(`/tasks/${id}`, data).then(res => res.data),
  updateStatus: (id: number, status: number) => 
    api.put(`/tasks/${id}/status`, { status }).then(res => res.data),
  delete: (id: number) => api.delete(`/tasks/${id}`).then(res => res.data),
};

// Activity API
export const activityApi = {
  getList: (params?: any) => api.get('/activities', { params }).then(res => res.data),
  getToday: () => api.get('/activities/today').then(res => res.data),
};

// Dashboard API
export const dashboardApi = {
  getStatistics: () => api.get('/dashboard/statistics').then(res => res.data),
  getFunnel: () => api.get('/dashboard/funnel').then(res => res.data),
  getRecentConverted: () => api.get('/dashboard/recent-converted').then(res => res.data),
  // 报表分析API
  getSalesReport: (year?: number) => api.get('/dashboard/reports/sales', { params: { year } }).then(res => res.data),
  getCustomerGrowth: (year?: number) => api.get('/dashboard/reports/customer-growth', { params: { year } }).then(res => res.data),
  getConversionReport: (params?: any) => api.get('/dashboard/reports/conversion', { params }).then(res => res.data),
  getFunnelDetail: () => api.get('/dashboard/reports/funnel-detail').then(res => res.data),
};

export default api;
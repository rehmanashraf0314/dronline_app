import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// IMPORTANT: Replace with your machine's local IP
// Run: ip a | grep 192 → use that IP
// Example: http://192.168.1.5:5000/api
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
    }
    // Better network error message
    if (!error.response) {
      error.message = `Cannot connect to server. Make sure:\n1. Backend is running (npm run dev)\n2. Your .env has correct IP: ${BASE_URL}`;
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  sendOTP: (data) => api.post('/auth/send-otp', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  setPassword: (data) => api.post('/auth/set-password', data),
  getMe: () => api.get('/auth/me'),
};

export const countriesAPI = {
  getAll: () => api.get('/countries'),
  create: (data) => api.post('/countries', data),
  update: (id, data) => api.put(`/countries/${id}`, data),
  delete: (id) => api.delete(`/countries/${id}`),
};

export const servicesAPI = {
  getEnabled: (country) => api.get('/services', { params: { country } }),
  getAll: () => api.get('/services/all'),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
};

export const doctorsAPI = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  getSlots: (id, date) => api.get(`/doctors/${id}/slots`, { params: { date } }),
  updateAvailability: (data) => api.put('/doctors/availability', data),
  updateProfile: (data) => api.put('/doctors/profile', data),
};

export const appointmentsAPI = {
  getMine: () => api.get('/appointments/mine'),
  getDoctorMine: () => api.get('/appointments/doctor/mine'),
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  assignDoctor: (id, doctorId) => api.put(`/appointments/${id}/assign`, { doctorId }),
  sendDocument: (id, data) => api.post(`/appointments/${id}/documents`, data),
  getMeetingToken: (id) => api.get(`/appointments/${id}/meeting-token`),
};

export const paymentsAPI = {
  createIntent: (data) => api.post('/payments/create-intent', data),
  createPendingAppointment: (data) => api.post('/payments/create-appointment-pending', data),
};

export const adminAPI = {
  // Doctor CRUD
  getDoctors: () => api.get('/admin/doctors'),
  getDoctorById: (id) => api.get(`/admin/doctors/${id}`),
  createDoctor: (data) => api.post('/admin/doctors/create', data),
  updateDoctor: (id, data) => api.put(`/admin/doctors/${id}`, data),
  deleteDoctor: (id) => api.delete(`/admin/doctors/${id}`),
  toggleDoctor: (id) => api.put(`/admin/doctors/${id}/toggle`),
  
  // Service & Country
  getServiceById: (id) => api.get(`/admin/services/${id}`),
  getCountryById: (id) => api.get(`/admin/countries/${id}`),
  
  // Stats
  getStats: () => api.get('/admin/stats'),
};

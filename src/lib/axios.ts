import axios from 'axios';
import { supabase } from './supabaseClient'; // Pastikan path ini benar

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

// ==========================================
// 1. REQUEST INTERCEPTOR (INI YANG HILANG)
// ==========================================
api.interceptors.request.use(
  async (config) => {
    // Ambil sesi dari Supabase secara async
    const { data: { session } } = await supabase.auth.getSession();
    
    // Jika ada token, sisipkan ke header Authorization
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// 2. RESPONSE INTERCEPTOR (Yang sudah ada)
// ==========================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Jangan hapus token Supabase di sini, karena Supabase yang manage sesi
      localStorage.removeItem('superadmin_token');
      
      // Hindari redirect loop jika sudah di halaman login
      if (window.location.pathname !== '/' && !window.location.pathname.includes('/login')) {
        window.location.href = '/'; 
      }
    }
    return Promise.reject(error);
  }
);
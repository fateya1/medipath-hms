// frontend/src/utils/api.ts
// Axios client with JWT interceptors — mirrors EduPath pattern

import axios, { AxiosInstance } from 'axios';

const TOKEN_KEY = 'medipath_access_token';

export const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      // Redirect will be handled by ProtectedRoute
    }
    return Promise.reject(error);
  }
);

// Convenience helpers
export const apiGet = <T>(url: string, params?: object) =>
  api.get<T>(url, { params }).then(r => r.data);

export const apiPost = <T>(url: string, data?: object) =>
  api.post<T>(url, data).then(r => r.data);

export const apiPatch = <T>(url: string, data?: object) =>
  api.patch<T>(url, data).then(r => r.data);

export const apiDelete = <T>(url: string) =>
  api.delete<T>(url).then(r => r.data);

// Format KES currency
export function formatKES(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Format phone for M-Pesa (convert 07XX → 2547XX)
export function formatMpesaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return '254' + digits.slice(1);
  if (digits.startsWith('7') || digits.startsWith('1')) return '254' + digits;
  return digits;
}

// Age from DOB
export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

// Triage colour mapping
export const TRIAGE_COLORS: Record<string, string> = {
  IMMEDIATE: 'bg-red-100 text-red-800 border-red-300',
  URGENT: 'bg-orange-100 text-orange-800 border-orange-300',
  LESS_URGENT: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  NON_URGENT: 'bg-green-100 text-green-800 border-green-300',
  DECEASED: 'bg-gray-100 text-gray-800 border-gray-300',
};

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-gray-100 text-gray-800',
  RESCHEDULED: 'bg-purple-100 text-purple-800',
};

export const BILLING_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  WAIVED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

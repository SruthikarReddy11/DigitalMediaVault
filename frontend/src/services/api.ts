import axios from 'axios';

export const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pdl_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message: error.response?.data?.error?.message || error.message || 'An unexpected error occurred.',
      code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
      status: error.response?.status || 500,
      details: error.response?.data?.error?.details,
    };
    return Promise.reject(customError);
  }
);

export const getMediaUrl = (url: string | null | undefined): string => {
  if (!url) return '';

  let fullUrl = url;

  // If not already an absolute URL, prepend base API URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const baseUrl = (import.meta as any).env?.VITE_API_URL || '/api';
    if (url.startsWith('/api/')) {
      fullUrl = `${baseUrl}${url.substring(4)}`;
    } else {
      fullUrl = `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
    }
  }

  // Attach token for cross-device & mobile 3rd-party cookie restriction bypass
  const token = localStorage.getItem('pdl_auth_token');
  if (token && !fullUrl.includes('token=')) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    return `${fullUrl}${separator}token=${encodeURIComponent(token)}`;
  }

  return fullUrl;
};
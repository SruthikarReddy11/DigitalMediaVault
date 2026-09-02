import axios from 'axios';

export const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
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

  // Already an absolute URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const baseUrl = (import.meta as any).env?.VITE_API_URL || '/api';

  // VITE_API_URL already ends with /api
  if (url.startsWith('/api/')) {
    return `${baseUrl}${url.substring(4)}`;
  }

  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
};
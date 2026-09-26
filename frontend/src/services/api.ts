import axios from 'axios';

const PROD_API_FALLBACK = 'https://digital-media-vault-api-g2hc.onrender.com/api';

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // In any browser (localhost, local IP, or Vercel production), always use /api
    // Vercel rewrites /api/* to the Render backend at the edge, eliminating CORS entirely.
    return '/api';
  }
  return import.meta.env.VITE_API_URL || PROD_API_FALLBACK;
};

export const api = axios.create({
  baseURL: getBaseUrl(),
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
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const token = localStorage.getItem('pdl_auth_token');
    if (token && !url.includes('token=')) {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}token=${encodeURIComponent(token)}`;
    }
    return url;
  }

  // Always use same-origin relative path through /api reverse proxy
  let fullUrl = url.startsWith('/') ? url : `/${url}`;

  // Attach token for media playback and download
  const token = localStorage.getItem('pdl_auth_token');
  if (token && !fullUrl.includes('token=')) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    return `${fullUrl}${separator}token=${encodeURIComponent(token)}`;
  }

  return fullUrl;
};
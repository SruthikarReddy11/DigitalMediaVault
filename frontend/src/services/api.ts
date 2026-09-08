import axios from 'axios';

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.')
    ) {
      return '/api';
    }
  }
  return (import.meta as any).env?.VITE_API_URL || '/api';
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

  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.startsWith('10.'));

  const rawBase = isLocal ? '' : (import.meta as any).env?.VITE_API_URL;
  let fullUrl = url;

  if (rawBase) {
    const cleanBase = String(rawBase).replace(/\/+$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api/')) {
      fullUrl = `${cleanBase}${cleanPath.substring(4)}`;
    } else {
      fullUrl = `${cleanBase}${cleanPath}`;
    }
  } else {
    fullUrl = url.startsWith('/') ? url : `/${url}`;
  }

  // Attach token for cross-device & mobile 3rd-party cookie restriction bypass
  const token = localStorage.getItem('pdl_auth_token');
  if (token && !fullUrl.includes('token=')) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    return `${fullUrl}${separator}token=${encodeURIComponent(token)}`;
  }

  return fullUrl;
};
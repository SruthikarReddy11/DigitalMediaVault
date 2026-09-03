import { api } from './api';
import { User } from '../types';

export interface UserSession {
  id: string;
  isCurrent: boolean;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

export const authApi = {
  async register(data: { name: string; username: string; email: string; password: string; confirmPassword: string }) {
    const res = await api.post<{ success: boolean; data: { user: User; token: string; securityPin?: string } }>('/auth/register', data);
    return res.data.data;
  },

  async regeneratePin() {
    const res = await api.post<{ success: boolean; data: { securityPin: string } }>('/auth/pin/regenerate');
    return res.data.data.securityPin;
  },

  async login(data: { identifier: string; password: string }) {
    const res = await api.post<{ success: boolean; data: { user: User; token: string } }>('/auth/login', data);
    return res.data.data;
  },

  async logout() {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  async getMe() {
    const res = await api.get<{ success: boolean; data: { user: User; token?: string } }>('/auth/me');
    if (res.data.data?.token) {
      localStorage.setItem('pdl_auth_token', res.data.data.token);
    }
    return res.data.data.user;
  },

  async updateProfile(data: { name?: string; currentPassword?: string; newPassword?: string }) {
    const res = await api.patch<{ success: boolean; data: { user: User } }>('/auth/profile', data);
    return res.data.data.user;
  },

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await api.post<{ success: boolean; data: { user: User } }>('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data.user;
  },

  async removeAvatar() {
    const res = await api.delete<{ success: boolean; data: { user: User } }>('/auth/avatar');
    return res.data.data.user;
  },

  async getSessions() {
    const res = await api.get<{ success: boolean; data: UserSession[] }>('/auth/sessions');
    return res.data.data;
  },

  async revokeOtherSessions() {
    const res = await api.delete<{ success: boolean; data: { message: string; count: number } }>('/auth/sessions/other');
    return res.data.data;
  },
};

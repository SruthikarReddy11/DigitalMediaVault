import { api } from './api';
import { AdminStats, AdminUser, FileItem, Role } from '../types';

export const adminApi = {
  async getStats() {
    const res = await api.get<{ success: boolean; data: AdminStats }>('/admin/stats');
    return res.data.data;
  },

  async getUsers(params: { search?: string; role?: Role; status?: string; page?: number; limit?: number } = {}) {
    const res = await api.get<{
      success: boolean;
      data: AdminUser[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>('/admin/users', { params });
    return res.data;
  },

  async updateUserStatus(id: string, data: { isActive?: boolean; role?: Role }) {
    const res = await api.patch<{ success: boolean; data: AdminUser }>(`/admin/users/${id}`, data);
    return res.data.data;
  },

  async deleteUser(id: string) {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },

  async getAllFiles(params: { userId?: string; fileType?: string; search?: string; page?: number; limit?: number } = {}) {
    const res = await api.get<{
      success: boolean;
      data: FileItem[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>('/admin/files', { params });
    return res.data;
  },

  async getLogs(params: { userId?: string; action?: string; page?: number; limit?: number } = {}) {
    const res = await api.get<{
      success: boolean;
      data: any[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>('/admin/logs', { params });
    return res.data;
  },

  async verifyUserPin(userId: string, pin: string) {
    const res = await api.post<{ success: boolean; data: { verified: boolean; message: string } }>('/admin/verify-pin', {
      userId,
      pin,
    });
    return res.data.data;
  },
};

import { api } from './api';
import { FileItem } from '../types';

export const trashApi = {
  async getTrash() {
    const res = await api.get<{ success: boolean; data: FileItem[] }>('/trash');
    return res.data.data;
  },

  async restoreAll() {
    const res = await api.post<{ success: boolean; data: { count: number; message: string } }>('/trash/restore-all');
    return res.data.data;
  },

  async emptyTrash() {
    const res = await api.delete<{ success: boolean; data: { count: number; message: string } }>('/trash/empty');
    return res.data.data;
  },
};

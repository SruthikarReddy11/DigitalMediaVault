import { api } from './api';
import { FileItem, DashboardStats, FileType } from '../types';

export interface FileFilterParams {
  folderId?: string | null;
  fileType?: FileType;
  search?: string;
  favoriteOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'size' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export const filesApi = {
  async getDashboardStats() {
    const res = await api.get<{ success: boolean; data: DashboardStats }>('/files/dashboard');
    return res.data.data;
  },

  async listFiles(params: FileFilterParams = {}) {
    const res = await api.get<{
      success: boolean;
      data: FileItem[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>('/files', { params });
    return res.data;
  },

  async getFile(id: string) {
    const res = await api.get<{ success: boolean; data: FileItem }>(`/files/${id}`);
    return res.data.data;
  },

  async uploadFiles(
    files: File[],
    folderId?: string | null,
    onProgress?: (percent: number) => void
  ) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (folderId) formData.append('folderId', folderId);

    const res = await api.post<{ success: boolean; data: { files: FileItem[] } }>(
      '/files/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      }
    );
    return res.data.data.files;
  },

  async renameFile(id: string, name: string) {
    const res = await api.patch<{ success: boolean; data: FileItem }>(`/files/${id}/rename`, { name });
    return res.data.data;
  },

  async moveFile(id: string, folderId: string | null) {
    const res = await api.patch<{ success: boolean; data: FileItem }>(`/files/${id}/move`, { folderId });
    return res.data.data;
  },

  async moveToTrash(id: string) {
    const res = await api.delete(`/files/${id}/trash`);
    return res.data;
  },

  async restoreFromTrash(id: string) {
    const res = await api.post(`/files/${id}/restore`);
    return res.data;
  },

  async permanentDelete(id: string) {
    const res = await api.delete(`/files/${id}/permanent`);
    return res.data;
  },
};

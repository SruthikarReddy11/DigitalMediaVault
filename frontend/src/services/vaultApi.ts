import { api } from './api';
import { VaultFolder, VaultCell, TwoFactorStatus, TwoFactorSetup, FileItem } from '../types';

export const vaultApi = {
  async get2FAStatus() {
    const res = await api.get<{ success: boolean; data: TwoFactorStatus }>('/vault/2fa/status');
    return res.data.data;
  },

  async setup2FA() {
    const res = await api.post<{ success: boolean; data: TwoFactorSetup }>('/vault/2fa/setup');
    return res.data.data;
  },

  async verify2FA(token: string) {
    const res = await api.post<{ success: boolean; data: { verified: boolean; vaultSessionToken: string } }>(
      '/vault/2fa/verify',
      { token }
    );
    return res.data.data;
  },

  async disable2FA(token: string) {
    const res = await api.post<{ success: boolean; data: { success: boolean } }>('/vault/2fa/disable', { token });
    return res.data.data;
  },

  async lockVault() {
    const res = await api.post<{ success: boolean; data: { success: boolean; message: string } }>('/vault/lock');
    return res.data.data;
  },

  async getFolders() {
    const res = await api.get<{ success: boolean; data: VaultFolder[] }>('/vault/folders');
    return res.data.data;
  },

  async createFolder(data: {
    name: string;
    password: string;
    description?: string;
    color?: string;
    icon?: string;
  }) {
    const res = await api.post<{ success: boolean; data: VaultFolder }>('/vault/folders', data);
    return res.data.data;
  },

  async unlockFolder(id: string, password: string) {
    const res = await api.post<{
      success: boolean;
      data: {
        unlocked: boolean;
        folder: VaultFolder;
        cells: VaultCell[];
        files?: FileItem[];
      };
    }>(`/vault/folders/${id}/unlock`, { password });
    return res.data.data;
  },

  async updateFolder(
    id: string,
    data: {
      name?: string;
      description?: string;
      color?: string;
      icon?: string;
      currentPassword?: string;
      newPassword?: string;
    }
  ) {
    const res = await api.patch<{ success: boolean; data: VaultFolder }>(`/vault/folders/${id}`, data);
    return res.data.data;
  },

  async deleteFolder(id: string) {
    const res = await api.delete<{ success: boolean; data: { success: boolean } }>(`/vault/folders/${id}`);
    return res.data.data;
  },

  async createCell(folderId: string, data: { url: string; title?: string; notes?: string }) {
    const res = await api.post<{ success: boolean; data: VaultCell }>(`/vault/folders/${folderId}/cells`, data);
    return res.data.data;
  },

  async updateCell(id: string, data: { url?: string; title?: string; notes?: string }) {
    const res = await api.patch<{ success: boolean; data: VaultCell }>(`/vault/cells/${id}`, data);
    return res.data.data;
  },

  async deleteCell(id: string) {
    const res = await api.delete<{ success: boolean; data: { success: boolean } }>(`/vault/cells/${id}`);
    return res.data.data;
  },

  async checkVideoPreview(url: string) {
    const res = await api.get<{
      success: boolean;
      data: {
        hasVideo: boolean;
        videoType?: 'youtube' | 'vimeo' | 'dailymotion' | 'direct' | 'stream';
        videoUrl?: string;
        embedUrl?: string;
        videoId?: string;
      };
    }>('/vault/preview', { params: { url } });
    return res.data.data;
  },

  async uploadFiles(folderId: string, files: File[]) {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    const res = await api.post<{
      success: boolean;
      data: {
        files: FileItem[];
      };
    }>(`/vault/folders/${folderId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data.files;
  },

  async getFolderFiles(folderId: string) {
    const res = await api.get<{ success: boolean; data: FileItem[] }>(`/vault/folders/${folderId}/files`);
    return res.data.data;
  },

  async deleteFile(fileId: string) {
    const res = await api.delete<{ success: boolean; data: { success: boolean; message?: string } }>(
      `/vault/files/${fileId}`
    );
    return res.data.data;
  },
};

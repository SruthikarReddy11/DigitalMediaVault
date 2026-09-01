import { api } from './api';
import { FolderItem } from '../types';

export const foldersApi = {
  async getFolders(parentId?: string | null) {
    const res = await api.get<{ success: boolean; data: FolderItem[] }>('/folders', {
      params: { parentId },
    });
    return res.data.data;
  },

  async getFolderTree() {
    const res = await api.get<{ success: boolean; data: FolderItem[] }>('/folders/tree');
    return res.data.data;
  },

  async createFolder(name: string, parentId?: string | null) {
    const res = await api.post<{ success: boolean; data: FolderItem }>('/folders', {
      name,
      parentId,
    });
    return res.data.data;
  },

  async renameFolder(id: string, name: string) {
    const res = await api.patch<{ success: boolean; data: FolderItem }>(`/folders/${id}`, {
      name,
    });
    return res.data.data;
  },

  async deleteFolder(id: string) {
    const res = await api.delete(`/folders/${id}`);
    return res.data;
  },
};

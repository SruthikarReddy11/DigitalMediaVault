import { api } from './api';
import { FileItem } from '../types';

export const favoritesApi = {
  async getFavorites() {
    const res = await api.get<{ success: boolean; data: FileItem[] }>('/favorites');
    return res.data.data;
  },

  async toggle(fileId: string) {
    const res = await api.post<{ success: boolean; data: { isFavorite: boolean; message: string } }>(
      `/favorites/${fileId}`
    );
    return res.data.data;
  },
};

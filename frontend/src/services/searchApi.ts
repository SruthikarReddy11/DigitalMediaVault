import { api } from './api';
import { GlobalSearchResponse } from '../types';

export const searchApi = {
  /**
   * Perform universal global search across Files, Music, Videos, Photos, and Folders
   */
  async globalSearch(
    query: string,
    options?: {
      category?: 'all' | 'files' | 'music' | 'videos' | 'photos' | 'folders';
      limit?: number;
    }
  ): Promise<GlobalSearchResponse> {
    const res = await api.get<{ success: boolean; data: GlobalSearchResponse }>('/search', {
      params: {
        q: query,
        category: options?.category || 'all',
        limit: options?.limit || 20,
      },
    });
    return res.data.data;
  },
};

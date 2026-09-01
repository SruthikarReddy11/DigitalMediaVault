import { api } from './api';
import { MusicItem } from '../types';

export const musicApi = {
  async getSongs(params: { search?: string; artist?: string; album?: string; genre?: string; favoriteOnly?: boolean } = {}) {
    const res = await api.get<{ success: boolean; data: MusicItem[] }>('/music/songs', { params });
    return res.data.data;
  },

  async getArtists() {
    const res = await api.get<{ success: boolean; data: Array<{ artist: string; songCount: number; albumCount: number; coverUrl?: string | null }> }>('/music/artists');
    return res.data.data;
  },

  async getAlbums() {
    const res = await api.get<{ success: boolean; data: Array<{ album: string; artist: string; year?: number; songCount: number; coverUrl?: string | null }> }>('/music/albums');
    return res.data.data;
  },

  async getGenres() {
    const res = await api.get<{ success: boolean; data: Array<{ genre: string; songCount: number }> }>('/music/genres');
    return res.data.data;
  },

  async getSong(id: string) {
    const res = await api.get<{ success: boolean; data: MusicItem }>(`/music/songs/${id}`);
    return res.data.data;
  },

  async updateMetadata(
    id: string,
    data: {
      title: string;
      artist: string;
      album?: string | null;
      genre?: string | null;
      year?: number | null;
      trackNumber?: number | null;
    }
  ) {
    const res = await api.patch<{ success: boolean; data: MusicItem }>(`/music/songs/${id}/metadata`, data);
    return res.data.data;
  },
};

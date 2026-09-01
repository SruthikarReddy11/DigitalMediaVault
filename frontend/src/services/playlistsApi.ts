import { api } from './api';
import { PlaylistItem } from '../types';

export const playlistsApi = {
  async getPlaylists() {
    const res = await api.get<{ success: boolean; data: PlaylistItem[] }>('/playlists');
    return res.data.data;
  },

  async getPlaylist(id: string) {
    const res = await api.get<{ success: boolean; data: PlaylistItem }>(`/playlists/${id}`);
    return res.data.data;
  },

  async createPlaylist(name: string, description?: string) {
    const res = await api.post<{ success: boolean; data: PlaylistItem }>('/playlists', {
      name,
      description,
    });
    return res.data.data;
  },

  async updatePlaylist(id: string, data: { name?: string; description?: string }) {
    const res = await api.patch<{ success: boolean; data: PlaylistItem }>(`/playlists/${id}`, data);
    return res.data.data;
  },

  async deletePlaylist(id: string) {
    const res = await api.delete(`/playlists/${id}`);
    return res.data;
  },

  async addSong(playlistId: string, musicId: string) {
    const res = await api.post(`/playlists/${playlistId}/songs`, { musicId });
    return res.data;
  },

  async removeSong(playlistId: string, musicId: string) {
    const res = await api.delete(`/playlists/${playlistId}/songs/${musicId}`);
    return res.data;
  },

  async reorder(playlistId: string, items: Array<{ id: string; position: number }>) {
    const res = await api.put(`/playlists/${playlistId}/reorder`, { items });
    return res.data;
  },
};

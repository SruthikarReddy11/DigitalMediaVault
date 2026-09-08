import { api } from './api';
import {
  PhotoTimelineGroup,
  ExifMetadataResult,
  DuplicatePhotosResponse,
  PhotoAlbum,
  CreateAlbumInput,
  UpdateAlbumInput,
} from '../types';

export const galleryApi = {
  /**
   * Fetch chronological timeline grouping of photos
   */
  async getTimeline(params?: { folderId?: string | null; favoriteOnly?: boolean }): Promise<PhotoTimelineGroup[]> {
    const res = await api.get<{ success: boolean; data: PhotoTimelineGroup[] }>('/gallery/timeline', {
      params,
    });
    return res.data.data;
  },

  /**
   * Fetch detailed EXIF metadata for an image
   */
  async getExif(fileId: string): Promise<ExifMetadataResult> {
    const res = await api.get<{ success: boolean; data: ExifMetadataResult }>(`/gallery/exif/${fileId}`);
    return res.data.data;
  },

  /**
   * Detect duplicate photos
   */
  async getDuplicates(): Promise<DuplicatePhotosResponse> {
    const res = await api.get<{ success: boolean; data: DuplicatePhotosResponse }>('/gallery/duplicates');
    return res.data.data;
  },

  /**
   * Download multiple selected photos as a ZIP archive
   */
  async downloadZip(fileIds: string[], defaultFilename = 'photos.zip'): Promise<void> {
    const res = await api.post('/gallery/download-zip', { fileIds }, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', defaultFilename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * List all user albums
   */
  async getAlbums(): Promise<PhotoAlbum[]> {
    const res = await api.get<{ success: boolean; data: PhotoAlbum[] }>('/albums');
    return res.data.data;
  },

  /**
   * Get single album details and photos
   */
  async getAlbum(id: string): Promise<PhotoAlbum> {
    const res = await api.get<{ success: boolean; data: PhotoAlbum }>(`/albums/${id}`);
    return res.data.data;
  },

  /**
   * Create a new photo album
   */
  async createAlbum(input: CreateAlbumInput): Promise<PhotoAlbum> {
    const res = await api.post<{ success: boolean; data: PhotoAlbum }>('/albums', input);
    return res.data.data;
  },

  /**
   * Update album metadata
   */
  async updateAlbum(id: string, input: UpdateAlbumInput): Promise<PhotoAlbum> {
    const res = await api.put<{ success: boolean; data: PhotoAlbum }>(`/albums/${id}`, input);
    return res.data.data;
  },

  /**
   * Delete an album
   */
  async deleteAlbum(id: string): Promise<void> {
    await api.delete(`/albums/${id}`);
  },

  /**
   * Add photos to an album
   */
  async addPhotosToAlbum(albumId: string, fileIds: string[]): Promise<PhotoAlbum> {
    const res = await api.post<{ success: boolean; data: PhotoAlbum }>(`/albums/${albumId}/photos`, { fileIds });
    return res.data.data;
  },

  /**
   * Remove a photo from an album
   */
  async removePhotoFromAlbum(albumId: string, fileId: string): Promise<void> {
    await api.delete(`/albums/${albumId}/photos/${fileId}`);
  },

  /**
   * Share an album via a public ShareLink
   */
  async shareAlbum(albumId: string, input: any): Promise<{ shareUrl: string; token: string; shareLink: any }> {
    const res = await api.post<{ success: boolean; data: { shareUrl: string; token: string; shareLink: any } }>(
      `/albums/${albumId}/share`,
      input
    );
    return res.data.data;
  },
};

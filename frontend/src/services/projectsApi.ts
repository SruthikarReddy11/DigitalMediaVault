import { api } from './api';
import {
  WebProject,
  ProjectListResponse,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilterOptions,
  WebsiteExtractedData,
} from '../types/project';

export const projectsApi = {
  /**
   * Fetch all projects with optional search and filters
   */
  async getProjects(filters?: ProjectFilterOptions): Promise<ProjectListResponse> {
    const params: any = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.category && filters.category !== 'ALL') params.category = filters.category;
    if (filters?.status && filters.status !== 'ALL') params.status = filters.status;
    if (filters?.tech && filters.tech !== 'ALL') params.tech = filters.tech;
    if (filters?.isFavorite !== undefined) params.isFavorite = filters.isFavorite;
    if (filters?.sortBy) params.sortBy = filters.sortBy;
    if (filters?.sortOrder) params.sortOrder = filters.sortOrder;

    const res = await api.get<{ success: boolean; data: ProjectListResponse }>('/projects', {
      params,
    });
    return res.data.data;
  },

  /**
   * Get single project details by ID
   */
  async getProjectById(id: string): Promise<WebProject> {
    const res = await api.get<{ success: boolean; data: WebProject }>(`/projects/${id}`);
    return res.data.data;
  },

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectInput): Promise<WebProject> {
    const res = await api.post<{ success: boolean; data: WebProject }>('/projects', data);
    return res.data.data;
  },

  /**
   * Update an existing project
   */
  async updateProject(id: string, data: UpdateProjectInput): Promise<WebProject> {
    const res = await api.put<{ success: boolean; data: WebProject }>(`/projects/${id}`, data);
    return res.data.data;
  },

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  /**
   * Toggle project star / pinned favorite
   */
  async toggleFavorite(id: string): Promise<WebProject> {
    const res = await api.post<{ success: boolean; data: WebProject }>(`/projects/${id}/favorite`);
    return res.data.data;
  },

  /**
   * Auto extract website preview & metadata from URL
   */
  async extractWebsite(url: string): Promise<WebsiteExtractedData> {
    const res = await api.post<{ success: boolean; data: WebsiteExtractedData }>(
      '/projects/extract',
      { url }
    );
    return res.data.data;
  },

  /**
   * Upload UI screenshot files to storage
   */
  async uploadScreenshots(
    files: File[]
  ): Promise<{ id: string; name: string; url: string; size: number }[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const res = await api.post<{
      success: boolean;
      data: { id: string; name: string; url: string; size: number }[];
    }>('/projects/upload-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data.data;
  },
};

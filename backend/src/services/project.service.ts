import { prisma } from '../database/prisma';
import { WebsiteExtractorService } from './websiteExtractor.service';
import { FileService, UploadFileItem } from './file.service';
import { AuthUser } from '../types';

export interface CreateProjectInput {
  title: string;
  liveUrl: string;
  brief?: string;
  description?: string;
  backendUrl?: string;
  githubUrl?: string;
  githubBackendUrl?: string;
  category?: string;
  status?: string;
  techStack?: string[];
  tags?: string[];
  features?: string[];
  thumbnailUrl?: string;
  images?: string[];
  demoEmail?: string;
  demoPassword?: string;
  startDate?: string | Date | null;
  completedDate?: string | Date | null;
  isFavorite?: boolean;
}

export interface UpdateProjectInput {
  title?: string;
  liveUrl?: string;
  brief?: string;
  description?: string;
  backendUrl?: string;
  githubUrl?: string;
  githubBackendUrl?: string;
  category?: string;
  status?: string;
  techStack?: string[];
  tags?: string[];
  features?: string[];
  thumbnailUrl?: string;
  images?: string[];
  demoEmail?: string;
  demoPassword?: string;
  startDate?: string | Date | null;
  completedDate?: string | Date | null;
  isFavorite?: boolean;
  sortOrder?: number;
}

export interface ProjectFilters {
  search?: string;
  category?: string;
  status?: string;
  isFavorite?: boolean;
  tech?: string;
  sortBy?: 'createdAt' | 'title' | 'status' | 'completedDate' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectStats {
  total: number;
  liveCount: number;
  inProgressCount: number;
  favoriteCount: number;
  categories: { category: string; count: number }[];
  topTechnologies: { name: string; count: number }[];
}

export class ProjectService {
  /**
   * Auto extract website info from live URL
   */
  public static async extractFromUrl(url: string) {
    return WebsiteExtractorService.extract(url);
  }

  /**
   * Upload screenshot UI images to vault storage
   */
  public static async uploadImages(user: AuthUser, files: UploadFileItem[]) {
    const uploadedImages: { id: string; name: string; url: string; size: number }[] = [];

    for (const file of files) {
      const fileRecord = await FileService.uploadFile(user, file, null, {
        isSecret: false,
      });

      uploadedImages.push({
        id: fileRecord.id,
        name: fileRecord.originalName,
        url: `/api/files/${fileRecord.id}/stream`,
        size: Number(fileRecord.size),
      });
    }

    return uploadedImages;
  }

  /**
   * List all projects for a user with rich filtering, search, and summary analytics
   */
  public static async listProjects(userId: string, filters: ProjectFilters = {}) {
    const {
      search,
      category,
      status,
      isFavorite,
      tech,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: any = { userId };

    if (category && category !== 'ALL') {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (status && status !== 'ALL') {
      where.status = { equals: status, mode: 'insensitive' };
    }

    if (isFavorite !== undefined) {
      where.isFavorite = isFavorite;
    }

    if (tech && tech !== 'ALL') {
      where.techStack = { has: tech };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { brief: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { liveUrl: { contains: q, mode: 'insensitive' } },
        { techStack: { has: q } },
        { tags: { has: q } },
      ];
    }

    // Determine orderBy
    let orderBy: any = [];
    if (sortBy === 'title') {
      orderBy = [{ title: sortOrder }];
    } else if (sortBy === 'completedDate') {
      orderBy = [{ completedDate: sortOrder }, { createdAt: 'desc' }];
    } else if (sortBy === 'updatedAt') {
      orderBy = [{ updatedAt: sortOrder }];
    } else {
      orderBy = [{ isFavorite: 'desc' }, { sortOrder: 'asc' }, { createdAt: sortOrder }];
    }

    // Fetch matching projects
    const projects = await prisma.webProject.findMany({
      where,
      orderBy,
    });

    // Compute comprehensive stats for user across all their projects
    const allUserProjects = await prisma.webProject.findMany({
      where: { userId },
      select: {
        id: true,
        category: true,
        status: true,
        isFavorite: true,
        techStack: true,
      },
    });

    const total = allUserProjects.length;
    let liveCount = 0;
    let inProgressCount = 0;
    let favoriteCount = 0;
    const categoryCounts: Record<string, number> = {};
    const techCounts: Record<string, number> = {};

    for (const p of allUserProjects) {
      if (p.status?.toLowerCase() === 'live') liveCount++;
      if (p.status?.toLowerCase() === 'in progress') inProgressCount++;
      if (p.isFavorite) favoriteCount++;

      const cat = p.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      if (Array.isArray(p.techStack)) {
        for (const t of p.techStack) {
          const trimmed = t.trim();
          if (trimmed) {
            techCounts[trimmed] = (techCounts[trimmed] || 0) + 1;
          }
        }
      }
    }

    const categories = Object.entries(categoryCounts).map(([cat, count]) => ({
      category: cat,
      count,
    }));

    const topTechnologies = Object.entries(techCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const stats: ProjectStats = {
      total,
      liveCount,
      inProgressCount,
      favoriteCount,
      categories,
      topTechnologies,
    };

    return {
      projects,
      stats,
    };
  }

  /**
   * Get project by ID (verifying ownership)
   */
  public static async getProjectById(userId: string, id: string) {
    const project = await prisma.webProject.findFirst({
      where: {
        id,
        userId,
      },
    });

    return project;
  }

  /**
   * Create a new project
   */
  public static async createProject(userId: string, data: CreateProjectInput) {
    let normalizedLiveUrl = data.liveUrl.trim();
    if (!normalizedLiveUrl.startsWith('http://') && !normalizedLiveUrl.startsWith('https://')) {
      normalizedLiveUrl = 'https://' + normalizedLiveUrl;
    }

    // Sanitize image URLs and thumbnail
    const images = Array.isArray(data.images)
      ? data.images.map((img) => img.trim()).filter(Boolean)
      : [];

    let thumbnailUrl = data.thumbnailUrl?.trim() || null;
    if (!thumbnailUrl && images.length > 0) {
      thumbnailUrl = images[0];
    }

    const techStack = Array.isArray(data.techStack)
      ? data.techStack.map((t) => t.trim()).filter(Boolean)
      : [];

    const tags = Array.isArray(data.tags)
      ? data.tags.map((t) => t.trim()).filter(Boolean)
      : [];

    const features = Array.isArray(data.features)
      ? data.features.map((f) => f.trim()).filter(Boolean)
      : [];

    const project = await prisma.webProject.create({
      data: {
        userId,
        title: data.title.trim(),
        liveUrl: normalizedLiveUrl,
        brief: data.brief?.trim() || null,
        description: data.description?.trim() || null,
        backendUrl: data.backendUrl?.trim() || null,
        githubUrl: data.githubUrl?.trim() || null,
        githubBackendUrl: data.githubBackendUrl?.trim() || null,
        category: data.category?.trim() || 'Full-Stack',
        status: data.status?.trim() || 'Live',
        techStack,
        tags,
        features,
        thumbnailUrl,
        images,
        demoEmail: data.demoEmail?.trim() || null,
        demoPassword: data.demoPassword?.trim() || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        completedDate: data.completedDate ? new Date(data.completedDate) : null,
        isFavorite: Boolean(data.isFavorite),
      },
    });

    return project;
  }

  /**
   * Update an existing project
   */
  public static async updateProject(userId: string, id: string, data: UpdateProjectInput) {
    const existing = await prisma.webProject.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    const updatePayload: any = {};

    if (data.title !== undefined) updatePayload.title = data.title.trim();
    if (data.liveUrl !== undefined) {
      let url = data.liveUrl.trim();
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      updatePayload.liveUrl = url;
    }
    if (data.brief !== undefined) updatePayload.brief = data.brief ? data.brief.trim() : null;
    if (data.description !== undefined)
      updatePayload.description = data.description ? data.description.trim() : null;
    if (data.backendUrl !== undefined)
      updatePayload.backendUrl = data.backendUrl ? data.backendUrl.trim() : null;
    if (data.githubUrl !== undefined)
      updatePayload.githubUrl = data.githubUrl ? data.githubUrl.trim() : null;
    if (data.githubBackendUrl !== undefined)
      updatePayload.githubBackendUrl = data.githubBackendUrl ? data.githubBackendUrl.trim() : null;
    if (data.category !== undefined) updatePayload.category = data.category.trim() || 'Full-Stack';
    if (data.status !== undefined) updatePayload.status = data.status.trim() || 'Live';
    if (data.techStack !== undefined) {
      updatePayload.techStack = Array.isArray(data.techStack)
        ? data.techStack.map((t) => t.trim()).filter(Boolean)
        : [];
    }
    if (data.tags !== undefined) {
      updatePayload.tags = Array.isArray(data.tags)
        ? data.tags.map((t) => t.trim()).filter(Boolean)
        : [];
    }
    if (data.features !== undefined) {
      updatePayload.features = Array.isArray(data.features)
        ? data.features.map((f) => f.trim()).filter(Boolean)
        : [];
    }
    if (data.images !== undefined) {
      updatePayload.images = Array.isArray(data.images)
        ? data.images.map((img) => img.trim()).filter(Boolean)
        : [];
    }
    if (data.thumbnailUrl !== undefined) {
      updatePayload.thumbnailUrl = data.thumbnailUrl ? data.thumbnailUrl.trim() : null;
    } else if (data.images && data.images.length > 0 && !existing.thumbnailUrl) {
      updatePayload.thumbnailUrl = data.images[0];
    }
    if (data.demoEmail !== undefined)
      updatePayload.demoEmail = data.demoEmail ? data.demoEmail.trim() : null;
    if (data.demoPassword !== undefined)
      updatePayload.demoPassword = data.demoPassword ? data.demoPassword.trim() : null;
    if (data.startDate !== undefined) {
      updatePayload.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.completedDate !== undefined) {
      updatePayload.completedDate = data.completedDate ? new Date(data.completedDate) : null;
    }
    if (data.isFavorite !== undefined) {
      updatePayload.isFavorite = Boolean(data.isFavorite);
    }
    if (data.sortOrder !== undefined) {
      updatePayload.sortOrder = Number(data.sortOrder);
    }

    const updated = await prisma.webProject.update({
      where: { id },
      data: updatePayload,
    });

    return updated;
  }

  /**
   * Delete a project
   */
  public static async deleteProject(userId: string, id: string) {
    const existing = await prisma.webProject.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    await prisma.webProject.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Toggle project favorite / pinned state
   */
  public static async toggleFavorite(userId: string, id: string) {
    const existing = await prisma.webProject.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    const updated = await prisma.webProject.update({
      where: { id },
      data: {
        isFavorite: !existing.isFavorite,
      },
    });

    return updated;
  }
}

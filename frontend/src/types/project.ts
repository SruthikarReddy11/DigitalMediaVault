export interface WebProject {
  id: string;
  userId: string;
  title: string;
  liveUrl: string;
  brief?: string | null;
  description?: string | null;
  backendUrl?: string | null;
  githubUrl?: string | null;
  githubBackendUrl?: string | null;
  category: string;
  status: string;
  techStack: string[];
  tags: string[];
  features: string[];
  thumbnailUrl?: string | null;
  images: string[];
  demoEmail?: string | null;
  demoPassword?: string | null;
  startDate?: string | null;
  completedDate?: string | null;
  isFavorite: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStats {
  total: number;
  liveCount: number;
  inProgressCount: number;
  favoriteCount: number;
  categories: { category: string; count: number }[];
  topTechnologies: { name: string; count: number }[];
}

export interface ProjectListResponse {
  projects: WebProject[];
  stats: ProjectStats;
}

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
  startDate?: string | null;
  completedDate?: string | null;
  isFavorite?: boolean;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  sortOrder?: number;
}

export interface ProjectFilterOptions {
  search?: string;
  category?: string;
  status?: string;
  tech?: string;
  isFavorite?: boolean;
  sortBy?: 'createdAt' | 'title' | 'status' | 'completedDate' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface WebsiteExtractedData {
  url: string;
  title: string;
  brief?: string;
  description?: string;
  thumbnailUrl?: string;
  favicon?: string;
  siteName?: string;
  suggestedTags: string[];
  themeColor?: string;
}

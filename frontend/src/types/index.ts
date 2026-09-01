export type Role = 'USER' | 'ADMIN';

export type FileType =
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'PDF'
  | 'DOCUMENT'
  | 'SPREADSHEET'
  | 'PRESENTATION'
  | 'ARCHIVE'
  | 'OTHER';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  role: Role;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId?: string | null;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  children?: FolderItem[];
  _count?: {
    files: number;
    children?: number;
  };
}

export interface MusicItem {
  id: string;
  fileId: string;
  title: string;
  artist: string;
  album?: string | null;
  albumArtist?: string | null;
  genre?: string | null;
  year?: number | null;
  trackNumber?: number | null;
  discNumber?: number | null;
  duration: number; // in seconds
  coverArtFileId?: string | null;
  coverUrl?: string | null;
  streamUrl: string;
  downloadUrl: string;
  playlistItemId?: string;
  position?: number;
  file?: {
    id: string;
    originalName: string;
    size: number;
    mimeType: string;
    createdAt: string;
    isFavorite: boolean;
  };
}

export interface FileItem {
  id: string;
  userId: string;
  folderId?: string | null;
  originalName: string;
  storageKey: string;
  mimeType: string;
  fileType: FileType;
  extension: string;
  size: number;
  checksum?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  folder?: { id: string; name: string } | null;
  music?: MusicItem | null;
  isFavorite: boolean;
  streamUrl: string;
  downloadUrl: string;
  owner?: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
}

export interface PlaylistItem {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  songCount: number;
  totalDuration?: number;
  previewCovers?: string[];
  songs?: MusicItem[];
}

export interface DashboardStats {
  totalFiles: number;
  countsByType: {
    images: number;
    videos: number;
    music: number;
    pdfs: number;
    documents: number;
    spreadsheets: number;
    archives: number;
    others: number;
  };
  favorites: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
  recentFiles: FileItem[];
  recentActivity: Array<{
    id: string;
    action: string;
    resourceType?: string;
    createdAt: string;
    metadata?: any;
  }>;
}

export interface AdminStats {
  users: {
    total: number;
    active: number;
    admins: number;
  };
  files: {
    total: number;
    byType: Record<string, number>;
  };
  storage: {
    totalBytes: number;
    byType: Record<string, number>;
  };
  playlists: {
    total: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    resourceType?: string;
    createdAt: string;
    ipAddress?: string;
    user?: {
      name: string;
      email: string;
      username: string;
    };
  }>;
}

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  fileCount: number;
  playlistCount: number;
  folderCount: number;
  storageBytes: number;
}

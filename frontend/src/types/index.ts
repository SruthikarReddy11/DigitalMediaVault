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
  securityPin?: string | null;
  role: Role;
  isActive: boolean;
  mobileNumber?: string | null;
  gender?: string | null;
  dob?: string | null;
  country?: string | null;
  state?: string | null;
  district?: string | null;
  village?: string | null;
  pincode?: string | null;
  occupation?: string | null;
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
  externalUrl?: string | null;
  isExternal?: boolean;
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

export interface VaultFolder {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  cellCount: number;
  isLocked: boolean;
}

export interface VaultCell {
  id: string;
  folderId: string;
  title: string;
  url: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SecureContact {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  contactType: string;
  occupation?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isFavorite: boolean;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactInput {
  name: string;
  phoneNumber: string;
  contactType?: string;
  occupation?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isFavorite?: boolean;
  color?: string | null;
}

export interface TwoFactorStatus {
  enabled: boolean;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeDataUrl: string;
  otpAuthUrl: string;
}

export interface ShareLinkItem {
  id: string;
  userId: string;
  fileId?: string | null;
  folderId?: string | null;
  token: string;
  title?: string | null;
  hasPassword: boolean;
  expiresAt?: string | null;
  allowDownload: boolean;
  maxDownloads?: number | null;
  downloadCount: number;
  viewCount: number;
  isRevoked: boolean;
  isExpired: boolean;
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  updatedAt: string;
  file?: {
    id: string;
    originalName: string;
    mimeType: string;
    fileType: FileType;
    size: number;
  } | null;
  folder?: {
    id: string;
    name: string;
  } | null;
  accessLogsCount?: number;
}

export interface ShareAccessLogItem {
  id: string;
  shareLinkId: string;
  action: 'VIEW' | 'DOWNLOAD' | 'STREAM';
  ipAddress?: string | null;
  userAgent?: string | null;
  fileId?: string | null;
  createdAt: string;
}

export interface CreateShareInput {
  fileId?: string;
  folderId?: string;
  title?: string;
  password?: string;
  expiresAtOption?: '1h' | '1d' | '7d' | '30d' | 'never' | string;
  customExpiresAt?: string;
  allowDownload?: boolean;
  maxDownloads?: number | null;
}

export interface PublicShareFile {
  id: string;
  originalName: string;
  mimeType: string;
  fileType: FileType;
  extension: string;
  size: number;
  createdAt: string;
  streamUrl: string;
  downloadUrl: string;
  storageKey?: string;
  isExternal?: boolean;
  externalUrl?: string | null;
  music?: {
    title: string;
    artist: string;
    album?: string | null;
    genre?: string | null;
    year?: number | null;
    trackNumber?: number | null;
    duration: number;
    coverArtFileId?: string | null;
    coverUrl?: string | null;
  } | null;
}

export interface PublicShareData {
  isUnlocked: boolean;
  hasPassword: boolean;
  token: string;
  title: string;
  type: 'FILE' | 'FOLDER' | 'ALBUM';
  allowDownload: boolean;
  isDownloadLimitReached?: boolean;
  maxDownloads?: number | null;
  downloadCount: number;
  viewCount: number;
  expiresAt?: string | null;
  createdAt: string;
  owner: {
    name: string;
    avatarUrl?: string | null;
  };
  file?: PublicShareFile | null;
  folder?: {
    id: string;
    name: string;
    createdAt: string;
    files: PublicShareFile[];
  } | null;
  album?: {
    id: string;
    name: string;
    description?: string | null;
    photoCount: number;
    photos: PublicShareFile[];
  } | null;
}

// Global Search Types
export interface SearchFolderResult {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  fileCount: number;
  subfolderCount: number;
  itemCount: number;
  matchReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchFileResult {
  id: string;
  name: string;
  fileType: FileType;
  extension: string;
  size: number;
  mimeType: string;
  folderId: string | null;
  folderName: string | null;
  folderPath: string | null;
  streamUrl: string;
  downloadUrl: string;
  isFavorite: boolean;
  matchReason: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchMusicResult {
  id: string;
  fileId: string;
  title: string;
  artist: string;
  album: string | null;
  albumArtist: string | null;
  genre: string | null;
  year: number | null;
  duration: number;
  coverUrl: string | null;
  streamUrl: string;
  downloadUrl: string;
  extension: string;
  size: number;
  isFavorite: boolean;
  matchReason: string;
  folderPath: string | null;
  tags: string[];
  file?: {
    id: string;
    originalName: string;
    size: number;
    mimeType: string;
    fileType: FileType;
    createdAt: string;
    isFavorite: boolean;
  };
}

export interface GlobalSearchCategories {
  files: { count: number; items: SearchFileResult[] };
  music: { count: number; items: SearchMusicResult[] };
  videos: { count: number; items: SearchFileResult[] };
  photos: { count: number; items: SearchFileResult[] };
  folders: { count: number; items: SearchFolderResult[] };
}

export interface GlobalSearchResponse {
  query: string;
  totalMatches: number;
  categories: GlobalSearchCategories;
}

export interface PhotoTimelineGroup {
  year: number;
  month: number;
  monthName: string;
  count: number;
  photos: FileItem[];
}

export interface ExifMetadataResult {
  hasExif: boolean;
  dimensions?: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  camera?: {
    make?: string;
    model?: string;
    lens?: string;
  };
  exposure?: {
    aperture?: string;
    shutterSpeed?: string;
    iso?: number;
    focalLength?: string;
    flash?: string;
  };
  dateTaken?: string;
  gps?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
  };
  fileDetails: {
    name: string;
    size: number;
    mimeType: string;
    createdAt: string;
  };
}

export interface DuplicatePhotoGroup {
  reason: 'exact_hash' | 'matching_size';
  size: number;
  photos: FileItem[];
}

export interface DuplicatePhotosResponse {
  totalGroups: number;
  totalDuplicates: number;
  groups: DuplicatePhotoGroup[];
}

export interface PhotoAlbum {
  id: string;
  name: string;
  description?: string | null;
  coverFileId?: string | null;
  coverUrl?: string | null;
  photoCount: number;
  previewFileIds?: string[];
  photos?: FileItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlbumInput {
  name: string;
  description?: string;
  coverFileId?: string;
}

export interface UpdateAlbumInput {
  name?: string;
  description?: string;
  coverFileId?: string | null;
}

export * from './calendar';
export * from './product';




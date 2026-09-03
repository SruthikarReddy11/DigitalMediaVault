import { Request } from 'express';
import { Role, FileType } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  securityPin?: string | null;
  role: Role;
  isActive: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  sessionId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AudioMetadataResult {
  title: string;
  artist: string;
  album?: string;
  albumArtist?: string;
  genre?: string;
  year?: number;
  trackNumber?: number;
  discNumber?: number;
  duration: number; // in seconds
  coverArtBuffer?: Buffer;
  coverArtMime?: string;
}

export interface StorageFileResult {
  storageKey: string;
  size: number;
  mimeType: string;
  originalName: string;
  extension: string;
  fileType: FileType;
  checksum?: string;
}

export interface NoteAttachment {
  id: string;
  fileId: string;
  addedAt: string;
  file?: {
    id: string;
    originalName: string;
    fileType: string;
    mimeType: string;
    size: number;
    extension?: string;
    streamUrl: string;
    thumbnailUrl?: string;
  } | null;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content?: string | null;
  isPasswordProtected: boolean;
  isLocked: boolean;
  isHidden: boolean;
  isPinned: boolean;
  isArchived: boolean;
  color: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  attachments?: NoteAttachment[];
}

export interface CreateNoteInput {
  title: string;
  content?: string;
  tags?: string[];
  color?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  isHidden?: boolean;
  isPasswordProtected?: boolean;
  password?: string;
  attachmentFileIds?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  color?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  isHidden?: boolean;
  enablePassword?: boolean;
  disablePassword?: boolean;
  currentPassword?: string;
  newPassword?: string;
  attachmentFileIds?: string[];
}

export interface NoteFilters {
  search?: string;
  tag?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  color?: string;
}

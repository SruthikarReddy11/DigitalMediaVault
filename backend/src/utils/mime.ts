import path from 'path';
import { FileType } from '@prisma/client';

const MIME_MAP: Record<string, { type: FileType; mime: string }> = {
  // Images
  jpg: { type: FileType.IMAGE, mime: 'image/jpeg' },
  jpeg: { type: FileType.IMAGE, mime: 'image/jpeg' },
  png: { type: FileType.IMAGE, mime: 'image/png' },
  gif: { type: FileType.IMAGE, mime: 'image/gif' },
  webp: { type: FileType.IMAGE, mime: 'image/webp' },
  svg: { type: FileType.IMAGE, mime: 'image/svg+xml' },
  bmp: { type: FileType.IMAGE, mime: 'image/bmp' },
  ico: { type: FileType.IMAGE, mime: 'image/x-icon' },
  heic: { type: FileType.IMAGE, mime: 'image/heic' },

  // Video
  mp4: { type: FileType.VIDEO, mime: 'video/mp4' },
  webm: { type: FileType.VIDEO, mime: 'video/webm' },
  mkv: { type: FileType.VIDEO, mime: 'video/x-matroska' },
  mov: { type: FileType.VIDEO, mime: 'video/quicktime' },
  avi: { type: FileType.VIDEO, mime: 'video/x-msvideo' },
  wmv: { type: FileType.VIDEO, mime: 'video/x-ms-wmv' },
  flv: { type: FileType.VIDEO, mime: 'video/x-flv' },
  m4v: { type: FileType.VIDEO, mime: 'video/x-m4v' },

  // Audio
  mp3: { type: FileType.AUDIO, mime: 'audio/mpeg' },
  wav: { type: FileType.AUDIO, mime: 'audio/wav' },
  ogg: { type: FileType.AUDIO, mime: 'audio/ogg' },
  flac: { type: FileType.AUDIO, mime: 'audio/flac' },
  aac: { type: FileType.AUDIO, mime: 'audio/aac' },
  m4a: { type: FileType.AUDIO, mime: 'audio/mp4' },
  opus: { type: FileType.AUDIO, mime: 'audio/opus' },
  wma: { type: FileType.AUDIO, mime: 'audio/x-ms-wma' },

  // PDF
  pdf: { type: FileType.PDF, mime: 'application/pdf' },

  // Document
  doc: { type: FileType.DOCUMENT, mime: 'application/msword' },
  docx: {
    type: FileType.DOCUMENT,
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  txt: { type: FileType.DOCUMENT, mime: 'text/plain' },
  rtf: { type: FileType.DOCUMENT, mime: 'application/rtf' },
  odt: { type: FileType.DOCUMENT, mime: 'application/vnd.oasis.opendocument.text' },
  md: { type: FileType.DOCUMENT, mime: 'text/markdown' },

  // Spreadsheet
  xls: { type: FileType.SPREADSHEET, mime: 'application/vnd.ms-excel' },
  xlsx: {
    type: FileType.SPREADSHEET,
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  csv: { type: FileType.SPREADSHEET, mime: 'text/csv' },
  ods: { type: FileType.SPREADSHEET, mime: 'application/vnd.oasis.opendocument.spreadsheet' },

  // Presentation
  ppt: { type: FileType.PRESENTATION, mime: 'application/vnd.ms-powerpoint' },
  pptx: {
    type: FileType.PRESENTATION,
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  },
  odp: { type: FileType.PRESENTATION, mime: 'application/vnd.oasis.opendocument.presentation' },

  // Archive
  zip: { type: FileType.ARCHIVE, mime: 'application/zip' },
  rar: { type: FileType.ARCHIVE, mime: 'application/vnd.rar' },
  '7z': { type: FileType.ARCHIVE, mime: 'application/x-7z-compressed' },
  tar: { type: FileType.ARCHIVE, mime: 'application/x-tar' },
  gz: { type: FileType.ARCHIVE, mime: 'application/gzip' },
};

export function classifyFile(
  filename: string,
  detectedMime?: string
): { fileType: FileType; extension: string; mimeType: string } {
  const extension = path.extname(filename).toLowerCase().replace('.', '');
  const match = MIME_MAP[extension];

  if (match) {
    return {
      fileType: match.type,
      extension: `.${extension}`,
      mimeType: detectedMime || match.mime,
    };
  }

  // Fallback by detected mime
  if (detectedMime) {
    if (detectedMime.startsWith('image/')) {
      return { fileType: FileType.IMAGE, extension: extension ? `.${extension}` : '', mimeType: detectedMime };
    }
    if (detectedMime.startsWith('video/')) {
      return { fileType: FileType.VIDEO, extension: extension ? `.${extension}` : '', mimeType: detectedMime };
    }
    if (detectedMime.startsWith('audio/')) {
      return { fileType: FileType.AUDIO, extension: extension ? `.${extension}` : '', mimeType: detectedMime };
    }
    if (detectedMime === 'application/pdf') {
      return { fileType: FileType.PDF, extension: '.pdf', mimeType: detectedMime };
    }
  }

  return {
    fileType: FileType.OTHER,
    extension: extension ? `.${extension}` : '',
    mimeType: detectedMime || 'application/octet-stream',
  };
}

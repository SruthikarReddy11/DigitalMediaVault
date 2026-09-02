import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { FileItem } from '../../types';
import { Download, FileText, FileCode, FileSpreadsheet, Eye, ExternalLink } from 'lucide-react';
import { formatBytes, formatDate } from '../../utils/formatters';
import { api, getMediaUrl } from '../../services/api';

interface FilePreviewModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
}) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !file) {
      setTextContent(null);
      return;
    }

    const isTextOrCode =
      file.fileType === 'DOCUMENT' &&
      (file.extension === '.txt' ||
        file.extension === '.md' ||
        file.extension === '.json' ||
        file.extension === '.csv' ||
        file.extension === '.log' ||
        file.mimeType.startsWith('text/'));

    if (isTextOrCode) {
      setLoadingText(true);
      fetch(getMediaUrl(file.streamUrl))
        .then((res) => res.text())
        .then((text) => {
          setTextContent(text);
          setLoadingText(false);
        })
        .catch(() => {
          setTextContent('Failed to load text preview.');
          setLoadingText(false);
        });
    }
  }, [isOpen, file]);

  if (!file || !isOpen) return null;

  const isPdf = file.fileType === 'PDF' || file.extension === '.pdf';
  const isImage = file.fileType === 'IMAGE';
  const isVideo = file.fileType === 'VIDEO';
  const isAudio = file.fileType === 'AUDIO';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 truncate max-w-lg">
          <FileText className="w-5 h-5 text-brand-400 shrink-0" />
          <span className="truncate">{file.originalName}</span>
        </div>
      }
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Preview Container */}
        <div className="min-h-[360px] max-h-[65vh] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center p-2">
          {isPdf ? (
            <iframe
              src={getMediaUrl(file.streamUrl)}
              title={file.originalName}
              className="w-full h-[60vh] rounded-xl bg-white border-0"
            />
          ) : isImage ? (
            <img
              src={getMediaUrl(file.streamUrl)}
              alt={file.originalName}
              className="max-h-[60vh] max-w-full object-contain rounded-xl"
            />
          ) : isVideo ? (
            <video
              src={getMediaUrl(file.streamUrl)}
              controls
              className="w-full max-h-[60vh] object-contain rounded-xl"
            />
          ) : isAudio ? (
            <div className="p-8 text-center w-full max-w-md">
              <audio src={getMediaUrl(file.streamUrl)} controls className="w-full" />
            </div>
          ) : textContent !== null ? (
            <div className="w-full h-[55vh] overflow-y-auto p-4 bg-slate-950 text-slate-300 font-mono text-xs whitespace-pre-wrap selection:bg-brand-500">
              {loadingText ? 'Loading file contents...' : textContent}
            </div>
          ) : (
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-base font-semibold text-white mb-1">
                Preview not directly available
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                This {file.extension.toUpperCase() || 'binary'} file format cannot be rendered in
                the browser preview. You can download the file directly.
              </p>
              <a
                href={file.downloadUrl}
                download={file.originalName}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-brand-600/20"
              >
                <Download className="w-4 h-4" />
                Download {formatBytes(file.size)}
              </a>
            </div>
          )}
        </div>

        {/* File Metadata Info Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500 font-medium mr-1.5">Size:</span>
              <span className="text-slate-200 font-semibold">{formatBytes(file.size)}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium mr-1.5">Type:</span>
              <span className="text-slate-200 font-semibold">{file.mimeType}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium mr-1.5">Uploaded:</span>
              <span className="text-slate-200 font-semibold">{formatDate(file.createdAt)}</span>
            </div>
          </div>

          <a
            href={file.downloadUrl}
            download={file.originalName}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        </div>
      </div>
    </Modal>
  );
};

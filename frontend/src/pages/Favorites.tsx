import React, { useState, useEffect } from 'react';
import { Heart, Play, Download, Trash2, FileText, Image, Video, Music, Sparkles } from 'lucide-react';
import { favoritesApi } from '../services/favoritesApi';
import { FileItem } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';
import { FileTypeBadge } from '../components/common/Badge';
import { FilePreviewModal } from '../components/files/FilePreviewModal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

export const Favorites: React.FC = () => {
  const { success, error } = useToast();
  const { playSongNow } = useAudioPlayer();

  const [favorites, setFavorites] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const fetchFavorites = async () => {
    setIsLoading(true);
    try {
      const data = await favoritesApi.getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleToggle = async (fileId: string) => {
    try {
      await favoritesApi.toggle(fileId);
      setFavorites((prev) => prev.filter((f) => f.id !== fileId));
      success('Removed from favorites.');
    } catch (err: any) {
      error(err.message || 'Failed to toggle favorite.');
    }
  };

  const handleFileClick = (file: FileItem) => {
    if (file.fileType === 'AUDIO' && file.music) {
      playSongNow(file.music);
    } else {
      setPreviewFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Heart className="w-7 h-7 text-rose-500 fill-current" />
          Favorites
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Your bookmarked images, songs, videos, and documents
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Click the heart icon on any image, video, song, or document to add it to your favorites."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {favorites.map((file) => {
            const isImg = file.fileType === 'IMAGE';
            const isAud = file.fileType === 'AUDIO';
            const isVid = file.fileType === 'VIDEO';

            return (
              <div
                key={file.id}
                onClick={() => handleFileClick(file)}
                className="group relative bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-200 hover:-translate-y-1"
              >
                {/* Thumbnail Stage */}
                <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                  {isImg ? (
                    <img
                      src={file.streamUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : isAud ? (
                    <div className="w-full h-full bg-gradient-to-tr from-amber-950/30 to-orange-950/30 flex items-center justify-center">
                      {file.music?.coverUrl ? (
                        <img src={file.music.coverUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-8 h-8 text-amber-400" />
                      )}
                    </div>
                  ) : isVid ? (
                    <div className="w-full h-full bg-gradient-to-tr from-purple-950/30 to-slate-950 flex items-center justify-center">
                      <Video className="w-8 h-8 text-purple-400" />
                    </div>
                  ) : (
                    <FileText className="w-8 h-8 text-slate-500" />
                  )}

                  {/* Remove Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(file.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white shadow-lg backdrop-blur-md transition"
                    title="Remove Favorite"
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                {/* Details */}
                <div className="p-3">
                  <p className="text-xs font-semibold text-white truncate leading-snug">
                    {file.originalName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{formatBytes(file.size)}</span>
                    <FileTypeBadge type={file.fileType} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};

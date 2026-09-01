import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Image,
  Video,
  Music,
  FileText,
  Heart,
  HardDrive,
  UploadCloud,
  Sparkles,
  ArrowRight,
  Play,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Eye,
} from 'lucide-react';
import { filesApi } from '../services/filesApi';
import { DashboardStats, FileItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { formatBytes, formatDate } from '../utils/formatters';
import { Skeleton } from '../components/common/Skeleton';
import { ImageLightbox } from '../components/gallery/ImageLightbox';
import { FilePreviewModal } from '../components/files/FilePreviewModal';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { playSongNow } = useAudioPlayer();
  const { openUpload } = useOutletContext<{ openUpload: () => void }>() || { openUpload: () => {} };

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const fetchStats = async () => {
    try {
      const data = await filesApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const handleUpdate = () => fetchStats();
    window.addEventListener('pdl_files_updated', handleUpdate);
    return () => window.removeEventListener('pdl_files_updated', handleUpdate);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const imagesOnly = stats?.recentFiles.filter((f) => f.fileType === 'IMAGE') || [];

  const handleFileClick = (file: FileItem) => {
    if (file.fileType === 'IMAGE') {
      const idx = imagesOnly.findIndex((img) => img.id === file.id);
      setLightboxIndex(idx >= 0 ? idx : 0);
    } else if (file.fileType === 'AUDIO' && file.music) {
      playSongNow(file.music);
    } else {
      setPreviewFile(file);
    }
  };

  const usedPercent =
    stats && stats.storageLimitBytes > 0
      ? Math.min(100, Math.max(1, (stats.storageUsedBytes / stats.storageLimitBytes) * 100))
      : 0;

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              Personal Digital Vault
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-xl leading-relaxed">
              Your media library is safe, organized, and accessible anywhere.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openUpload}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-brand-600/25 active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Files
            </button>
          </div>
        </div>
      </div>

      {/* Media Type Quick Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          {
            to: '/gallery',
            label: 'Images',
            count: stats?.countsByType.images ?? 0,
            icon: Image,
            color: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30',
          },
          {
            to: '/videos',
            label: 'Videos',
            count: stats?.countsByType.videos ?? 0,
            icon: Video,
            color: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30',
          },
          {
            to: '/music',
            label: 'Music',
            count: stats?.countsByType.music ?? 0,
            icon: Music,
            color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
          },
          {
            to: '/files?type=DOCUMENT',
            label: 'Documents',
            count: stats?.countsByType.documents ?? 0,
            icon: FileText,
            color: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
          },
          {
            to: '/files?type=PDF',
            label: 'PDFs',
            count: stats?.countsByType.pdfs ?? 0,
            icon: FileText,
            color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
          },
          {
            to: '/favorites',
            label: 'Favorites',
            count: stats?.favorites ?? 0,
            icon: Heart,
            color: 'from-red-500/20 to-rose-500/20 text-rose-400 border-rose-500/30',
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className="group relative p-4 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} border flex items-center justify-center mb-3`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">{item.label}</p>
                <p className="text-xl font-bold text-white mt-0.5">
                  {isLoading ? '...' : item.count}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Storage Gauge & Status */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Storage Quota</h3>
              <p className="text-xs text-slate-400">
                Used {formatBytes(stats?.storageUsedBytes || 0)} of{' '}
                {formatBytes(stats?.storageLimitBytes || 100 * 1024 * 1024 * 1024)} (
                {usedPercent.toFixed(1)}%)
              </p>
            </div>
          </div>
          <Link
            to="/files"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
          >
            Manage Files <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(2, usedPercent)}%` }}
          />
        </div>
      </div>

      {/* Recently Added Media Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Recently Added</h2>
            <p className="text-xs text-slate-400">Latest media and documents in your library</p>
          </div>
          <Link
            to="/files"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : stats?.recentFiles.length === 0 ? (
          <div className="p-8 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-center">
            <p className="text-sm text-slate-400 mb-3">Your library is currently empty.</p>
            <button
              onClick={openUpload}
              className="px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl"
            >
              Upload Your First File
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {stats?.recentFiles.map((file) => {
              const isImg = file.fileType === 'IMAGE';
              const isAud = file.fileType === 'AUDIO';
              const isVid = file.fileType === 'VIDEO';

              return (
                <div
                  key={file.id}
                  onClick={() => handleFileClick(file)}
                  className="group relative bg-slate-900 border border-slate-800 hover:border-brand-500/50 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Thumbnail Stage */}
                  <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                    {isImg ? (
                      <img
                        src={file.streamUrl}
                        alt={file.originalName}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : isAud ? (
                      <div className="w-full h-full bg-gradient-to-tr from-amber-950/30 to-orange-950/30 flex items-center justify-center">
                        {file.music?.coverUrl ? (
                          <img src={file.music.coverUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-10 h-10 text-amber-400/80" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <div className="p-3 bg-brand-500 text-white rounded-full shadow-lg">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : isVid ? (
                      <div className="w-full h-full bg-gradient-to-tr from-purple-950/30 to-slate-950 flex items-center justify-center">
                        <Video className="w-10 h-10 text-purple-400/80" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <div className="p-3 bg-brand-500 text-white rounded-full shadow-lg">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-slate-950 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-slate-500" />
                      </div>
                    )}
                  </div>

                  {/* Info Card */}
                  <div className="p-3.5">
                    <p className="text-xs font-semibold text-white truncate leading-snug">
                      {file.originalName}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>{formatBytes(file.size)}</span>
                      <span>{formatDate(file.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox for Images */}
      {lightboxIndex >= 0 && (
        <ImageLightbox
          images={imagesOnly}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex >= 0}
          onClose={() => setLightboxIndex(-1)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}

      {/* Preview Modal for Docs/PDFs */}
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

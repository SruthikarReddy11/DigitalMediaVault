import React, { useState, useEffect } from 'react';
import {
  Copy,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  FolderClosed,
  Eye,
  Sparkles,
} from 'lucide-react';
import { DuplicatePhotoGroup, FileItem } from '../../types';
import { galleryApi } from '../../services/galleryApi';
import { filesApi } from '../../services/filesApi';
import { formatBytes, formatDate } from '../../utils/formatters';
import { getMediaUrl } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface DuplicatePhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotosCleaned?: () => void;
  onViewPhoto?: (photo: FileItem) => void;
}

export const DuplicatePhotosModal: React.FC<DuplicatePhotosModalProps> = ({
  isOpen,
  onClose,
  onPhotosCleaned,
  onViewPhoto,
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<DuplicatePhotoGroup[]>([]);
  const [cleaningGroupIndex, setCleaningGroupIndex] = useState<number | null>(null);

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const res = await galleryApi.getDuplicates();
      setGroups(res.groups);
    } catch (err: any) {
      error(err.message || 'Failed to scan for duplicate photos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDuplicates();
    }
  }, [isOpen]);

  const handleKeepOne = async (keepPhotoId: string, groupIndex: number) => {
    const group = groups[groupIndex];
    if (!group) return;

    setCleaningGroupIndex(groupIndex);
    try {
      const toDelete = group.photos.filter((p) => p.id !== keepPhotoId);
      for (const p of toDelete) {
        await filesApi.moveToTrash(p.id);
      }

      success(`Removed ${toDelete.length} duplicate ${toDelete.length === 1 ? 'copy' : 'copies'}.`);
      setGroups((prev) => prev.filter((_, idx) => idx !== groupIndex));
      if (onPhotosCleaned) onPhotosCleaned();
    } catch (err: any) {
      error(err.message || 'Failed to remove duplicates.');
    } finally {
      setCleaningGroupIndex(null);
    }
  };

  const handleDeleteSingle = async (photoId: string, groupIndex: number) => {
    try {
      await filesApi.moveToTrash(photoId);
      success('Duplicate image moved to trash.');
      setGroups((prev) => {
        const next = [...prev];
        const group = next[groupIndex];
        group.photos = group.photos.filter((p) => p.id !== photoId);
        if (group.photos.length <= 1) {
          next.splice(groupIndex, 1);
        }
        return next;
      });
      if (onPhotosCleaned) onPhotosCleaned();
    } catch (err: any) {
      error(err.message || 'Failed to delete photo.');
    }
  };

  if (!isOpen) return null;

  const totalWastedBytes = groups.reduce((acc, g) => acc + g.size * (g.photos.length - 1), 0);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Duplicate Photo Detection
                {groups.length > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                    {groups.length} groups found
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Identify identical images and reclaim storage space with 1-click cleanup.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reclaimable summary banner */}
        {groups.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent px-6 py-3 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                You can save approximately <strong>{formatBytes(totalWastedBytes)}</strong> by removing redundant copies.
              </span>
            </div>
            <button
              onClick={fetchDuplicates}
              className="text-xs text-amber-300 hover:text-white font-semibold underline underline-offset-2"
            >
              Re-scan
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm font-medium">Scanning photos for duplicates...</p>
              <p className="text-xs text-slate-500">Checking checksum hashes and size fingerprints</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">No Duplicate Photos Found!</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your gallery is cleanly organized. There are no redundant images or duplicate files.
              </p>
            </div>
          ) : (
            groups.map((group, gIdx) => {
              const isCleaning = cleaningGroupIndex === gIdx;

              return (
                <div
                  key={gIdx}
                  className="bg-slate-950/70 border border-white/[0.08] rounded-2xl p-4.5 space-y-4 shadow-sm"
                >
                  {/* Group header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/20 uppercase tracking-wider">
                        {group.reason === 'exact_hash' ? 'Exact Checksum Match' : 'Matching File Size'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {formatBytes(group.size)} each &bull; {group.photos.length} copies
                      </span>
                    </div>

                    {isCleaning && (
                      <div className="flex items-center gap-2 text-xs text-amber-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Cleaning duplicates...</span>
                      </div>
                    )}
                  </div>

                  {/* Duplicate photos list side-by-side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {group.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="bg-slate-900 border border-white/[0.06] rounded-xl p-3 flex flex-col justify-between gap-3 group"
                      >
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40 border border-white/5">
                          <img
                            src={getMediaUrl(photo.streamUrl)}
                            alt={photo.originalName}
                            className="w-full h-full object-cover"
                          />
                          {onViewPhoto && (
                            <button
                              onClick={() => onViewPhoto(photo)}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition backdrop-blur-xs"
                              title="Preview"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-200 truncate" title={photo.originalName}>
                            {photo.originalName}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{formatDate(photo.createdAt)}</span>
                            {photo.folder && (
                              <span className="flex items-center gap-1 text-slate-300 truncate max-w-[100px]">
                                <FolderClosed className="w-3 h-3 text-amber-400 shrink-0" />
                                {photo.folder.name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
                          <button
                            disabled={isCleaning}
                            onClick={() => handleKeepOne(photo.id, gIdx)}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Keep this copy and trash all other duplicates in this group"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Keep This</span>
                          </button>
                          <button
                            disabled={isCleaning}
                            onClick={() => handleDeleteSingle(photo.id, gIdx)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] transition cursor-pointer disabled:opacity-50"
                            title="Move this specific photo to trash"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

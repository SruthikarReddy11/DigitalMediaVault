import React from 'react';
import {
  Calendar,
  Heart,
  Share2,
  CheckCircle2,
  Circle,
  FolderClosed,
} from 'lucide-react';
import { PhotoTimelineGroup, FileItem } from '../../types';
import { getMediaUrl } from '../../services/api';
import { formatBytes } from '../../utils/formatters';

interface GalleryTimelineViewProps {
  timelineGroups: PhotoTimelineGroup[];
  isLoading: boolean;
  selectedIds: Set<string>;
  isMultiSelectMode: boolean;
  onToggleSelect: (id: string) => void;
  onSelectAllInGroup: (photos: FileItem[]) => void;
  onOpenLightbox: (file: FileItem) => void;
  onToggleFavorite: (id: string) => void;
  onShare: (file: FileItem) => void;
}

export const GalleryTimelineView: React.FC<GalleryTimelineViewProps> = ({
  timelineGroups,
  isLoading,
  selectedIds,
  isMultiSelectMode,
  onToggleSelect,
  onSelectAllInGroup,
  onOpenLightbox,
  onToggleFavorite,
  onShare,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-8">
        {[1, 2].map((g) => (
          <div key={g} className="space-y-4">
            <div className="h-10 w-64 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (timelineGroups.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p className="text-base font-semibold text-slate-300">No photos in timeline</p>
        <p className="text-xs text-slate-500 mt-1">Upload photos or adjust filters to view your timeline.</p>
      </div>
    );
  }

  // Group by Year for neat hierarchical timeline display
  const yearMap = new Map<number, PhotoTimelineGroup[]>();
  for (const group of timelineGroups) {
    const list = yearMap.get(group.year) || [];
    list.push(group);
    yearMap.set(group.year, list);
  }

  const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a);

  return (
    <div className="space-y-10">
      {sortedYears.map((year) => {
        const months = yearMap.get(year)!;
        const totalYearPhotos = months.reduce((acc, m) => acc + m.count, 0);

        return (
          <div key={year} className="space-y-6">
            {/* Year Header Banner */}
            <div className="sticky top-20 z-10 flex items-center justify-between py-2.5 px-5 bg-slate-950/85 backdrop-blur-xl border-y border-pink-500/20 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-white tracking-tight">
                  {year}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/20">
                  {totalYearPhotos} {totalYearPhotos === 1 ? 'photo' : 'photos'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-pink-400" />
                <span>{months.length} {months.length === 1 ? 'month' : 'months'} active</span>
              </div>
            </div>

            {/* Months inside Year */}
            <div className="space-y-8 pl-1 sm:pl-3">
              {months.map((group) => {
                const isGroupAllSelected =
                  group.photos.length > 0 && group.photos.every((p) => selectedIds.has(p.id));

                return (
                  <div key={`${group.year}-${group.month}`} className="space-y-3.5">
                    {/* Month header matching user request */}
                    <div className="flex items-center justify-between py-1 px-2 border-b border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 shadow-sm shadow-pink-500/50" />
                        <h3 className="text-lg font-bold text-white tracking-tight">
                          {group.monthName}
                        </h3>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1">
                          <span>📸</span>
                          <span>{group.count} {group.count === 1 ? 'photo' : 'photos'}</span>
                        </span>
                      </div>

                      {/* Select All Month Button */}
                      {isMultiSelectMode && (
                        <button
                          onClick={() => onSelectAllInGroup(group.photos)}
                          className="text-xs font-semibold text-pink-400 hover:text-pink-300 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-pink-500/10 transition"
                        >
                          {isGroupAllSelected ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-pink-400" />
                              <span>Deselect Month</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-3.5 h-3.5 text-slate-400" />
                              <span>Select All ({group.photos.length})</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Photo Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {group.photos.map((photo) => {
                        const isSelected = selectedIds.has(photo.id);

                        return (
                          <div
                            key={photo.id}
                            onClick={() => {
                              if (isMultiSelectMode) {
                                onToggleSelect(photo.id);
                              } else {
                                onOpenLightbox(photo);
                              }
                            }}
                            className={`group relative aspect-square bg-slate-900/80 rounded-2xl overflow-hidden cursor-pointer shadow-md transition-all duration-200 ${
                              isSelected
                                ? 'ring-2 ring-pink-500 scale-[0.98]'
                                : 'border border-white/[0.08] hover:border-pink-500/50 hover:-translate-y-0.5'
                            }`}
                          >
                            <img
                              src={getMediaUrl(photo.streamUrl)}
                              alt={photo.originalName}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              loading="lazy"
                            />

                            {/* Multi-select checkbox */}
                            {isMultiSelectMode && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleSelect(photo.id);
                                }}
                                className="absolute top-2.5 left-2.5 z-10"
                              >
                                {isSelected ? (
                                  <div className="p-1 rounded-lg bg-pink-600 text-white shadow-lg">
                                    <CheckCircle2 className="w-4 h-4 fill-current" />
                                  </div>
                                ) : (
                                  <div className="p-1 rounded-lg bg-black/60 text-white/70 hover:text-white border border-white/20 backdrop-blur-md">
                                    <Circle className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-between">
                              {/* Top actions */}
                              <div className="flex items-center justify-end gap-1 self-end">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(photo.id);
                                  }}
                                  className={`p-1.5 rounded-lg backdrop-blur-md transition ${
                                    photo.isFavorite
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-black/60 text-white/80 hover:text-white'
                                  }`}
                                  title="Favorite"
                                >
                                  <Heart className={`w-3.5 h-3.5 ${photo.isFavorite ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onShare(photo);
                                  }}
                                  className="p-1.5 rounded-lg bg-black/60 hover:bg-brand-600 text-white/80 hover:text-white backdrop-blur-md transition"
                                  title="Share"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Bottom metadata */}
                              <div className="p-1.5 bg-black/50 backdrop-blur-md rounded-lg border border-white/10">
                                <p className="text-[11px] font-semibold text-white truncate">
                                  {photo.originalName}
                                </p>
                                <p className="text-[9px] text-slate-300 font-mono">
                                  {formatBytes(photo.size)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

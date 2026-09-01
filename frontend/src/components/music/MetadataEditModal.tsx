import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { MusicItem } from '../../types';
import { musicApi } from '../../services/musicApi';
import { useToast } from '../../contexts/ToastContext';

interface MetadataEditModalProps {
  song: MusicItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updated: MusicItem) => void;
}

export const MetadataEditModal: React.FC<MetadataEditModalProps> = ({
  song,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { success, error } = useToast();
  const [title, setTitle] = useState(song?.title || '');
  const [artist, setArtist] = useState(song?.artist || '');
  const [album, setAlbum] = useState(song?.album || '');
  const [genre, setGenre] = useState(song?.genre || '');
  const [year, setYear] = useState<string>(song?.year ? String(song.year) : '');
  const [trackNumber, setTrackNumber] = useState<string>(
    song?.trackNumber ? String(song.trackNumber) : ''
  );
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (song) {
      setTitle(song.title);
      setArtist(song.artist);
      setAlbum(song.album || '');
      setGenre(song.genre || '');
      setYear(song.year ? String(song.year) : '');
      setTrackNumber(song.trackNumber ? String(song.trackNumber) : '');
    }
  }, [song]);

  if (!song) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return;

    setIsSaving(true);
    try {
      const updated = await musicApi.updateMetadata(song.id, {
        title: title.trim(),
        artist: artist.trim(),
        album: album.trim() || null,
        genre: genre.trim() || null,
        year: year ? parseInt(year, 10) : null,
        trackNumber: trackNumber ? parseInt(trackNumber, 10) : null,
      });

      success('Music metadata updated!');
      if (onSaved) onSaved(updated);
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to update metadata.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Song Metadata">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Song Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Artist *</label>
            <input
              type="text"
              required
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Album</label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Genre</label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Release Year</label>
            <input
              type="number"
              min="1900"
              max="2100"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Track Number</label>
            <input
              type="number"
              min="1"
              max="999"
              value={trackNumber}
              onChange={(e) => setTrackNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition shadow-lg shadow-brand-600/20 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

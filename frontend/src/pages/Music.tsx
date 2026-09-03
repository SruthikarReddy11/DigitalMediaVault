import React, { useState, useEffect } from 'react';
import { getMediaUrl } from '../services/api';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Music as MusicIcon,
  Play,
  Pause,
  Shuffle,
  Plus,
  Search,
  UploadCloud,
  Heart,
  ListPlus,
  Edit2,
  Disc,
  Mic2,
  Radio,
  ListMusic,
  MoreVertical,
  Trash2,
  Clock,
  Sliders,
  Sparkles,
  RotateCcw,
  Volume2,
  CornerDownRight,
} from 'lucide-react';
import { musicApi } from '../services/musicApi';
import { playlistsApi } from '../services/playlistsApi';
import { favoritesApi } from '../services/favoritesApi';
import { filesApi } from '../services/filesApi';
import { MusicItem, PlaylistItem } from '../types';
import { formatDuration } from '../utils/formatters';
import { useAudioPlayer, EqualizerPreset } from '../contexts/AudioPlayerContext';
import { MetadataEditModal } from '../components/music/MetadataEditModal';
import { AddToPlaylistModal } from '../components/music/AddToPlaylistModal';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';

type Tab = 'songs' | 'albums' | 'artists' | 'genres' | 'playlists' | 'equalizer';

export const Music: React.FC = () => {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const {
    currentTrack,
    isPlaying,
    playSongNow,
    playPlaylistNow,
    addToQueue,
    playNext,
    togglePlay,
    equalizerPreset,
    setEqualizerPreset,
    eqGains,
    setEqBandGain,
  } = useAudioPlayer();
  const { openUpload } = useOutletContext<{ openUpload: () => void }>() || { openUpload: () => {} };

  const [activeTab, setActiveTab] = useState<Tab>('songs');
  const [songs, setSongs] = useState<MusicItem[]>([]);
  const [albums, setAlbums] = useState<Array<{ album: string; artist: string; year?: number; songCount: number; coverUrl?: string | null }>>([]);
  const [artists, setArtists] = useState<Array<{ artist: string; songCount: number; albumCount: number; coverUrl?: string | null }>>([]);
  const [genres, setGenres] = useState<Array<{ genre: string; songCount: number }>>([]);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearchTerm] = useState('');
  const [filterArtist, setFilterArtist] = useState<string | null>(null);
  const [filterAlbum, setFilterAlbum] = useState<string | null>(null);
  const [filterGenre, setFilterGenre] = useState<string | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Modals
  const [editTarget, setEditTarget] = useState<MusicItem | null>(null);
  const [playlistTargetSongId, setPlaylistTargetSongId] = useState<string | null>(null);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  const fetchMusicData = async () => {
    setIsLoading(true);
    try {
      const [songsData, albumsData, artistsData, genresData, playlistsData] = await Promise.all([
        musicApi.getSongs({
          search: search || undefined,
          artist: filterArtist || undefined,
          album: filterAlbum || undefined,
          genre: filterGenre || undefined,
          favoriteOnly: onlyFavorites,
        }),
        musicApi.getAlbums(),
        musicApi.getArtists(),
        musicApi.getGenres(),
        playlistsApi.getPlaylists(),
      ]);

      setSongs(songsData);
      setAlbums(albumsData);
      setArtists(artistsData);
      setGenres(genresData);
      setPlaylists(playlistsData);
    } catch (err) {
      console.error('Failed to load music data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMusicData();

    const handleUpdate = () => fetchMusicData();
    window.addEventListener('pdl_files_updated', handleUpdate);
    return () => window.removeEventListener('pdl_files_updated', handleUpdate);
  }, [search, filterArtist, filterAlbum, filterGenre, onlyFavorites]);

  const handleToggleFavorite = async (fileId: string) => {
    try {
      const res = await favoritesApi.toggle(fileId);
      setSongs((prev) =>
        prev.map((s) =>
          s.fileId === fileId
            ? { ...s, file: s.file ? { ...s.file, isFavorite: res.isFavorite } : undefined }
            : s
        )
      );
      success(res.message);
    } catch (err: any) {
      error(err.message || 'Failed to update favorite.');
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const created = await playlistsApi.createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
      setPlaylists((prev) => [created, ...prev]);
      success(`Playlist "${created.name}" created!`);
      setIsCreatePlaylistOpen(false);
      setNewPlaylistName('');
      setNewPlaylistDesc('');
    } catch (err: any) {
      error(err.message || 'Failed to create playlist.');
    }
  };

  const clearFilters = () => {
    setFilterArtist(null);
    setFilterAlbum(null);
    setFilterGenre(null);
    setSearchTerm('');
    setOnlyFavorites(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            <Radio className="w-4 h-4" />
            Audio & Music Experience
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Music Library
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Stream, manage playlists, edit ID3 tags, and enjoy lossless audio playback.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          {songs.length > 0 && (
            <>
              <button
                onClick={() => playPlaylistNow(songs, 0)}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/25 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                Play All
              </button>
              <button
                onClick={() => {
                  const shuffled = [...songs].sort(() => Math.random() - 0.5);
                  playPlaylistNow(shuffled, 0);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl transition"
                title="Shuffle All"
              >
                <Shuffle className="w-4 h-4" />
                Shuffle
              </button>
            </>
          )}

          <button
            onClick={openUpload}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-brand-600/20 active:scale-95"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Music
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'songs', label: 'All Songs', icon: MusicIcon, count: songs.length },
          { id: 'albums', label: 'Albums', icon: Disc, count: albums.length },
          { id: 'artists', label: 'Artists', icon: Mic2, count: artists.length },
          { id: 'genres', label: 'Genres', icon: Radio, count: genres.length },
          { id: 'playlists', label: 'Playlists', icon: ListMusic, count: playlists.length },
          {
            id: 'equalizer',
            label: 'Equalizer',
            icon: Sliders,
            badge: equalizerPreset !== 'flat' ? equalizerPreset.toUpperCase() : 'DSP',
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition whitespace-nowrap ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count !== undefined ? tab.count : tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter notification chip if active */}
      {(filterArtist || filterAlbum || filterGenre) && (
        <div className="flex items-center gap-2 p-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-xs text-brand-300">
          <span>Filtering by:</span>
          {filterArtist && <span className="font-semibold">Artist: {filterArtist}</span>}
          {filterAlbum && <span className="font-semibold">Album: {filterAlbum}</span>}
          {filterGenre && <span className="font-semibold">Genre: {filterGenre}</span>}
          <button
            onClick={clearFilters}
            className="ml-auto underline hover:text-white font-medium"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* TAB 1: ALL SONGS */}
      {activeTab === 'songs' && (
        <div className="space-y-4">
          {/* Search and Quick Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search songs, artists, albums..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setOnlyFavorites((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                onlyFavorites
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current text-rose-500' : ''}`} />
              Favorites Only
            </button>
          </div>

          {/* Songs Table */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-14 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : songs.length === 0 ? (
            <EmptyState
              icon={MusicIcon}
              title="No songs found"
              description="Upload MP3, WAV, FLAC, or AAC audio files to start your collection."
              actionLabel="Upload Music"
              onAction={openUpload}
            />
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5 sm:col-span-4">Title</div>
                <div className="hidden sm:block sm:col-span-3">Artist / Album</div>
                <div className="hidden md:block md:col-span-2">Genre</div>
                <div className="col-span-3 sm:col-span-2 text-right">Duration</div>
                <div className="col-span-3 sm:col-span-2 text-right">Actions</div>
              </div>

              <div className="divide-y divide-slate-800/60">
                {songs.map((song, idx) => {
                  const isCurrent = currentTrack?.id === song.id;
                  const isTrackPlaying = isCurrent && isPlaying;

                  return (
                    <div
                      key={song.id}
                      className={`grid grid-cols-12 gap-4 px-4 py-3 items-center text-xs transition group ${
                        isCurrent ? 'bg-brand-600/15 text-brand-300' : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      {/* Play / Index */}
                      <div className="col-span-1 text-center flex items-center justify-center">
                        <button
                          onClick={() => {
                            if (isCurrent) togglePlay();
                            else playSongNow(song, songs);
                          }}
                          className="w-7 h-7 rounded-lg bg-slate-800 group-hover:bg-brand-600 text-slate-300 group-hover:text-white flex items-center justify-center transition shadow"
                        >
                          {isTrackPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          )}
                        </button>
                      </div>

                      {/* Title & Cover */}
                      <div className="col-span-5 sm:col-span-4 flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center border border-slate-800">
                          {song.coverUrl ? (
                            <img src={getMediaUrl(song.coverUrl)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <MusicIcon className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="font-semibold text-white truncate text-sm leading-tight">
                            {song.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate sm:hidden mt-0.5">
                            {song.artist}
                          </p>
                        </div>
                      </div>

                      {/* Artist / Album */}
                      <div className="hidden sm:block sm:col-span-3 truncate">
                        <p className="font-medium text-slate-200 truncate">{song.artist}</p>
                        <p className="text-[11px] text-slate-400 truncate">{song.album || '—'}</p>
                      </div>

                      {/* Genre */}
                      <div className="hidden md:block md:col-span-2 text-slate-400 truncate">
                        {song.genre ? (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-medium text-slate-300">
                            {song.genre}
                          </span>
                        ) : (
                          '—'
                        )}
                      </div>

                      {/* Duration */}
                      <div className="col-span-3 sm:col-span-2 text-right font-mono text-slate-400">
                        {formatDuration(song.duration)}
                      </div>

                      {/* Actions */}
                      <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1">
                        {/* Favorite */}
                        <button
                          onClick={() => handleToggleFavorite(song.fileId)}
                          className={`p-1.5 rounded-lg transition ${
                            song.file?.isFavorite
                              ? 'text-rose-400'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="Favorite"
                        >
                          <Heart className={`w-3.5 h-3.5 ${song.file?.isFavorite ? 'fill-current' : ''}`} />
                        </button>

                        {/* Add to Queue */}
                        <button
                          onClick={() => {
                            addToQueue(song);
                            success(`Added "${song.title}" to queue`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                          title="Add to queue"
                        >
                          <ListPlus className="w-3.5 h-3.5" />
                        </button>

                        {/* Play Next */}
                        <button
                          onClick={() => {
                            playNext(song);
                            success(`"${song.title}" will play next`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-brand-300 rounded-lg transition"
                          title="Play next"
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                        </button>

                        {/* Add to Playlist */}
                        <button
                          onClick={() => setPlaylistTargetSongId(song.id)}
                          className="p-1.5 text-slate-400 hover:text-brand-400 rounded-lg transition"
                          title="Add to playlist"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Metadata */}
                        <button
                          onClick={() => setEditTarget(song)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                          title="Edit metadata"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALBUMS */}
      {activeTab === 'albums' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {albums.map((album, idx) => (
            <div
              key={`${album.album}-${idx}`}
              onClick={() => {
                setFilterAlbum(album.album);
                setActiveTab('songs');
              }}
              className="group p-4 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
            >
              <div className="aspect-square w-full rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden mb-3 border border-slate-800">
                {album.coverUrl ? (
                  <img src={getMediaUrl(album.coverUrl)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                ) : (
                  <Disc className="w-12 h-12 text-slate-600 group-hover:text-amber-400 transition" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition truncate">
                  {album.album}
                </h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">{album.artist}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800">
                  <span>{album.songCount} songs</span>
                  {album.year && <span>{album.year}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ARTISTS */}
      {activeTab === 'artists' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {artists.map((artist, idx) => (
            <div
              key={`${artist.artist}-${idx}`}
              onClick={() => {
                setFilterArtist(artist.artist);
                setActiveTab('songs');
              }}
              className="group p-4 bg-slate-900 border border-slate-800 hover:border-brand-500/50 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl text-center"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-slate-950 flex items-center justify-center overflow-hidden mb-3 border-2 border-slate-800 group-hover:border-brand-500 transition">
                {artist.coverUrl ? (
                  <img src={getMediaUrl(artist.coverUrl)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Mic2 className="w-10 h-10 text-brand-400" />
                )}
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition truncate">
                {artist.artist}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {artist.songCount} songs • {artist.albumCount} albums
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: GENRES */}
      {activeTab === 'genres' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {genres.map((genre) => (
            <div
              key={genre.genre}
              onClick={() => {
                setFilterGenre(genre.genre);
                setActiveTab('songs');
              }}
              className="p-5 bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                  <Radio className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{genre.genre}</h3>
                  <p className="text-xs text-slate-400">{genre.songCount} tracks</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: PLAYLISTS */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Your Playlists</h2>
            <button
              onClick={() => setIsCreatePlaylistOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-brand-600/20"
            >
              <Plus className="w-4 h-4" />
              New Playlist
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => navigate(`/playlists/${pl.id}`)}
                className="group p-5 bg-slate-900 border border-slate-800 hover:border-brand-500/50 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-600/20 shrink-0">
                    <ListMusic className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
                    {pl.songCount} tracks
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition truncate">
                    {pl.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {pl.description || 'No description provided.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Equalizer Studio Tab */}
      {activeTab === 'equalizer' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Card */}
          <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-brand-950/40 border border-slate-800 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  <Sliders className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">Studio Sound Equalizer</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 text-xs font-semibold border border-brand-500/20">
                  Web Audio API DSP
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                Real-time 5-Band Biquad Filter processing applied directly to browser audio output. Adjust frequency gains or select studio presets.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEqualizerPreset('flat')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition border border-slate-700/60"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Flat
              </button>
            </div>
          </div>

          {/* Equalizer Presets Rack */}
          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                Equalizer Sound Profiles
              </h3>
              <span className="text-xs font-mono font-bold text-brand-300">
                ACTIVE: {equalizerPreset.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {[
                { id: 'flat', label: 'Flat', desc: 'Natural audio curve' },
                { id: 'bass', label: 'Bass Boost', desc: 'Sub & low-end impact' },
                { id: 'vocal', label: 'Vocal Clarity', desc: 'Crisp speech & lyrics' },
                { id: 'treble', label: 'Treble Boost', desc: 'Bright highs & cymbals' },
                { id: 'electronic', label: 'Electronic', desc: 'Dynamic synth curve' },
                { id: 'pop', label: 'Pop', desc: 'Upbeat acoustic curve' },
                { id: 'rock', label: 'Rock', desc: 'Punchy low & high boost' },
              ].map((preset) => {
                const isSelected = equalizerPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setEqualizerPreset(preset.id as EqualizerPreset)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'bg-brand-600/20 text-brand-300 border-brand-500/50 shadow-lg shadow-brand-600/10 scale-[1.02]'
                        : 'bg-slate-950/60 hover:bg-slate-800/80 text-slate-300 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{preset.label}</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{preset.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5-Band Interactive Graphical Equalizer */}
          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">5-Band Parametric Frequency Sliders</h3>
                <p className="text-xs text-slate-400">Low-shelf, 3 peaking filters, and high-shelf from 60 Hz to 14 kHz</p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-400">Scale: -12 dB to +12 dB</span>
            </div>

            {/* Faders */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-4 pt-2">
              {[
                { name: 'Sub-Bass', freq: '60 Hz', type: 'Lowshelf', idx: 0 },
                { name: 'Bass', freq: '230 Hz', type: 'Peaking', idx: 1 },
                { name: 'Midrange', freq: '910 Hz', type: 'Peaking', idx: 2 },
                { name: 'Upper-Mid', freq: '3.6 kHz', type: 'Peaking', idx: 3 },
                { name: 'Treble', freq: '14 kHz', type: 'Highshelf', idx: 4 },
              ].map((band) => {
                const gain = eqGains[band.idx];
                return (
                  <div
                    key={band.freq}
                    className="p-4 bg-slate-950/70 border border-slate-800/90 rounded-2xl flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{band.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{band.freq}</p>
                      </div>
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                          gain > 0
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : gain < 0
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {gain > 0 ? `+${gain}` : gain} dB
                      </span>
                    </div>

                    {/* Slider input */}
                    <div className="py-2">
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={gain}
                        onChange={(e) => setEqBandGain(band.idx, parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-800 accent-brand-500 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                        <span>-12dB</span>
                        <span>0dB</span>
                        <span>+12dB</span>
                      </div>
                    </div>

                    <span className="text-[9px] text-center text-slate-500 font-semibold uppercase tracking-wider">
                      {band.type}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Live Track Audition Bar */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {currentTrack ? (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center">
                    {currentTrack.coverUrl ? (
                      <img src={getMediaUrl(currentTrack.coverUrl)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <MusicIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {isPlaying ? 'Now Shaping:' : 'Loaded:'} {currentTrack.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{currentTrack.artist}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No track currently playing. Play a track to hear equalizer changes live.</p>
              )}

              <div className="flex items-center gap-2 shrink-0">
                {currentTrack ? (
                  <button
                    onClick={togglePlay}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition shadow flex items-center gap-1.5"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    <span>{isPlaying ? 'Pause Audio' : 'Resume Audio'}</span>
                  </button>
                ) : songs.length > 0 ? (
                  <button
                    onClick={() => playSongNow(songs[0], songs)}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition shadow flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    <span>Play First Song</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editTarget && (
        <MetadataEditModal
          song={editTarget}
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated: MusicItem) => {
            setSongs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          }}
        />
      )}

      {/* Add To Playlist Modal */}
      {playlistTargetSongId && (
        <AddToPlaylistModal
          musicId={playlistTargetSongId}
          isOpen={!!playlistTargetSongId}
          onClose={() => setPlaylistTargetSongId(null)}
        />
      )}

      {/* Create New Playlist Modal */}
      <Modal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        title="Create New Playlist"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreatePlaylist} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Playlist Name *</label>
            <input
              type="text"
              required
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="e.g. Chill Coding Vibes"
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={newPlaylistDesc}
              onChange={(e) => setNewPlaylistDesc(e.target.value)}
              placeholder="Optional description..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreatePlaylistOpen(false)}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-600/20"
            >
              Create Playlist
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

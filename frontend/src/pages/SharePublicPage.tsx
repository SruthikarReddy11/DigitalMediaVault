import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Film,
  Music as MusicIcon,
  FileSpreadsheet,
  Archive,
  File as FileIcon,
  Clock,
  QrCode,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Folder as FolderIcon,
  HardDrive,
  Calendar,
  Sparkles,
  Images,
  Play,
} from 'lucide-react';
import { shareApi } from '../services/shareApi';
import { getMediaUrl } from '../services/api';
import { PublicShareData, PublicShareFile, FileItem } from '../types';
import { formatBytes, formatDateTime } from '../utils/formatters';
import { FileTypeBadge } from '../components/common/Badge';
import { QRCodeDisplayModal } from '../components/share/QRCodeDisplay';
import { ImageLightbox } from '../components/gallery/ImageLightbox';
import { SlideshowModal } from '../components/gallery/SlideshowModal';

export const SharePublicPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [shareData, setShareData] = useState<PublicShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Password Unlock state
  const [passwordInput, setPasswordInput] = useState('');
  const [activePassword, setActivePassword] = useState<string>(() => {
    try {
      return token ? sessionStorage.getItem(`share_pwd_${token}`) || '' : '';
    } catch {
      return '';
    }
  });
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Previewing specific file inside folder
  const [activeFolderFile, setActiveFolderFile] = useState<PublicShareFile | null>(null);

  // Copy & QR
  const [copied, setCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Album Lightbox & Slideshow state
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);

  // Helper to ensure password query param is attached to stream/download URLs
  const appendPasswordToUrl = (rawUrl: string | null | undefined): string => {
    if (!rawUrl) return '';
    const base = getMediaUrl(rawUrl);
    if (!activePassword) return base;
    if (base.includes('pwd=') || base.includes('password=')) return base;
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}pwd=${encodeURIComponent(activePassword)}`;
  };

  const fetchShareData = async (pwd?: string) => {
    if (!token) return;
    setLoading(true);
    setErrorMessage(null);
    setUnlockError(null);

    const effectivePwd = pwd !== undefined ? pwd : (activePassword || undefined);

    try {
      const data = await shareApi.getPublicShare(token, effectivePwd);
      setShareData(data);
      if (effectivePwd && data.isUnlocked) {
        setActivePassword(effectivePwd);
        try {
          sessionStorage.setItem(`share_pwd_${token}`, effectivePwd);
        } catch {}
      }
      if (data.folder && data.folder.files.length > 0) {
        setActiveFolderFile(data.folder.files[0]);
      }
    } catch (err: any) {
      console.error('Failed to load shared item:', err);
      setErrorMessage(err.message || 'Failed to access shared link.');
      setErrorCode(err.code || 'ERROR');
    } finally {
      setLoading(false);
      setIsUnlocking(false);
    }
  };

  useEffect(() => {
    fetchShareData();
  }, [token]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwd = passwordInput.trim();
    if (!pwd) return;
    setIsUnlocking(true);
    setUnlockError(null);

    try {
      await fetchShareData(pwd);
    } catch (err: any) {
      setUnlockError(err.message || 'Incorrect password.');
      setIsUnlocking(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleOpenQr = async () => {
    if (!token) return;
    try {
      const res = await shareApi.getQrCode(token);
      setQrDataUrl(res.qrDataUrl);
      setIsQrOpen(true);
    } catch (err) {
      console.error('QR failed:', err);
    }
  };

  const renderFileIcon = (type: string) => {
    switch (type) {
      case 'IMAGE':
        return <ImageIcon className="w-5 h-5 text-brand-400" />;
      case 'VIDEO':
        return <Film className="w-5 h-5 text-rose-400" />;
      case 'AUDIO':
        return <MusicIcon className="w-5 h-5 text-amber-400" />;
      case 'PDF':
      case 'DOCUMENT':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'SPREADSHEET':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'ARCHIVE':
        return <Archive className="w-5 h-5 text-orange-400" />;
      default:
        return <FileIcon className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500/30 selection:text-white">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-white text-base tracking-tight leading-none">
              VaultMedia
            </span>
            <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider mt-0.5">
              Secure Share
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenQr}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Scan QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-400">Verifying secure link...</p>
          </div>
        ) : errorMessage ? (
          /* Error Screen */
          <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">Link Unavailable</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {errorMessage}
              </p>
            </div>

            {errorCode === 'LINK_REVOKED' && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                This link was revoked by the file owner.
              </div>
            )}

            {errorCode === 'LINK_EXPIRED' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                The expiration timeframe set for this link has elapsed.
              </div>
            )}

            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
              >
                Go to VaultMedia
              </Link>
            </div>
          </div>
        ) : !shareData?.isUnlocked ? (
          /* Password Unlock Gate */
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-brand-500/30 shadow-2xl backdrop-blur-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Protected Share Link
              </h2>
              <p className="text-xs text-slate-400">
                This {shareData?.type.toLowerCase() || 'item'} is password protected. Enter the password provided by the owner to unlock.
              </p>
            </div>

            {/* Shared Item Title Badge */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-brand-400 shrink-0">
                {shareData?.type === 'FOLDER' ? (
                  <FolderIcon className="w-5 h-5" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {shareData?.title}
                </div>
                <div className="text-[10px] text-slate-400">
                  Shared by {shareData?.owner.name || 'User'}
                </div>
              </div>
            </div>

            {/* Password Form */}
            <form onSubmit={handleUnlock} className="space-y-3.5">
              <div>
                <input
                  type="password"
                  placeholder="Enter link password..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-4 py-3 bg-slate-950/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                />
                {unlockError && (
                  <p className="text-xs text-rose-400 mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{unlockError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isUnlocking}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-brand-600/25 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{isUnlocking ? 'Unlocking...' : 'Unlock Content'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* Unlocked Content Screen */
          <div className="w-full max-w-5xl space-y-6 animate-in fade-in duration-300">
            {/* Shared Header Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3.5 rounded-2xl border shrink-0 ${
                  shareData.type === 'ALBUM' || shareData.album
                    ? 'bg-pink-500/15 border-pink-500/30 text-pink-400'
                    : 'bg-brand-500/15 border-brand-500/30 text-brand-400'
                }`}>
                  {shareData.type === 'ALBUM' || shareData.album ? (
                    <Images className="w-7 h-7" />
                  ) : shareData.type === 'FOLDER' ? (
                    <FolderIcon className="w-7 h-7" />
                  ) : (
                    renderFileIcon(shareData.file?.fileType || 'OTHER')
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      {shareData.title}
                    </h1>
                    {shareData.file && (
                      <FileTypeBadge type={shareData.file.fileType} />
                    )}
                    {shareData.album && (
                      <span className="px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-300 text-xs font-bold border border-pink-500/20">
                        Photo Album
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span>Shared by <strong className="text-slate-200">{shareData.owner.name}</strong></span>
                    {shareData.file && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{formatBytes(shareData.file.size)}</span>
                      </>
                    )}
                    {shareData.folder && (
                      <>
                        <span>•</span>
                        <span>{shareData.folder.files.length} items in folder</span>
                      </>
                    )}
                    {shareData.album && (
                      <>
                        <span>•</span>
                        <span className="text-pink-300 font-semibold">📸 {shareData.album.photoCount} photos in album</span>
                      </>
                    )}
                    {shareData.expiresAt && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-cyan-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Expires {formatDateTime(shareData.expiresAt)}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center">
                {/* Slideshow button for album */}
                {shareData.album && shareData.album.photos.length > 0 && (
                  <button
                    onClick={() => setIsSlideshowOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs sm:text-sm font-bold transition backdrop-blur-md cursor-pointer active:scale-95"
                  >
                    <Play className="w-4 h-4 text-brand-400 fill-current" />
                    <span>Slideshow</span>
                  </button>
                )}

                {/* Download Album (ZIP) or Download File */}
                {shareData.allowDownload ? (
                  shareData.album ? (
                    <a
                      href={appendPasswordToUrl(`/api/share/public/${shareData.token}/download-all`)}
                      download={`${shareData.album.name || 'album'}.zip`}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-pink-600/25 transition active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Album (ZIP)</span>
                    </a>
                  ) : shareData.file ? (
                    <a
                      href={appendPasswordToUrl(shareData.file.downloadUrl)}
                      download={shareData.file.originalName}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/25 transition active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download File</span>
                    </a>
                  ) : shareData.folder ? (
                    <a
                      href={appendPasswordToUrl(`/api/share/public/${shareData.token}/download-all`)}
                      download={`${shareData.folder.name || 'folder'}.zip`}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/25 transition active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download All (ZIP)</span>
                    </a>
                  ) : null
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-700">
                    View-Only Link
                  </span>
                )}
              </div>
            </div>

            {/* SINGLE FILE PREVIEW */}
            {shareData.file && (
              <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-2xl p-4 sm:p-6">
                {shareData.file.fileType === 'IMAGE' ? (
                  <div className="flex items-center justify-center max-h-[600px] overflow-hidden rounded-2xl bg-slate-950">
                    <img
                      src={appendPasswordToUrl(shareData.file.streamUrl)}
                      alt={shareData.file.originalName}
                      className="max-h-[600px] w-auto object-contain rounded-2xl"
                    />
                  </div>
                ) : shareData.file.fileType === 'VIDEO' ? (
                  <div className="rounded-2xl overflow-hidden bg-black shadow-2xl">
                    <video
                      controls
                      controlsList={shareData.allowDownload ? undefined : 'nodownload'}
                      src={appendPasswordToUrl(shareData.file.streamUrl)}
                      className="w-full max-h-[560px]"
                    />
                  </div>
                ) : shareData.file.fileType === 'AUDIO' ? (
                  <div className="p-8 flex flex-col items-center justify-center space-y-6 bg-slate-950/80 rounded-2xl">
                    <div className="w-24 h-24 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-2xl">
                      <MusicIcon className="w-12 h-12 animate-pulse" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-base font-bold text-white">
                        {shareData.file.originalName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Audio Stream</p>
                    </div>
                    <audio
                      controls
                      controlsList={shareData.allowDownload ? undefined : 'nodownload'}
                      src={appendPasswordToUrl(shareData.file.streamUrl)}
                      className="w-full max-w-md"
                    />
                  </div>
                ) : (
                  /* Documents / Other File Card */
                  <div className="py-16 text-center space-y-4 rounded-2xl bg-slate-950/60 border border-slate-800/60">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-brand-400 flex items-center justify-center mx-auto shadow-xl">
                      {renderFileIcon(shareData.file.fileType)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {shareData.file.originalName}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        {formatBytes(shareData.file.size)} • {shareData.file.mimeType}
                      </p>
                    </div>

                    {shareData.allowDownload && (
                      <a
                        href={appendPasswordToUrl(shareData.file.downloadUrl)}
                        download={shareData.file.originalName}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-lg shadow-brand-600/25 active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download to View</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FOLDER VIEW */}
            {shareData.folder && (
              <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-2xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FolderIcon className="w-4 h-4 text-brand-400" />
                    <span>Files in Folder ({shareData.folder.files.length})</span>
                  </h3>
                </div>

                <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
                  {shareData.folder.files.map((file) => (
                    <div
                      key={file.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-900/50 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-slate-800 text-slate-300 shrink-0">
                          {renderFileIcon(file.fileType)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-white truncate">
                            {file.originalName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {formatBytes(file.size)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {shareData.allowDownload && (
                          <a
                            href={appendPasswordToUrl(file.downloadUrl)}
                            download={file.originalName}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="hidden sm:inline">Download</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ALBUM VIEW */}
            {shareData.album && (
              <div className="rounded-3xl bg-slate-900/60 border border-slate-800/90 overflow-hidden shadow-2xl p-4 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <Images className="w-4 h-4 text-pink-400" />
                      <span>Photos in Album ({shareData.album.photos.length})</span>
                    </h3>
                    {shareData.album.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{shareData.album.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">Click any photo to view in high resolution</span>
                </div>

                {shareData.album.photos.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    This album does not have any photos yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                    {shareData.album.photos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        onClick={() => setLightboxIndex(idx)}
                        className="group relative aspect-square bg-slate-950/80 border border-white/[0.08] hover:border-pink-500/50 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                      >
                        <img
                          src={appendPasswordToUrl(photo.streamUrl)}
                          alt={photo.originalName}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          loading="lazy"
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-between">
                          <div className="flex justify-end">
                            {shareData.allowDownload && (
                              <a
                                href={appendPasswordToUrl(photo.downloadUrl)}
                                download={photo.originalName}
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg bg-black/60 hover:bg-emerald-600 text-white/80 hover:text-white backdrop-blur-md transition"
                                title="Download photo"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>

                          <div className="p-1.5 bg-black/50 backdrop-blur-md rounded-lg border border-white/10">
                            <p className="text-[11px] font-semibold text-white truncate">{photo.originalName}</p>
                            <p className="text-[9px] text-slate-300 font-mono">{formatBytes(photo.size)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Lightbox for shared album photos */}
      {shareData?.album && lightboxIndex >= 0 && (
        <ImageLightbox
          images={(shareData.album.photos || []).map((p) => ({
            id: p.id,
            userId: '',
            originalName: p.originalName,
            storageKey: '',
            mimeType: p.mimeType,
            fileType: p.fileType,
            extension: p.extension,
            size: p.size,
            createdAt: p.createdAt,
            updatedAt: p.createdAt,
            isFavorite: false,
            streamUrl: appendPasswordToUrl(p.streamUrl),
            downloadUrl: appendPasswordToUrl(p.downloadUrl),
          }))}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex >= 0}
          onClose={() => setLightboxIndex(-1)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          onStartSlideshow={() => {
            setLightboxIndex(-1);
            setIsSlideshowOpen(true);
          }}
        />
      )}

      {/* Fullscreen Slideshow for shared album */}
      {shareData?.album && (
        <SlideshowModal
          images={(shareData.album.photos || []).map((p) => ({
            id: p.id,
            userId: '',
            originalName: p.originalName,
            storageKey: '',
            mimeType: p.mimeType,
            fileType: p.fileType,
            extension: p.extension,
            size: p.size,
            createdAt: p.createdAt,
            updatedAt: p.createdAt,
            isFavorite: false,
            streamUrl: appendPasswordToUrl(p.streamUrl),
            downloadUrl: appendPasswordToUrl(p.downloadUrl),
          }))}
          isOpen={isSlideshowOpen}
          onClose={() => setIsSlideshowOpen(false)}
        />
      )}

      {/* QR Code Modal */}
      <QRCodeDisplayModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        title={shareData?.title || 'Shared Item'}
        shareUrl={window.location.href}
        qrDataUrl={qrDataUrl}
      />
    </div>
  );
};

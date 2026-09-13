import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Tv,
  Play,
  RotateCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
  Share2,
  Copy,
  Check,
  AlertCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Info,
  Flame,
  Volume2,
  Layers,
  HelpCircle,
  Clipboard,
  X,
  Compass,
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export interface CricketStreamItem {
  id: string;
  title: string;
  src: string;
  serverName?: string;
  category?: string;
  addedAt: string;
  isDefault?: boolean;
}

const STORAGE_KEY = 'cricket_live_streams_v1';

const DEFAULT_STREAMS: CricketStreamItem[] = [
  {
    id: 'default-ntv-1',
    title: 'Cricket Live Stream (NTV Live HD)',
    src: 'https://ntv.cx/embed?t=Z0hobzNYTEYyVE4xRHNDRDNBSlFzbEdRM29PSXN3Vkw0UXROczFlMkh5OFZ0bzQrcGVPbVhGaEIrMjZDM0VMR2NqUFVpT0ExVUw5MGlvcWUzYityTVkzNDJoejdyODVYeEFITmNrVHJMMlNkYStrQkxQeHczM1h0cERNUGFpT1EvVWl0OUZlSmdQQVR1QTVzN3pLYVpnPT0~',
    serverName: 'Server 1 (Official NTV)',
    category: 'Live Match',
    addedAt: new Date().toISOString(),
    isDefault: true,
  },
];

export const CricketLivePage: React.FC = () => {
  const { success, error: toastError, info } = useToast();

  // Streams state
  const [streams, setStreams] = useState<CricketStreamItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_STREAMS;
  });

  const [activeStreamId, setActiveStreamId] = useState<string>(() => {
    return streams[0]?.id || 'default-ntv-1';
  });

  // Player controls state
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isStreamLoading, setIsStreamLoading] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Ad Shield Mode: 'balanced' (blocks popups & redirects) | 'strict' (maximum script lockdown) | 'off'
  const [adShieldMode, setAdShieldMode] = useState<'balanced' | 'strict' | 'off'>('balanced');
  const [showShieldDropdown, setShowShieldDropdown] = useState<boolean>(false);

  // Computed iframe sandbox attribute to block ads and popups
  const getSandboxString = () => {
    if (adShieldMode === 'off') return undefined;
    if (adShieldMode === 'strict') {
      return 'allow-scripts allow-same-origin';
    }
    // 'balanced' (Default): allows video engine scripts, same-origin chunks, forms & presentation,
    // but crucially BLOCKS all popups, new tabs, downloads, and top navigation!
    return 'allow-scripts allow-same-origin allow-forms allow-presentation';
  };

  // Modal / Add stream state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [pasteInput, setPasteInput] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customServer, setCustomServer] = useState<string>('');

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(streams));
    } catch {
      // ignore
    }
  }, [streams]);

  const activeStream =
    streams.find((s) => s.id === activeStreamId) ||
    streams[0] ||
    DEFAULT_STREAMS[0];

  // Helper to extract clean URL from pasted iframe or direct link
  const extractStreamUrl = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';

    // If iframe tag passed, extract src="..."
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      let url = srcMatch[1];
      if (url.startsWith('//')) url = 'https:' + url;
      return url;
    }

    // If direct link passed
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.startsWith('//')) {
      return 'https:' + trimmed;
    }
    if (trimmed.includes('.') && !trimmed.includes('<')) {
      return 'https://' + trimmed;
    }

    return trimmed;
  };

  // Quick Start Stream from paste input
  const handleStartStream = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanUrl = extractStreamUrl(pasteInput);
    if (!cleanUrl) {
      toastError('Please paste a valid iframe code or stream URL.');
      return;
    }

    const titleToUse =
      customTitle.trim() ||
      `Live Match Stream #${streams.length + 1}`;

    const newStream: CricketStreamItem = {
      id: `stream-${Date.now()}`,
      title: titleToUse,
      src: cleanUrl,
      serverName: customServer.trim() || `Live Server ${streams.length + 1}`,
      category: 'User Stream',
      addedAt: new Date().toISOString(),
    };

    setStreams((prev) => [newStream, ...prev]);
    setActiveStreamId(newStream.id);
    setIsStreamLoading(true);
    setPasteInput('');
    setCustomTitle('');
    setCustomServer('');
    setIsAddModalOpen(false);
    success(`Streaming "${newStream.title}" live now!`);
  };

  // Paste from system clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPasteInput(text);
        info('Pasted link from clipboard!');
      }
    } catch {
      toastError('Could not read from clipboard. Please paste manually.');
    }
  };

  // Toggle fullscreen
  const handleToggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      playerContainerRef.current
        .requestFullscreen()
        .catch((err) => console.error('Fullscreen request failed:', err));
    } else {
      document.exitFullscreen().catch((err) => console.error('Exit fullscreen failed:', err));
    }
  };

  // Refresh current stream
  const handleRefreshStream = () => {
    setIsStreamLoading(true);
    setRefreshKey((prev) => prev + 1);
    info('Reloading live stream...');
  };

  // Copy active stream link or iframe
  const handleCopyIframe = () => {
    if (!activeStream) return;
    const iframeCode = `<iframe src="${activeStream.src}" width="800" height="450" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    navigator.clipboard.writeText(iframeCode);
    setCopiedLink(true);
    success('Iframe code copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Delete stream
  const handleDeleteStream = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (streams.length <= 1) {
      toastError('You must keep at least one stream in the list.');
      return;
    }

    const filtered = streams.filter((s) => s.id !== id);
    setStreams(filtered);
    if (activeStreamId === id) {
      setActiveStreamId(filtered[0].id);
      setIsStreamLoading(true);
    }
    success('Stream removed from list.');
  };

  // Reset to default NTV stream
  const handleResetDefaults = () => {
    setStreams(DEFAULT_STREAMS);
    setActiveStreamId(DEFAULT_STREAMS[0].id);
    setIsStreamLoading(true);
    info('Reset to default Cricket Live stream.');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner & Header */}
      <div className="relative rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black uppercase tracking-wider animate-pulse shadow-sm shadow-rose-500/20">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-rose-500 -ml-3.5" />
                <span>CRICKET LIVE</span>
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                1080p Ultra HD
              </span>

              <span className="text-xs text-slate-400">
                Live Broadcast Arena
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Cricket Live Arena</span>
              <Flame className="w-7 h-7 text-amber-400 animate-bounce" />
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Watch premier cricket tournaments, live series, and matches in real-time. Paste any stream iframe code or embed link below to start streaming any match live instantly!
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Paste Iframe / Stream</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition cursor-pointer active:scale-95 ${
                isTheaterMode
                  ? 'bg-brand-500/20 text-brand-300 border-brand-500/50 shadow-md shadow-brand-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Toggle Theater Mode"
            >
              {isTheaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isTheaterMode ? 'Standard View' : 'Theater Mode'}</span>
            </button>

            <button
              type="button"
              onClick={handleRefreshStream}
              className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer active:scale-95"
              title="Refresh Live Stream"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK PASTE BAR (Instant Live Stream Launcher) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl">
        <form onSubmit={handleStartStream} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Radio className="w-4 h-4 text-rose-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={pasteInput}
              onChange={(e) => setPasteInput(e.target.value)}
              placeholder='Paste iframe code (<iframe src="...">) or stream URL to watch live...'
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-11 pr-24 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition shadow-inner"
            />
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition cursor-pointer"
              title="Paste from clipboard"
            >
              <Clipboard className="w-3 h-3" />
              <span>Paste</span>
            </button>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-rose-600/30 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Stream Live</span>
          </button>
        </form>
      </div>

      {/* MAIN STREAMING ARENA */}
      <div
        ref={playerContainerRef}
        className={`relative rounded-3xl bg-slate-950 border border-slate-800/90 shadow-2xl overflow-hidden transition-all duration-300 ${
          isTheaterMode ? 'max-w-none w-full' : 'w-full'
        }`}
      >
        {/* Live Player Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>

            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
                <span>{activeStream.title}</span>
                {activeStream.isDefault && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    Official Feed
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>{activeStream.serverName || 'Live Stream'}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Active Stream Online</span>
              </p>
            </div>
          </div>

          {/* Player Bar Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Ad Shield Mode Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowShieldDropdown(!showShieldDropdown)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  adShieldMode !== 'off'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
                title="Configure Ad Shield (Popup & Redirect Blocker)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">
                  {adShieldMode === 'balanced' ? 'Ad Shield: ON' : adShieldMode === 'strict' ? 'Ad Shield: Strict' : 'Ad Shield: Off'}
                </span>
                <span className="sm:hidden">Shield</span>
              </button>

              {/* Shield Dropdown Menu */}
              {showShieldDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-30 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>Ad & Popup Shield</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowShieldDropdown(false)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Stream embeds inject popups and new-tab redirects. Ad Shield drops them at the browser engine level:
                  </p>

                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAdShieldMode('balanced');
                        setShowShieldDropdown(false);
                        success('Ad Shield: Balanced (Popups & Redirects Blocked)');
                      }}
                      className={`w-full text-left p-2 rounded-xl transition flex flex-col gap-0.5 cursor-pointer ${
                        adShieldMode === 'balanced'
                          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="font-bold flex items-center justify-between text-xs">
                        <span>🛡️ Balanced (Recommended)</span>
                        {adShieldMode === 'balanced' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Blocks all popups, new tabs, and parent redirects while keeping video controls fully functional.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAdShieldMode('strict');
                        setShowShieldDropdown(false);
                        success('Ad Shield: Strict Mode Activated');
                      }}
                      className={`w-full text-left p-2 rounded-xl transition flex flex-col gap-0.5 cursor-pointer ${
                        adShieldMode === 'strict'
                          ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="font-bold flex items-center justify-between text-xs">
                        <span>⚡ Strict Lockdown</span>
                        {adShieldMode === 'strict' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Minimal scripts and media chunks only. Maximum isolation against intrusive embeds.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAdShieldMode('off');
                        setShowShieldDropdown(false);
                        info('Ad Shield disabled (Unrestricted mode)');
                      }}
                      className={`w-full text-left p-2 rounded-xl transition flex flex-col gap-0.5 cursor-pointer ${
                        adShieldMode === 'off'
                          ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <span className="font-bold flex items-center justify-between text-xs">
                        <span>🔓 Off (Unrestricted)</span>
                        {adShieldMode === 'off' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Use only if a stream fails to play inside sandbox protection.
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleRefreshStream}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
              title="Refresh stream / Clear overlays"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleCopyIframe}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
              title="Copy embed code"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            <a
              href={activeStream.src}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
              title="Open stream in external tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pop-out</span>
            </a>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video Player Canvas (16:9 Cinema Container) */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          {/* Buffering / Loading Overlay */}
          {isStreamLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm space-y-3 pointer-events-none">
              <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
              <p className="text-xs sm:text-sm font-semibold text-slate-300">
                Connecting to live cricket stream...
              </p>
            </div>
          )}

          {/* Embedded Live Iframe with Sandboxed Anti-Popup Ad Shield */}
          <iframe
            key={`${activeStream.id}-${refreshKey}-${adShieldMode}`}
            ref={iframeRef}
            src={activeStream.src}
            title={activeStream.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="no-referrer"
            sandbox={getSandboxString()}
            onLoad={() => setIsStreamLoading(false)}
          />
        </div>

        {/* Player Footer Notification / Tips */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900/60 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-emerald-300">Ad Shield Active:</strong> Browser-level sandbox blocks all popup tabs and redirect hijackers.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>Stream Source: <strong className="text-slate-300">{new URL(activeStream.src).hostname || 'Live Embed'}</strong></span>
          </div>
        </div>
      </div>

      {/* AD BLOCKING & STREAM VIEWING GUIDE */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/70 border border-slate-800/80 shadow-lg backdrop-blur-md space-y-3">
        <div className="flex items-center gap-2 text-rose-300 font-bold text-xs sm:text-sm">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>How to Block Ads on Free Stream Embeds</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">1</span>
              <span>Built-in Pop-up Shield</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Our player operates in a secure sandbox that blocks all new tabs, gambling popups, and page redirects that streaming servers attempt to open.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">2</span>
              <span>Click Trap Dismissal</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              If an initial click on the play button does nothing, click once more. With Ad Shield active, the transparent click-trap is dismissed harmlessly without any popups.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">3</span>
              <span>On-Screen Banner Blocking</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              To also remove static in-video ad banners hardcoded by the stream provider, install the free <strong className="text-white">uBlock Origin</strong> extension or browse via <strong className="text-white">Brave Browser</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* SAVED MATCHES & STREAMS PLAYLIST SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Live Channels & Matches ({streams.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-slate-400 hover:text-white transition underline cursor-pointer"
            >
              Reset Default Feed
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Channel</span>
            </button>
          </div>
        </div>

        {/* Streams Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {streams.map((stream) => {
            const isActive = stream.id === activeStreamId;

            return (
              <div
                key={stream.id}
                onClick={() => {
                  setActiveStreamId(stream.id);
                  setIsStreamLoading(true);
                }}
                className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer overflow-hidden border ${
                  isActive
                    ? 'bg-slate-900 border-rose-500/60 shadow-lg shadow-rose-500/10'
                    : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-transparent'
                }`}
              >
                {/* Multi-Color Cyber Laser Border on Hover */}
                <div className="laser-border-glow" />
                <div className="laser-border-container">
                  <div className="laser-border-gradient" />
                </div>

                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                          : 'bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-slate-700'
                      }`}
                    >
                      {isActive ? (
                        <Radio className="w-5 h-5 animate-pulse" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isActive ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500 text-white flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            <span>PLAYING</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">
                            {stream.category || 'Live Channel'}
                          </span>
                        )}

                        <span className="text-[10px] font-medium text-slate-500 truncate">
                          {stream.serverName || 'Direct Embed'}
                        </span>
                      </div>

                      <h3
                        className={`text-sm font-bold truncate leading-snug ${
                          isActive ? 'text-rose-300' : 'text-white group-hover:text-rose-400 transition-colors'
                        }`}
                        title={stream.title}
                      >
                        {stream.title}
                      </h3>

                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {stream.src}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {!stream.isDefault && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteStream(stream.id, e)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100 shrink-0"
                      title="Remove stream"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: ADD / PASTE NEW STREAM */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Add Live Cricket Stream
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Paste an iframe tag or direct stream URL
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleStartStream} className="p-6 space-y-4">
              {/* Iframe / URL Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    Iframe Code or Stream Link <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Clipboard className="w-3 h-3" />
                    <span>Paste from Clipboard</span>
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  placeholder={`Example:\n<iframe src="https://ntv.cx/embed?t=..." width="800" height="450" allowfullscreen></iframe>\n\nOr direct link: https://ntv.cx/embed?...`}
                  className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition font-mono leading-relaxed resize-none"
                  required
                />
                <p className="text-[11px] text-slate-500">
                  We automatically extract the streaming embed URL from your iframe code.
                </p>
              </div>

              {/* Match Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">
                  Match Title / Channel Name (Optional)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. India vs Australia - Live Match 1"
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              {/* Server / Provider Label */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">
                  Server / Quality Tag (Optional)
                </label>
                <input
                  type="text"
                  value={customServer}
                  onChange={(e) => setCustomServer(e.target.value)}
                  placeholder="e.g. Server 2 HD, English Audio, Hindi Commentary"
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Streaming Live</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

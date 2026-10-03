import React, { useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Sparkles, CheckCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface VideoDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoDemoModal: React.FC<VideoDemoModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeFeature, setActiveFeature] = useState<'vault' | 'music' | 'gallery' | 'plans'>('vault');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center">
              <Play className="w-4 h-4 fill-cyan-400 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>VaultXMedia Product Tour & Video Demo</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30">
                  4K 60FPS
                </span>
              </h3>
              <p className="text-xs text-slate-400">Discover all-in-one cloud storage, military vault encryption & hi-fi streaming</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Simulation Canvas */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
          {/* Simulated Live Interface Preview based on activeFeature */}
          <div className="absolute inset-0">
            {activeFeature === 'vault' && (
              <img
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80"
                alt="Vault Security"
                className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
              />
            )}
            {activeFeature === 'music' && (
              <img
                src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80"
                alt="Hi-Fi Music"
                className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
              />
            )}
            {activeFeature === 'gallery' && (
              <img
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80"
                alt="Photo Gallery"
                className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
              />
            )}
            {activeFeature === 'plans' && (
              <img
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80"
                alt="Places & Travel Plans"
                className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
              />
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />

          {/* Interactive Floating Badge in Center */}
          <div className="relative text-center px-4 max-w-lg space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-lg backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>VaultXMedia Next-Gen Cloud Platform</span>
            </span>
            <h4 className="text-xl sm:text-2xl font-black text-white">
              End-to-End Encrypted Media Cloud
            </h4>
            <p className="text-xs sm:text-sm text-slate-300">
              Access photos, videos, hi-fi music, trip plans & passwords securely across all your devices.
            </p>

            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-cyan-500/30 transition transform hover:scale-105"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? 'Pause Demo' : 'Play Video'}</span>
            </button>
          </div>

          {/* Bottom Video Controls Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <span className="font-mono text-[11px] text-cyan-300">01:45 / 03:20</span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>AES-256 GCM Live Stream</span>
            </div>
          </div>
        </div>

        {/* Feature Quick Selector Tabs */}
        <div className="p-4 border-t border-white/10 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
            {[
              { id: 'vault', label: 'Secret 2FA Vault' },
              { id: 'gallery', label: 'Photos & 4K Cinema' },
              { id: 'music', label: 'Hi-Fi Lossless Music' },
              { id: 'plans', label: 'Places & Trip Planner' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFeature(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  activeFeature === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Link
            to="/register"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition"
          >
            <span>Create Free Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

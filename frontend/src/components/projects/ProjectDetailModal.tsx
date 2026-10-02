import React, { useState } from 'react';
import {
  X,
  Globe,
  ExternalLink,
  Github,
  Server,
  Star,
  Copy,
  Check,
  Edit2,
  Trash2,
  Calendar,
  KeyRound,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Layers,
  Code2,
} from 'lucide-react';
import { WebProject } from '../../types/project';
import { getMediaUrl } from '../../services/api';
import { formatDate } from '../../utils/formatters';

interface ProjectDetailModalProps {
  project: WebProject | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (project: WebProject) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenLightbox: (images: string[], initialIndex: number, title: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onOpenLightbox,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  if (!isOpen || !project) return null;

  const images = project.images && project.images.length > 0
    ? project.images
    : project.thumbnailUrl
    ? [project.thumbnailUrl]
    : [];

  const currentImage = images[activeImageIndex];
  const resolvedImageUrl = currentImage ? getMediaUrl(currentImage) : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(project.liveUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmail = () => {
    if (project.demoEmail) {
      navigator.clipboard.writeText(project.demoEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleCopyPass = () => {
    if (project.demoPassword) {
      navigator.clipboard.writeText(project.demoPassword);
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const handlePrevImg = () => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImg = () => {
    setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/15 text-brand-300 border border-brand-500/30">
              {project.category}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                project.status.toLowerCase() === 'live'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}
            >
              {project.status.toLowerCase() === 'live' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
              {project.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(project.id)}
              className={`p-2 rounded-xl border transition-all ${
                project.isFavorite
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-white/10 text-slate-400 hover:text-amber-300'
              }`}
              title={project.isFavorite ? 'Unpin' : 'Pin to favorites'}
            >
              <Star className={`w-4 h-4 ${project.isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(project);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white transition-colors"
              title="Edit project"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                onClose();
                onDelete(project.id);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 border border-white/10 text-slate-400 hover:text-rose-400 transition-colors"
              title="Delete project"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Tagline */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {project.title}
            </h1>
            {project.brief && (
              <p className="text-sm font-medium text-brand-400 mt-1">{project.brief}</p>
            )}
          </div>

          {/* Screenshots Gallery & Lightbox Opener */}
          {images.length > 0 && (
            <div className="space-y-3">
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/15 group shadow-2xl">
                {resolvedImageUrl && (
                  <img
                    src={resolvedImageUrl}
                    alt={`${project.title} screenshot ${activeImageIndex + 1}`}
                    className="w-full h-full object-cover object-top cursor-pointer"
                    onClick={() => onOpenLightbox(images, activeImageIndex, project.title)}
                  />
                )}

                {/* Lightbox full-size trigger icon */}
                <button
                  onClick={() => onOpenLightbox(images, activeImageIndex, project.title)}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-slate-950/80 hover:bg-brand-600 backdrop-blur-md text-white border border-white/15 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                  title="Expand to Fullscreen Lightbox"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {/* Left / Right Carousel Controls */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImg}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/80 hover:bg-brand-600 backdrop-blur-md text-white border border-white/15 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextImg}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/80 hover:bg-brand-600 backdrop-blur-md text-white border border-white/15 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Counter */}
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-white/15 text-[11px] font-mono text-slate-300">
                  {activeImageIndex + 1} / {images.length}
                </div>
              </div>

              {/* Thumbnails row */}
              {images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative shrink-0 rounded-xl overflow-hidden aspect-[16/10] w-24 border-2 transition-all ${
                        idx === activeImageIndex
                          ? 'border-brand-500 ring-2 ring-brand-500/50 scale-105'
                          : 'border-white/10 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={getMediaUrl(img)}
                        alt={`Thumb ${idx + 1}`}
                        className="w-full h-full object-cover object-top"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Primary Action Button: Visit Live Website */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-900/30 via-indigo-900/20 to-purple-900/20 border border-brand-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
                <Globe className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-brand-400 tracking-wider">
                  Live Deployment
                </span>
                <p className="text-sm font-mono text-white truncate max-w-sm sm:max-w-md">
                  {project.liveUrl}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Copy link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all active:scale-95"
              >
                <span>Launch Live Site</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Source Repositories & API Links */}
          <div className="flex flex-wrap gap-2.5">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold transition-colors"
              >
                <Github className="w-4 h-4 text-white" />
                <span>GitHub Source (Frontend)</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}

            {project.githubBackendUrl && (
              <a
                href={project.githubBackendUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold transition-colors"
              >
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>Backend Repository</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}

            {project.backendUrl && (
              <a
                href={project.backendUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold transition-colors"
              >
                <Server className="w-4 h-4 text-indigo-400" />
                <span>Live API Server</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}

            {project.completedDate && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Launched: {formatDate(project.completedDate)}</span>
              </div>
            )}
          </div>

          {/* Demo Account Credentials Box (If Provided) */}
          {(project.demoEmail || project.demoPassword) && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Guest / Demo Testing Credentials</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {project.demoEmail && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/20">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Email / Username:</span>
                      <span className="text-xs font-mono font-bold text-white">
                        {project.demoEmail}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyEmail}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Copy email"
                    >
                      {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}

                {project.demoPassword && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/20">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Password:</span>
                      <span className="text-xs font-mono font-bold text-white">
                        {project.demoPassword}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyPass}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Copy password"
                    >
                      {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {project.description && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                About the Project
              </h3>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {project.description}
              </div>
            </div>
          )}

          {/* Key Features List */}
          {project.features && project.features.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Key Features & Capabilities
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {project.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tech Stack */}
          {project.techStack && project.techStack.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-400" />
                Technologies & Architecture
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl text-xs font-mono font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20 shadow-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

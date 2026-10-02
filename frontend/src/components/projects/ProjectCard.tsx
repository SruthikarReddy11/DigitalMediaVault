import React, { useState } from 'react';
import {
  ExternalLink,
  Github,
  Star,
  Globe,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Check,
  Eye,
  Images,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';
import { WebProject } from '../../types/project';
import { getMediaUrl } from '../../services/api';

interface ProjectCardProps {
  project: WebProject;
  onViewDetails: (project: WebProject) => void;
  onEdit: (project: WebProject) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenScreenshots: (images: string[], initialIndex: number, title: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleFavorite,
  onOpenScreenshots,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(project.liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Site
          </span>
        );
      case 'in progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            In Progress
          </span>
        );
      case 'beta':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Beta
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-500/15 text-brand-300 border border-brand-500/30">
            {status}
          </span>
        );
    }
  };

  const displayImage = project.thumbnailUrl || (project.images && project.images[0]) || null;
  const imageResolvedUrl = displayImage ? getMediaUrl(displayImage) : null;
  const allImages = project.images && project.images.length > 0
    ? project.images
    : displayImage
    ? [displayImage]
    : [];

  return (
    <div
      onClick={() => onViewDetails(project)}
      className="group relative bg-slate-900/70 hover:bg-slate-900/90 border border-white/10 hover:border-brand-500/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-brand-500/10 flex flex-col cursor-pointer"
    >
      {/* Top Media / Thumbnail Showcase Area */}
      <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden">
        {imageResolvedUrl ? (
          <img
            src={imageResolvedUrl}
            alt={project.title}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-600 gap-2">
            <Globe className="w-12 h-12 text-slate-700 stroke-[1.2]" />
            <span className="text-xs font-mono text-slate-500">No Screenshot Preview</span>
          </div>
        )}

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-1.5">
            {getStatusBadge(project.status)}
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900/80 backdrop-blur-md text-slate-300 border border-white/10">
              {project.category}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Star Favorite Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(project.id);
              }}
              className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
                project.isFavorite
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900/80 border-white/10 text-slate-400 hover:text-amber-300 hover:border-amber-500/30'
              }`}
              title={project.isFavorite ? 'Unpin project' : 'Pin to favorites'}
            >
              <Star
                className={`w-4 h-4 ${project.isFavorite ? 'fill-amber-400' : ''}`}
              />
            </button>

            {/* Overflow Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-white/10 text-slate-400 hover:text-white transition-all"
                title="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                    }}
                  />
                  <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-slate-900 border border-white/15 shadow-2xl py-1 z-30 backdrop-blur-xl">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onViewDetails(project);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 text-left transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-brand-400" />
                      View Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onEdit(project);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 text-left transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                      Edit Project
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink(e);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 text-left transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-indigo-400" />
                      Copy Live Link
                    </button>
                    <div className="my-1 border-t border-white/10" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onDelete(project.id);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-left transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Project
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Screenshot counter pill if multiple screenshots available */}
        {allImages.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenScreenshots(allImages, 0, project.title);
            }}
            className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-brand-600 backdrop-blur-md border border-white/15 text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-all pointer-events-auto"
            title="View screenshots in lightbox"
          >
            <Images className="w-3.5 h-3.5" />
            <span>{allImages.length} {allImages.length === 1 ? 'image' : 'images'}</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Title */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
              {project.title}
            </h3>
          </div>

          {/* Brief Tagline */}
          {project.brief && (
            <p className="text-xs font-medium text-brand-400/90 mb-2 line-clamp-1">
              {project.brief}
            </p>
          )}

          {/* Description Snippet */}
          {project.description && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
              {project.description}
            </p>
          )}

          {/* Tech Stack Chips */}
          {project.techStack && project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {project.techStack.slice(0, 4).map((tech, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
                >
                  {tech}
                </span>
              ))}
              {project.techStack.length > 4 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono text-slate-400 bg-slate-800/40">
                  +{project.techStack.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
          {/* Deployed Frontend Link (Primary Action) */}
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/20 transition-all duration-150 active:scale-95"
            title={`Visit ${project.liveUrl}`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Visit Live</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>

          {/* Secondary Action Icons */}
          <div className="flex items-center gap-1">
            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors"
              title="Copy live link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* GitHub Repo Button if available */}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors"
                title="View GitHub Repository"
              >
                <Github className="w-4 h-4" />
              </a>
            )}

            {/* Backend URL icon if available */}
            {project.backendUrl && (
              <a
                href={project.backendUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors"
                title="View Live Backend / API"
              >
                <Server className="w-4 h-4 text-cyan-400" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

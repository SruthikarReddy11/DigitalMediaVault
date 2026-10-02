import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Search,
  Filter,
  Plus,
  Loader2,
  Sparkles,
  ArrowUpDown,
  Star,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { WebProject, ProjectStats, ProjectFilterOptions } from '../types/project';
import { projectsApi } from '../services/projectsApi';
import { useToast } from '../contexts/ToastContext';
import { ProjectsHeader } from '../components/projects/ProjectsHeader';
import { ProjectCard } from '../components/projects/ProjectCard';
import { ProjectModal } from '../components/projects/ProjectModal';
import { ProjectDetailModal } from '../components/projects/ProjectDetailModal';
import { ProjectScreenshotLightbox } from '../components/projects/ProjectScreenshotLightbox';

const CATEGORIES = [
  'ALL',
  'Full-Stack',
  'Frontend',
  'Backend / API',
  'Mobile Web / PWA',
  'SaaS',
  'E-Commerce',
  'AI / Machine Learning',
  'Portfolio',
];

const STATUS_FILTERS = ['ALL', 'Live', 'In Progress', 'Beta', 'Archived'];

export const ProjectsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [projects, setProjects] = useState<WebProject[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedTech, setSelectedTech] = useState('ALL');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'completedDate'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<WebProject | null>(null);

  const [detailProject, setDetailProject] = useState<WebProject | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Lightbox
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxTitle, setLightboxTitle] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters: ProjectFilterOptions = {
        search: search.trim() || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        tech: selectedTech !== 'ALL' ? selectedTech : undefined,
        isFavorite: favoriteOnly ? true : undefined,
        sortBy,
        sortOrder,
      };

      const res = await projectsApi.getProjects(filters);
      setProjects(res.projects);
      setStats(res.stats);
    } catch (err: any) {
      toastError(err.message || 'Failed to load projects.');
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, selectedStatus, selectedTech, favoriteOnly, sortBy, sortOrder]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Open Modal to Add
  const handleOpenAdd = () => {
    setProjectToEdit(null);
    setIsAddEditModalOpen(true);
  };

  // Open Modal to Edit
  const handleOpenEdit = (project: WebProject) => {
    setProjectToEdit(project);
    setIsAddEditModalOpen(true);
  };

  // Open Details Modal
  const handleViewDetails = (project: WebProject) => {
    setDetailProject(project);
    setIsDetailModalOpen(true);
  };

  // Open Screenshots Lightbox
  const handleOpenScreenshots = (images: string[], initialIndex: number, title: string) => {
    setLightboxImages(images);
    setLightboxIndex(initialIndex);
    setLightboxTitle(title);
    setIsLightboxOpen(true);
  };

  // Toggle Favorite
  const handleToggleFavorite = async (id: string) => {
    try {
      const updated = await projectsApi.toggleFavorite(id);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      if (detailProject?.id === id) {
        setDetailProject(updated);
      }
      success(updated.isFavorite ? 'Pinned to favorites!' : 'Unpinned from favorites');
      // Refresh stats
      projectsApi.getProjects().then((r) => setStats(r.stats)).catch(() => {});
    } catch (err: any) {
      toastError(err.message || 'Failed to update favorite status.');
    }
  };

  // Delete Project
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project from your showcase?')) {
      return;
    }

    try {
      await projectsApi.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (detailProject?.id === id) {
        setIsDetailModalOpen(false);
        setDetailProject(null);
      }
      success('Project removed from showcase.');
      // Refresh stats
      projectsApi.getProjects().then((r) => setStats(r.stats)).catch(() => {});
    } catch (err: any) {
      toastError(err.message || 'Failed to delete project.');
    }
  };

  // Callback when a project is saved from modal
  const handleProjectSaved = (saved: WebProject) => {
    fetchProjects();
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header and Analytics Stats */}
      <ProjectsHeader
        stats={stats}
        onAddProject={handleOpenAdd}
        selectedTech={selectedTech}
        onSelectTech={(tech) => setSelectedTech(tech)}
      />

      {/* Filter and Search Controls Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, or stack..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end overflow-x-auto">
            {/* Starred Only Toggle */}
            <button
              onClick={() => setFavoriteOnly(!favoriteOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all shrink-0 ${
                favoriteOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${favoriteOnly ? 'fill-current' : ''}`} />
              <span>Starred</span>
            </button>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 shrink-0"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  Status: {s}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as any);
                setSortOrder(so as any);
              }}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 shrink-0"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="title-asc">Title: A to Z</option>
              <option value="title-desc">Title: Z to A</option>
              <option value="completedDate-desc">Launch Date</option>
            </select>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-white/5">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects Grid Content Area */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-400">Loading developed web projects...</p>
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div className="py-20 flex flex-col items-center justify-center text-center p-6 bg-slate-900/30 rounded-3xl border border-white/5 space-y-4">
          <div className="p-4 rounded-3xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-inner">
            <Globe className="w-12 h-12 stroke-[1.5]" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-bold text-white">No web projects found</h3>
            <p className="text-xs text-slate-400">
              {search || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || selectedTech !== 'ALL'
                ? 'No projects match your active search or filters. Try clearing filters to see all.'
                : 'Start building your portfolio showcase by adding your deployed websites, frontend links, UI screenshots, and features!'}
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Website</span>
          </button>
        </div>
      ) : (
        /* Projects Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <ProjectCard
              key={proj.id}
              project={proj}
              onViewDetails={handleViewDetails}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
              onOpenScreenshots={handleOpenScreenshots}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Project Modal */}
      <ProjectModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        onSaved={handleProjectSaved}
        projectToEdit={projectToEdit}
      />

      {/* Detailed Presentation View Modal */}
      <ProjectDetailModal
        project={detailProject}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onToggleFavorite={handleToggleFavorite}
        onOpenLightbox={handleOpenScreenshots}
      />

      {/* Full-Screen Screenshots Lightbox */}
      <ProjectScreenshotLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        title={lightboxTitle}
      />
    </div>
  );
};

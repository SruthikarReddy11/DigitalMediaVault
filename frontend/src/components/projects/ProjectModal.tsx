import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  Upload,
  Sparkles,
  Loader2,
  Trash2,
  Plus,
  Star,
  Check,
  Github,
  Server,
  KeyRound,
  Calendar,
  Layers,
  FileText,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { WebProject, CreateProjectInput } from '../../types/project';
import { projectsApi } from '../../services/projectsApi';
import { useToast } from '../../contexts/ToastContext';
import { getMediaUrl } from '../../services/api';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (project: WebProject) => void;
  projectToEdit?: WebProject | null;
}

const CATEGORIES = [
  'Full-Stack',
  'Frontend',
  'Backend / API',
  'Mobile Web / PWA',
  'SaaS',
  'E-Commerce',
  'AI / Machine Learning',
  'Portfolio',
  'Utility / Tool',
  'Other',
];

const STATUSES = ['Live', 'In Progress', 'Beta', 'Maintained', 'Archived'];

const POPULAR_TECHS = [
  'React',
  'Next.js',
  'TypeScript',
  'JavaScript',
  'Tailwind CSS',
  'Node.js',
  'Express',
  'PostgreSQL',
  'Prisma',
  'MongoDB',
  'Python',
  'FastAPI',
  'Docker',
  'AWS',
  'Vercel',
  'Supabase',
  'Firebase',
  'Redux',
  'GraphQL',
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  projectToEdit,
}) => {
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'details' | 'tech'>('info');

  // Form states
  const [title, setTitle] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [brief, setBrief] = useState('');
  const [description, setDescription] = useState('');
  const [backendUrl, setBackendUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [githubBackendUrl, setGithubBackendUrl] = useState('');
  const [category, setCategory] = useState('Full-Stack');
  const [status, setStatus] = useState('Live');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoPassword, setDemoPassword] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  // Loading states
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setTitle(projectToEdit.title || '');
      setLiveUrl(projectToEdit.liveUrl || '');
      setBrief(projectToEdit.brief || '');
      setDescription(projectToEdit.description || '');
      setBackendUrl(projectToEdit.backendUrl || '');
      setGithubUrl(projectToEdit.githubUrl || '');
      setGithubBackendUrl(projectToEdit.githubBackendUrl || '');
      setCategory(projectToEdit.category || 'Full-Stack');
      setStatus(projectToEdit.status || 'Live');
      setThumbnailUrl(projectToEdit.thumbnailUrl || '');
      setImages(projectToEdit.images || []);
      setTechStack(projectToEdit.techStack || []);
      setFeatures(projectToEdit.features || []);
      setDemoEmail(projectToEdit.demoEmail || '');
      setDemoPassword(projectToEdit.demoPassword || '');
      setCompletedDate(
        projectToEdit.completedDate
          ? new Date(projectToEdit.completedDate).toISOString().split('T')[0]
          : ''
      );
      setIsFavorite(Boolean(projectToEdit.isFavorite));
    } else {
      // Reset form
      setTitle('');
      setLiveUrl('');
      setBrief('');
      setDescription('');
      setBackendUrl('');
      setGithubUrl('');
      setGithubBackendUrl('');
      setCategory('Full-Stack');
      setStatus('Live');
      setThumbnailUrl('');
      setImages([]);
      setTechStack([]);
      setFeatures([]);
      setDemoEmail('');
      setDemoPassword('');
      setCompletedDate('');
      setIsFavorite(false);
      setActiveTab('info');
    }
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  // Auto Extract Metadata from Live URL
  const handleAutoExtract = async () => {
    if (!liveUrl.trim()) {
      toastError('Please enter a deployed frontend link first.');
      return;
    }

    try {
      setIsExtracting(true);
      const extracted = await projectsApi.extractWebsite(liveUrl.trim());

      if (extracted.title && !title) {
        setTitle(extracted.title);
      }
      if (extracted.brief && !brief) {
        setBrief(extracted.brief);
      }
      if (extracted.description && !description) {
        setDescription(extracted.description);
      }
      if (extracted.thumbnailUrl) {
        if (!thumbnailUrl) setThumbnailUrl(extracted.thumbnailUrl);
        if (!images.includes(extracted.thumbnailUrl)) {
          setImages((prev) => [extracted.thumbnailUrl!, ...prev]);
        }
      }
      if (extracted.suggestedTags && extracted.suggestedTags.length > 0) {
        setTechStack((prev) => Array.from(new Set([...prev, ...extracted.suggestedTags])));
      }

      success('Website details auto-extracted successfully!');
    } catch (err: any) {
      toastError(err.message || 'Failed to extract website details.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Upload Screenshots
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const fileList = Array.from(files);
      const uploaded = await projectsApi.uploadScreenshots(fileList);

      const newUrls = uploaded.map((u) => u.url);
      setImages((prev) => [...prev, ...newUrls]);

      if (!thumbnailUrl && newUrls.length > 0) {
        setThumbnailUrl(newUrls[0]);
      }

      success(`${uploaded.length} UI screenshot(s) uploaded successfully!`);
    } catch (err: any) {
      toastError(err.message || 'Failed to upload screenshot images.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddManualImage = () => {
    if (!manualImageUrl.trim()) return;
    const url = manualImageUrl.trim();
    if (!images.includes(url)) {
      setImages((prev) => [...prev, url]);
      if (!thumbnailUrl) setThumbnailUrl(url);
    }
    setManualImageUrl('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const removedUrl = images[indexToRemove];
    const newImages = images.filter((_, idx) => idx !== indexToRemove);
    setImages(newImages);

    if (thumbnailUrl === removedUrl) {
      setThumbnailUrl(newImages.length > 0 ? newImages[0] : '');
    }
  };

  // Add Tech Tag
  const handleAddTech = (tech: string) => {
    const trimmed = tech.trim();
    if (!trimmed) return;
    if (!techStack.includes(trimmed)) {
      setTechStack([...techStack, trimmed]);
    }
    setTechInput('');
  };

  const handleRemoveTech = (techToRemove: string) => {
    setTechStack(techStack.filter((t) => t !== techToRemove));
  };

  // Add Feature Item
  const handleAddFeature = () => {
    const trimmed = featureInput.trim();
    if (!trimmed) return;
    if (!features.includes(trimmed)) {
      setFeatures([...features, trimmed]);
    }
    setFeatureInput('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toastError('Project title is required.');
      setActiveTab('info');
      return;
    }

    if (!liveUrl.trim()) {
      toastError('Deployed frontend link is required.');
      setActiveTab('info');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: CreateProjectInput = {
        title: title.trim(),
        liveUrl: liveUrl.trim(),
        brief: brief.trim() || undefined,
        description: description.trim() || undefined,
        backendUrl: backendUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
        githubBackendUrl: githubBackendUrl.trim() || undefined,
        category,
        status,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        images,
        techStack,
        features,
        demoEmail: demoEmail.trim() || undefined,
        demoPassword: demoPassword.trim() || undefined,
        completedDate: completedDate ? completedDate : undefined,
        isFavorite,
      };

      let result: WebProject;
      if (projectToEdit) {
        result = await projectsApi.updateProject(projectToEdit.id, payload);
        success('Project updated successfully!');
      } else {
        result = await projectsApi.createProject(payload);
        success('New project added to your showcase!');
      }

      onSaved(result);
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Failed to save project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-auto bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/25">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {projectToEdit ? 'Edit Web Project' : 'Add Developed Website'}
              </h2>
              <p className="text-xs text-slate-400">
                Showcase your deployed application, screenshots, and technical specs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-white/10 flex items-center gap-2 overflow-x-auto bg-slate-900/50">
          {[
            { id: 'info', label: '1. Website & Links', icon: Globe },
            { id: 'media', label: '2. UI Screenshots', icon: ImageIcon },
            { id: 'details', label: '3. Description & Features', icon: FileText },
            { id: 'tech', label: '4. Tech Stack & Demo', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-brand-500 text-brand-300 bg-brand-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: INFO & LINKS */}
          {activeTab === 'info' && (
            <div className="space-y-5 animate-fade-in">
              {/* Deployed Frontend Link with Instant Auto-Extract */}
              <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-brand-400" />
                    Deployed Frontend Link *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoExtract}
                    disabled={isExtracting || !liveUrl.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm disabled:opacity-50 transition-all"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Fetching Info...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Auto-Fetch Details</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="url"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="https://my-awesome-app.vercel.app"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-brand-500/30 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Tip: Paste your live URL and click <strong>Auto-Fetch Details</strong> to automatically retrieve the title, description, and preview image!
                </p>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Project / Website Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Personal Media Vault"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status & Brief Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Project Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Short Tagline / Brief Pitch
                  </label>
                  <input
                    type="text"
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="e.g. Next-generation media storage with lossless audio player"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Source Code Repositories & Backend Links */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Source Code & Backend Links (Optional)
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5 text-slate-400" />
                      GitHub Repository (Frontend/Main)
                    </label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username/project"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-cyan-400" />
                      Backend / API Live URL
                    </label>
                    <input
                      type="url"
                      value={backendUrl}
                      onChange={(e) => setBackendUrl(e.target.value)}
                      placeholder="https://api.my-app.com"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UI SCREENSHOTS & MEDIA */}
          {activeTab === 'media' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Upload UI Screenshots & Mockups
                </label>

                {/* Upload Drag/Browse Box */}
                <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 hover:border-brand-500 rounded-2xl bg-slate-950/50 hover:bg-slate-950/80 cursor-pointer transition-all group">
                  <div className="p-3 rounded-full bg-brand-500/10 text-brand-400 group-hover:scale-110 transition-transform mb-2">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-white">
                    {isUploading ? 'Uploading UI Screenshots...' : 'Click to select or drag screenshots here'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Supports PNG, JPG, WEBP, GIF, SVG (Up to 25MB each)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Or Add Via URL */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Or Add Screenshot by Image Link / URL:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={manualImageUrl}
                    onChange={(e) => setManualImageUrl(e.target.value)}
                    placeholder="https://example.com/screenshot.png"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualImage}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-white/10 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add URL
                  </button>
                </div>
              </div>

              {/* Gallery of Uploaded / Attached Screenshots */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Attached Screenshots ({images.length})
                  </label>
                  <span className="text-[11px] text-brand-400">
                    ★ Click star to set primary cover thumbnail
                  </span>
                </div>

                {images.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-white/5 text-slate-500 text-xs">
                    No UI screenshots added yet. Upload some screenshots or use Auto-Fetch in Tab 1!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((img, idx) => {
                      const isThumb = thumbnailUrl === img || (!thumbnailUrl && idx === 0);
                      const resolved = getMediaUrl(img);
                      return (
                        <div
                          key={idx}
                          className={`relative group rounded-xl overflow-hidden aspect-[16/10] bg-slate-950 border-2 transition-all ${
                            isThumb
                              ? 'border-brand-500 ring-2 ring-brand-500/40'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <img
                            src={resolved}
                            alt={`Screenshot ${idx + 1}`}
                            className="w-full h-full object-cover object-top"
                          />

                          {/* Hover Actions */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setThumbnailUrl(img)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isThumb
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300'
                              }`}
                              title="Set as main thumbnail"
                            >
                              <Star className={`w-4 h-4 ${isThumb ? 'fill-current' : ''}`} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors"
                              title="Remove screenshot"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Cover Badge */}
                          {isThumb && (
                            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-brand-500 text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              Cover
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DESCRIPTION & FEATURES */}
          {activeTab === 'details' && (
            <div className="space-y-5 animate-fade-in">
              {/* Full Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Detailed Project Description
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project, architecture, problems solved, user workflows, and standout capabilities..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
                />
              </div>

              {/* Key Features Bullet Points */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Key Features & Highlights
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="e.g. End-to-end encrypted storage, 1-click audio streaming"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Feature
                  </button>
                </div>

                {features.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-300"
                      >
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TECH STACK & DEMO ACCESS */}
          {activeTab === 'tech' && (
            <div className="space-y-5 animate-fade-in">
              {/* Tech Stack Tags */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Technologies & Frameworks
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTech(techInput);
                      }
                    }}
                    placeholder="Type tech name and press Enter (e.g. Next.js, Redux)"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTech(techInput)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-white/10"
                  >
                    Add
                  </button>
                </div>

                {/* Selected Tech Chips */}
                {techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {techStack.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-brand-500/15 text-brand-300 border border-brand-500/30"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => handleRemoveTech(tech)}
                          className="text-brand-400 hover:text-rose-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Add Popular Pills */}
                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 font-medium">Quick suggestions:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {POPULAR_TECHS.map((tech) => {
                      const isSelected = techStack.includes(tech);
                      return (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => (isSelected ? handleRemoveTech(tech) : handleAddTech(tech))}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                            isSelected
                              ? 'bg-brand-600 text-white font-semibold'
                              : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          {isSelected ? `✓ ${tech}` : `+ ${tech}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Demo Account Credentials */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Demo Account Credentials (For Visitors / Recruiters)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Provide test user credentials so evaluators can test authenticated features with 1-click copy:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Demo Email / Username
                    </label>
                    <input
                      type="text"
                      value={demoEmail}
                      onChange={(e) => setDemoEmail(e.target.value)}
                      placeholder="demo@example.com"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Demo Password
                    </label>
                    <input
                      type="text"
                      value={demoPassword}
                      onChange={(e) => setDemoPassword(e.target.value)}
                      placeholder="DemoPass123"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Completion Date & Favorite Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Launch / Completion Date
                  </label>
                  <input
                    type="date"
                    value={completedDate}
                    onChange={(e) => setCompletedDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="pt-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isFavorite}
                      onChange={(e) => setIsFavorite(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 bg-slate-800 border-white/20 focus:ring-brand-500"
                    />
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      Pin to Top (Featured Project)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {activeTab !== 'info' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'media') setActiveTab('info');
                    if (activeTab === 'details') setActiveTab('media');
                    if (activeTab === 'tech') setActiveTab('details');
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Previous
                </button>
              )}

              {activeTab !== 'tech' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'info') setActiveTab('media');
                    if (activeTab === 'media') setActiveTab('details');
                    if (activeTab === 'details') setActiveTab('tech');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-colors"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/25 flex items-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{projectToEdit ? 'Save Changes' : 'Add to Showcase'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

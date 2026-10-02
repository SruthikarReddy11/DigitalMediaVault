import React from 'react';
import {
  Globe,
  Plus,
  Rocket,
  Layers,
  Star,
  Activity,
  Code2,
  Sparkles,
} from 'lucide-react';
import { ProjectStats } from '../../types/project';

interface ProjectsHeaderProps {
  stats: ProjectStats | null;
  onAddProject: () => void;
  selectedTech?: string;
  onSelectTech?: (tech: string) => void;
}

export const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({
  stats,
  onAddProject,
  selectedTech,
  onSelectTech,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-brand-500/10 text-brand-300 border border-brand-500/20">
              Websites & Applications Vault
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Globe className="w-7 h-7 text-brand-400" />
            <span>Developed Web Projects</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Keep track of all your built and deployed websites with live links, UI screenshots, features, source repositories, and test credentials.
          </p>
        </div>

        <div>
          <button
            onClick={onAddProject}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-xl shadow-brand-500/25 transition-all duration-200 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Developed Website</span>
          </button>
        </div>
      </div>

      {/* Analytics & Metrics Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Projects */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Total Projects</span>
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                <Rocket className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{stats.total}</div>
            <div className="text-[11px] text-slate-400 mt-1">Across all categories</div>
          </div>

          {/* Live Sites */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Live Deployments</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-400 flex items-center gap-2">
              <span>{stats.liveCount}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Accessible online</div>
          </div>

          {/* In Progress */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">In Progress</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Code2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-400">{stats.inProgressCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Under development</div>
          </div>

          {/* Pinned / Favorites */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Featured / Starred</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Star className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-400">{stats.favoriteCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Pinned showcase</div>
          </div>
        </div>
      )}

      {/* Top Technologies Bar */}
      {stats && stats.topTechnologies && stats.topTechnologies.length > 0 && onSelectTech && (
        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 mr-1">
            <Layers className="w-3.5 h-3.5 text-brand-400" />
            Stack Filter:
          </span>

          <button
            onClick={() => onSelectTech('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all shrink-0 ${
              !selectedTech || selectedTech === 'ALL'
                ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Tech
          </button>

          {stats.topTechnologies.slice(0, 10).map((t) => {
            const isSelected = selectedTech === t.name;
            return (
              <button
                key={t.name}
                onClick={() => onSelectTech(isSelected ? 'ALL' : t.name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span>{t.name}</span>
                <span className="text-[10px] opacity-70">({t.count})</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

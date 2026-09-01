import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  HardDrive,
  Files,
  Activity,
  Image,
  Video,
  Music,
  FileText,
  Radio,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { AdminStats } from '../../types';
import { formatBytes, formatDateTime } from '../../utils/formatters';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-slate-900 border border-slate-800 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-900/30 rounded-3xl shadow-2xl flex items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
            <Shield className="w-4 h-4" />
            System Administration
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Admin Console & Metrics
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            System-wide statistics, storage utilization, user controls, and activity audit logs.
          </p>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Users */}
        <Link
          to="/admin/users"
          className="group p-6 bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-3xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400">Total Users</p>
            <p className="text-3xl font-extrabold text-white">{stats?.users.total || 0}</p>
            <p className="text-[11px] text-emerald-400 font-medium">
              {stats?.users.active || 0} active ({stats?.users.admins || 0} admins)
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition">
            <Users className="w-8 h-8" />
          </div>
        </Link>

        {/* Total Files */}
        <Link
          to="/admin/files"
          className="group p-6 bg-slate-900 border border-slate-800 hover:border-brand-500/50 rounded-3xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400">Total System Files</p>
            <p className="text-3xl font-extrabold text-white">{stats?.files.total || 0}</p>
            <p className="text-[11px] text-brand-400 font-medium">Across all user accounts</p>
          </div>
          <div className="p-4 rounded-2xl bg-brand-500/10 text-brand-400 group-hover:scale-110 transition">
            <Files className="w-8 h-8" />
          </div>
        </Link>

        {/* Total Storage */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400">Physical Storage Used</p>
            <p className="text-3xl font-extrabold text-white">
              {formatBytes(stats?.storage.totalBytes || 0)}
            </p>
            <p className="text-[11px] text-amber-400 font-medium">Local/S3 Object Storage</p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400">
            <HardDrive className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Storage Breakdown and File Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Type Counts */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Files className="w-5 h-5 text-brand-400" />
            File Types Distribution
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Images', count: stats?.files.byType?.IMAGE || 0, icon: Image, color: 'text-pink-400' },
              { label: 'Videos', count: stats?.files.byType?.VIDEO || 0, icon: Video, color: 'text-purple-400' },
              { label: 'Music', count: stats?.files.byType?.AUDIO || 0, icon: Music, color: 'text-amber-400' },
              { label: 'PDFs', count: stats?.files.byType?.PDF || 0, icon: FileText, color: 'text-rose-400' },
              { label: 'Docs', count: stats?.files.byType?.DOCUMENT || 0, icon: FileText, color: 'text-blue-400' },
              { label: 'Sheets', count: stats?.files.byType?.SPREADSHEET || 0, icon: FileText, color: 'text-emerald-400' },
              { label: 'Archives', count: stats?.files.byType?.ARCHIVE || 0, icon: FileText, color: 'text-yellow-400' },
              { label: 'Other', count: stats?.files.byType?.OTHER || 0, icon: FileText, color: 'text-slate-400' },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.label} className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl">
                  <Icon className={`w-4 h-4 ${t.color} mb-1.5`} />
                  <p className="text-xs font-semibold text-slate-400">{t.label}</p>
                  <p className="text-lg font-bold text-white mt-0.5">{t.count}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Storage Volume Breakdown */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-amber-400" />
            Storage Volume by Category
          </h3>

          <div className="space-y-3">
            {Object.entries(stats?.storage.byType || {}).map(([type, bytes]) => {
              const percent =
                stats && stats.storage.totalBytes > 0
                  ? (Number(bytes) / stats.storage.totalBytes) * 100
                  : 0;

              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">{type}</span>
                    <span className="text-slate-400 font-mono">
                      {formatBytes(Number(bytes))} ({percent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-brand-500 to-indigo-500 h-full rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Log Preview */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Recent System Activity Logs
          </h3>
          <Link
            to="/admin/logs"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            View All Logs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-800/80">
          {stats?.recentActivity.map((log) => (
            <div key={log.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                  {log.action}
                </span>
                <span className="text-slate-300">
                  {log.user ? `${log.user.name} (@${log.user.username})` : 'System / Anonymous'}
                </span>
              </div>
              <span className="text-slate-500">{formatDateTime(log.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

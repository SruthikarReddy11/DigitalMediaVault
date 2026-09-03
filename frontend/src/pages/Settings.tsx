import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Lock,
  Camera,
  Trash2,
  Upload,
  Shield,
  Key,
  HardDrive,
  Laptop,
  CheckCircle2,
  Download,
  RefreshCw,
  LogOut,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { authApi, UserSession } from '../services/authApi';
import { filesApi } from '../services/filesApi';
import { DashboardStats } from '../types';
import { formatBytes, formatDate } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { getMediaUrl } from '../services/api';

export const Settings: React.FC = () => {
  const { user, updateUser, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 4-Digit Security PIN state
  const [showPin, setShowPin] = useState(false);
  const [isRegeneratingPin, setIsRegeneratingPin] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);

  // Dashboard stats (Storage usage)
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Reset imageError when user avatarUrl changes
  useEffect(() => {
    setImageError(false);
  }, [user?.avatarUrl]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUserData = async () => {
    setIsLoadingSessions(true);
    try {
      const [sessionsData, statsData] = await Promise.all([
        authApi.getSessions().catch(() => []),
        filesApi.getDashboardStats().catch(() => null),
      ]);
      setSessions(sessionsData);
      setStats(statsData);
    } catch (err) {
      console.warn('Failed to load settings extra data:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleCopyPin = () => {
    if (!user?.securityPin) return;
    navigator.clipboard.writeText(user.securityPin);
    setPinCopied(true);
    success('Security PIN copied to clipboard!');
    setTimeout(() => setPinCopied(false), 2000);
  };

  const handleRegeneratePin = async () => {
    setIsRegeneratingPin(true);
    try {
      const newPin = await authApi.regeneratePin();
      if (user) {
        updateUser({ ...user, securityPin: newPin });
      }
      success(`New Security PIN generated: ${newPin}`);
    } catch (err: any) {
      error(err.message || 'Failed to regenerate PIN.');
    } finally {
      setIsRegeneratingPin(false);
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      error('Profile picture must be under 10 MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const updated = await authApi.uploadAvatar(file);
      updateUser(updated);
      success('Profile picture updated successfully!');
    } catch (err: any) {
      error(err.message || 'Failed to upload profile picture.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    try {
      const updated = await authApi.removeAvatar();
      updateUser(updated);
      success('Profile picture removed.');
    } catch (err: any) {
      error(err.message || 'Failed to remove profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        error('New passwords do not match.');
        return;
      }
      if (newPassword.length < 8) {
        error('New password must be at least 8 characters.');
        return;
      }
      if (!currentPassword) {
        error('Current password is required to change password.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const updated = await authApi.updateProfile({
        name: name !== user?.name ? name : undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      updateUser(updated);
      success('Settings updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeSessions = async () => {
    setIsRevokingSessions(true);
    try {
      const res = await authApi.revokeOtherSessions();
      success(res.message);
      fetchUserData();
    } catch (err: any) {
      error(err.message || 'Failed to revoke other sessions.');
    } finally {
      setIsRevokingSessions(false);
    }
  };

  const handleExportData = () => {
    if (!user) return;
    const exportPayload = {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      stats,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `PDL_Account_Export_${user.username}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    success('Account metadata exported to JSON.');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          Account Settings & Security
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage profile details, credentials, active sessions, and storage preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card & Quick Stats */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-5 text-center flex flex-col items-center justify-center shadow-xl">
            {/* Avatar with Camera Hover Overlay */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-brand-500/25 overflow-hidden border-2 border-slate-700">
                {user?.avatarUrl && !imageError ? (
                  <img
                    src={getMediaUrl(user.avatarUrl)}
                    alt={user.name}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>

              {/* Hover Camera Overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-semibold transition cursor-pointer"
              >
                <Camera className="w-5 h-5 mb-1 text-brand-300" />
                <span>Change</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />

            {/* Avatar action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl transition flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                {isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}
              </button>

              {user?.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                  className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl transition"
                  title="Remove photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{user?.name}</h3>
              <p className="text-xs text-slate-400">@{user?.username}</p>
              <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
            </div>

            <div className="pt-1">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isAdmin
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                }`}
              >
                {isAdmin ? 'ADMINISTRATOR' : 'STANDARD USER'}
              </span>
            </div>
          </div>

          {/* Storage Usage Widget */}
          {stats && (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-brand-400" />
                  Database Storage Meter
                </h4>
                <span className="text-xs font-mono font-bold text-brand-300">
                  {formatBytes(stats.storageUsedBytes)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-brand-500 h-full"
                  style={{ width: `${Math.min(100, (stats.storageUsedBytes / (stats.storageLimitBytes || (500 * 1024 * 1024))) * 100)}%` }}
                  title="Used storage"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
                <div>
                  <span className="font-semibold text-white">{stats.totalFiles}</span> total files
                </div>
                <div>
                  <span className="font-semibold text-white">{stats.countsByType?.music || 0}</span> songs
                </div>
                <div>
                  <span className="font-semibold text-white">{stats.countsByType?.images || 0}</span> photos
                </div>
                <div>
                  <span className="font-semibold text-white">{stats.countsByType?.videos || 0}</span> videos
                </div>
              </div>
            </div>
          )}

          {/* Quick Data Export */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-xl">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              Library Data Export
            </h4>
            <p className="text-xs text-slate-400">
              Download a complete JSON record of your account settings, stats, and files.
            </p>
            <button
              onClick={handleExportData}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl transition flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON Backup
            </button>
          </div>
        </div>

        {/* Right Column: Update Profile & Session Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Update Form */}
          <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-brand-400" />
              Personal Profile Details
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none"
                />
              </div>

              {/* Change Password Section */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-brand-400" />
                  Security & Access Authorization
                </h4>

                {/* Private Security PIN Section */}
                <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-2xl space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Private 4-Digit Security PIN
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                      Confidential
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5 font-mono text-xl font-bold tracking-widest text-amber-400 bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-700">
                        {user?.securityPin ? (
                          showPin ? (
                            user.securityPin
                          ) : (
                            '••••'
                          )
                        ) : (
                          <span className="text-xs text-slate-500 font-sans">Generating...</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                        title={showPin ? 'Hide PIN' : 'Reveal PIN'}
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyPin}
                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                        title="Copy PIN"
                      >
                        {pinCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleRegeneratePin}
                      disabled={isRegeneratingPin}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingPin ? 'animate-spin' : ''}`} />
                      <span>Regenerate PIN</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    ⚠️ <strong>Do not share this code with anyone.</strong> When an administrator inspects or views your files from File Management, they are required to enter this 4-digit security code to verify access.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-brand-600/20 disabled:opacity-50"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* Active Sessions & Security Section */}
          <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Active Login Sessions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Devices and sessions authenticated to your account
                </p>
              </div>

              {sessions.length > 1 && (
                <button
                  onClick={handleRevokeSessions}
                  disabled={isRevokingSessions}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {isRevokingSessions ? 'Revoking...' : 'Revoke Other Sessions'}
                </button>
              )}
            </div>

            {isLoadingSessions ? (
              <div className="space-y-2">
                <div className="h-12 bg-slate-950 rounded-xl animate-pulse" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-slate-400">Current session active.</p>
            ) : (
              <div className="space-y-2.5">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition ${
                      s.isCurrent
                        ? 'bg-brand-500/10 border-brand-500/30 text-brand-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {s.isCurrent ? 'Current Browser Session' : 'Authenticated Client'}
                          </span>
                          {s.isCurrent && (
                            <span className="px-2 py-0.2 bg-brand-500 text-white text-[10px] font-bold rounded-full">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Last active: {formatDate(s.lastUsedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 font-mono">
                      Expires: {formatDate(s.expiresAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

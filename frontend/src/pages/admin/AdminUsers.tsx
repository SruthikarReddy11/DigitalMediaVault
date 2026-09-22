import React, { useState, useEffect, useRef } from 'react';
import {
  Users as UsersIcon,
  Search,
  Shield,
  User,
  CheckCircle,
  XCircle,
  Trash2,
  Lock,
  Unlock,
  HardDrive,
  FolderClosed,
  Music,
  QrCode,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import jsQR from 'jsqr';
import { adminApi } from '../../services/adminApi';
import { AdminUser, Role } from '../../types';
import { formatBytes, formatDate } from '../../utils/formatters';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getMediaUrl } from '../../services/api';

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // QR Code Retrieval State
  const [decodedQr, setDecodedQr] = useState<{
    raw: string;
    preview: {
      user: { id: string; name: string; username: string; email: string; role: Role; isActive: boolean; createdAt: string };
      isPending: boolean;
      message: string;
    };
  } | null>(null);
  const [isProcessingQr, setIsProcessingQr] = useState(false);
  const [isActivatingQr, setIsActivatingQr] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [search, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Actions
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 50,
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter]);

  const handleToggleStatus = async (targetUser: AdminUser) => {
    try {
      const newStatus = !targetUser.isActive;
      await adminApi.updateUserStatus(targetUser.id, { isActive: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: newStatus } : u))
      );
      success(`User account ${newStatus ? 'activated' : 'disabled'}.`);
    } catch (err: any) {
      error(err.message || 'Failed to update user status.');
    }
  };

  const handleRoleChange = async (targetUser: AdminUser, newRole: Role) => {
    try {
      await adminApi.updateUserStatus(targetUser.id, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
      success(`User role updated to ${newRole}.`);
    } catch (err: any) {
      error(err.message || 'Failed to update role.');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;

    try {
      await adminApi.deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      success('User deleted successfully.');
      setDeleteTarget(null);
    } catch (err: any) {
      error(err.message || 'Failed to delete user.');
    }
  };

  // QR Code Decoding & Upload Handling
  const processQrImageFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      error('Please upload a valid image file containing the QR code.');
      return;
    }

    setIsProcessingQr(true);
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            error('Canvas context initialization failed.');
            setIsProcessingQr(false);
            return;
          }

          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (!code || !code.data) {
            error('No QR code detected in this image. Please ensure the QR code is clearly visible.');
            setIsProcessingQr(false);
            return;
          }

          // Call backend preview endpoint to verify signature and fetch user record
          const preview = await adminApi.previewQr(code.data);
          setDecodedQr({
            raw: code.data,
            preview,
          });
          success(`QR code detected for @${preview.user.username}!`);
        } catch (err: any) {
          error(err.message || 'Failed to verify QR code registration data.');
        } finally {
          setIsProcessingQr(false);
        }
      };

      img.onerror = () => {
        error('Failed to load image file.');
        setIsProcessingQr(false);
      };

      img.src = reader.result as string;
    };

    reader.onerror = () => {
      error('Failed to read image file.');
      setIsProcessingQr(false);
    };

    reader.readAsDataURL(file);
  };

  const handleActivateDecodedUser = async () => {
    if (!decodedQr?.raw) return;

    setIsActivatingQr(true);
    try {
      const res = await adminApi.activateUserFromQr(decodedQr.raw);
      success(res.message || `Account for @${res.user.username} has been activated!`);
      setDecodedQr(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchUsers();
    } catch (err: any) {
      error(err.message || 'Failed to activate user account from QR code.');
    } finally {
      setIsActivatingQr(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <UsersIcon className="w-7 h-7 text-purple-400" />
          User Management
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage registered accounts, roles, access statuses, and verify registration QR codes
        </p>
      </div>

      {/* QR Code Account Retrieval & Activation Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                QR Code Account Retrieval & Activation
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Admin Tool
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload registration QR codes received from users to activate accounts
              </p>
            </div>
          </div>
        </div>

        {/* Dropzone & Preview Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) {
                processQrImageFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
              isDragging
                ? 'border-cyan-400 bg-cyan-500/10'
                : 'border-slate-700/80 hover:border-cyan-500/50 bg-slate-950/60 hover:bg-slate-950/90'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  processQrImageFile(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              {isProcessingQr ? (
                <span className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>

            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">
                {isProcessingQr ? 'Decoding QR Code...' : 'Click to Browse or Drag & Drop QR Image'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supports PNG, JPEG, or WebP registration QR codes
              </p>
            </div>
          </div>

          {/* Decoded QR Details & Activation Action */}
          <div className="bg-slate-950/80 border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between">
            {decodedQr ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    Decoded Registration
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      decodedQr.preview.isPending
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {decodedQr.preview.isPending ? 'Pending Activation' : 'Already Active'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Username:</span>
                    <span className="font-bold text-white font-mono">@{decodedQr.preview.user.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-semibold text-slate-200">{decodedQr.preview.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Role:</span>
                    <span className="text-cyan-400 font-bold">{decodedQr.preview.user.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">User ID:</span>
                    <span className="font-mono text-[10px] text-slate-400">{decodedQr.preview.user.id.slice(0, 16)}...</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={isActivatingQr || !decodedQr.preview.isPending}
                    onClick={handleActivateDecodedUser}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isActivatingQr ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{decodedQr.preview.isPending ? 'Approve & Activate Account' : 'Account Already Active'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDecodedQr(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-6 text-slate-500 space-y-2">
                <QrCode className="w-8 h-8 opacity-40 text-cyan-400" />
                <p className="text-xs text-slate-400 max-w-xs">
                  No QR code uploaded yet. Select or drop a QR code image to inspect and activate the user account.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, username, or email..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="USER">Standard Users</option>
            <option value="ADMIN">Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Pending Approval / Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-4 sm:col-span-3">User</div>
            <div className="hidden sm:block sm:col-span-2">Role</div>
            <div className="col-span-3 sm:col-span-2">Storage</div>
            <div className="hidden md:block md:col-span-2">Files / Playlists</div>
            <div className="col-span-2 sm:col-span-1">Status</div>
            <div className="col-span-3 sm:col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-slate-800/60">
            {users.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No users found matching current filters.
              </div>
            ) : (
              users.map((targetUser) => {
                const isSelf = targetUser.id === currentUser?.id;

                return (
                  <div
                    key={targetUser.id}
                    className={`grid grid-cols-12 gap-4 px-5 py-3.5 items-center text-xs transition ${
                      !targetUser.isActive
                        ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.07] text-slate-200'
                        : 'text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    {/* User info */}
                    <div className="col-span-4 sm:col-span-3 flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-brand-600 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden border border-slate-700">
                        {targetUser.avatarUrl ? (
                          <img
                            src={getMediaUrl(targetUser.avatarUrl)}
                            alt={targetUser.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          targetUser.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{targetUser.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">@{targetUser.username}</p>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="hidden sm:block sm:col-span-2">
                      <select
                        value={targetUser.role}
                        disabled={isSelf}
                        onChange={(e) => handleRoleChange(targetUser, e.target.value as Role)}
                        className={`bg-slate-950 border rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none ${
                          targetUser.role === 'ADMIN'
                            ? 'border-purple-500/40 text-purple-300'
                            : 'border-slate-800 text-slate-300'
                        }`}
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>

                    {/* Storage */}
                    <div className="col-span-3 sm:col-span-2 font-mono text-slate-300">
                      {formatBytes(targetUser.storageBytes)}
                    </div>

                    {/* Files / Playlists */}
                    <div className="hidden md:block md:col-span-2 text-slate-400">
                      {targetUser.fileCount} files • {targetUser.playlistCount} playlists
                    </div>

                    {/* Status */}
                    <div className="col-span-2 sm:col-span-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          targetUser.isActive
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {targetUser.isActive ? 'Active' : 'Pending'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1.5">
                      {/* Disable / Enable toggle */}
                      <button
                        onClick={() => handleToggleStatus(targetUser)}
                        disabled={isSelf}
                        className={`p-1.5 rounded-lg transition disabled:opacity-30 ${
                          targetUser.isActive
                            ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                            : 'text-amber-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                        title={targetUser.isActive ? 'Deactivate user' : 'Approve & Activate user'}
                      >
                        {targetUser.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>

                      {/* Delete user */}
                      <button
                        onClick={() => setDeleteTarget(targetUser)}
                        disabled={isSelf}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition disabled:opacity-30"
                        title="Delete user account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Delete User Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteUser}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete user "${deleteTarget?.name}" (@${deleteTarget?.username})? All their files, folders, and playlists will be deleted.`}
        confirmText="Delete User"
        isDangerous
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
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
      success(`User account ${newStatus ? 'enabled' : 'disabled'}.`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <UsersIcon className="w-7 h-7 text-purple-400" />
          User Management
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage registered accounts, roles, access statuses, and file quotas
        </p>
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
            <option value="inactive">Disabled Only</option>
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
            {users.map((targetUser) => {
              const isSelf = targetUser.id === currentUser?.id;

              return (
                <div
                  key={targetUser.id}
                  className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center text-xs text-slate-300 hover:bg-slate-800/40 transition"
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
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {targetUser.isActive ? 'Active' : 'Disabled'}
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
                          : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                      title={targetUser.isActive ? 'Deactivate user' : 'Activate user'}
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
            })}
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

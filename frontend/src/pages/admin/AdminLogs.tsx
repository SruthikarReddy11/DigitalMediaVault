import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Search,
  User,
  Shield,
  Clock,
  UserPlus,
  LogIn,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Folder,
  FolderPlus,
  KeyRound,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  File,
  Trash2,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Globe,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { formatBytes, formatDetailedDateTime } from '../../utils/formatters';

interface LogItem {
  id: string;
  userId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    username: string;
    email: string;
  } | null;
}

export const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [visibleCount, setVisibleCount] = useState<number>(15);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getLogs({
        limit: 300,
      });
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Reset pagination count when category or search changes
  useEffect(() => {
    setVisibleCount(15);
  }, [activeCategory, search]);

  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyMetadata = (id: string, metadata: any) => {
    navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Categorization filter logic
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Category Filter
      if (activeCategory !== 'ALL') {
        const act = log.action.toUpperCase();
        if (activeCategory === 'AUTH') {
          const isAuth =
            act.includes('LOGIN') ||
            act.includes('LOGOUT') ||
            act.includes('REGISTER') ||
            act.includes('USER_') ||
            act.includes('PIN_') ||
            act.includes('AVATAR');
          if (!isAuth) return false;
        } else if (activeCategory === 'VAULT') {
          if (!act.includes('VAULT')) return false;
        } else if (activeCategory === 'FILES') {
          const isFile =
            act.includes('FILE_UPLOAD') ||
            act.includes('FILE_RENAME') ||
            act.includes('FILE_MOVE') ||
            act.includes('FAVORITE');
          if (!isFile) return false;
        } else if (activeCategory === 'TRASH') {
          const isTrash =
            act.includes('TRASH') ||
            act.includes('DELETE') ||
            act.includes('RESTORE');
          if (!isTrash) return false;
        } else if (activeCategory === 'FOLDERS') {
          if (!act.includes('FOLDER') || act.includes('VAULT_FOLDER')) {
            if (!act.includes('FOLDER')) return false;
          }
        } else if (activeCategory === 'PLAYLISTS') {
          if (!act.includes('PLAYLIST')) return false;
        } else if (activeCategory === 'ADMIN') {
          if (!act.includes('ADMIN')) return false;
        }
      }

      // 2. Search query filter
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();

      const actionMatch = log.action.toLowerCase().includes(q);
      const userMatch =
        log.user?.name.toLowerCase().includes(q) ||
        log.user?.username.toLowerCase().includes(q) ||
        log.user?.email.toLowerCase().includes(q);
      const ipMatch = log.ipAddress?.toLowerCase().includes(q);
      const metaString = log.metadata ? JSON.stringify(log.metadata).toLowerCase() : '';
      const metaMatch = metaString.includes(q);

      return actionMatch || userMatch || ipMatch || metaMatch;
    });
  }, [logs, activeCategory, search]);

  // Paginated visible slice of logs
  const displayedLogs = useMemo(() => {
    return filteredLogs.slice(0, visibleCount);
  }, [filteredLogs, visibleCount]);

  // Statistics counters
  const stats = useMemo(() => {
    let authCount = 0;
    let vaultCount = 0;
    let fileCount = 0;
    let trashCount = 0;

    logs.forEach((l) => {
      const act = l.action.toUpperCase();
      if (act.includes('LOGIN') || act.includes('REGISTER') || act.includes('USER_')) authCount++;
      if (act.includes('VAULT')) vaultCount++;
      if (act.includes('FILE_') || act.includes('FAVORITE')) fileCount++;
      if (act.includes('TRASH') || act.includes('DELETE')) trashCount++;
    });

    return {
      total: logs.length,
      auth: authCount,
      vault: vaultCount,
      files: fileCount,
      trash: trashCount,
    };
  }, [logs]);

  // Render Action Icon & Colors
  const getActionConfig = (action: string, metadata?: any) => {
    const act = action.toUpperCase();

    if (act === 'REGISTER' || act === 'USER_REGISTER') {
      return {
        icon: UserPlus,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        badge: 'NEW REGISTRATION',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      };
    }
    if (act === 'LOGIN') {
      return {
        icon: LogIn,
        color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
        badge: 'USER LOGIN',
        badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      };
    }
    if (act === 'LOGIN_FAILED') {
      return {
        icon: ShieldAlert,
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        badge: 'LOGIN FAILED',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      };
    }
    if (act === 'LOGOUT') {
      return {
        icon: LogOut,
        color: 'text-slate-400 bg-slate-800 border-slate-700',
        badge: 'USER LOGOUT',
        badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
      };
    }
    if (act === 'VAULT_OPEN') {
      return {
        icon: ShieldCheck,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        badge: 'VAULT 2FA UNLOCKED',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
    }
    if (act === 'VAULT_CLOSE') {
      return {
        icon: Lock,
        color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
        badge: 'VAULT LOCKED',
        badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      };
    }
    if (act === 'VAULT_FOLDER_UNLOCK') {
      return {
        icon: KeyRound,
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        badge: 'VAULT FOLDER OPENED',
        badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      };
    }
    if (act === 'VAULT_FOLDER_CREATE') {
      return {
        icon: FolderPlus,
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
        badge: 'NEW VAULT FOLDER',
        badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      };
    }
    if (act === 'VAULT_CELL_CREATE') {
      return {
        icon: Sparkles,
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        badge: 'VAULT LINK CREATED',
        badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      };
    }
    if (act === 'VAULT_CELL_DELETE' || act === 'VAULT_FOLDER_DELETE') {
      return {
        icon: Trash2,
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        badge: 'VAULT ITEM REMOVED',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      };
    }
    if (act === 'FILE_UPLOAD') {
      const type = metadata?.fileType || '';
      if (type === 'IMAGE') {
        return {
          icon: ImageIcon,
          color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
          badge: 'PHOTO UPLOAD',
          badgeBg: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
        };
      }
      if (type === 'VIDEO') {
        return {
          icon: Video,
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
          badge: 'VIDEO UPLOAD',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        };
      }
      if (type === 'AUDIO') {
        return {
          icon: Music,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          badge: 'AUDIO UPLOAD',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
      }
      return {
        icon: FileText,
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        badge: 'DOCUMENT UPLOAD',
        badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      };
    }
    if (act === 'FILE_DELETE' || act === 'TRASH_EMPTY' || act === 'FILE_PERMANENT_DELETE') {
      return {
        icon: Trash2,
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        badge: act.replace(/_/g, ' '),
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      };
    }
    if (act === 'FILE_RESTORE' || act === 'TRASH_RESTORE_ALL') {
      return {
        icon: RotateCcw,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        badge: act.replace(/_/g, ' '),
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      };
    }
    if (act.includes('ADMIN')) {
      return {
        icon: Shield,
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        badge: 'ADMIN ACTION',
        badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      };
    }

    return {
      icon: Activity,
      color: 'text-slate-400 bg-slate-800 border-slate-700',
      badge: act.replace(/_/g, ' '),
      badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
    };
  };

  // Natural Language Description Generator
  const formatEventMessage = (log: LogItem) => {
    const act = log.action.toUpperCase();
    const meta = log.metadata || {};
    const userLabel = log.user
      ? `${log.user.name} (@${log.user.username})`
      : 'Anonymous User / System';

    if (act === 'REGISTER' || act === 'USER_REGISTER') {
      const parts = [];
      if (meta.email) parts.push(`Email: ${meta.email}`);
      if (meta.role) parts.push(`Role: ${meta.role}`);
      if (meta.country || meta.state) parts.push(`Location: ${[meta.village, meta.district, meta.state, meta.country].filter(Boolean).join(', ')}`);
      if (meta.mobileNumber) parts.push(`Mobile: ${meta.mobileNumber}`);
      if (meta.occupation) parts.push(`Occupation: ${meta.occupation}`);
      if (meta.securityPinAssigned) parts.push(`4-Digit PIN: Assigned`);

      return (
        <div>
          <span className="text-white font-bold">New user registration: </span>
          <span className="text-emerald-300 font-semibold">{meta.name || log.user?.name || 'New User'}</span>{' '}
          <span className="text-slate-300 font-mono">(@{meta.username || log.user?.username || 'user'})</span> created account successfully.
          {parts.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300">
              {parts.map((p, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-950/70 border border-emerald-500/20 text-emerald-200">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (act === 'LOGIN') {
      return (
        <div>
          <span className="text-white font-bold">User authentication: </span>
          <span className="text-sky-300 font-semibold">{userLabel}</span> logged in successfully via{' '}
          <span className="text-slate-200 font-medium">{meta.authMethod || 'Password'} authentication</span>.
        </div>
      );
    }

    if (act === 'LOGIN_FAILED') {
      return (
        <div>
          <span className="text-rose-400 font-bold">Failed login attempt: </span>
          Identifier <span className="text-white font-mono bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">"{meta.attemptedIdentifier || 'unknown'}"</span> — Reason:{' '}
          <span className="text-rose-300 font-medium">{meta.reason || 'Invalid credentials'}</span>.
        </div>
      );
    }

    if (act === 'LOGOUT') {
      return (
        <div>
          <span className="text-slate-300 font-bold">User session terminated: </span>
          <span className="text-white font-semibold">{userLabel}</span> logged out.
        </div>
      );
    }

    if (act === 'VAULT_OPEN') {
      const dt = formatDetailedDateTime(log.createdAt);
      return (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-amber-300 font-bold">Secure Vault Space Opened: </span>
            <span className="text-white font-semibold">{userLabel}</span>
            <span className="text-slate-300">unlocked and accessed secret vault.</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 pt-0.5">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-200 font-mono">
              Google Authenticator (TOTP 2FA)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-950/70 border border-white/[0.08] text-amber-300 font-mono font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Opened: {dt.date} at {dt.time}
            </span>
          </div>
        </div>
      );
    }

    if (act === 'VAULT_CLOSE') {
      const dt = formatDetailedDateTime(log.createdAt);
      return (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-orange-300 font-bold">Secure Vault Space Closed & Locked: </span>
            <span className="text-white font-semibold">{userLabel}</span>
            <span className="text-slate-300">exited vault space and secured master session lock.</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 pt-0.5">
            <span className="px-2 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-200 font-mono">
              Session Locked
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-950/70 border border-white/[0.08] text-orange-300 font-mono font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Closed: {dt.date} at {dt.time}
            </span>
          </div>
        </div>
      );
    }

    if (act === 'VAULT_UNLOCK_FAILED') {
      return (
        <div>
          <span className="text-rose-400 font-bold">Vault 2FA Verification Failed: </span>
          <span className="text-white font-semibold">{userLabel}</span> entered invalid 6-digit Authenticator code.
        </div>
      );
    }

    if (act === 'VAULT_FOLDER_UNLOCK') {
      const dt = formatDetailedDateTime(log.createdAt);
      return (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-purple-300 font-bold">Protected Vault Folder Unlocked: </span>
            <span className="text-white font-semibold">{userLabel}</span>
            <span className="text-slate-300">unlocked folder</span>
            <span className="text-purple-200 font-bold">"{meta.folderName || 'Vault Folder'}"</span>.
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 pt-0.5">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-200 font-mono">
              Folder Password Verified
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-950/70 border border-white/[0.08] text-purple-300 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {dt.date} • {dt.time}
            </span>
          </div>
        </div>
      );
    }

    if (act === 'VAULT_FOLDER_CREATE') {
      return (
        <div>
          <span className="text-indigo-300 font-bold">Created Protected Vault Folder: </span>
          <span className="text-white font-bold">"{meta.folderName}"</span> with encrypted master password by {userLabel}.
        </div>
      );
    }

    if (act === 'VAULT_CELL_CREATE') {
      return (
        <div>
          <span className="text-cyan-300 font-bold">Added Encrypted Link to Vault: </span>
          Saved link <span className="text-white font-bold">"{meta.title}"</span>{' '}
          {meta.url && <span className="text-slate-400 font-mono text-[11px]">({meta.url})</span>} in folder{' '}
          <span className="text-cyan-200 font-semibold">"{meta.folderName || 'Vault'}"</span>.
        </div>
      );
    }

    if (act === 'VAULT_CELL_DELETE') {
      return (
        <div>
          <span className="text-rose-300 font-bold">Deleted Vault Link: </span>
          Removed link <span className="text-white font-bold">"{meta.title}"</span> from folder "{meta.folderName || 'Vault'}".
        </div>
      );
    }

    if (act === 'FILE_UPLOAD') {
      const sizeStr = meta.size ? ` (${formatBytes(meta.size)})` : '';
      const folderStr = meta.folderName ? ` into folder "${meta.folderName}"` : '';
      const typeLabel = meta.fileType === 'IMAGE' ? 'photo' : meta.fileType === 'VIDEO' ? 'video' : meta.fileType === 'AUDIO' ? 'audio track' : 'file';

      return (
        <div>
          <span className="text-white font-bold">{userLabel} uploaded {typeLabel}: </span>
          <span className="text-pink-300 font-bold">"{meta.fileName || meta.originalName || 'file'}"</span>
          <span className="text-slate-300 font-medium">{sizeStr}</span>
          <span className="text-slate-400">{folderStr}</span>.
        </div>
      );
    }

    if (act === 'FILE_RENAME') {
      return (
        <div>
          <span className="text-white font-bold">{userLabel} renamed file: </span>
          <span className="text-slate-400 line-through">"{meta.oldName}"</span>{' '}
          <span className="text-emerald-300 font-bold">→ "{meta.newName}"</span>.
        </div>
      );
    }

    if (act === 'FILE_MOVE') {
      return (
        <div>
          <span className="text-white font-bold">{userLabel} moved file: </span>
          <span className="text-white font-semibold">"{meta.fileName}"</span> from "{meta.fromFolder}" to "{meta.toFolder}".
        </div>
      );
    }

    if (act === 'FILE_DELETE') {
      return (
        <div>
          <span className="text-rose-400 font-bold">{userLabel} moved file to Trash: </span>
          <span className="text-white font-semibold">"{meta.fileName || meta.originalName}"</span>.
        </div>
      );
    }

    if (act === 'FILE_RESTORE') {
      return (
        <div>
          <span className="text-emerald-400 font-bold">{userLabel} restored file from Trash: </span>
          <span className="text-white font-semibold">"{meta.fileName || meta.originalName}"</span>.
        </div>
      );
    }

    if (act === 'FILE_PERMANENT_DELETE') {
      return (
        <div>
          <span className="text-rose-500 font-bold">{userLabel} permanently deleted file: </span>
          <span className="text-white font-semibold">"{meta.fileName || meta.originalName}"</span> (erased from storage).
        </div>
      );
    }

    if (act === 'FOLDER_CREATE') {
      return (
        <div>
          <span className="text-cyan-300 font-bold">{userLabel} created workspace folder: </span>
          <span className="text-white font-bold">"{meta.folderName}"</span>.
        </div>
      );
    }

    if (act === 'FOLDER_DELETE') {
      return (
        <div>
          <span className="text-rose-400 font-bold">{userLabel} deleted folder: </span>
          <span className="text-white font-bold">"{meta.folderName}"</span>.
        </div>
      );
    }

    if (act === 'TRASH_EMPTY') {
      return (
        <div>
          <span className="text-rose-400 font-bold">{userLabel} emptied Trash bin: </span>
          Permanently deleted <span className="text-white font-bold">{meta.count || 'multiple'}</span> files.
        </div>
      );
    }

    if (act === 'TRASH_RESTORE_ALL') {
      return (
        <div>
          <span className="text-emerald-400 font-bold">{userLabel} restored all files from Trash: </span>
          Restored <span className="text-white font-bold">{meta.count || 'all'}</span> files back to library.
        </div>
      );
    }

    if (act === 'FAVORITE_ADD') {
      return (
        <div>
          <span className="text-rose-300 font-bold">{userLabel} added file to Favorites: </span>
          <span className="text-white font-semibold">"{meta.fileName}"</span>.
        </div>
      );
    }

    if (act === 'FAVORITE_REMOVE') {
      return (
        <div>
          <span className="text-slate-400 font-bold">{userLabel} removed file from Favorites: </span>
          <span className="text-white font-semibold">"{meta.fileName}"</span>.
        </div>
      );
    }

    if (act === 'PLAYLIST_CREATE') {
      return (
        <div>
          <span className="text-amber-300 font-bold">{userLabel} created music playlist: </span>
          <span className="text-white font-bold">"{meta.name}"</span>.
        </div>
      );
    }

    if (act === 'USER_UPDATE') {
      return (
        <div>
          <span className="text-indigo-300 font-bold">Profile details updated: </span>
          <span className="text-white font-semibold">{userLabel}</span> modified profile fields{' '}
          <span className="font-mono text-slate-300">[{meta.updatedFields?.join(', ') || 'profile'}]</span>
          {meta.passwordChanged ? ' (Password was changed)' : ''}.
        </div>
      );
    }

    return (
      <div>
        <span className="text-white font-semibold">{userLabel} performed action </span>
        <span className="text-brand-300 font-mono font-bold">[{log.action}]</span>
        {meta && Object.keys(meta).length > 0 && (
          <span className="text-slate-400 font-mono text-[11px] ml-1">
            ({JSON.stringify(meta)})
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Luxury Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-purple-950/40 border border-white/[0.08] p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Real-Time Security & Operations Trail</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Audit & Activity Logs
              <span className="text-xs sm:text-sm font-semibold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {logs.length} Recorded
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-medium">
              Detailed chronological records of user registrations, logins, secure vault access, photo & video uploads, file modifications, and security events with full day, month, year, and time stamps.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="group relative overflow-hidden flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-xs sm:text-sm font-black rounded-2xl transition-all duration-200 shadow-xl shadow-purple-600/25 hover:shadow-purple-600/40 border border-white/20 active:scale-95 whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              <div className="p-1 rounded-lg bg-white/20 group-hover:rotate-180 transition-transform duration-500">
                <RefreshCw className={`w-4 h-4 text-white ${isLoading ? 'animate-spin' : ''}`} />
              </div>
              <span>{isLoading ? 'Syncing...' : 'Refresh Logs'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/[0.08]">
          <div className="p-3 bg-slate-950/60 border border-white/[0.08] rounded-2xl backdrop-blur-md">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-400" />
              Auth & User Events
            </span>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">{stats.auth}</p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-white/[0.08] rounded-2xl backdrop-blur-md">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Vault Operations
            </span>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">{stats.vault}</p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-white/[0.08] rounded-2xl backdrop-blur-md">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
              Files & Media Uploads
            </span>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">{stats.files}</p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-white/[0.08] rounded-2xl backdrop-blur-md">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Deletions & Trash
            </span>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">{stats.trash}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-900/70 border border-white/[0.08] rounded-2xl backdrop-blur-md">
          {/* Live Search */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, filename, action, IP, location..."
              className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-purple-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action Category Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'All Activity' },
              { id: 'AUTH', label: 'Auth & Register' },
              { id: 'VAULT', label: 'Secure Vault' },
              { id: 'FILES', label: 'Files & Media' },
              { id: 'FOLDERS', label: 'Folders' },
              { id: 'TRASH', label: 'Trash' },
              { id: 'ADMIN', label: 'Admin' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition duration-150 active:scale-95 cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/20'
                    : 'bg-slate-950/80 text-slate-400 border-white/[0.08] hover:text-white hover:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Feed */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-24 bg-slate-900/60 border border-white/[0.08] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 bg-slate-900/40 border border-dashed border-white/[0.1] rounded-3xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No logs match your filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search keywords or switching to "All Activity".
          </p>
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setActiveCategory('ALL');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedLogs.map((log) => {
            const config = getActionConfig(log.action, log.metadata);
            const Icon = config.icon;
            const timeObj = formatDetailedDateTime(log.createdAt);
            const isExpanded = expandedLogIds.has(log.id);

            return (
              <div
                key={log.id}
                className="group p-4 sm:p-5 bg-slate-900/80 hover:bg-slate-900 border border-white/[0.08] hover:border-purple-500/30 rounded-2xl backdrop-blur-md transition shadow-lg space-y-3"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Icon, Action Badge, and Natural Language Headline */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${config.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-mono font-black px-2.5 py-0.5 rounded-lg border text-[11px] tracking-wider uppercase ${config.badgeBg}`}
                        >
                          {config.badge}
                        </span>

                        {log.user ? (
                          <span className="text-xs font-bold text-slate-200">
                            {log.user.name} <span className="text-slate-400 font-mono">(@{log.user.username})</span>
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">Anonymous / System</span>
                        )}
                      </div>

                      {/* Descriptive Natural Language Event Text */}
                      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal pt-0.5">
                        {formatEventMessage(log)}
                      </div>
                    </div>
                  </div>

                  {/* Right: Date, Month, Year & Exact Time Stamp */}
                  <div className="flex flex-wrap lg:flex-col lg:items-end items-center gap-2 lg:gap-1 text-xs shrink-0 self-start">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/80 border border-white/[0.08] text-slate-200 font-mono text-[11px] shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span className="font-bold text-white">{timeObj.date}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-purple-300 font-semibold">{timeObj.time}</span>
                    </div>

                    {/* Technical IP & UserAgent Badges */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      {log.ipAddress && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/50 border border-white/[0.05]">
                          <Globe className="w-3 h-3 text-slate-400" />
                          {log.ipAddress}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metadata Details Bar & Toggle Button */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="pt-2 border-t border-white/[0.05] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Quick metadata badges */}
                      {log.metadata.fileName && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/60 border border-white/[0.08] text-[11px] font-mono text-slate-300 flex items-center gap-1">
                          <File className="w-3 h-3 text-pink-400" />
                          {log.metadata.fileName}
                        </span>
                      )}
                      {log.metadata.size && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/60 border border-white/[0.08] text-[11px] font-mono text-slate-300">
                          {formatBytes(log.metadata.size)}
                        </span>
                      )}
                      {log.metadata.folderName && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/60 border border-white/[0.08] text-[11px] font-mono text-cyan-300 flex items-center gap-1">
                          <Folder className="w-3 h-3 text-cyan-400" />
                          {log.metadata.folderName}
                        </span>
                      )}
                      {log.metadata.email && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/60 border border-white/[0.08] text-[11px] font-mono text-emerald-300">
                          {log.metadata.email}
                        </span>
                      )}
                      {log.metadata.role && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/60 border border-white/[0.08] text-[11px] font-mono text-purple-300">
                          Role: {log.metadata.role}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => copyMetadata(log.id, log.metadata)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/60 hover:bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 border border-white/[0.06] transition cursor-pointer"
                        title="Copy raw JSON payload"
                      >
                        {copiedId === log.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/60 hover:bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 border border-white/[0.06] transition cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Raw' : 'View Raw'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded Raw JSON View */}
                {isExpanded && log.metadata && (
                  <div className="p-3 bg-slate-950/90 border border-white/[0.08] rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto">
                    <pre className="whitespace-pre-wrap leading-relaxed">{JSON.stringify(log.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Toolbar: Load More & Show Less */}
          {filteredLogs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-white/[0.08] backdrop-blur-md shadow-xl mt-4">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                <span>
                  Showing <span className="font-bold text-white font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">{displayedLogs.length}</span> of{' '}
                  <span className="font-bold text-white font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-white/[0.08]">{filteredLogs.length}</span> activity logs
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {visibleCount < filteredLogs.length && (
                  <button
                    onClick={() => setVisibleCount((prev) => Math.min(prev + 15, filteredLogs.length))}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black transition shadow-lg shadow-purple-600/25 active:scale-95 cursor-pointer border border-white/10"
                  >
                    <span>Load More (+15 Logs)</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}

                {visibleCount < filteredLogs.length && (
                  <button
                    onClick={() => setVisibleCount(filteredLogs.length)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition active:scale-95 cursor-pointer border border-white/[0.08]"
                  >
                    <span>Show All ({filteredLogs.length})</span>
                  </button>
                )}

                {visibleCount > 15 && (
                  <button
                    onClick={() => {
                      setVisibleCount(15);
                      window.scrollTo({ top: 200, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-white/[0.08] active:scale-95 cursor-pointer"
                  >
                    <span>Show Less (Collapse)</span>
                    <ChevronUp className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  User,
  Shield,
  Clock,
  Terminal,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { formatDateTime } from '../../utils/formatters';

export const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getLogs({
        action: actionFilter || undefined,
        limit: 100,
      });
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('DELETE')) return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    if (action.includes('UPLOAD') || action.includes('CREATE'))
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (action.includes('ADMIN')) return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    if (action.includes('LOGIN') || action.includes('LOGOUT'))
      return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Activity className="w-7 h-7 text-purple-400" />
          Audit & Activity Logs
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Detailed security trail and operation events across the system
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Filter by action name (e.g. LOGIN, FILE_UPLOAD)..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {['', 'LOGIN', 'FILE_UPLOAD', 'FILE_DELETE', 'ADMIN'].map((act) => (
            <button
              key={act || 'all'}
              onClick={() => setActionFilter(act)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                actionFilter === act
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {act || 'All Actions'}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Stream */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-14 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="p-8 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl text-center text-slate-400 text-sm">
          No activity logs match the current filter.
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-800/60">
          {logs.map((log) => (
            <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start sm:items-center gap-3">
                <span
                  className={`font-mono font-bold px-2.5 py-1 rounded-md border text-xs shrink-0 ${getActionBadgeColor(
                    log.action
                  )}`}
                >
                  {log.action}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {log.user ? `${log.user.name} (@${log.user.username})` : 'Anonymous / System'}
                    </span>
                    {log.ipAddress && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({log.ipAddress})
                      </span>
                    )}
                  </div>
                  {log.metadata && (
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {JSON.stringify(log.metadata)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-slate-500 shrink-0 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                {formatDateTime(log.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

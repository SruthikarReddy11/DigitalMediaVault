import React, { useState, useEffect } from 'react';
import { Eye, Download, Play, Clock, Globe, Shield, RefreshCw } from 'lucide-react';
import { Modal } from '../common/Modal';
import { shareApi } from '../../services/shareApi';
import { ShareAccessLogItem } from '../../types';
import { formatDetailedDateTime } from '../../utils/formatters';

interface ShareAccessLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareLinkId: string;
  shareTitle?: string;
  shareToken?: string;
}

export const ShareAccessLogsModal: React.FC<ShareAccessLogsModalProps> = ({
  isOpen,
  onClose,
  shareLinkId,
  shareTitle,
  shareToken,
}) => {
  const [logs, setLogs] = useState<ShareAccessLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadLogs = async () => {
    if (!shareLinkId) return;
    setLoading(true);
    try {
      const data = await shareApi.getShareLogs(shareLinkId);
      setLogs(data.logs);
    } catch (err) {
      console.error('Failed to load share logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen, shareLinkId]);

  const viewCount = logs.filter((l) => l.action === 'VIEW').length;
  const downloadCount = logs.filter((l) => l.action === 'DOWNLOAD').length;
  const streamCount = logs.filter((l) => l.action === 'STREAM').length;

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'VIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Eye className="w-3 h-3" />
            <span>Viewed</span>
          </span>
        );
      case 'DOWNLOAD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Download className="w-3 h-3" />
            <span>Downloaded</span>
          </span>
        );
      case 'STREAM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Play className="w-3 h-3" />
            <span>Streamed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
            {action}
          </span>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Link Audit & Visitor Logs"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <div>
            <div className="text-xs text-slate-400 font-medium">Tracking Link:</div>
            <div className="text-sm font-bold text-white truncate max-w-md">
              {shareTitle || 'Shared Item'}
            </div>
            {shareToken && (
              <div className="text-[11px] font-mono text-brand-400">/share/{shareToken}</div>
            )}
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="text-center px-2 py-1 bg-slate-900 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Views</div>
              <div className="text-sm font-bold text-blue-400">{viewCount}</div>
            </div>
            <div className="text-center px-2 py-1 bg-slate-900 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Downloads</div>
              <div className="text-sm font-bold text-emerald-400">{downloadCount}</div>
            </div>
            <div className="text-center px-2 py-1 bg-slate-900 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Streams</div>
              <div className="text-sm font-bold text-purple-400">{streamCount}</div>
            </div>

            <button
              onClick={loadLogs}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="space-y-2 py-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-900/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 rounded-2xl bg-slate-950/40 border border-slate-800">
            <Globe className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-300">No visitors recorded yet</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Access logs will appear here when someone views or downloads your shared link.
            </p>
          </div>
        ) : (
          <div className="max-h-[380px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-3.5 py-2.5">Action</th>
                  <th className="px-3.5 py-2.5">IP Address</th>
                  <th className="px-3.5 py-2.5">Device / Browser</th>
                  <th className="px-3.5 py-2.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                {logs.map((log) => {
                  const dateInfo = formatDetailedDateTime(log.createdAt);
                  return (
                    <tr key={log.id} className="hover:bg-slate-900/50 transition">
                      <td className="px-3.5 py-2.5">{getActionBadge(log.action)}</td>
                      <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-400">
                        {log.ipAddress || 'Unknown IP'}
                      </td>
                      <td className="px-3.5 py-2.5 max-w-[200px] truncate text-slate-400 text-[11px]" title={log.userAgent || ''}>
                        {log.userAgent || 'Web Browser'}
                      </td>
                      <td className="px-3.5 py-2.5 text-right text-slate-400 font-mono text-[11px]">
                        {dateInfo.full}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};

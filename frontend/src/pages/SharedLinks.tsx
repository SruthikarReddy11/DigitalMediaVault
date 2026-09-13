import React, { useState, useEffect, useMemo } from 'react';
import {
  Share2,
  Copy,
  Check,
  QrCode,
  Eye,
  Download,
  Lock,
  Clock,
  RotateCcw,
  Trash2,
  Shield,
  FileText,
  Folder as FolderIcon,
  Search,
  Filter,
  BarChart3,
  ExternalLink,
  RefreshCw,
  ShoppingBag,
  Layers,
} from 'lucide-react';
import { shareApi } from '../services/shareApi';
import { ShareLinkItem } from '../types';
import { formatDateTime } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { QRCodeDisplayModal } from '../components/share/QRCodeDisplay';
import { ShareAccessLogsModal } from '../components/share/ShareAccessLogsModal';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const SharedLinks: React.FC = () => {
  const { success, error } = useToast();

  const [shares, setShares] = useState<ShareLinkItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'revoked'>('all');

  // Modals
  const [qrModal, setQrModal] = useState<{
    isOpen: boolean;
    title: string;
    shareUrl: string;
    qrDataUrl: string;
  }>({
    isOpen: false,
    title: '',
    shareUrl: '',
    qrDataUrl: '',
  });

  const [logsModal, setLogsModal] = useState<{
    isOpen: boolean;
    shareLinkId: string;
    title: string;
    token: string;
  }>({
    isOpen: false,
    shareLinkId: '',
    title: '',
    token: '',
  });

  const [deleteTarget, setDeleteTarget] = useState<ShareLinkItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadShares = async () => {
    setLoading(true);
    try {
      const data = await shareApi.getMyShares();
      setShares(data);
    } catch (err) {
      console.error('Failed to load share links:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShares();
  }, []);

  const handleCopy = async (token: string, id: string) => {
    const url = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      success('Link copied to clipboard!');
    } catch (err) {
      error('Failed to copy link.');
    }
  };

  const handleOpenQr = async (link: ShareLinkItem) => {
    try {
      const res = await shareApi.getQrCode(link.token);
      setQrModal({
        isOpen: true,
        title: link.title || link.file?.originalName || link.folder?.name || 'Shared Item',
        shareUrl: res.shareUrl || `${window.location.origin}/share/${link.token}`,
        qrDataUrl: res.qrDataUrl,
      });
    } catch (err) {
      error('Failed to generate QR code.');
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await shareApi.revokeShare(id);
      success('Share link revoked.');
      loadShares();
    } catch (err: any) {
      error(err.message || 'Failed to revoke link.');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await shareApi.restoreShare(id);
      success('Share link restored.');
      loadShares();
    } catch (err: any) {
      error(err.message || 'Failed to restore link.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await shareApi.deleteShare(deleteTarget.id);
      success('Share link deleted permanently.');
      setDeleteTarget(null);
      loadShares();
    } catch (err: any) {
      error(err.message || 'Failed to delete link.');
    }
  };

  // Filtered links
  const filteredShares = useMemo(() => {
    return shares.filter((link) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = link.title?.toLowerCase().includes(q);
        const matchesToken = link.token.toLowerCase().includes(q);
        const matchesFile = link.file?.originalName.toLowerCase().includes(q);
        const matchesFolder = link.folder?.name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesToken && !matchesFile && !matchesFolder) return false;
      }

      // Status
      if (statusFilter === 'active' && (link.isRevoked || link.isExpired)) return false;
      if (statusFilter === 'expired' && !link.isExpired) return false;
      if (statusFilter === 'revoked' && !link.isRevoked) return false;

      return true;
    });
  }, [shares, searchQuery, statusFilter]);

  // Overall stats
  const totalViews = useMemo(() => shares.reduce((acc, s) => acc + s.viewCount, 0), [shares]);
  const totalDownloads = useMemo(() => shares.reduce((acc, s) => acc + s.downloadCount, 0), [shares]);
  const activeCount = useMemo(() => shares.filter((s) => !s.isRevoked && !s.isExpired).length, [shares]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-brand-500/20 to-indigo-500/10 border border-brand-500/30 text-brand-400 shadow-lg shadow-brand-500/10">
              <Share2 className="w-6 h-6 sm:w-7 h-7" />
            </div>
            <span>Shared Links</span>
            {shares.length > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                {shares.length} {shares.length === 1 ? 'link' : 'links'}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your secure public links, track visitor views and downloads, or revoke links anytime.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadShares}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white text-xs sm:text-sm font-bold border border-white/10 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {shares.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
            <div className="text-xs text-slate-400 font-medium">Total Shared Links</div>
            <div className="text-2xl font-black text-white mt-1">{shares.length}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
            <div className="text-xs text-emerald-400 font-medium">Active Links</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
            <div className="text-xs text-blue-400 font-medium">Total Visitor Views</div>
            <div className="text-2xl font-black text-blue-400 mt-1">{totalViews}</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
            <div className="text-xs text-purple-400 font-medium">Total Downloads</div>
            <div className="text-2xl font-black text-purple-400 mt-1">{totalDownloads}</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      {shares.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 backdrop-blur-md">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by link title, token, or file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer pr-2"
            >
              <option value="all" className="bg-slate-900 text-white">All Statuses</option>
              <option value="active" className="bg-slate-900 text-white">Active Only</option>
              <option value="expired" className="bg-slate-900 text-white">Expired</option>
              <option value="revoked" className="bg-slate-900 text-white">Revoked</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Links Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-900/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : shares.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="No shared links yet"
          description="Click the Share button on any file or folder to generate secure public links."
        />
      ) : filteredShares.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Search className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No matching links found</h3>
          <p className="text-xs text-slate-400 mt-1">Try changing your search query or filter.</p>
        </div>
      ) : (
        /* Links Table / Card Container */
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Shared Item & Title</th>
                  <th className="px-4 py-3.5">Share Link</th>
                  <th className="px-4 py-3.5">Status & Expiration</th>
                  <th className="px-4 py-3.5">Protection</th>
                  <th className="px-4 py-3.5">Activity</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredShares.map((link) => {
                  const isCopied = copiedId === link.id;
                  const itemTitle = link.title || link.productSection?.name || link.product?.title || link.file?.originalName || link.folder?.name || 'Item';

                  return (
                    <tr
                      key={link.id}
                      className="hover:bg-slate-800/50 transition duration-150 group"
                    >
                      {/* Shared Item Title */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3 max-w-xs">
                          <div className="p-2 rounded-lg bg-slate-800 text-brand-400 shrink-0">
                            {link.productSection ? (
                              <Layers className="w-4 h-4 text-indigo-400" />
                            ) : link.product ? (
                              <ShoppingBag className="w-4 h-4 text-emerald-400" />
                            ) : link.folder ? (
                              <FolderIcon className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate" title={itemTitle}>
                              {itemTitle}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Created {formatDateTime(link.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Share Link Slug */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-brand-400">
                          <span>/share/{link.token}</span>
                          <button
                            onClick={() => handleCopy(link.token, link.id)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                            title="Copy link"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status & Expiry */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          {link.isRevoked ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Revoked
                            </span>
                          ) : link.isExpired ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Expired
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Active
                            </span>
                          )}

                          <div className="text-[10px] text-slate-400">
                            {link.expiresAt
                              ? `Expires ${formatDateTime(link.expiresAt)}`
                              : 'Never expires'}
                          </div>
                        </div>
                      </td>

                      {/* Protection (Password & Downloads) */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 text-[11px]">
                          {link.hasPassword ? (
                            <span className="flex items-center gap-1 text-amber-400 font-semibold">
                              <Lock className="w-3 h-3" />
                              <span>Password</span>
                            </span>
                          ) : (
                            <span className="text-slate-500">Public (No pwd)</span>
                          )}

                          <span className="text-slate-400 text-[10px]">
                            {link.allowDownload ? 'Downloads ON' : 'View-only'}
                          </span>
                        </div>
                      </td>

                      {/* Activity (Views & Downloads) */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-0.5 text-[11px]">
                          <div className="flex items-center gap-1 text-blue-400 font-semibold">
                            <Eye className="w-3 h-3" />
                            <span>{link.viewCount} views</span>
                          </div>
                          <div className="flex items-center gap-1 text-purple-400 font-semibold">
                            <Download className="w-3 h-3" />
                            <span>
                              {link.downloadCount}
                              {link.maxDownloads ? `/${link.maxDownloads}` : ''} dl
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* QR Code */}
                          <button
                            onClick={() => handleOpenQr(link)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-400 transition cursor-pointer"
                            title="Show QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Audit Logs */}
                          <button
                            onClick={() =>
                              setLogsModal({
                                isOpen: true,
                                shareLinkId: link.id,
                                title: itemTitle,
                                token: link.token,
                              })
                            }
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition cursor-pointer"
                            title="Visitor Audit Logs"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>

                          {/* Revoke / Restore */}
                          {link.isRevoked ? (
                            <button
                              onClick={() => handleRestore(link.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 transition cursor-pointer"
                              title="Restore Link"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRevoke(link.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                              title="Revoke Link"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          )}

                          {/* Open external */}
                          <a
                            href={`${window.location.origin}/share/${link.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Open Link in New Tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget(link)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeDisplayModal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal((prev) => ({ ...prev, isOpen: false }))}
        title={qrModal.title}
        shareUrl={qrModal.shareUrl}
        qrDataUrl={qrModal.qrDataUrl}
      />

      {/* Audit Logs Modal */}
      <ShareAccessLogsModal
        isOpen={logsModal.isOpen}
        onClose={() => setLogsModal((prev) => ({ ...prev, isOpen: false }))}
        shareLinkId={logsModal.shareLinkId}
        shareTitle={logsModal.title}
        shareToken={logsModal.token}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Share Link"
        message={`Are you sure you want to delete the share link for "${deleteTarget?.title || deleteTarget?.file?.originalName || deleteTarget?.folder?.name}"? The link will immediately stop working.`}
        confirmText="Delete Link"
        isDangerous
      />
    </div>
  );
};

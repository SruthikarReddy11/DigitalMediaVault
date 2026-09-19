import React, { useState } from 'react';
import {
  X,
  Building2,
  RefreshCw,
  Trash2,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';
import { ConnectedAccount, bankSyncApi } from '../../services/bankSyncApi';
import { useToast } from '../../contexts/ToastContext';

interface ConnectedBanksModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: ConnectedAccount[];
  onRefresh: () => Promise<void>;
  onOpenLinkModal: () => void;
}

export const ConnectedBanksModal: React.FC<ConnectedBanksModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onRefresh,
  onOpenLinkModal,
}) => {
  const { success, error } = useToast();
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const res = await bankSyncApi.syncTransactions();
      success(
        res.syncedCount > 0
          ? `Synced ${res.syncedCount} new transactions from your bank!`
          : 'All bank transactions are already up to date.'
      );
      await onRefresh();
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to sync bank accounts');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async (id: string, bankName: string) => {
    if (!window.confirm(`Are you sure you want to unlink ${bankName}? Existing synced transactions will remain.`)) {
      return;
    }

    setDisconnectingId(id);
    try {
      await bankSyncApi.disconnectAccount(id);
      success(`${bankName} unlinked`);
      await onRefresh();
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to unlink account');
    } finally {
      setDisconnectingId(null);
    }
  };

  const activeAccounts = accounts.filter((a) => a.consentStatus === 'ACTIVE');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Connected Bank Accounts
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                  {activeAccounts.length} Linked
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Automated transaction feeds via RBI Account Aggregator
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {activeAccounts.length === 0 ? (
            <div className="py-10 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-white/5">
              <Building2 className="w-10 h-10 text-slate-500 mx-auto opacity-50" />
              <div>
                <h4 className="text-sm font-bold text-white">No Connected Banks</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Link your bank account to automatically import transactions without any manual entry.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLinkModal();
                }}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Link Bank Account Now
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs">
                      {acc.bankName.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{acc.bankName}</h4>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Active
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {acc.accountNumberMask} &bull; {acc.accountType}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Last synced:{' '}
                        {acc.lastSyncedAt
                          ? new Date(acc.lastSyncedAt).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Never'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    title="Unlink Account"
                    disabled={disconnectingId === acc.id}
                    onClick={() => handleDisconnect(acc.id, acc.bankName)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-40"
                  >
                    {disconnectingId === acc.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLinkModal();
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Link Another Bank
            </button>

            {activeAccounts.length > 0 && (
              <button
                type="button"
                onClick={handleSyncAll}
                disabled={isSyncing}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing Feeds...' : 'Sync All Bank Feeds'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, KeyRound, Copy, Check, ArrowRight, Smartphone, RefreshCw } from 'lucide-react';
import { vaultApi } from '../../services/vaultApi';
import { TwoFactorSetup } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface VaultGateModalProps {
  isOpen: boolean;
  onUnlock: () => void;
  onClose?: () => void;
}

export const VaultGateModal: React.FC<VaultGateModalProps> = ({ isOpen, onUnlock, onClose }) => {
  const { success, error } = useToast();

  const [has2FA, setHas2FA] = useState<boolean | null>(null);
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const checkStatus = async () => {
      setIsChecking(true);
      try {
        const res = await vaultApi.get2FAStatus();
        setHas2FA(res.enabled);
        if (!res.enabled) {
          const setup = await vaultApi.setup2FA();
          setSetupData(setup);
        }
      } catch (err: any) {
        error(err.response?.data?.error?.message || 'Failed to check Google Authenticator status.');
      } finally {
        setIsChecking(false);
      }
    };

    checkStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      error('Please enter a 6-digit code.');
      return;
    }

    setIsLoading(true);
    try {
      await vaultApi.verify2FA(cleanCode);
      success('Secret Vault Unlocked!');
      setCode('');
      onUnlock();
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Invalid 6-digit code. Please check your app.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopiedKey(true);
    success('Secret setup key copied to clipboard!');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {isChecking ? (
          <div className="py-12 space-y-4">
            <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Verifying Security Protocols...</p>
          </div>
        ) : has2FA ? (
          /* Locked State: Enter 6-digit Authenticator Code */
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30 shadow-lg shadow-amber-500/10">
              <KeyRound className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Secret Vault Gate
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Open your <strong>Google Authenticator</strong> app on your device and enter the 6-digit code to open this space.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4 pt-2">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-56 text-center tracking-[0.5em] font-mono text-3xl font-extrabold bg-slate-950 border-2 border-slate-700 focus:border-brand-500 text-brand-400 rounded-2xl py-3 mx-auto block focus:outline-none transition shadow-inner"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || code.length !== 6}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold rounded-2xl transition shadow-lg shadow-brand-600/30 text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Unlock Space</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 text-left space-y-0.5">
              <p className="font-semibold text-slate-300">🛡️ Immediate Auto-Lock Policy</p>
              <p>
                Closing or navigating away from this space automatically locks it within 1 second for maximum confidentiality.
              </p>
            </div>
          </div>
        ) : (
          /* First Time Setup: Link Google Authenticator */
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
              <Smartphone className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Link Google Authenticator
              </h2>
              <p className="text-xs text-slate-400">
                To create and access your Secret Vault Space, link your smartphone authenticator
              </p>
            </div>

            {setupData && (
              <div className="space-y-4">
                {/* QR Code Container */}
                <div className="p-3 bg-white rounded-2xl w-fit mx-auto shadow-2xl border-4 border-slate-800">
                  <img
                    src={setupData.qrCodeDataUrl}
                    alt="Scan Google Authenticator QR Code"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                </div>

                {/* Manual Secret Key */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 truncate mr-2 select-all font-semibold">
                    {setupData.secret}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
                    title="Copy Secret Key"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* 3 Step Guide */}
                <div className="text-left text-xs text-slate-400 space-y-1 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <p className="font-semibold text-slate-300">How to setup:</p>
                  <p>1. Open the <strong>Google Authenticator</strong> app on your smartphone.</p>
                  <p>2. Tap <strong>+</strong> and scan this QR code (or paste the key).</p>
                  <p>3. Enter the 6-digit code shown in the app below to activate:</p>
                </div>

                {/* Verification input */}
                <form onSubmit={handleVerify} className="space-y-3 pt-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="w-full text-center tracking-[0.4em] font-mono text-xl font-bold bg-slate-950 border border-slate-700 focus:border-brand-500 text-brand-400 rounded-xl py-2.5 focus:outline-none transition shadow-inner"
                  />

                  <button
                    type="submit"
                    disabled={isLoading || code.length !== 6}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition shadow-lg shadow-brand-600/30 text-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Activate & Open Secret Vault</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

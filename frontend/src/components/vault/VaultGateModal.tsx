import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  ArrowRight,
  Smartphone,
  RefreshCw,
  ArrowLeft,
  Lock,
} from 'lucide-react';
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

  const inputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (isOpen && !isChecking) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    }
  }, [isOpen, isChecking, has2FA]);

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

  const handleReset2FA = async () => {
    setIsChecking(true);
    try {
      const setup = await vaultApi.setup2FA();
      setSetupData(setup);
      setHas2FA(false);
      setCode('');
      success('Scan the new QR code in your Google Authenticator app.');
    } catch (err: any) {
      error(err.response?.data?.error?.message || 'Failed to re-link Google Authenticator.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center relative overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Go Back Button (Top Left) */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-semibold flex items-center gap-1.5 border border-slate-700/60 shadow-sm active:scale-95"
            title="Go back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
        )}

        {isChecking ? (
          <div className="py-12 space-y-4">
            <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Checking Authenticator status...</p>
          </div>
        ) : has2FA ? (
          /* Locked State: Clean, Simple 6-Digit PIN Entry */
          <div className="space-y-5 pt-2">
            {/* Simple Neat Shield Badge */}
            <div className="w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/30 text-brand-400 flex items-center justify-center mx-auto shadow-inner">
              <KeyRound className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Secret Vault Verification
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Enter the 6-digit code from your <strong>Google Authenticator</strong> app.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-5 pt-2">
              {/* Hidden Master Input */}
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer pointer-events-none -z-10"
              />

              {/* 6 Neat, Modern Digit Boxes */}
              <div
                onClick={() => inputRef.current?.focus()}
                className="flex items-center justify-center gap-2 sm:gap-2.5 py-1 cursor-pointer"
                title="Click to type code"
              >
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const digit = code[index];
                  const isCurrent = code.length === index;
                  const isFilled = digit !== undefined;

                  return (
                    <div
                      key={index}
                      className={`relative w-11 h-14 sm:w-12 sm:h-15 rounded-2xl flex items-center justify-center font-mono text-2xl font-bold transition-all duration-150 select-none ${
                        isFilled
                          ? 'bg-slate-950 border-2 border-brand-500 text-white shadow-sm'
                          : isCurrent
                          ? 'bg-slate-950 border-2 border-brand-400 ring-4 ring-brand-500/15 text-brand-400 scale-105'
                          : 'bg-slate-950/80 border border-slate-800 text-slate-600'
                      }`}
                    >
                      {isFilled ? (
                        <span className="animate-in zoom-in-75 duration-100">{digit}</span>
                      ) : isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={isLoading || code.length !== 6}
                  className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-2xl transition shadow-lg shadow-brand-600/25 text-sm flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Unlock Vault</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-200 transition font-medium"
                  >
                    Cancel & Return to Library
                  </button>
                )}

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={handleReset2FA}
                    className="text-xs text-slate-400 hover:text-brand-400 transition underline underline-offset-4"
                  >
                    Code not working? Re-link Google Authenticator
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          /* First Time Setup: Simple, Clean QR Code Linking */
          <div className="space-y-4 pt-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
              <Smartphone className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Setup Google Authenticator
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Scan the QR code with your authenticator app to enable 2FA:
              </p>
            </div>

            {setupData && (
              <div className="space-y-4">
                {/* QR Code */}
                <div className="p-3 bg-white rounded-2xl w-fit mx-auto shadow-lg border border-slate-700">
                  <img
                    src={setupData.qrCodeDataUrl}
                    alt="Scan Google Authenticator QR Code"
                    className="w-40 h-40 object-contain rounded-lg"
                  />
                </div>

                {/* Secret Key with Copy */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 truncate mr-2 select-all font-semibold">
                    {setupData.secret}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shrink-0 active:scale-95"
                    title="Copy Key"
                  >
                    {copiedKey ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Verification form */}
                <form onSubmit={handleVerify} className="space-y-3 pt-1">
                  {/* Hidden Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer pointer-events-none -z-10"
                  />

                  {/* 6 Digit Boxes */}
                  <div
                    onClick={() => inputRef.current?.focus()}
                    className="flex items-center justify-center gap-2 py-1 cursor-pointer"
                  >
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                      const digit = code[index];
                      const isCurrent = code.length === index;
                      const isFilled = digit !== undefined;

                      return (
                        <div
                          key={index}
                          className={`relative w-10 h-13 rounded-xl flex items-center justify-center font-mono text-xl font-bold transition-all ${
                            isFilled
                              ? 'bg-slate-950 border-2 border-brand-500 text-white shadow-sm'
                              : isCurrent
                              ? 'bg-slate-950 border-2 border-brand-400 ring-2 ring-brand-500/20 text-brand-400 scale-105'
                              : 'bg-slate-950/80 border border-slate-800 text-slate-600'
                          }`}
                        >
                          {isFilled ? digit : isCurrent ? <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" /> : '-'}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || code.length !== 6}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition shadow-lg shadow-brand-600/25 text-xs flex items-center justify-center gap-2 active:scale-98 disabled:opacity-40"
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Verify & Unlock Vault</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-1 text-xs text-slate-400 hover:text-slate-200 transition font-medium"
                    >
                      Go Back to Library
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

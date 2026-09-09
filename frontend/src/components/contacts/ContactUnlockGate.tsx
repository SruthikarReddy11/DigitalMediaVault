import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { contactsApi } from '../../services/contactsApi';
import { useToast } from '../../contexts/ToastContext';

interface ContactUnlockGateProps {
  onUnlocked: () => void;
}

export const ContactUnlockGate: React.FC<ContactUnlockGateProps> = ({ onUnlocked }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { success } = useToast();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await contactsApi.unlock(password);
      success('Contacts vault unlocked successfully');
      onUnlocked();
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message ||
        err.message ||
        'Incorrect password. Access denied.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md relative">
        {/* Glow Effects */}
        <div className="absolute -top-16 -left-16 w-56 h-56 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/50 text-center space-y-7">
          {/* Padlock Stage */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 to-indigo-500/30 rounded-3xl blur-xl animate-pulse" />
            <div className="relative w-full h-full rounded-3xl bg-slate-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Lock className="w-9 h-9" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg border border-white/20">
              <KeyRound className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Password Protected Area</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Secure Contacts & Phone Vault
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              This directory contains encrypted phone numbers, identity details, and contact cells. Enter your account password to decrypt and open access.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Account Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Enter your password..."
                  disabled={isLoading}
                  autoFocus
                  className="w-full px-4 py-3.5 bg-slate-950/70 border border-white/10 focus:border-cyan-500/60 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 animate-shake">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-sm font-bold rounded-2xl shadow-xl shadow-cyan-600/25 border border-white/20 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Password...</span>
                </>
              ) : (
                <>
                  <span>Unlock Phone Vault</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Notice */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Encrypted with bank-grade zero-leak bcrypt protection</span>
          </div>
        </div>
      </div>
    </div>
  );
};

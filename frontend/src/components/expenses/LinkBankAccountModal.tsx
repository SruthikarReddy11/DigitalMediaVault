import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Phone,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import {
  bankSyncApi,
  BankFIP,
  InitiateConsentResponse,
  LinkedAccountItem,
} from '../../services/bankSyncApi';
import { useToast } from '../../contexts/ToastContext';

interface LinkBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LinkBankAccountModal: React.FC<LinkBankAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { success, error } = useToast();

  const [step, setStep] = useState<'bank_and_phone' | 'otp' | 'success'>('bank_and_phone');
  const [banks, setBanks] = useState<BankFIP[]>([]);
  const [selectedBank, setSelectedBank] = useState<BankFIP | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [consentData, setConsentData] = useState<InitiateConsentResponse | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccountItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load supported banks on modal open
  useEffect(() => {
    if (isOpen) {
      setStep('bank_and_phone');
      setOtp('');
      loadBanks();
    }
  }, [isOpen]);

  const loadBanks = async () => {
    try {
      const list = await bankSyncApi.getSupportedBanks();
      setBanks(list);
      if (list.length > 0 && !selectedBank) {
        setSelectedBank(list[0]);
      }
    } catch (e: any) {
      console.error('Failed to load banks:', e);
    }
  };

  if (!isOpen) return null;

  // Step 1: Submit Bank & Mobile Number to Initiate Consent
  const handleInitiateConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank) {
      error('Please select your bank');
      return;
    }
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      error('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    try {
      const res = await bankSyncApi.initiateConsent(cleanMobile, selectedBank.fipId);
      setConsentData(res);
      setStep('otp');
      success(`OTP sent to +91 ${cleanMobile}`);
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to request consent');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentData) return;

    if (!otp || otp.trim().length < 4) {
      error('Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const res = await bankSyncApi.verifyConsent(consentData.consentHandle, otp, selectedBank?.fipId || 'HDFC-FIP');
      setLinkedAccounts(res.linkedAccounts);
      setStep('success');
      success('Bank account linked and synchronized successfully!');
      onSuccess();
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Link Bank Account
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  RBI Account Aggregator
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Direct automated transaction sync with zero manual typing
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

        {/* Content Body */}
        <div className="p-6">
          {/* STEP 1: SELECT BANK & MOBILE NUMBER */}
          {step === 'bank_and_phone' && (
            <form onSubmit={handleInitiateConsent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Select Your Bank
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {banks.map((b) => {
                    const isSelected = selectedBank?.fipId === b.fipId;
                    return (
                      <button
                        key={b.fipId}
                        type="button"
                        onClick={() => setSelectedBank(b)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? 'bg-brand-600/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                            : 'bg-slate-950/60 border-white/5 text-slate-300 hover:border-white/20 hover:bg-slate-800/40'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-[10px] mb-2 shadow"
                          style={{ backgroundColor: b.logoColor }}
                        >
                          {b.code}
                        </div>
                        <span className="text-xs font-semibold leading-tight line-clamp-1">
                          {b.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mobile Number Registered with Bank
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-xs">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  You will receive an official Bank/AA verification OTP on this number.
                </p>
              </div>

              {/* Security Guarantee Banner */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-300 leading-relaxed">
                  <strong className="text-white">Bank-Grade Encryption</strong>: Regulated under RBI's Account Aggregator (AA) framework. We never ask for, view, or store your net banking passwords or PINs.
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Request Consent OTP
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 mx-auto flex items-center justify-center mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  Enter Verification OTP
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sent to <strong className="text-white">+91 {consentData?.mobileNumber}</strong> for {consentData?.bankName}
                </p>
              </div>

              {/* Simulator Hint Pill */}
              {consentData?.mockOtpNotice && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 text-center justify-center font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{consentData.mockOtpNotice}</span>
                </div>
              )}

              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.5em] py-3 bg-slate-950/90 border border-white/10 rounded-xl text-white font-mono text-lg focus:outline-none focus:border-brand-500 transition-all"
                />
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep('bank_and_phone')}
                  className="text-xs text-slate-400 hover:text-white transition-all"
                >
                  ← Change Number
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Approve &amp; Link
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS & SYNCED */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">
                  Bank Linked &amp; Synchronized!
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Your bank transactions have been fetched and automatically categorized into your Expense Tracker dashboard.
                </p>
              </div>

              {linkedAccounts.length > 0 && (
                <div className="bg-slate-950/60 border border-white/10 rounded-xl p-3 text-left max-w-sm mx-auto space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Connected Accounts
                  </span>
                  {linkedAccounts.map((acc) => (
                    <div key={acc.id} className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{acc.bankName}</span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {acc.accountNumberMask} ({acc.accountType})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all"
                >
                  View My Synced Transactions
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

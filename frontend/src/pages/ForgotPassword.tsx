import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  Mail,
  Calendar,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { authApi } from '../services/authApi';
import { useToast } from '../contexts/ToastContext';
import { Logo3D } from '../components/common/Logo3D';

type ResetStep = 'account' | 'verification' | 'new_password' | 'success';

export const ForgotPassword: React.FC = () => {
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<ResetStep>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Account
  const [identifier, setIdentifier] = useState('');
  const [accountInfo, setAccountInfo] = useState<{
    identifier: string;
    name: string;
    hasDob: boolean;
    hasMobile: boolean;
  } | null>(null);

  // Step 2: Verification
  const [dob, setDob] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Step 3: New Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // STEP 1: Lookup Account
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await authApi.forgotPasswordChallenge(identifier.trim());
      setAccountInfo(data);
      setStep('verification');
      success('Account identified. Please verify your details.');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Account not found.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify DOB & 10-Digit Mobile Number
  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob || !mobileNumber.trim()) {
      setErrorMessage('Please fill in both Date of Birth and 10-digit Mobile Number.');
      return;
    }

    // Clean any spaces or dashes from the user input
    const cleanPhone = mobileNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter exactly 10 digits for your mobile number (excluding +91).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await authApi.forgotPasswordVerify({
        identifier: identifier.trim(),
        dob,
        mobileNumber: cleanPhone,
      });

      setResetToken(data.resetToken);
      setStep('new_password');
      success('Identity verified! Please set your new password.');
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.message ||
        'The date of birth or mobile number does not match our records.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (!resetToken) {
      setErrorMessage('Reset session expired. Please start over.');
      setStep('account');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await authApi.forgotPasswordConfirm({
        resetToken,
        newPassword,
      });

      setStep('success');
      success('Password reset successfully!');
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to reset password. Please try again.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-brand-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header / Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="flex justify-center mb-4">
          <Logo3D size="lg" to="/" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Reset Your Password
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Verify your saved profile identity to regain access to your vault
        </p>
      </div>

      {/* Card Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl shadow-2xl space-y-6">

          {/* Progress Indicators */}
          {step !== 'success' && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    step === 'account'
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {step !== 'account' ? '✓' : '1'}
                </span>
                <span className={`text-xs font-semibold ${step === 'account' ? 'text-white' : 'text-slate-400'}`}>
                  Account
                </span>
              </div>

              <div className="w-8 h-0.5 bg-slate-800" />

              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    step === 'verification'
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : step === 'new_password'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {step === 'new_password' ? '✓' : '2'}
                </span>
                <span className={`text-xs font-semibold ${step === 'verification' ? 'text-white' : 'text-slate-400'}`}>
                  Verify
                </span>
              </div>

              <div className="w-8 h-0.5 bg-slate-800" />

              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    step === 'new_password'
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  3
                </span>
                <span className={`text-xs font-semibold ${step === 'new_password' ? 'text-white' : 'text-slate-400'}`}>
                  Password
                </span>
              </div>
            </div>
          )}

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Find Account */}
          {step === 'account' && (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter Your Username or Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="e.g. sruthikar or your.email@example.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  We'll search for your account and challenge your saved profile details.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !identifier.trim()}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-brand-600/25 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Continue to Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Verify DOB & 10-Digit Mobile */}
          {step === 'verification' && (
            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              {/* Account Identified Notice */}
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block">Identified Account</span>
                  <strong className="text-white text-sm">{accountInfo?.name || identifier}</strong>
                  <span className="text-slate-400 text-xs ml-1 font-mono">(@{accountInfo?.identifier})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('account');
                    setErrorMessage(null);
                  }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-200 underline font-semibold"
                >
                  Change
                </button>
              </div>

              {/* Date of Birth Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => {
                      setDob(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none transition [color-scheme:dark]"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter the birth date saved in your Vault profile.
                </p>
              </div>

              {/* 10-Digit Mobile Number Field (No country code) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  10-Digit Mobile Number <span className="text-slate-500 font-normal">(without +91)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      setMobileNumber(digitsOnly);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 font-mono focus:outline-none transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Enter only 10 digits. Country codes (+91) are excluded.</span>
                  <span className="font-mono text-[10px] text-slate-400">{mobileNumber.length}/10</span>
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setStep('account');
                    setErrorMessage(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !dob || mobileNumber.length !== 10}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-brand-600/25 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Verify Identity</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: New Password */}
          {step === 'new_password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <strong className="block font-bold">Identity Confirmed</strong>
                  <span className="text-emerald-200/80 text-[11px]">
                    Create a strong new password for your vault account.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-200 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Minimum 6 characters.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none transition"
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-rose-400 mt-1">Passwords do not match.</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Passwords match!</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-emerald-600/25 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Set New Password</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Success View */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-5 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">Password Updated!</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Your password has been successfully reset. All active sessions have been safely terminated for your security.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-brand-600/25 active:scale-95 cursor-pointer"
              >
                Sign In with New Password
              </button>
            </div>
          )}

          {/* Back to Login link */}
          {step !== 'success' && (
            <div className="text-center pt-2 border-t border-slate-800/80 text-xs text-slate-400">
              Remember your credentials?{' '}
              <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300">
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

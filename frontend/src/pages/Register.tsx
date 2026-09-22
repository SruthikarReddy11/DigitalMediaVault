import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Send,
  Download,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Logo3D } from '../components/common/Logo3D';
import { RegisterResponse } from '../services/authApi';

const ADMIN_EMAIL = 'sruthikarreddy11@gmail.com';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  // Only 4 required fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [registeredData, setRegisteredData] = useState<RegisterResponse | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [detailsCopied, setDetailsCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      error('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register({
        username: username.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });

      if (res.status === 'PENDING_ADMIN_APPROVAL' || res.qrCodeUrl) {
        setRegisteredData(res);
        success('Registration submitted! Please send your QR code to the admin.');
      } else {
        success('Account created successfully! Welcome to your digital vault.');
        navigate('/');
      }
    } catch (err: any) {
      error(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQrImage = () => {
    if (!registeredData?.qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = registeredData.qrCodeUrl;
    link.download = `vault-registration-${username || registeredData.user.username}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendToAdmin = () => {
    if (!registeredData) return;

    // 1. Download QR Code automatically so user can attach it
    downloadQrImage();

    // 2. Draft email via mailto
    const uname = registeredData.user.username;
    const uemail = registeredData.user.email;
    const uid = registeredData.user.id;

    const subject = encodeURIComponent(`Vault Account Registration Approval - @${uname}`);
    const body = encodeURIComponent(
      `Hello Admin,\n\nI have registered for an account on the Digital Media Vault.\n\n` +
      `Account Registration Details:\n` +
      `- Username: ${uname}\n` +
      `- Email: ${uemail}\n` +
      `- User ID: ${uid}\n\n` +
      `I have attached my registration QR code image (saved in Downloads as vault-registration-${uname}.png).\n\n` +
      `Please upload or scan this QR code in the Admin Console to approve and activate my account.\n\n` +
      `Thank you!`
    );

    window.open(`mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleOpenGmailWeb = () => {
    if (!registeredData) return;
    downloadQrImage();

    const uname = registeredData.user.username;
    const uemail = registeredData.user.email;
    const uid = registeredData.user.id;

    const subject = encodeURIComponent(`Vault Account Registration Approval - @${uname}`);
    const body = encodeURIComponent(
      `Hello Admin,\n\nI have registered for an account on the Digital Media Vault.\n\n` +
      `Account Registration Details:\n` +
      `- Username: ${uname}\n` +
      `- Email: ${uemail}\n` +
      `- User ID: ${uid}\n\n` +
      `I have attached my registration QR code image (saved in Downloads as vault-registration-${uname}.png).\n\n` +
      `Please upload or scan this QR code in the Admin Console to approve and activate my account.\n\n` +
      `Thank you!`
    );

    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${ADMIN_EMAIL}&su=${subject}&body=${body}`, '_blank');
  };

  const handleCopyAdminEmail = () => {
    navigator.clipboard.writeText(ADMIN_EMAIL);
    setEmailCopied(true);
    success('Admin email copied to clipboard!');
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const handleCopyDetails = () => {
    if (!registeredData) return;
    const text = `Username: ${registeredData.user.username}\nEmail: ${registeredData.user.email}\nUser ID: ${registeredData.user.id}`;
    navigator.clipboard.writeText(text);
    setDetailsCopied(true);
    success('Account details copied!');
    setTimeout(() => setDetailsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-brand-500/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        <div className="flex justify-center mb-4">
          <Logo3D size="lg" to="/" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {registeredData ? 'Account Registration Submitted' : 'Create Vault Account'}
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          {registeredData
            ? 'Complete activation by sending your QR code to the administrator'
            : 'Enter your credentials to generate your encrypted vault profile'}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/80 border border-white/[0.08] backdrop-blur-2xl py-8 px-6 sm:px-8 rounded-3xl shadow-2xl space-y-6">
          {/* Post-Registration QR Code Display View */}
          {registeredData ? (
            <div className="space-y-6 text-center animate-fade-in">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Pending Admin Activation</span>
              </div>

              {/* User Details Summary */}
              <div className="bg-slate-950/80 border border-white/[0.08] rounded-2xl p-4 text-left space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Username:</span>
                  <span className="font-bold text-white font-mono">@{registeredData.user.username}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-semibold text-slate-200">{registeredData.user.email}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-amber-400 font-bold">Awaiting QR Verification</span>
                </div>
              </div>

              {/* QR Code Presentation */}
              <div className="relative group p-4 bg-white rounded-3xl shadow-2xl inline-block mx-auto border-4 border-slate-700/80">
                {registeredData.qrCodeUrl ? (
                  <img
                    src={registeredData.qrCodeUrl}
                    alt="Registration Activation QR Code"
                    className="w-56 h-56 object-contain"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                    <QrCode className="w-16 h-16" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-900/90 text-[10px] font-mono text-cyan-300 rounded-md border border-cyan-400/30">
                  SECURE QR
                </div>
              </div>

              {/* Primary Action: Send to Admin */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleSendToAdmin}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-cyan-300/30"
                >
                  <Send className="w-4 h-4" />
                  <span>Send to Admin</span>
                </button>

                <p className="text-[11px] text-slate-400">
                  Sends QR code to <strong className="text-slate-200">Admin</strong>
                </p>
              </div>

              {/* Secondary Sharing & Action Options */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={handleOpenGmailWeb}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-200 rounded-xl transition border border-white/[0.08] cursor-pointer"
                  title="Open Gmail Web"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Open in Gmail</span>
                </button>

                <button
                  type="button"
                  onClick={downloadQrImage}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-200 rounded-xl transition border border-white/[0.08] cursor-pointer"
                  title="Download QR code image file"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download QR</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs pt-1">
                <button
                  type="button"
                  onClick={handleCopyAdminEmail}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition cursor-pointer"
                >
                  {emailCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{emailCopied ? 'Copied' : 'Copy Admin Contact'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyDetails}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                >
                  {detailsCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{detailsCopied ? 'Copied Details' : 'Copy Details'}</span>
                </button>
              </div>

              {/* Instructions Guide */}
              <div className="p-3.5 bg-slate-950/90 border border-white/[0.08] rounded-2xl text-left space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>What happens next?</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
                  <li>Click <strong>Send to Admin</strong> to download your QR code and draft the email.</li>
                  <li>Admin receives your email request with your QR code attached.</li>
                  <li>Admin uploads your QR code in the Admin Console to activate your account.</li>
                  <li>Once activated, you can sign in to access your media vault!</li>
                </ol>
              </div>

              {/* Back to Sign In */}
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
                >
                  <span>Already sent? Proceed to Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            /* Registration Input Form (4 fields only) */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-brand-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-brand-500 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-brand-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-brand-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-600 hover:from-brand-500 hover:via-indigo-500 hover:to-cyan-500 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-brand-600/30 active:scale-98 disabled:opacity-50 border border-white/20 cursor-pointer"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Generate Registration QR Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-6 text-center text-xs text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300">
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

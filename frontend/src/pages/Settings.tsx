import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  User,
  Lock,
  Camera,
  Trash2,
  Upload,
  Shield,
  Key,
  HardDrive,
  Laptop,
  CheckCircle2,
  Download,
  RefreshCw,
  LogOut,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  Phone,
  Calendar,
  Briefcase,
  MapPin,
  Mail,
  AlertCircle,
  Edit3,
  X,
  Building2,
  Globe,
  CheckCircle,
  ShieldCheck,
  Bell,
  Volume2,
  VolumeX,
  Smartphone,
  Tablet,
  Wifi,
  Clock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { authApi, UserSession } from '../services/authApi';
import { filesApi } from '../services/filesApi';
import { DashboardStats } from '../types';
import { formatBytes, formatDate, calculateAge } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { getMediaUrl } from '../services/api';

export const Settings: React.FC = () => {
  const { user, updateUser, refreshUser, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'storage' | 'notifications'>('profile');
  const [reminderSoundEnabled, setReminderSoundEnabled] = useState(() => localStorage.getItem('pdl_reminder_sound') !== 'false');
  const [headerAlertsEnabled, setHeaderAlertsEnabled] = useState(() => localStorage.getItem('pdl_header_alerts') !== 'false');
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(
    () => typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [dob, setDob] = useState(user?.dob ? user.dob.substring(0, 10) : '');
  const [country, setCountry] = useState(user?.country || '');
  const [stateName, setStateName] = useState(user?.state || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [village, setVillage] = useState(user?.village || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [occupation, setOccupation] = useState(user?.occupation || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 4-Digit Security PIN state
  const [showPin, setShowPin] = useState(false);
  const [isRegeneratingPin, setIsRegeneratingPin] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);

  // Dashboard stats (Storage usage)
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Real-time dynamic age calculation
  const calculatedAge = useMemo(() => calculateAge(dob), [dob]);
  const userAge = useMemo(() => calculateAge(user?.dob || dob), [user?.dob, dob]);
  const userLocation = useMemo(() => {
    return [user?.village || village, user?.pincode || pincode].filter(Boolean).join(', ');
  }, [user?.village, user?.pincode, village, pincode]);

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);

  // Full address string for display and copy
  const fullAddressString = useMemo(() => {
    return [
      user?.village || village,
      user?.district || district,
      user?.state || stateName,
      user?.pincode || pincode,
      user?.country || country,
    ]
      .filter(Boolean)
      .join(', ');
  }, [user, village, district, stateName, pincode, country]);

  const handleCopyAddress = () => {
    if (!fullAddressString) return;
    navigator.clipboard.writeText(fullAddressString);
    setAddressCopied(true);
    success('Residential address copied to clipboard!');
    setTimeout(() => setAddressCopied(false), 2000);
  };

  // Profile Completeness Score (0 - 100%)
  const profileCompleteness = useMemo(() => {
    const fields = [
      user?.name || name,
      user?.email,
      user?.mobileNumber || mobileNumber,
      user?.gender || gender,
      user?.dob || dob,
      user?.country || country,
      user?.state || stateName,
      user?.district || district,
      user?.village || village,
      user?.pincode || pincode,
      user?.occupation || occupation,
    ];
    const filled = fields.filter((f) => typeof f === 'string' && f.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [user, name, mobileNumber, gender, dob, country, stateName, district, village, pincode, occupation]);

  // List of missing demographic fields
  const missingFieldsList = useMemo(() => {
    const list: string[] = [];
    const mobile = user?.mobileNumber || mobileNumber;
    const gndr = user?.gender || gender;
    const birthDate = user?.dob || dob;
    const vlg = user?.village || village;
    const pin = user?.pincode || pincode;
    if (!mobile || !mobile.trim()) list.push('Mobile Number');
    if (!gndr || !gndr.trim()) list.push('Sex');
    if (!birthDate || !birthDate.trim()) list.push('Date of Birth');
    if (!vlg || !vlg.trim()) list.push('Village');
    if (!pin || !pin.trim()) list.push('Pincode');
    return list;
  }, [user, mobileNumber, gender, dob, village, pincode]);

  // Check if profile is incomplete for current user
  const isProfileIncomplete = useMemo(() => {
    const mobile = user?.mobileNumber || mobileNumber;
    const birthDate = user?.dob || dob;
    const vlg = user?.village || village;
    const gndr = user?.gender || gender;
    const hasMobile = typeof mobile === 'string' && mobile.trim().length > 0;
    const hasDob = typeof birthDate === 'string' && birthDate.trim().length > 0;
    const hasVillage = typeof vlg === 'string' && vlg.trim().length > 0;
    const hasGender = typeof gndr === 'string' && gndr.trim().length > 0;
    return !hasMobile || !hasDob || !hasVillage || !hasGender;
  }, [user, mobileNumber, dob, village, gender]);



  // Reset imageError when user avatarUrl changes
  useEffect(() => {
    setImageError(false);
  }, [user?.avatarUrl]);

  // Sync profile field states with authenticated user
  useEffect(() => {
    if (user && !isEditingProfile) {
      setName(user.name || '');
      setMobileNumber(user.mobileNumber || '');
      setGender(user.gender || '');
      setDob(user.dob ? user.dob.substring(0, 10) : '');
      setCountry(user.country || '');
      setStateName(user.state || '');
      setDistrict(user.district || '');
      setVillage(user.village || '');
      setPincode(user.pincode || '');
      setOccupation(user.occupation || '');
    }
  }, [user]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUserData = async () => {
    setIsLoadingSessions(true);
    try {
      const [sessionsData, statsData, freshUser] = await Promise.all([
        authApi.getSessions().catch(() => []),
        filesApi.getDashboardStats().catch(() => null),
        refreshUser().catch(() => null),
      ]);
      setSessions(sessionsData);
      setStats(statsData);
      if (freshUser) {
        setName(freshUser.name || '');
        setMobileNumber(freshUser.mobileNumber || '');
        setGender(freshUser.gender || '');
        setDob(freshUser.dob ? freshUser.dob.substring(0, 10) : '');
        setCountry(freshUser.country || '');
        setStateName(freshUser.state || '');
        setDistrict(freshUser.district || '');
        setVillage(freshUser.village || '');
        setPincode(freshUser.pincode || '');
        setOccupation(freshUser.occupation || '');
      }
    } catch (err) {
      console.warn('Failed to load settings extra data:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleCopyPin = () => {
    if (!user?.securityPin) return;
    navigator.clipboard.writeText(user.securityPin);
    setPinCopied(true);
    success('Security PIN copied to clipboard!');
    setTimeout(() => setPinCopied(false), 2000);
  };

  const handleRegeneratePin = async () => {
    setIsRegeneratingPin(true);
    try {
      const newPin = await authApi.regeneratePin();
      if (user) {
        updateUser({ ...user, securityPin: newPin });
      }
      success(`New Security PIN generated: ${newPin}`);
    } catch (err: any) {
      error(err.message || 'Failed to regenerate PIN.');
    } finally {
      setIsRegeneratingPin(false);
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      error('Profile picture must be under 10 MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const updated = await authApi.uploadAvatar(file);
      updateUser(updated);
      success('Profile picture updated successfully!');
    } catch (err: any) {
      error(err.message || 'Failed to upload profile picture.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    try {
      const updated = await authApi.removeAvatar();
      updateUser(updated);
      success('Profile picture removed.');
    } catch (err: any) {
      error(err.message || 'Failed to remove profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleStartEdit = () => {
    if (user) {
      setName(user.name || name || '');
      setMobileNumber(user.mobileNumber || mobileNumber || '');
      setGender(user.gender || gender || '');
      setDob(user.dob ? user.dob.substring(0, 10) : (dob || ''));
      setCountry(user.country || country || '');
      setStateName(user.state || stateName || '');
      setDistrict(user.district || district || '');
      setVillage(user.village || village || '');
      setPincode(user.pincode || pincode || '');
      setOccupation(user.occupation || occupation || '');
    }
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    if (user) {
      setName(user.name || '');
      setMobileNumber(user.mobileNumber || '');
      setGender(user.gender || '');
      setDob(user.dob ? user.dob.substring(0, 10) : '');
      setCountry(user.country || '');
      setStateName(user.state || '');
      setDistrict(user.district || '');
      setVillage(user.village || '');
      setPincode(user.pincode || '');
      setOccupation(user.occupation || '');
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditingProfile(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        error('New passwords do not match.');
        return;
      }
      if (newPassword.length < 8) {
        error('New password must be at least 8 characters.');
        return;
      }
      if (!currentPassword) {
        error('Current password is required to change password.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const cleanStr = (val: any) => {
        if (typeof val !== 'string') return null;
        const t = val.trim();
        return t.length > 0 ? t : null;
      };

      const payload = {
        name: cleanStr(name) || user?.name || '',
        mobileNumber: cleanStr(mobileNumber),
        gender: cleanStr(gender),
        dob: cleanStr(dob),
        country: cleanStr(country),
        state: cleanStr(stateName),
        district: cleanStr(district),
        village: cleanStr(village),
        pincode: cleanStr(pincode),
        occupation: cleanStr(occupation),
        currentPassword: cleanStr(currentPassword) || undefined,
        newPassword: cleanStr(newPassword) || undefined,
      };

      const updated = await authApi.updateProfile(payload);

      updateUser(updated);

      setName(updated.name || payload.name || '');
      setMobileNumber(updated.mobileNumber || payload.mobileNumber || '');
      setGender(updated.gender || payload.gender || '');
      setDob(updated.dob ? updated.dob.substring(0, 10) : (payload.dob || ''));
      setCountry(updated.country || payload.country || '');
      setStateName(updated.state || payload.state || '');
      setDistrict(updated.district || payload.district || '');
      setVillage(updated.village || payload.village || '');
      setPincode(updated.pincode || payload.pincode || '');
      setOccupation(updated.occupation || payload.occupation || '');

      success('Profile details saved & verified successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsEditingProfile(false);
    } catch (err: any) {
      error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeSessions = async () => {
    setIsRevokingSessions(true);
    try {
      const res = await authApi.revokeOtherSessions();
      success(res.message || 'Other device sessions revoked.');
      await fetchUserData();
    } catch (err: any) {
      error(err.message || 'Failed to revoke other sessions.');
    } finally {
      setIsRevokingSessions(false);
    }
  };

  const handleRevokeSingleSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to disconnect this device session?')) {
      return;
    }
    setIsRevokingSessions(true);
    try {
      const res = await authApi.revokeSession(sessionId);
      success(res.message || 'Device session revoked successfully.');
      await fetchUserData();
    } catch (err: any) {
      error(err.message || 'Failed to revoke session.');
    } finally {
      setIsRevokingSessions(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    if (
      !window.confirm(
        'Are you sure you want to sign out from ALL devices? This will invalidate all active sessions, including this current device, and return you to the login screen.'
      )
    ) {
      return;
    }
    setIsRevokingSessions(true);
    try {
      await authApi.revokeAllSessions(true);
      success('Successfully signed out from all devices.');
      await logout();
    } catch (err: any) {
      error(err.message || 'Failed to sign out from all devices.');
      setIsRevokingSessions(false);
    }
  };

  const handleExportData = () => {
    if (!user) return;
    const exportPayload = {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        mobileNumber: user.mobileNumber,
        gender: user.gender,
        dob: user.dob,
        country: user.country,
        state: user.state,
        district: user.district,
        village: user.village,
        pincode: user.pincode,
        occupation: user.occupation,
        role: user.role,
      },
      stats,
      exportedAt: new Date().toISOString(),
    };

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `PDL_Account_Export_${user.username}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    success('Account metadata exported to JSON.');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Existing User Profile Incomplete Alert */}
      {!bannerDismissed && isProfileIncomplete && (
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-xl animate-fade-in">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm font-black text-amber-200 tracking-wide uppercase">
                  Profile Incomplete ({100 - profileCompleteness}% Pending)
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Setup Required
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-300/80 mt-1 max-w-xl leading-relaxed">
                Please update your mobile number, date of birth, sex, and residential address details below to verify your digital vault account.
              </p>
              {missingFieldsList.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-amber-400 font-bold">Missing:</span>
                  {missingFieldsList.map((f) => (
                    <span
                      key={f}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-500/30 text-amber-200"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => {
                setActiveTab('profile');
                handleStartEdit();
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl transition shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Update Profile Now</span>
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-2 text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl transition"
              title="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Luxury Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-indigo-950/40 border border-white/[0.08] p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>System & Security Center</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed font-medium">
              Manage personal identity, cryptographic vault security, session tokens, and database quotas.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5 ${
                isAdmin
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isAdmin ? 'ADMINISTRATOR' : 'STANDARD USER'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Modern macOS System Settings Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 border border-white/[0.08] rounded-2xl backdrop-blur-xl w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
            activeTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile & Demographics</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
            activeTab === 'security'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Security PIN & Sessions</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
            activeTab === 'storage'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Storage & Export</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
            activeTab === 'notifications'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications & Alerts</span>
        </button>
      </div>

      {/* Tab 1: Profile & Demographics */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar Profile Card & Overview */}
          <div className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-3xl space-y-5 text-center flex flex-col items-center justify-center shadow-xl">
            {/* Avatar with Camera Hover Overlay */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-brand-500/30 overflow-hidden border-2 border-white/20 ring-4 ring-brand-500/20">
                {user?.avatarUrl && !imageError ? (
                  <img
                    src={getMediaUrl(user.avatarUrl)}
                    alt={user.name}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>

              {/* Hover Camera Overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-bold transition cursor-pointer backdrop-blur-sm"
              >
                <Camera className="w-6 h-6 mb-1 text-brand-300" />
                <span>Change</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />

            {/* Avatar action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-white rounded-xl border border-white/[0.08] transition flex items-center gap-1.5 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                {isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}
              </button>

              {user?.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                  className="p-2 bg-slate-800/80 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl border border-white/[0.08] transition shadow-sm"
                  title="Remove photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">{user?.name}</h3>
              <p className="text-xs text-brand-400 font-mono">@{user?.username}</p>

              {/* Registered Email with Lock & Verified Pill */}
              <div className="pt-2 flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                  <Mail className="w-3 h-3 text-brand-400" />
                  <span>Registered Email</span>
                </span>
                <p className="text-xs text-slate-200 font-medium mt-0.5 bg-slate-950/80 border border-white/[0.08] px-3 py-1 rounded-lg">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Profile Completeness Meter */}
            <div className="w-full pt-3 border-t border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Profile Completion</span>
                </span>
                <span
                  className={`font-black text-xs px-2 py-0.5 rounded-full ${
                    profileCompleteness === 100
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {profileCompleteness}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-white/[0.06]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    profileCompleteness === 100
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                      : 'bg-gradient-to-r from-amber-500 via-brand-500 to-indigo-500 shadow-sm shadow-brand-500/50'
                  }`}
                  style={{ width: `${profileCompleteness}%` }}
                />
              </div>
            </div>

            {/* Demographic Highlights Pills */}
            <div className="w-full pt-2 border-t border-white/[0.06] space-y-2 text-left">
              {userAge !== null && (
                <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-950/50 border border-white/[0.04] hover:border-brand-500/20 transition">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-400" />
                    <span>Age</span>
                  </span>
                  <span className="font-bold text-white bg-brand-500/15 text-brand-300 px-2 py-0.5 rounded-md border border-brand-500/25">
                    {userAge} years
                  </span>
                </div>
              )}

              {(user?.gender || gender) && (
                <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-950/50 border border-white/[0.04] hover:border-indigo-500/20 transition">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sex</span>
                  </span>
                  <span className="font-bold text-white">{user?.gender || gender}</span>
                </div>
              )}

              {(user?.occupation || occupation) && (
                <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-950/50 border border-white/[0.04] hover:border-cyan-500/20 transition">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Occupation</span>
                  </span>
                  <span className="font-bold text-white truncate max-w-[130px]">{user?.occupation || occupation}</span>
                </div>
              )}

              {(user?.mobileNumber || mobileNumber) && (
                <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-950/50 border border-white/[0.04] hover:border-emerald-500/20 transition">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mobile</span>
                  </span>
                  <span className="font-mono text-white text-[11px]">{user?.mobileNumber || mobileNumber}</span>
                </div>
              )}

              {(user?.village || village || user?.pincode || pincode) && (
                <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-950/50 border border-white/[0.04] hover:border-rose-500/20 transition">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>Location</span>
                  </span>
                  <span className="font-medium text-white truncate max-w-[140px] text-right">
                    {[user?.village || village, user?.pincode || pincode].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Demographics & Profile Panel (View Mode / Edit Mode) */}
          <div className="lg:col-span-2 p-6 sm:p-8 bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-3xl shadow-xl space-y-6">
            {!isEditingProfile ? (
              /* VIEW MODE: Read-Only Display of Saved Details with 3D Luxury Stylings */
              <div className="space-y-6">
                {/* 3D Identity Hero Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/50 via-slate-900/90 to-purple-950/40 border border-white/[0.1] p-5 sm:p-6 shadow-2xl">
                  <div className="absolute top-0 right-0 w-60 h-60 bg-gradient-to-bl from-brand-500/15 via-indigo-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1.5 shadow-sm">
                          <ShieldCheck className="w-3 h-3 text-brand-400" />
                          <span>Verified Vault Citizen</span>
                        </span>
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-md border flex items-center gap-1 shadow-sm ${
                            profileCompleteness === 100
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>{profileCompleteness}% Profile Complete</span>
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {user?.name || name || 'Vault User'}
                      </h2>
                      <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                        Registered personal identification, verified cryptographic security credentials, and residential address records.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="group relative overflow-hidden flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:via-indigo-500 hover:to-purple-500 text-white text-xs font-black rounded-xl transition-all duration-200 shadow-xl shadow-brand-500/25 border border-white/20 active:scale-95 shrink-0 self-start sm:self-auto"
                    >
                      <Edit3 className="w-3.5 h-3.5 transition group-hover:rotate-12" />
                      <span>Edit Profile Details</span>
                    </button>
                  </div>
                </div>

                {/* 6 Luxury 3D Cards of Profile Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card 1: Full Name */}
                  <div className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/[0.08] hover:border-brand-500/40 transition-all duration-200 hover:shadow-xl hover:shadow-brand-500/5 hover:-translate-y-0.5 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 group-hover:scale-110 transition-transform">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                          Full Legal Name
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">(Including Surname)</span>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base font-black text-white pl-0.5">
                      {(user?.name || name) || <span className="text-slate-500 italic font-normal text-xs">Not provided</span>}
                    </p>
                  </div>

                  {/* Card 2: Registered Email */}
                  <div className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/[0.08] hover:border-emerald-500/40 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-0.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                            Registered Email
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">Identity Token</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Verified</span>
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-200 truncate pl-0.5 font-mono">
                      {user?.email || <span className="text-slate-500 italic font-normal text-xs">Not provided</span>}
                    </p>
                  </div>

                  {/* Card 3: Mobile Number */}
                  <div className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/[0.08] hover:border-cyan-500/40 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-0.5 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                          Mobile Number
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">Primary Contact</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pl-0.5">
                      <p className="text-sm sm:text-base font-mono font-bold text-white tracking-wide">
                        {(user?.mobileNumber || mobileNumber) || <span className="text-slate-500 italic font-normal text-xs font-sans">Not provided</span>}
                      </p>
                      {(user?.mobileNumber || mobileNumber) && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText((user?.mobileNumber || mobileNumber)!);
                            success('Mobile number copied to clipboard!');
                          }}
                          className="text-slate-400 hover:text-cyan-300 p-1 rounded-lg hover:bg-white/[0.05] transition"
                          title="Copy mobile number"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card 4: Sex / Gender */}
                  <div className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/[0.08] hover:border-indigo-500/40 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                          Sex / Gender
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">Demographic Record</span>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base font-black text-white pl-0.5">
                      {(user?.gender || gender) || <span className="text-slate-500 italic font-normal text-xs">Not specified</span>}
                    </p>
                  </div>

                  {/* Card 5: Date of Birth & Age */}
                  <div className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/[0.08] hover:border-amber-500/40 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-0.5 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                          Date of Birth & Age
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">Chronological Identity</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 pl-0.5">
                      <p className="text-sm sm:text-base font-black text-white">
                        {(user?.dob || dob) ? formatDate(user?.dob || dob) : <span className="text-slate-500 italic font-normal text-xs">Not provided</span>}
                      </p>
                      {userAge !== null && (
                        <span className="text-xs font-black text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30 shadow-sm">
                          {userAge} yrs old
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card 6: Occupation */}
                  <div className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/[0.08] hover:border-sky-500/40 transition-all duration-200 hover:shadow-xl hover:shadow-sky-500/5 hover:-translate-y-0.5 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">
                          Occupation
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">Professional Role</span>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base font-black text-white pl-0.5">
                      {(user?.occupation || occupation) || <span className="text-slate-500 italic font-normal text-xs">Not specified</span>}
                    </p>
                  </div>
                </div>

                {/* Residential Address 3D Cyber-Station */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-950/90 to-slate-900/95 border border-cyan-500/30 p-5 sm:p-6 space-y-4 shadow-2xl hover:border-cyan-500/50 transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                          Permanent Residential Address
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Official geographic location mapped to account security
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {userLocation && (
                        <span className="text-xs font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-3 py-1 rounded-xl shadow-sm">
                          📍 {userLocation}
                        </span>
                      )}
                      {fullAddressString && (
                        <button
                          type="button"
                          onClick={handleCopyAddress}
                          className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white rounded-xl border border-white/[0.08] transition shadow-sm"
                          title="Copy complete address"
                        >
                          {addressCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 5 Micro-Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.06] space-y-1 hover:border-cyan-500/30 transition">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Village / Town
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-white truncate">
                        {(user?.village || village) || <span className="text-slate-600 font-normal">—</span>}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.06] space-y-1 hover:border-cyan-500/30 transition">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Pincode
                      </span>
                      <p className="text-xs sm:text-sm font-mono font-bold text-white">
                        {(user?.pincode || pincode) || <span className="text-slate-600 font-sans font-normal">—</span>}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.06] space-y-1 hover:border-cyan-500/30 transition">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        District
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-white truncate">
                        {(user?.district || district) || <span className="text-slate-600 font-normal">—</span>}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.06] space-y-1 hover:border-cyan-500/30 transition">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        State
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-white truncate">
                        {(user?.state || stateName) || <span className="text-slate-600 font-normal">—</span>}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.06] space-y-1 hover:border-cyan-500/30 transition">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Country
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-white truncate">
                        {(user?.country || country) || <span className="text-slate-600 font-normal">—</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Edit Action Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-black rounded-xl border border-white/[0.08] transition active:scale-95 shadow-lg shadow-black/30"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-brand-400" />
                    <span>Edit Profile Details</span>
                  </button>
                </div>
              </div>
            ) : (
              /* EDIT MODE: Form to Update Profile */
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-brand-400" />
                      <span>Edit Personal Details & Demographics</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Modify your details and click save to update your vault profile.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/[0.08] transition"
                    title="Cancel edit"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Registered Email (Disabled) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-brand-400" />
                      <span>Registered Email Address</span>
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified Primary Email</span>
                    </span>
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full bg-slate-950/50 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Name (Including Surname) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Johnathan Alexander Vance"
                      className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-brand-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
                    />
                  </div>
                </div>

                {/* Contact & Personal Demographics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-brand-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Sex / Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-slate-950/80 border border-white/[0.08] text-sm font-medium text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-500 transition cursor-pointer"
                    >
                      <option value="">Select Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Date of Birth (DOB)
                      </label>
                      {calculatedAge !== null && (
                        <span className="text-[11px] font-bold text-brand-300 bg-brand-500/20 px-2 py-0.5 rounded-full border border-brand-500/30 animate-pulse">
                          Age: {calculatedAge} years old
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-brand-500 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Occupation
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        placeholder="e.g. Software Engineer, Designer"
                        className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-brand-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Residential Address Section */}
                <div className="pt-3 border-t border-white/[0.06] space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Residential Address</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Country</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. India"
                        className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">State</label>
                      <input
                        type="text"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        placeholder="e.g. Telangana / California"
                        className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">District</label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="e.g. Hyderabad"
                        className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Village / Town / City
                      </label>
                      <input
                        type="text"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        placeholder="e.g. Madhapur"
                        className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pincode</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="e.g. 500081"
                        className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Change Password Section */}
                <div className="pt-3 border-t border-white/[0.06] space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5 text-brand-400" />
                    <span>Update Password (Optional)</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password to authorize password change..."
                      className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-brand-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-brand-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-brand-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-bold rounded-xl transition border border-white/[0.08] active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-lg shadow-brand-600/25 border border-brand-400/30 disabled:opacity-50 active:scale-95"
                  >
                    {isSaving ? 'Saving Changes...' : 'Save Profile Details'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Security & PIN & Sessions */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Private Security PIN Section */}
          <div className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-slate-950 to-amber-950/30 border border-amber-500/30 rounded-3xl shadow-2xl space-y-5">
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Private 4-Digit Security PIN
                  </h3>
                  <p className="text-xs text-amber-300/80">
                    Confidential vault authorization code for file verification
                  </p>
                </div>
              </div>

              <span className="text-[10px] px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider self-start sm:self-auto">
                Strictly Confidential
              </span>
            </div>

            {/* PIN tactile digits display */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-3">
                {/* 4 Digit Capsules */}
                <div className="flex items-center gap-2 bg-slate-950/90 border border-amber-500/40 p-2 rounded-2xl shadow-inner">
                  {user?.securityPin ? (
                    user.securityPin.split('').map((digit: string, idx: number) => (
                      <div
                        key={idx}
                        className="w-10 h-12 rounded-xl bg-slate-900 border border-white/[0.08] flex items-center justify-center font-mono text-xl font-black text-amber-400 shadow-sm"
                      >
                        {showPin ? digit : '•'}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 px-3 py-2 font-sans">Generating...</span>
                  )}
                </div>

                {/* Show/Hide button */}
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="p-2.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-white/[0.08] transition shadow-sm"
                  title={showPin ? 'Hide PIN' : 'Reveal PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                {/* Copy button */}
                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="p-2.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-white/[0.08] transition shadow-sm"
                  title="Copy PIN"
                >
                  {pinCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Regenerate PIN */}
              <button
                type="button"
                onClick={handleRegeneratePin}
                disabled={isRegeneratingPin}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl transition shadow-lg shadow-amber-500/10 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingPin ? 'animate-spin' : ''}`} />
                <span>Regenerate PIN</span>
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
              ⚠️ <strong>Do not share this code with unauthorized users.</strong> When an administrator or security officer inspects files from File Management, they are required to enter this 4-digit code to authorize decrypting and viewing your private items.
            </div>
          </div>

          {/* Your Devices & Multi-Device Sync Section */}
          <div className="p-6 sm:p-8 bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-3xl shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-br from-brand-500/20 via-purple-500/20 to-sky-500/20 border border-brand-500/30 text-brand-300">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                        Your Devices & Multi-Device Sync
                      </h3>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Sync Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Real-time encrypted synchronization across all your logged-in phones, computers, and tablets.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={handleRevokeSessions}
                    disabled={isRevokingSessions}
                    className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-white/10 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                    title="Log out of all other devices except this current one"
                  >
                    <LogOut className="w-3.5 h-3.5 text-amber-400" />
                    <span>Revoke Others ({sessions.length - 1})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSignOutAllDevices}
                  disabled={isRevokingSessions}
                  className="px-3.5 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shadow-lg shadow-rose-500/10"
                  title="Sign out and disconnect from all devices including this one"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sign out from all devices</span>
                </button>
              </div>
            </div>

            {/* Multi-Device Cloud Sync Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/40 via-purple-950/30 to-slate-950/50 border border-brand-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-300 shrink-0">
                  <Wifi className="w-4 h-4 animate-pulse text-brand-400" />
                </div>
                <div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span>Multi-Device Synchronization</span>
                    <span className="text-[10px] px-2 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-mono">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Files, lossless music playlists, photo galleries, and smart reminders sync instantaneously with end-to-end security.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 font-medium shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{sessions.length} {sessions.length === 1 ? 'Device' : 'Devices'} Connected</span>
              </div>
            </div>

            {/* Devices List */}
            {isLoadingSessions ? (
              <div className="space-y-3">
                <div className="h-20 bg-slate-950/80 rounded-2xl animate-pulse" />
                <div className="h-20 bg-slate-950/80 rounded-2xl animate-pulse" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-white/[0.06]">
                <Laptop className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">No active sessions found</p>
                <p className="text-xs text-slate-500 mt-1">Current session is active in this browser.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => {
                  const isMob = s.deviceType === 'MOBILE' || (s.deviceName || '').toLowerCase().includes('android') || (s.deviceName || '').toLowerCase().includes('iphone');
                  const isTab = s.deviceType === 'TABLET' || (s.deviceName || '').toLowerCase().includes('ipad') || (s.deviceName || '').toLowerCase().includes('tablet');
                  const isPc = s.deviceType === 'DESKTOP' || (s.deviceName || '').toLowerCase().includes('pc') || (s.deviceName || '').toLowerCase().includes('windows') || (s.deviceName || '').toLowerCase().includes('mac');

                  const isCurrentSession = !!s.isCurrent;
                  const isLive = isCurrentSession || s.status === 'ACTIVE_NOW';
                  const isOnline = s.status === 'ONLINE';
                  const isIdle = s.status === 'IDLE';

                  return (
                    <div
                      key={s.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                        isCurrentSession
                          ? 'bg-brand-500/[0.07] border-brand-500/40 shadow-lg shadow-brand-500/5'
                          : 'bg-slate-950/60 hover:bg-slate-950/80 border-white/[0.07]'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Device Info */}
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div
                            className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
                              isCurrentSession
                                ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                                : isMob
                                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                                : isTab
                                ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                                : 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                            }`}
                          >
                            {isMob ? (
                              <Smartphone className="w-5 h-5" />
                            ) : isTab ? (
                              <Tablet className="w-5 h-5" />
                            ) : isPc ? (
                              <Laptop className="w-5 h-5" />
                            ) : (
                              <Globe className="w-5 h-5" />
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                                {isMob ? '📱' : isTab ? '📟' : isPc ? '💻' : '🌐'} {s.deviceName || (isCurrentSession ? 'Current Device' : 'Authorized Device')}
                              </span>

                              {isCurrentSession && (
                                <span className="px-2 py-0.5 bg-brand-500/20 text-brand-300 border border-brand-500/40 text-[10px] font-extrabold rounded-md tracking-wider">
                                  THIS DEVICE
                                </span>
                              )}

                              {isLive ? (
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold rounded-full flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  ONLINE / ACTIVE
                                </span>
                              ) : isOnline ? (
                                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-full flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  ONLINE
                                </span>
                              ) : isIdle ? (
                                <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-full flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                  IDLE
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-white/10 text-[10px] font-semibold rounded-full">
                                  OFFLINE
                                </span>
                              )}
                            </div>

                            {/* Metadata Subline */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                              <span className="text-slate-300 font-medium">
                                {s.browser || 'Browser'} • {s.os || 'Operating System'}
                              </span>
                              <span className="text-slate-600 hidden sm:inline">•</span>
                              <span className="flex items-center gap-1 text-slate-400">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                <span>{s.ipAddress || '127.0.0.1'}</span>
                                {s.location && <span className="text-slate-500">({s.location})</span>}
                              </span>
                            </div>

                            {/* Timestamps */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Login: {formatDate(s.createdAt)}</span>
                              </span>
                              <span className="text-slate-600 hidden sm:inline">•</span>
                              <span>Last active: {formatDate(s.lastUsedAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          {isCurrentSession ? (
                            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Current Session</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRevokeSingleSession(s.id)}
                              disabled={isRevokingSessions}
                              className="px-3.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                              title="Disconnect this device"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Revoke Session</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Storage & Data Export */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          {/* Storage Meter Card */}
          {stats && (
            <div className="p-6 sm:p-8 bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-3xl space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <span>Database Storage Quota</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time cloud database consumption breakdown
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-cyan-300">
                    {formatBytes(stats.storageUsedBytes)}
                  </span>
                  <span className="text-xs text-slate-400"> / 500 MB</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-slate-950/80 rounded-full overflow-hidden flex p-0.5 border border-white/[0.08]">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (stats.storageUsedBytes / (stats.storageLimitBytes || 500 * 1024 * 1024)) * 100
                    )}%`,
                  }}
                  title="Used storage"
                />
              </div>

              {/* Storage breakdown pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/[0.06] text-center">
                  <p className="text-xs text-slate-400">Total Items</p>
                  <p className="text-lg font-black text-white mt-1">{stats.totalFiles}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/[0.06] text-center">
                  <p className="text-xs text-slate-400">Music Tracks</p>
                  <p className="text-lg font-black text-brand-400 mt-1">{stats.countsByType?.music || 0}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/[0.06] text-center">
                  <p className="text-xs text-slate-400">Photos</p>
                  <p className="text-lg font-black text-pink-400 mt-1">{stats.countsByType?.images || 0}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/[0.06] text-center">
                  <p className="text-xs text-slate-400">Videos</p>
                  <p className="text-lg font-black text-purple-400 mt-1">{stats.countsByType?.videos || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Data Export Card */}
          <div className="p-6 sm:p-8 bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-3xl space-y-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1 max-w-lg">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Library Metadata & Backup Export</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Download a clean, structured JSON archive containing your full account profile, media catalogs, demographics, and storage metrics.
              </p>
            </div>

            <button
              onClick={handleExportData}
              className="px-5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-white rounded-xl border border-white/[0.1] transition flex items-center justify-center gap-2 shadow-lg active:scale-95 shrink-0"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export JSON Archive</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Notifications & Alerts */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-3xl space-y-6 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-brand-400" />
                <span>Calendar & Smart Reminder Preferences</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Customize how VaultMedia notifies you of scheduled meetings, deadlines, and tasks.
              </p>
            </div>

            <div className="space-y-4 divide-y divide-slate-800/80">
              {/* Sound alert chime toggle */}
              <div className="pt-4 flex items-center justify-between gap-4">
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm font-semibold text-white">Audible Reminder Chimes</p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Play a gentle electronic synthesizer chime when a scheduled reminder or event trigger occurs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !reminderSoundEnabled;
                    setReminderSoundEnabled(next);
                    localStorage.setItem('pdl_reminder_sound', String(next));
                    success(next ? 'Reminder sound alerts enabled' : 'Reminder sound alerts muted');
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    reminderSoundEnabled ? 'bg-brand-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                      reminderSoundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Header notifications badge */}
              <div className="pt-4 flex items-center justify-between gap-4">
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-brand-400" />
                    <p className="text-sm font-semibold text-white">Top Navigation Bell Alerts</p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Display glowing urgency badges and popup notification panels in the global header bar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !headerAlertsEnabled;
                    setHeaderAlertsEnabled(next);
                    localStorage.setItem('pdl_header_alerts', String(next));
                    success(next ? 'Header notifications enabled' : 'Header notifications muted');
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    headerAlertsEnabled ? 'bg-brand-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                      headerAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Browser Desktop Notifications */}
              <div className="pt-4 flex items-center justify-between gap-4">
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-indigo-400" />
                    <p className="text-sm font-semibold text-white">Browser Desktop Notifications</p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Receive native OS desktop notifications even when VaultMedia is running in the background.
                  </p>
                </div>
                {browserNotificationsEnabled ? (
                  <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Granted
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      if ('Notification' in window) {
                        const perm = await Notification.requestPermission();
                        if (perm === 'granted') {
                          setBrowserNotificationsEnabled(true);
                          success('Desktop notifications enabled!');
                        } else {
                          error('Desktop notifications permission denied in browser');
                        }
                      } else {
                        error('Desktop notifications not supported in this browser');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-95 shrink-0"
                  >
                    Enable Permission
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

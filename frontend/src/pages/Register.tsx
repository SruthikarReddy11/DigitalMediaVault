import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldAlert,
  Copy,
  Check,
  Phone,
  Calendar,
  Briefcase,
  MapPin,
  Home,
  Building,
  Navigation,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { calculateAge } from '../utils/formatters';
import { Logo3D } from '../components/common/Logo3D';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  // Account Credentials
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Personal Profile
  const [mobileNumber, setMobileNumber] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [dob, setDob] = useState('');
  const [occupation, setOccupation] = useState('');

  // Address
  const [country, setCountry] = useState('');
  const [stateName, setStateName] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [pincode, setPincode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [registeredPin, setRegisteredPin] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Dynamic age calculation in years
  const age = useMemo(() => calculateAge(dob), [dob]);

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
        name,
        username,
        email,
        password,
        confirmPassword,
        mobileNumber: mobileNumber || undefined,
        gender: gender || undefined,
        dob: dob || undefined,
        country: country || undefined,
        state: stateName || undefined,
        district: district || undefined,
        village: village || undefined,
        pincode: pincode || undefined,
        occupation: occupation || undefined,
      });

      if (res?.securityPin) {
        setRegisteredPin(res.securityPin);
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

  const handleCopyPin = () => {
    if (!registeredPin) return;
    navigator.clipboard.writeText(registeredPin);
    setCopied(true);
    success('PIN copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-brand-500/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10 text-center mb-6">
        <div className="flex justify-center mb-4">
          <Logo3D size="lg" to="/" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Create Your Digital Vault Profile
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Encrypted media cloud with personalized demographics and security authentication
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <div className="bg-slate-900/80 border border-white/[0.08] backdrop-blur-2xl py-8 px-6 sm:px-10 rounded-3xl shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group 1: Account Credentials */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-400 uppercase tracking-wider border-b border-white/[0.06] pb-2">
                <User className="w-3.5 h-3.5" />
                <span>Account Credentials</span>
              </div>

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
                    className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-brand-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                      placeholder="alexvance"
                      className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-brand-500 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Registered Email <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex.vance@example.com"
                      className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-brand-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
              </div>
            </div>

            {/* Group 2: Personal Profile & Demographics */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-white/[0.06] pb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Personal Demographics</span>
              </div>

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
                      className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-brand-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
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
                    className="w-full bg-slate-950/80 border border-white/[0.08] text-xs sm:text-sm font-medium text-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-brand-500 transition cursor-pointer"
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
                    {age !== null && (
                      <span className="text-[11px] font-bold text-brand-300 bg-brand-500/20 px-2 py-0.5 rounded-full border border-brand-500/30 animate-pulse">
                        Age: {age} years
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-brand-500 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
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
                      className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-brand-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Group 3: Residential Address */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-white/[0.06] pb-2">
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
                    className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">State</label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="e.g. Telangana / California"
                    className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition"
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
                    className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition"
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
                    className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 500081"
                    className="w-full bg-slate-950/80 border border-white/[0.08] focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-600 hover:from-brand-500 hover:via-indigo-500 hover:to-cyan-500 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-brand-600/30 active:scale-98 disabled:opacity-50 border border-white/20"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Complete Registration & Create Vault</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Security PIN Display Modal */}
      {registeredPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-white/[0.1] w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center relative">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Your Private Security PIN</h3>
              <p className="text-xs text-slate-400">
                Please memorize or securely save this 4-digit access code
              </p>
            </div>

            <div className="p-4 bg-slate-950 border-2 border-amber-500/40 rounded-2xl flex items-center justify-center gap-4">
              <div className="flex gap-2">
                {registeredPin.split('').map((digit, i) => (
                  <div
                    key={i}
                    className="w-11 h-13 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center text-2xl font-mono font-extrabold text-amber-400 shadow-inner"
                  >
                    {digit}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCopyPin}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow"
                title="Copy PIN"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left text-xs text-amber-300/90 leading-relaxed space-y-1">
              <p className="font-semibold text-amber-200">⚠️ DO NOT SHARE THIS CODE WITH ANYONE</p>
              <p>
                This 4-digit PIN protects your unauthorized private data. If an administrator views or inspects your files, they will be required to enter this code.
              </p>
              <p className="text-[11px] text-amber-400/75">
                (You can also view or regenerate this code anytime inside your User Settings.)
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                success('Welcome to your digital vault!');
                navigate('/');
              }}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition shadow-lg shadow-brand-600/30 text-sm"
            >
              I've Saved It, Continue to Vault
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

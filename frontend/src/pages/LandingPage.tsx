import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  ArrowRight,
  Play,
  Shield,
  Cloud,
  Layers,
  Users,
  Database,
  Globe,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Star,
  Image as ImageIcon,
  Video,
  Music,
  Files,
  Wallet,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  Apple,
  Check,
  Sparkles,
  ExternalLink,
  Moon,
  Sun,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { VaultXLogo } from '../components/common/VaultXLogo';
import { HeroDeviceMockup } from '../components/landing/HeroDeviceMockup';
import { VideoDemoModal } from '../components/landing/VideoDemoModal';

const TESTIMONIALS = [
  {
    quote: 'VaultXMedia keeps all my important files safe and accessible. The interface is just perfect!',
    author: 'A Satisfied User',
    role: 'Creative Director',
    avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=120&q=80',
    stars: 5,
  },
  {
    quote: 'The lossless audio streaming and 4K cinema player replace three separate apps for me. Absolutely stellar engineering.',
    author: 'Devin Thorne',
    role: 'Music Producer & Audiophile',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
    stars: 5,
  },
  {
    quote: 'The Google Maps place resolver and trip itinerary planner with expense tracking made my Tokyo getaway effortless.',
    author: 'Priya Sharma',
    role: 'Global Traveler',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&q=80',
    stars: 5,
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeTestimonialIdx, setActiveTestimonialIdx] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  const handleNextTestimonial = () => {
    setActiveTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const handlePrevTestimonial = () => {
    setActiveTestimonialIdx((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const currentTestimonial = TESTIMONIALS[activeTestimonialIdx];

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Dynamic Ambient Background Nebulas */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-10 w-[550px] h-[550px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 left-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px]" />
      </div>

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 h-20 bg-slate-950/80 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <VaultXLogo size="md" withText withBadge badgeText="PRO" to="/" />

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-cyan-400 transition cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="hover:text-cyan-400 transition cursor-pointer"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('security')}
              className="hover:text-cyan-400 transition cursor-pointer"
            >
              Security
            </button>
            <button
              onClick={() => scrollToSection('download')}
              className="hover:text-cyan-400 transition cursor-pointer"
            >
              Download
            </button>
            <button
              onClick={() => scrollToSection('blog')}
              className="hover:text-cyan-400 transition cursor-pointer"
            >
              Blog
            </button>
            <button
              onClick={() => scrollToSection('support')}
              className="hover:text-cyan-400 transition cursor-pointer"
            >
              Support
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setIsDarkTheme(!isDarkTheme)}
              className="w-9 h-9 rounded-full bg-slate-900 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Toggle theme"
            >
              <Moon className="w-4 h-4 text-cyan-300" />
            </button>

            {/* Sign In */}
            <Link
              to="/login"
              className="text-xs sm:text-sm font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-900 transition"
            >
              Sign In
            </Link>

            {/* Get Started Free CTA */}
            <Link
              to="/register"
              className="relative group px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/30 hover:shadow-cyan-500/40 border border-cyan-400/40 transition active:scale-95 overflow-hidden"
            >
              <span className="relative z-10">Get Started Free</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-white/10"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-950/95 border-b border-white/10 p-4 space-y-3 backdrop-blur-2xl animate-in fade-in duration-150">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-300">
              <button
                onClick={() => scrollToSection('features')}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-cyan-400"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-cyan-400"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('security')}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-cyan-400"
              >
                Security
              </button>
              <button
                onClick={() => scrollToSection('download')}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-cyan-400"
              >
                Download
              </button>
              <button
                onClick={() => scrollToSection('blog')}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-cyan-400"
              >
                Blog
              </button>
              <button
                onClick={() => scrollToSection('support')}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-cyan-400"
              >
                Support
              </button>
            </nav>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <Link to="/login" className="text-sm font-bold text-slate-300">
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* MAIN BODY WRAPPER */}
      <main className="relative z-10 flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-10 sm:pt-16 pb-14 sm:pb-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              {/* Left Column: Typography, Pitch, CTAs */}
              <div className="lg:col-span-5 space-y-6 sm:space-y-7 text-left">
                {/* Top Badge Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)] text-cyan-300 text-xs font-mono font-bold tracking-wide">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>YOUR PERSONAL MEDIA CLOUD VAULT</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
                  Store, Organize and <br />
                  Relive{' '}
                  <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(34,211,238,0.3)]">
                    Your Memories
                  </span>
                </h1>

                {/* Subtitle Description */}
                <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-lg">
                  VaultXMedia is a secure, all-in-one cloud vault to store your photos, videos, music, files
                  and more — accessible anywhere, with powerful features and end-to-end encryption.
                </p>

                {/* CTA Action Buttons */}
                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                  {/* Primary CTA */}
                  <Link
                    to="/register"
                    className="group relative inline-flex items-center gap-2.5 px-6 sm:px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base shadow-[0_6px_25px_rgba(6,182,212,0.35)] hover:shadow-[0_8px_30px_rgba(6,182,212,0.5)] border border-cyan-300/40 transition active:scale-95"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  {/* Secondary Video Button */}
                  <button
                    type="button"
                    onClick={() => setIsVideoModalOpen(true)}
                    className="inline-flex items-center gap-2.5 px-5 sm:px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/40 text-slate-200 hover:text-white font-bold text-sm sm:text-base shadow-lg transition active:scale-95 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                    </div>
                    <span>Watch Video</span>
                  </button>
                </div>

                {/* 4 Trust Highlights Below CTAs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-slate-300 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Secure & Private</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Access Anywhere</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>All Your Media</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>End-to-End Encryption</span>
                  </div>
                </div>
              </div>

              {/* Right Column: High Fidelity 3D Laptop & Phone Mockups */}
              <div className="lg:col-span-7 flex justify-center lg:justify-end">
                <HeroDeviceMockup />
              </div>
            </div>
          </div>
        </section>

        {/* METRICS & SATISFIED USER TESTIMONIAL HORIZONTAL BAR */}
        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="rounded-3xl bg-slate-900/70 border border-white/[0.08] backdrop-blur-xl p-4 sm:p-6 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left: 4 Metric Stats */}
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
                {/* Stat 1 */}
                <div className="flex items-center gap-3 pr-2">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-white">50K+</p>
                    <p className="text-xs text-slate-400 font-medium">Happy Users</p>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:px-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-white">1M+</p>
                    <p className="text-xs text-slate-400 font-medium">Memories Stored</p>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:px-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-white">100+</p>
                    <p className="text-xs text-slate-400 font-medium">Countries</p>
                  </div>
                </div>

                {/* Stat 4 */}
                <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:pl-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-black text-white">99.9%</p>
                    <p className="text-xs text-slate-400 font-medium">Uptime</p>
                  </div>
                </div>
              </div>

              {/* Right: Testimonial Carousel Pill */}
              <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-white/[0.08] pt-4 lg:pt-0 lg:pl-6 flex items-center justify-between gap-3">
                {/* Prev Arrow */}
                <button
                  type="button"
                  onClick={handlePrevTestimonial}
                  className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0 cursor-pointer"
                  aria-label="Previous Testimonial"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Content */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={currentTestimonial.avatar}
                    alt={currentTestimonial.author}
                    className="w-11 h-11 rounded-2xl object-cover ring-2 ring-cyan-500/30 shadow-md shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-200 italic line-clamp-2">
                      "{currentTestimonial.quote}"
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-bold text-white truncate">
                        — {currentTestimonial.author}
                      </span>
                      <div className="flex text-amber-400 text-xs">
                        {[...Array(currentTestimonial.stars)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Arrow */}
                <button
                  type="button"
                  onClick={handleNextTestimonial}
                  className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0 cursor-pointer"
                  aria-label="Next Testimonial"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* POWERFUL FEATURES SECTION */}
        <section id="features" className="py-16 sm:py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
            {/* Header */}
            <div className="space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                POWERFUL FEATURES
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Everything You Need in One Secure Platform
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                A modern, fast and secure media vault designed for your digital life.
              </p>
            </div>

            {/* 8 Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
              {/* Feature 1: Photo Gallery */}
              <div className="group p-5 rounded-3xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-cyan-500/40 shadow-xl transition-all duration-300 space-y-3.5">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center transition-transform group-hover:scale-110">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                    Photo Gallery
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Store and organize your photos in high resolution.
                  </p>
                </div>
              </div>

              {/* Feature 2: Video Streaming */}
              <div className="group p-5 rounded-3xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-rose-500/40 shadow-xl transition-all duration-300 space-y-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition">
                    Video Streaming
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Watch your videos anytime, anywhere.
                  </p>
                </div>
              </div>

              {/* Feature 3: Music Player */}
              <div className="group p-5 rounded-3xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-purple-500/40 shadow-xl transition-all duration-300 space-y-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Music className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition">
                    Music Player
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Build your personal music library.
                  </p>
                </div>
              </div>

              {/* Feature 4: File Storage */}
              <div className="group p-5 rounded-3xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-blue-500/40 shadow-xl transition-all duration-300 space-y-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Files className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition">
                    File Storage
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Store any type of file securely in the cloud.
                  </p>
                </div>
              </div>

              {/* Feature 5: Secret Vault */}
              <div className="group p-5 rounded-3xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-indigo-500/40 shadow-xl transition-all duration-300 space-y-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                    Secret Vault
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Extra layer of security for sensitive files.
                  </p>
                </div>
              </div>

              {/* Feature 6: Expense Tracker */}
              <div className="group p-5 rounded-3xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-amber-500/40 shadow-xl transition-all duration-300 space-y-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition">
                    Expense Tracker
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Track and manage your expenses easily.
                  </p>
                </div>
              </div>

              {/* Feature 7: Places & Wishlist */}
              <div className="group p-5 rounded-3xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-pink-500/40 shadow-xl transition-all duration-300 space-y-3.5">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/15 text-pink-400 border border-pink-500/30 flex items-center justify-center transition-transform group-hover:scale-110">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition">
                    Places & Wishlist
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Save your favorite places and future plans.
                  </p>
                </div>
              </div>

              {/* Feature 8: Access Anywhere */}
              <div className="group p-5 rounded-3xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/[0.08] hover:border-sky-500/40 shadow-xl transition-all duration-300 space-y-3.5">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Monitor className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition">
                    Access Anywhere
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Available on web, mobile and desktop.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AVAILABLE EVERYWHERE SECTION */}
        <section id="download" className="py-16 sm:py-24 relative border-t border-white/[0.08] bg-slate-950/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Multi-Device Visual Mockup Composition */}
              <div className="lg:col-span-6 relative flex items-center justify-center">
                {/* Cloud Glow */}
                <div className="absolute inset-0 bg-cyan-500/15 blur-3xl rounded-full pointer-events-none" />

                {/* Screen Trio Composition */}
                <div className="relative w-full max-w-lg flex items-center justify-center">
                  {/* Tablet Screen */}
                  <div className="relative w-44 sm:w-56 h-32 sm:h-40 rounded-2xl bg-slate-900 border border-white/20 p-1.5 shadow-2xl -rotate-6 transform hover:rotate-0 transition duration-500">
                    <img
                      src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80"
                      alt="Tablet Preview"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>

                  {/* Desktop / Laptop Screen */}
                  <div className="relative w-52 sm:w-64 h-36 sm:h-44 rounded-2xl bg-slate-900 border border-cyan-400/40 p-2 shadow-2xl z-10 -ml-10 hover:scale-105 transition duration-500">
                    <img
                      src="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&q=80"
                      alt="Laptop Preview"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>

                  {/* Standing Smartphone */}
                  <div className="relative w-24 sm:w-32 h-44 sm:h-56 rounded-3xl bg-slate-900 border border-white/20 p-1 shadow-2xl z-20 -ml-8 rotate-6 hover:rotate-0 transition duration-500">
                    <img
                      src="https://images.unsplash.com/photo-1518684079-3c830dcef090?w=300&q=80"
                      alt="Phone Preview"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>
                </div>
              </div>

              {/* Text Pitch & Download Action Pills */}
              <div className="lg:col-span-6 space-y-6 text-left">
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                    AVAILABLE EVERYWHERE
                  </span>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                    Your Media, Wherever You Go
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                    Access your files from any device — web, mobile or desktop. Your memories are always with you.
                  </p>
                </div>

                {/* 4 Action Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  {/* Web App */}
                  <Link
                    to="/register"
                    className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-cyan-500/40 flex items-center gap-3 transition group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition">Web App</p>
                      <p className="text-[11px] text-slate-400">Access from any browser</p>
                    </div>
                  </Link>

                  {/* Google Play */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-emerald-500/40 flex items-center gap-3 transition group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Play className="w-5 h-5 fill-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Get it on</p>
                      <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition">Google Play</p>
                    </div>
                  </div>

                  {/* App Store */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-sky-500/40 flex items-center gap-3 transition group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                      <Apple className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Download on the</p>
                      <p className="text-xs font-bold text-white group-hover:text-sky-300 transition">App Store</p>
                    </div>
                  </div>

                  {/* Windows */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-blue-500/40 flex items-center gap-3 transition group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Download for</p>
                      <p className="text-xs font-bold text-white group-hover:text-blue-300 transition">Windows</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-16 sm:py-24 relative border-t border-white/[0.08]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
            <div className="space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                SIMPLE & TRANSPARENT PRICING
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Choose the Vault That Fits Your Needs
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                No hidden costs. Upgrade or cancel anytime with full data export support.
              </p>
            </div>

            {/* 3 Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
              {/* Plan 1: Free Starter */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">
                    Starter
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-white">Free Vault</h3>
                    <p className="text-xs text-slate-400 mt-1">Perfect for getting started with basic cloud storage.</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">₹0</span>
                    <span className="text-xs text-slate-400">/ forever</span>
                  </div>
                  <div className="space-y-2.5 pt-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>10 GB Encrypted Storage</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>Photos & File Drive</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>Basic Music Streaming</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>Cross-Device Web Access</span>
                    </div>
                  </div>
                </div>
                <Link
                  to="/register"
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center transition"
                >
                  Start Free
                </Link>
              </div>

              {/* Plan 2: Pro Explorer (Popular) */}
              <div className="relative p-6 rounded-3xl bg-slate-900/90 border-2 border-cyan-400 shadow-2xl shadow-cyan-500/20 space-y-6 flex flex-col justify-between transform md:-translate-y-2">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md">
                  MOST POPULAR
                </div>
                <div className="space-y-4">
                  <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                    Pro Vault
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-white">Pro Explorer</h3>
                    <p className="text-xs text-slate-400 mt-1">Unlimited media, 4K streaming & secret vault protection.</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">₹299</span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <div className="space-y-2.5 pt-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-white">100 GB Cloud Storage</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>Cinema 4K Video Streaming</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>Hi-Fi Lossless Music Studio</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>Secret Vault with 2FA & PIN</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400" />
                      <span>Google Maps Places & Trip Planner</span>
                    </div>
                  </div>
                </div>
                <Link
                  to="/register"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-xs text-center shadow-lg shadow-cyan-500/30 transition hover:opacity-95"
                >
                  Get Started Free
                </Link>
              </div>

              {/* Plan 3: Lifetime VIP */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/40">
                    Lifetime VIP
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-white">Ultimate Vault</h3>
                    <p className="text-xs text-slate-400 mt-1">One-time payment for lifetime enterprise cloud security.</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">₹6,999</span>
                    <span className="text-xs text-slate-400">/ one-time</span>
                  </div>
                  <div className="space-y-2.5 pt-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-white">1 TB Quantum Cloud Vault</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-400" />
                      <span>Military-Grade AES-256 GCM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-400" />
                      <span>Unlimited Devices & Family Vault</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-400" />
                      <span>Lifetime VIP Concierge Support</span>
                    </div>
                  </div>
                </div>
                <Link
                  to="/register"
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs text-center transition"
                >
                  Claim Lifetime
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY SECTION */}
        <section id="security" className="py-16 sm:py-24 relative border-t border-white/[0.08] bg-slate-950/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
            <div className="space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                MILITARY-GRADE SECURITY
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Engineered for Absolute Confidentiality
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                Your photos, videos, passwords and financial records are protected by zero-knowledge architecture.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-3">
                <ShieldCheck className="w-8 h-8 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Zero-Knowledge Architecture</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Only you possess the cryptographic master keys. Not even VaultXMedia engineers can decrypt your media.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-3">
                <Lock className="w-8 h-8 text-indigo-400" />
                <h3 className="text-base font-bold text-white">AES-256 GCM Cloud Encryption</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every byte uploaded is fragmented and encrypted with quantum-grade AES-256 GCM before cloud transmission.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-3">
                <Sparkles className="w-8 h-8 text-purple-400" />
                <h3 className="text-base font-bold text-white">Two-Factor Biometric Passkeys</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enforce hardware-bound WebAuthn passkeys, FaceID, TouchID, and PIN access for sensitive vault directories.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CALL TO ACTION BANNER */}
        <section className="py-16 sm:py-24 relative border-t border-white/[0.08]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="relative p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-cyan-500/40 shadow-2xl overflow-hidden space-y-6">
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                <Sparkles className="w-3.5 h-3.5" />
                <span>JOIN OVER 50,000+ USERS TODAY</span>
              </span>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                Ready to Secure Your Digital Life?
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                Create your free vault in under 30 seconds. No credit card required.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link
                  to="/register"
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-600 to-indigo-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition"
                >
                  Get Started Free →
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 rounded-2xl bg-slate-900/90 border border-white/15 text-slate-200 hover:text-white font-bold text-sm sm:text-base transition hover:bg-slate-800"
                >
                  Sign In to Vault
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer id="support" className="border-t border-white/[0.08] bg-slate-950 py-12 relative z-10 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand Col */}
            <div className="col-span-2 space-y-4">
              <VaultXLogo size="md" withText withBadge badgeText="PRO" to="/" />
              <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                VaultXMedia is the secure all-in-one cloud vault for photos, 4K videos, lossless audio,
                sensitive documents, expenses and future visit plans.
              </p>
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>All Systems Operational (99.9% Uptime)</span>
              </div>
            </div>

            {/* Col 1: Platform */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Features</p>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-cyan-400 transition cursor-pointer">Photo Gallery</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-cyan-400 transition cursor-pointer">Cinema & Videos</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-cyan-400 transition cursor-pointer">Lossless Music</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-cyan-400 transition cursor-pointer">Secret 2FA Vault</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-cyan-400 transition cursor-pointer">Places & Plans</button></li>
              </ul>
            </div>

            {/* Col 2: Company */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Company</p>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-cyan-400 transition cursor-pointer">Pricing</button></li>
                <li><button onClick={() => scrollToSection('security')} className="hover:text-cyan-400 transition cursor-pointer">Security</button></li>
                <li><button onClick={() => scrollToSection('download')} className="hover:text-cyan-400 transition cursor-pointer">Downloads</button></li>
                <li><span className="hover:text-cyan-400 transition cursor-pointer">About Us</span></li>
                <li><span className="hover:text-cyan-400 transition cursor-pointer">Blog</span></li>
              </ul>
            </div>

            {/* Col 3: Support */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Legal & Help</p>
              <ul className="space-y-2">
                <li><span className="hover:text-cyan-400 transition cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-cyan-400 transition cursor-pointer">Terms of Service</span></li>
                <li><span className="hover:text-cyan-400 transition cursor-pointer">Security Audit</span></li>
                <li><span className="hover:text-cyan-400 transition cursor-pointer">Support Desk</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <p>© {new Date().getFullYear()} VaultXMedia. All rights reserved.</p>
            <p className="font-mono">End-to-End Encrypted Cloud Storage</p>
          </div>
        </div>
      </footer>

      {/* Video Tour Demo Modal */}
      <VideoDemoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Calendar,
  Clock,
  Tag,
  Star,
  ExternalLink,
  Edit3,
  Trash2,
  Bell,
  CheckCircle2,
  ArrowLeft,
  Share2,
  Luggage,
  Sparkles,
  Phone,
  Globe,
  Plus,
  ChevronRight,
  AlertCircle,
  Image as ImageIcon,
  DollarSign,
  Sun,
} from 'lucide-react';
import { placesApi } from '../services/placesApi';
import { Place, PlaceStatus } from '../types';
import { EditPlaceModal } from '../components/places/EditPlaceModal';

const STATUS_CONFIG: Record<
  PlaceStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  WANT_TO_VISIT: {
    label: 'Want to Visit',
    bg: 'bg-indigo-500/20',
    text: 'text-indigo-300',
    border: 'border-indigo-500/30',
    dot: 'bg-indigo-400',
  },
  PLANNED: {
    label: 'Planned',
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-300',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-400',
  },
  UPCOMING: {
    label: 'Upcoming',
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  VISITED: {
    label: 'Visited',
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-500/20',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
  },
};

export const PlaceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [place, setPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Image Selection for Image Viewer
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reminder Quick State
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      loadPlaceDetails(id);
    }
  }, [id]);

  const loadPlaceDetails = async (placeId: string) => {
    try {
      setIsLoading(true);
      setError('');
      const data = await placesApi.getPlaceById(placeId);
      setPlace(data);
      setActiveImageIndex(0);
    } catch (err: any) {
      console.error('Failed to load place details:', err);
      setError(err?.response?.data?.error?.message || 'Place not found or failed to load.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (nextStatus: PlaceStatus) => {
    if (!place || place.status === nextStatus) return;
    try {
      setIsUpdatingStatus(true);
      const updated = await placesApi.updateStatus(place.id, nextStatus);
      setPlace(updated);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeletePlace = async () => {
    if (!place) return;
    try {
      setIsDeleting(true);
      await placesApi.deletePlace(place.id);
      navigate('/places', { replace: true });
    } catch (err) {
      console.error('Failed to delete place:', err);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
        {/* Header Skeleton */}
        <div className="border-b border-white/[0.08] bg-slate-950/60 backdrop-blur-xl sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="h-6 w-32 bg-slate-900 rounded-lg animate-pulse" />
            <div className="h-8 w-24 bg-slate-900 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 space-y-4">
              <div className="h-[450px] rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse" />
              <div className="flex gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-6 space-y-5">
              <div className="h-7 w-48 bg-slate-900 rounded-full animate-pulse" />
              <div className="h-10 w-3/4 bg-slate-900 rounded-xl animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-slate-900 rounded-2xl animate-pulse" />
                <div className="h-20 bg-slate-900 rounded-2xl animate-pulse" />
              </div>
              <div className="h-36 bg-slate-900 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Place Not Found</h2>
          <p className="text-xs text-slate-400">{error || 'The requested destination does not exist or was deleted.'}</p>
          <button
            onClick={() => navigate('/places')}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Places & Plans</span>
          </button>
        </div>
      </div>
    );
  }

  // Determine images array
  const galleryImages: string[] = Array.isArray(place.images) && place.images.length > 0
    ? place.images
    : place.imageUrl
    ? [place.imageUrl]
    : [];

  const currentMainImage = galleryImages[activeImageIndex] || galleryImages[0] || null;
  const statusCfg = STATUS_CONFIG[place.status] || STATUS_CONFIG.WANT_TO_VISIT;

  // Format neat location badge components
  const locationParts = [place.city, place.state, place.country].filter(Boolean);
  const locationString = locationParts.length > 0 ? locationParts.join(', ') : 'Global Destination';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* Top Header / Navigation Bar */}
      <div className="border-b border-white/[0.08] bg-slate-950/70 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Back Button */}
          <button
            onClick={() => navigate('/places')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/[0.08] text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Back to Places &amp; Plans</span>
          </button>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <a
              href={place.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/[0.08] text-cyan-300 text-xs font-bold transition hidden sm:inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Place</span>
            </button>

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800/80 transition cursor-pointer"
              title="Delete place"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* =========================================================================
              LEFT COLUMN: IMAGE SECTION (MATCHING REFERENCE IMAGE LAYOUT)
              ========================================================================= */}
          <div className="lg:col-span-6 space-y-4">
            {/* Main Image Container Card */}
            <div className="relative rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl shadow-black/60 overflow-hidden flex items-center justify-center min-h-[380px] sm:min-h-[460px] max-h-[540px] group">
              {currentMainImage ? (
                <img
                  src={currentMainImage}
                  alt={place.name}
                  className="w-full h-full object-contain max-h-[520px] p-2 transition-transform duration-300 group-hover:scale-[1.02]"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                  <div className="w-16 h-16 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-3">
                    <Compass className="w-8 h-8 text-slate-600" />
                  </div>
                  <span className="text-sm font-semibold">No photo available</span>
                </div>
              )}

              {/* Neat Status Pill Badge with Glowing Indicator Dot (Top Left - matching reference image) */}
              <div className="absolute top-4 left-4 z-10">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg border text-xs font-bold tracking-wide ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusCfg.dot} animate-pulse shadow-sm`} />
                  <span>{statusCfg.label}</span>
                </div>
              </div>

              {/* Rating Pill (Top Right) */}
              {place.rating !== undefined && place.rating !== null && (
                <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-full bg-slate-950/80 border border-white/10 text-amber-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow-md">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{place.rating.toFixed(1)}</span>
                  {place.userRatingsTotal && (
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({place.userRatingsTotal.toLocaleString()})
                    </span>
                  )}
                </div>
              )}

              {/* Google Attribution if available */}
              {place.photoAttributions && place.photoAttributions.length > 0 && (
                <div
                  className="absolute bottom-2 right-3 text-[9px] text-white/70 bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-xs"
                  dangerouslySetInnerHTML={{ __html: place.photoAttributions[0] }}
                />
              )}
            </div>

            {/* Thumbnail Images Row (Matching Reference Image) */}
            <div className="flex items-center gap-3 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-slate-800">
              {galleryImages.map((imgUrl, idx) => {
                const isActive = idx === activeImageIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-2 transition-all duration-200 shrink-0 cursor-pointer bg-slate-900/90 ${
                      isActive
                        ? 'border-cyan-400 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/25 scale-105'
                        : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${place.name} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 bg-black/75 text-cyan-300 text-[8px] font-extrabold px-1 rounded">
                        MAIN
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Quick Add Image Button in Thumbnail Row */}
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-900/40 hover:bg-slate-900 text-slate-400 hover:text-cyan-300 transition flex flex-col items-center justify-center gap-1 shrink-0 cursor-pointer text-center p-1"
                title="Add or edit images"
              >
                <Plus className="w-5 h-5" />
                <span className="text-[10px] font-bold">Add Photo</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN: FULL PLACE DETAILS & ACTIONS
              ========================================================================= */}
          <div className="lg:col-span-6 space-y-6">
            {/* Neat Location Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wide shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{locationString}</span>
              </div>

              {place.category && (
                <span className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold">
                  {place.category}
                </span>
              )}
            </div>

            {/* Place Name Heading */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                {place.name}
              </h1>

              {/* Quick Location Pills: Country, State, City */}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                {place.city && (
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
                    <span>City:</span>
                    <strong className="text-white">{place.city}</strong>
                  </span>
                )}
                {place.city && place.state && <span>•</span>}
                {place.state && (
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
                    <span>State:</span>
                    <strong className="text-white">{place.state}</strong>
                  </span>
                )}
                {(place.city || place.state) && place.country && <span>•</span>}
                {place.country && (
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
                    <span>Country:</span>
                    <strong className="text-white">{place.country}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Highlights Grid: Best Time to Visit & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Best Time to Visit Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex items-start gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Best Time to Visit
                  </span>
                  <span className="text-sm font-bold text-amber-200 mt-0.5 block">
                    {place.bestTimeToVisit || 'Flexible / Year-round'}
                  </span>
                </div>
              </div>

              {/* Price / Entry Fee Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex items-start gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Price / Entry Fee
                  </span>
                  <span className="text-sm font-bold text-emerald-300 mt-0.5 block">
                    {place.price || 'Free / Not Specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>About this Destination</span>
              </h3>
              {place.description ? (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {place.description}
                </p>
              ) : (
                <div className="text-xs text-slate-500 italic py-1 flex items-center justify-between">
                  <span>No description added yet.</span>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline"
                  >
                    + Add Description
                  </button>
                </div>
              )}
            </div>

            {/* Address & Direct Navigation */}
            <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Address &amp; Directions
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{place.address || 'Address details not provided'}</span>
                  </p>
                </div>

                <a
                  href={place.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Open Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Contact info if available */}
              {(place.phoneNumber || place.website) && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-4 text-xs text-slate-300">
                  {place.phoneNumber && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{place.phoneNumber}</span>
                    </div>
                  )}
                  {place.website && (
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-cyan-400 hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Official Website</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Visit Status & Reminder Controls */}
            <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Status &amp; Schedule
                </span>
                <span className="text-xs text-slate-400">Click to update status</span>
              </div>

              {/* Status Switcher Buttons */}
              <div className="flex flex-wrap gap-2">
                {(['WANT_TO_VISIT', 'PLANNED', 'UPCOMING', 'VISITED'] as PlaceStatus[]).map((st) => {
                  const cfg = STATUS_CONFIG[st];
                  const isSelected = place.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? `${cfg.bg} ${cfg.text} border ${cfg.border} ring-2 ring-white/10 shadow-md`
                          : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Scheduled Reminder Status */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span>
                    Reminder:{' '}
                    <strong className="text-white">
                      {place.reminderDate
                        ? `${new Date(place.reminderDate).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })} at ${place.reminderTime || '09:00'}`
                        : 'None scheduled'}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline"
                >
                  {place.reminderDate ? 'Edit Reminder' : '+ Set Reminder'}
                </button>
              </div>

              {/* Associated Trip Plans */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Luggage className="w-4 h-4 text-pink-400 shrink-0" />
                  <span className="text-xs text-slate-400">
                    Trip Plan:{' '}
                    <strong className="text-white">
                      {place.tripPlans && place.tripPlans.length > 0
                        ? place.tripPlans[0].tripPlan.name
                        : 'None'}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-pink-400 hover:text-pink-300 text-xs font-bold hover:underline"
                >
                  {place.tripPlans && place.tripPlans.length > 0 ? 'Change' : '+ Add to Trip'}
                </button>
              </div>
            </div>

            {/* Notes & Tags */}
            {(place.notes || (place.tags && place.tags.length > 0)) && (
              <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-3">
                {place.notes && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Private Notes
                    </span>
                    <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                      {place.notes}
                    </p>
                  </div>
                )}

                {place.tags && place.tags.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {place.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-950 border border-slate-800 text-cyan-300"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Place Modal */}
      <EditPlaceModal
        place={place}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={(updated) => {
          setPlace(updated);
          setActiveImageIndex(0);
        }}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete Destination?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to remove <strong>{place.name}</strong> from your saved places? This cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePlace}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceDetailsPage;

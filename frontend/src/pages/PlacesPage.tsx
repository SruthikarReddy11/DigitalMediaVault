import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Plus,
  Search,
  ExternalLink,
  Calendar,
  Clock,
  Star,
  CheckCircle2,
  Bell,
  Trash2,
  Edit3,
  Luggage,
  Sparkles,
  AlertCircle,
  X,
  Phone,
  Globe,
  Tag,
  Share2,
  ChevronRight,
  Filter,
  Upload,
  DollarSign,
  Sun,
  Image as ImageIcon,
} from 'lucide-react';
import { placesApi } from '../services/placesApi';
import { EditPlaceModal } from '../components/places/EditPlaceModal';
import {
  Place,
  PlaceStatus,
  ResolvedPlaceData,
  TripPlan,
  CreatePlaceInput,
  CreateTripPlanInput,
} from '../types';

const STATUS_CONFIG: Record<
  PlaceStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  WANT_TO_VISIT: {
    label: 'Want to Visit',
    bg: 'bg-indigo-500/20',
    text: 'text-indigo-300',
    border: 'border-indigo-500/30',
  },
  PLANNED: {
    label: 'Planned',
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-300',
    border: 'border-cyan-500/30',
  },
  UPCOMING: {
    label: 'Upcoming',
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
  },
  VISITED: {
    label: 'Visited',
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-500/20',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
  },
};

export const PlacesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'PLACES' | 'TRIPS'>('PLACES');
  const [places, setPlaces] = useState<Place[]>([]);
  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<PlaceStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recently_added' | 'upcoming_reminder' | 'alphabetical' | 'recently_visited'>('recently_added');

  // Save Place Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [resolvedPreview, setResolvedPreview] = useState<ResolvedPlaceData | null>(null);

  // Complete details for saving
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveBestTimeToVisit, setSaveBestTimeToVisit] = useState('');
  const [savePrice, setSavePrice] = useState('');
  const [saveCountry, setSaveCountry] = useState('');
  const [saveState, setSaveState] = useState('');
  const [saveCity, setSaveCity] = useState('');
  const [saveAddress, setSaveAddress] = useState('');
  const [saveCategory, setSaveCategory] = useState('');
  const [saveImages, setSaveImages] = useState<string[]>([]);
  const [saveNewImageUrl, setSaveNewImageUrl] = useState('');
  const [saveImageError, setSaveImageError] = useState('');

  const [saveStatus, setSaveStatus] = useState<PlaceStatus>('WANT_TO_VISIT');
  const [saveNotes, setSaveNotes] = useState('');
  const [saveTags, setSaveTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saveReminderDate, setSaveReminderDate] = useState('');
  const [saveReminderTime, setSaveReminderTime] = useState('09:00');
  const [saveReminderOption, setSaveReminderOption] = useState('EXACT');
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Reminder Modal State
  const [reminderModalPlace, setReminderModalPlace] = useState<Place | null>(null);
  const [modalReminderDate, setModalReminderDate] = useState('');
  const [modalReminderTime, setModalReminderTime] = useState('09:00');
  const [modalReminderOption, setModalReminderOption] = useState('EXACT');

  // Trip Creation Modal State
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [tripName, setTripName] = useState('');
  const [tripDestination, setTripDestination] = useState('');
  const [tripDescription, setTripDescription] = useState('');
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');
  const [tripColor, setTripColor] = useState('#ec4899');
  const [tripPlaceIds, setTripPlaceIds] = useState<string[]>([]);
  const [isSavingTrip, setIsSavingTrip] = useState(false);

  // Trip Detail Drawer State
  const [selectedTripDetail, setSelectedTripDetail] = useState<TripPlan | null>(null);
  const [isAddingPlacesToTrip, setIsAddingPlacesToTrip] = useState(false);

  // Delete Place Confirmation
  const [deletingPlace, setDeletingPlace] = useState<Place | null>(null);

  // Edit Place Modal State
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);

  const fetchPlaces = async () => {
    try {
      setIsLoading(true);
      const data = await placesApi.listPlaces({
        status: statusFilter,
        search: searchQuery || undefined,
        sort: sortBy,
      });
      setPlaces(data || []);
    } catch (err) {
      console.error('Failed to load places:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrips = async () => {
    try {
      const data = await placesApi.listTrips();
      setTrips(data || []);
    } catch (err) {
      console.error('Failed to load trips:', err);
    }
  };

  useEffect(() => {
    fetchPlaces();
    fetchTrips();
  }, [statusFilter, searchQuery, sortBy]);

  // Handle URL Resolution
  const handleResolveUrl = async () => {
    if (!inputUrl.trim()) return;

    try {
      setIsResolving(true);
      setResolveError('');
      const data = await placesApi.resolveUrl(inputUrl.trim());
      setResolvedPreview(data);
      setSaveName(data.name || '');
      setSaveDescription(data.description || '');
      setSaveBestTimeToVisit(data.bestTimeToVisit || '');
      setSavePrice(data.price || '');
      setSaveCountry(data.country || '');
      setSaveState(data.state || '');
      setSaveCity(data.city || '');
      setSaveAddress(data.address || '');
      setSaveCategory(data.category || '');
      const imgs = Array.isArray(data.images) && data.images.length > 0
        ? [...data.images]
        : data.imageUrl
        ? [data.imageUrl]
        : [];
      setSaveImages(imgs);
      setSaveNewImageUrl('');
      setSaveImageError('');
    } catch (err: any) {
      setResolveError(err.response?.data?.error?.message || 'Could not resolve Google Maps place.');
    } finally {
      setIsResolving(false);
    }
  };

  const handleAddSaveImageUrl = () => {
    const trimmed = saveNewImageUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
      setSaveImageError('Please enter a valid URL (http:// or https://)');
      return;
    }
    if (saveImages.includes(trimmed)) {
      setSaveImageError('Image URL is already added.');
      return;
    }
    setSaveImages((prev) => [...prev, trimmed]);
    setSaveNewImageUrl('');
    setSaveImageError('');
  };

  const handleSaveFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        setSaveImages((prev) => [...prev, result]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveSaveImage = (indexToRemove: number) => {
    setSaveImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetSaveCover = (indexToCover: number) => {
    if (indexToCover === 0) return;
    setSaveImages((prev) => {
      const item = prev[indexToCover];
      const rest = prev.filter((_, idx) => idx !== indexToCover);
      return [item, ...rest];
    });
  };

  // Handle Save Place Confirmation
  const handleConfirmSavePlace = async () => {
    if (!inputUrl.trim()) return;

    try {
      setIsSaving(true);
      const payload: CreatePlaceInput = {
        googleMapsUrl: inputUrl.trim(),
        name: saveName.trim() || resolvedPreview?.name || 'Saved Place',
        description: saveDescription.trim() || undefined,
        bestTimeToVisit: saveBestTimeToVisit.trim() || undefined,
        price: savePrice.trim() || undefined,
        images: saveImages,
        placeId: resolvedPreview?.placeId || undefined,
        address: saveAddress.trim() || resolvedPreview?.address || undefined,
        city: saveCity.trim() || resolvedPreview?.city || undefined,
        state: saveState.trim() || resolvedPreview?.state || undefined,
        country: saveCountry.trim() || resolvedPreview?.country || undefined,
        latitude: resolvedPreview?.latitude || undefined,
        longitude: resolvedPreview?.longitude || undefined,
        category: saveCategory.trim() || resolvedPreview?.category || undefined,
        rating: resolvedPreview?.rating || undefined,
        userRatingsTotal: resolvedPreview?.userRatingsTotal || undefined,
        phoneNumber: resolvedPreview?.phoneNumber || undefined,
        website: resolvedPreview?.website || undefined,
        openingHours: resolvedPreview?.openingHours || undefined,
        imageUrl: saveImages.length > 0 ? saveImages[0] : (resolvedPreview?.imageUrl || undefined),
        photoReference: resolvedPreview?.photoReference || undefined,
        photoAttributions: resolvedPreview?.photoAttributions || [],
        notes: saveNotes.trim() || undefined,
        tags: saveTags,
        status: saveStatus,
        reminderDate: saveReminderDate || undefined,
        reminderTime: saveReminderDate ? saveReminderTime : undefined,
        reminderOption: saveReminderDate ? saveReminderOption : undefined,
        tripPlanId: selectedTripId || undefined,
        syncCalendar: true,
      };

      await placesApi.createPlace(payload);
      setIsSaveModalOpen(false);
      setInputUrl('');
      setResolvedPreview(null);
      setSaveName('');
      setSaveDescription('');
      setSaveBestTimeToVisit('');
      setSavePrice('');
      setSaveCountry('');
      setSaveState('');
      setSaveCity('');
      setSaveAddress('');
      setSaveCategory('');
      setSaveImages([]);
      setSaveNotes('');
      setSaveTags([]);
      setSaveReminderDate('');
      fetchPlaces();
      window.dispatchEvent(new CustomEvent('calendar_events_updated'));
    } catch (err: any) {
      setResolveError(err.response?.data?.error?.message || 'Failed to save place.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Quick Status Update
  const handleUpdateStatus = async (placeId: string, nextStatus: PlaceStatus) => {
    try {
      await placesApi.updateStatus(placeId, nextStatus);
      fetchPlaces();
      window.dispatchEvent(new CustomEvent('calendar_events_updated'));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Set Reminder Modal
  const handleSaveReminder = async () => {
    if (!reminderModalPlace) return;

    try {
      await placesApi.updatePlace(reminderModalPlace.id, {
        reminderDate: modalReminderDate || null,
        reminderTime: modalReminderDate ? modalReminderTime : null,
        reminderOption: modalReminderDate ? modalReminderOption : null,
      });
      setReminderModalPlace(null);
      fetchPlaces();
      window.dispatchEvent(new CustomEvent('calendar_events_updated'));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Save Trip
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripName.trim()) return;

    try {
      setIsSavingTrip(true);
      const payload: CreateTripPlanInput = {
        name: tripName.trim(),
        destination: tripDestination.trim() || undefined,
        description: tripDescription.trim() || undefined,
        startDate: tripStartDate || undefined,
        endDate: tripEndDate || undefined,
        color: tripColor,
        placeIds: tripPlaceIds.length > 0 ? tripPlaceIds : undefined,
      };
      await placesApi.createTrip(payload);
      setIsTripModalOpen(false);
      setTripName('');
      setTripDestination('');
      setTripDescription('');
      setTripStartDate('');
      setTripEndDate('');
      setTripPlaceIds([]);
      fetchTrips();
      fetchPlaces();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingTrip(false);
    }
  };

  // Handle Add Place to Active Trip
  const handleAddPlaceToTrip = async (placeId: string) => {
    if (!selectedTripDetail) return;
    try {
      const updated = await placesApi.addPlaceToTrip(selectedTripDetail.id, placeId);
      setSelectedTripDetail(updated);
      fetchTrips();
      fetchPlaces();
    } catch (err) {
      console.error('Failed to add place to trip:', err);
    }
  };

  // Handle Remove Place from Active Trip
  const handleRemovePlaceFromTrip = async (placeId: string) => {
    if (!selectedTripDetail) return;
    try {
      const updated = await placesApi.removePlaceFromTrip(selectedTripDetail.id, placeId);
      setSelectedTripDetail(updated);
      fetchTrips();
      fetchPlaces();
    } catch (err) {
      console.error('Failed to remove place from trip:', err);
    }
  };

  // Handle Delete Place
  const handleDeletePlaceConfirm = async () => {
    if (!deletingPlace) return;

    try {
      await placesApi.deletePlace(deletingPlace.id);
      setDeletingPlace(null);
      fetchPlaces();
      window.dispatchEvent(new CustomEvent('calendar_events_updated'));
    } catch (err) {
      console.error(err);
    }
  };

  // Open Trip Details
  const handleOpenTripDetail = async (tripId: string) => {
    try {
      const detail = await placesApi.getTripById(tripId);
      setSelectedTripDetail(detail);
      setIsAddingPlacesToTrip(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Header */}
      <div className="border-b border-white/[0.08] bg-slate-950/60 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-white tracking-tight">Places & Plans</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Google Places API
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Save travel destinations, trip itineraries, reminders & visit plans
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsTripModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                <Luggage className="w-4 h-4 text-pink-400" />
                <span>+ New Trip Plan</span>
              </button>

              <button
                onClick={() => {
                  setIsSaveModalOpen(true);
                  setResolvedPreview(null);
                  setInputUrl('');
                  setResolveError('');
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 border border-cyan-400/30 flex items-center gap-2 transition cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                <span>Save Place</span>
              </button>
            </div>
          </div>

          {/* Subheader: Tabs, Search & Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-white/[0.06]">
            {/* View Tabs */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/[0.08]">
              <button
                onClick={() => setActiveTab('PLACES')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'PLACES'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Saved Places ({places.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('TRIPS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'TRIPS'
                    ? 'bg-pink-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Luggage className="w-3.5 h-3.5" />
                <span>Trips & Plans ({trips.length})</span>
              </button>
            </div>

            {/* Search & Sort */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, city, tags..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-white/[0.08] focus:border-cyan-500 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="recently_added">Recently Added</option>
                <option value="upcoming_reminder">Upcoming Reminder</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="recently_visited">Recently Visited</option>
              </select>
            </div>
          </div>

          {/* Status Filter Tabs (Only in Places View) */}
          {activeTab === 'PLACES' && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
              {(['ALL', 'WANT_TO_VISIT', 'PLANNED', 'UPCOMING', 'VISITED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition shrink-0 ${
                    statusFilter === st
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {st === 'ALL' ? 'All Places' : STATUS_CONFIG[st].label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'PLACES' ? (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-80 rounded-3xl bg-slate-900/50 border border-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : places.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-500">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-300">No saved places found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Paste any Google Maps link to instantly resolve place photos, ratings, address, and set future visit reminders.
                </p>
                <button
                  onClick={() => setIsSaveModalOpen(true)}
                  className="mt-2 px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Save Your First Place</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {places.map((place) => renderPlaceCard(place))}
              </div>
            )}
          </>
        ) : (
          /* TRIPS & PLANS VIEW */
          renderTripsView()
        )}
      </div>

      {/* MODALS */}
      {renderSavePlaceModal()}
      {renderReminderModal()}
      {renderTripCreateModal()}
      {renderTripDetailDrawer()}
      {renderDeletePlaceModal()}

      <EditPlaceModal
        place={editingPlace}
        isOpen={!!editingPlace}
        onClose={() => setEditingPlace(null)}
        onSuccess={(updated) => {
          setPlaces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          setEditingPlace(null);
        }}
      />
    </div>
  );

  /**
   * Render Place Card matching user's exact specification:
   * Place Image, Place Name, Address, Category, Rating, [Open in Google Maps], Reminder, [Set Reminder] [Edit] [Mark as Visited]
   */
  function renderPlaceCard(place: Place) {
    const statusCfg = STATUS_CONFIG[place.status] || STATUS_CONFIG.WANT_TO_VISIT;

    return (
      <div
        key={place.id}
        onClick={() => navigate(`/places/${place.id}`)}
        className="rounded-3xl bg-slate-900/80 border border-slate-800/90 hover:border-cyan-500/40 shadow-xl hover:shadow-cyan-500/10 transition-all duration-200 overflow-hidden flex flex-col justify-between group cursor-pointer"
      >
        {/* Top: Place Image with Status Badge */}
        <div className="relative h-44 bg-slate-950 overflow-hidden">
          {place.imageUrl ? (
            <img
              src={place.imageUrl}
              alt={place.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-950 to-slate-900 text-slate-600">
              <MapPin className="w-10 h-10 mb-1 opacity-50" />
              <span className="text-[11px] font-medium">No photo available</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-lg ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
            >
              {statusCfg.label}
            </span>
          </div>

          {/* Google Attribution if present */}
          {place.photoAttributions && place.photoAttributions.length > 0 && (
            <div
              className="absolute bottom-1 right-2 text-[9px] text-white/70 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs"
              dangerouslySetInnerHTML={{ __html: place.photoAttributions[0] }}
            />
          )}

          {/* Rating Badge */}
          {place.rating !== undefined && place.rating !== null && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-slate-950/80 border border-white/10 text-amber-300 text-xs font-bold flex items-center gap-1 backdrop-blur-md">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{place.rating.toFixed(1)}</span>
              {place.userRatingsTotal && (
                <span className="text-[10px] text-slate-400">({place.userRatingsTotal})</span>
              )}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-2.5 flex-1">
          {/* Category & Location */}
          <div className="flex items-center gap-2 text-[11px] text-cyan-400 font-bold uppercase tracking-wider">
            <span>{place.category || 'Point of Interest'}</span>
            {place.city && <span>• {place.city}</span>}
          </div>

          {/* Place Name */}
          <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
            {place.name}
          </h3>

          {/* Address */}
          {place.address && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>{place.address}</span>
            </p>
          )}

          {/* Open in Google Maps */}
          <div>
            <a
              href={place.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline pt-1"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Associated Trip Plan Pill */}
          {place.tripPlans && place.tripPlans.length > 0 && (
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-300 bg-pink-500/15 border border-pink-500/30 px-2 py-0.5 rounded-md">
                <Luggage className="w-3 h-3" />
                <span>{place.tripPlans[0].tripPlan.name}</span>
              </span>
            </div>
          )}

          {/* Reminder Section */}
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Bell className="w-3 h-3 text-cyan-400" />
                <span>Reminder:</span>
              </span>
              <span className="font-bold text-white">
                {place.reminderDate
                  ? new Date(place.reminderDate).toLocaleDateString(undefined, {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'None scheduled'}
              </span>
            </div>
          </div>
        </div>

        {/* Card Actions Footer: [Set Reminder] [Edit] [Mark as Visited] */}
        <div className="px-4 py-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setReminderModalPlace(place);
              setModalReminderDate(
                place.reminderDate ? new Date(place.reminderDate).toISOString().split('T')[0] : ''
              );
              setModalReminderTime(place.reminderTime || '09:00');
              setModalReminderOption(place.reminderOption || 'EXACT');
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            title="Set Reminder"
          >
            <Bell className="w-3 h-3 text-cyan-400" />
            <span>Reminder</span>
          </button>

          {place.status !== 'VISITED' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(place.id, 'VISITED');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1 border border-emerald-500/30 transition cursor-pointer"
              title="Mark as Visited"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Visited</span>
            </button>
          ) : (
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Visited</span>
            </span>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingPlace(place);
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Edit place details"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeletingPlace(place);
              }}
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
              title="Delete place"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render Trips & Plans View (e.g. "Japan Trip" collections)
   */
  function renderTripsView() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white">Trip Itineraries & Collections</h2>
            <p className="text-xs text-slate-400">
              Connect saved places, travel notes, photos, expense receipts & calendar events under a shared trip
            </p>
          </div>

          <button
            onClick={() => setIsTripModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-pink-500/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Trip Plan</span>
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-900/40 rounded-3xl border border-slate-800">
            <Luggage className="w-10 h-10 text-pink-400 mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-slate-300">No trips planned yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Plan your next getaway, like "Japan Trip 2027", and group places to visit with notes, expenses and photos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => handleOpenTripDetail(trip.id)}
                className="rounded-3xl bg-slate-900/80 border border-slate-800/80 hover:border-pink-500/40 p-5 space-y-4 hover:shadow-xl hover:shadow-pink-500/5 transition cursor-pointer group"
                style={{ borderTopColor: trip.color || '#ec4899', borderTopWidth: 4 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition">
                      {trip.name}
                    </h3>
                    {trip.destination && (
                      <p className="text-xs text-cyan-400 font-semibold mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{trip.destination}</span>
                      </p>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    {trip.status}
                  </span>
                </div>

                {trip.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{trip.description}</p>
                )}

                {/* Counts */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center text-[11px]">
                  <div className="bg-slate-950/60 p-2 rounded-xl">
                    <span className="font-bold text-white">{trip._count?.places || 0}</span>
                    <p className="text-[10px] text-slate-500">Places</p>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl">
                    <span className="font-bold text-white">{trip._count?.notes || 0}</span>
                    <p className="text-[10px] text-slate-500">Notes</p>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl">
                    <span className="font-bold text-white">{trip._count?.files || 0}</span>
                    <p className="text-[10px] text-slate-500">Photos</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>
                    {trip.startDate
                      ? new Date(trip.startDate).toLocaleDateString()
                      : 'Flexible dates'}
                  </span>
                  <span className="text-pink-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition">
                    View Trip Details <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /**
   * 1. SAVE PLACE MODAL (Google Maps link resolution & preview)
   */
  function renderSavePlaceModal() {
    if (!isSaveModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Save Place from Google Maps</h3>
            </div>
            <button
              onClick={() => setIsSaveModalOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* URL Input & Resolve button */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              Paste Google Maps Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/... or https://google.com/maps/place/..."
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleResolveUrl}
                disabled={isResolving || !inputUrl.trim()}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                {isResolving ? (
                  <div className="w-4 h-4 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Detect Place</span>
                  </>
                )}
              </button>
            </div>

            {resolveError && (
              <p className="text-xs text-red-400 flex items-center gap-1 pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{resolveError}</span>
              </p>
            )}
          </div>

          {/* PREVIEW & COMPLETE DETAILS FORM */}
          {resolvedPreview && (
            <div className="rounded-2xl bg-slate-950 border border-cyan-500/30 p-5 space-y-4 animate-in fade-in duration-150 max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              {/* Place Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Place Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Place name"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={saveCategory}
                    onChange={(e) => setSaveCategory(e.target.value)}
                    placeholder="e.g. Landmark, Beach"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Best Time to Visit & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-400" />
                    <span>Best Time to Visit</span>
                  </label>
                  <input
                    type="text"
                    value={saveBestTimeToVisit}
                    onChange={(e) => setSaveBestTimeToVisit(e.target.value)}
                    placeholder="e.g. October to March, Winter"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    <span>Price / Entry Fee / Budget</span>
                  </label>
                  <input
                    type="text"
                    value={savePrice}
                    onChange={(e) => setSavePrice(e.target.value)}
                    placeholder="e.g. ₹500 / person, Free, $25"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Place Description
                </label>
                <textarea
                  rows={2}
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Describe highlights, history, sightseeing tips..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none resize-none"
                />
              </div>

              {/* Country, State, City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    value={saveCity}
                    onChange={(e) => setSaveCity(e.target.value)}
                    placeholder="e.g. Agra"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">State</label>
                  <input
                    type="text"
                    value={saveState}
                    onChange={(e) => setSaveState(e.target.value)}
                    placeholder="e.g. Uttar Pradesh"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Country</label>
                  <input
                    type="text"
                    value={saveCountry}
                    onChange={(e) => setSaveCountry(e.target.value)}
                    placeholder="e.g. India"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Full Address</label>
                <input
                  type="text"
                  value={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.value)}
                  placeholder="Full street address..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              {/* Multiple Images Gallery */}
              <div className="pt-2 border-t border-slate-900 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Multiple Photos & Gallery ({saveImages.length})</span>
                  </label>
                  <span className="text-[10px] text-slate-400">First image is used as cover</span>
                </div>

                {/* Thumbnails */}
                {saveImages.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {saveImages.map((img, idx) => (
                      <div
                        key={idx}
                        className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 group bg-slate-900 ${
                          idx === 0 ? 'border-cyan-500' : 'border-slate-800'
                        }`}
                      >
                        <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-0.5 left-0.5 bg-cyan-500 text-slate-950 text-[8px] font-extrabold px-1 rounded">
                            COVER
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetSaveCover(idx)}
                              className="p-1 rounded bg-cyan-600 text-white text-[9px] font-bold"
                              title="Set as cover"
                            >
                              Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveSaveImage(idx)}
                            className="p-1 rounded bg-rose-600 text-white hover:bg-rose-500"
                            title="Remove image"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Image Inputs */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={saveNewImageUrl}
                    onChange={(e) => {
                      setSaveNewImageUrl(e.target.value);
                      setSaveImageError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSaveImageUrl();
                      }
                    }}
                    placeholder="Paste another image URL (https://...)"
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSaveImageUrl}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add URL</span>
                  </button>
                  <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer shrink-0">
                    <Upload className="w-3 h-3 text-pink-400" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSaveFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {saveImageError && (
                  <p className="text-[11px] text-rose-400">{saveImageError}</p>
                )}
              </div>

              {/* Status, Trip, Reminder Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-900">
                {/* Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                  <select
                    value={saveStatus}
                    onChange={(e: any) => setSaveStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="WANT_TO_VISIT">Want to Visit</option>
                    <option value="PLANNED">Planned</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="VISITED">Visited</option>
                  </select>
                </div>

                {/* Associate Trip */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Connect to Trip (Optional)
                  </label>
                  <select
                    value={selectedTripId}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="">-- None --</option>
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reminder Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Future Visit Reminder
                  </label>
                  <input
                    type="date"
                    value={saveReminderDate}
                    onChange={(e) => setSaveReminderDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Reminder Option */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Reminder Notification Timing
                  </label>
                  <select
                    value={saveReminderOption}
                    onChange={(e) => setSaveReminderOption(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="EXACT">Exact date & time</option>
                    <option value="ONE_DAY_BEFORE">1 day before</option>
                    <option value="ONE_WEEK_BEFORE">1 week before</option>
                    <option value="ONE_MONTH_BEFORE">1 month before</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Personal Travel Notes
                </label>
                <textarea
                  rows={2}
                  value={saveNotes}
                  onChange={(e) => setSaveNotes(e.target.value)}
                  placeholder="e.g. Try their famous ramen, best sunset spot, need reservations..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none resize-none"
                />
              </div>

              {/* Confirm Save Button */}
              <button
                type="button"
                onClick={handleConfirmSavePlace}
                disabled={isSaving}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Save to Places & Plans</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /**
   * 2. SET REMINDER MODAL
   */
  function renderReminderModal() {
    if (!reminderModalPlace) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Set Visit Reminder</h3>
            </div>
            <button
              onClick={() => setReminderModalPlace(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Remind me to visit <span className="font-bold text-white">"{reminderModalPlace.name}"</span>
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Reminder Date</label>
              <input
                type="date"
                value={modalReminderDate}
                onChange={(e) => setModalReminderDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Time (Optional)</label>
              <input
                type="time"
                value={modalReminderTime}
                onChange={(e) => setModalReminderTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Notify Timing</label>
              <select
                value={modalReminderOption}
                onChange={(e) => setModalReminderOption(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="EXACT">Exact date & time</option>
                <option value="ONE_DAY_BEFORE">1 day before</option>
                <option value="ONE_WEEK_BEFORE">1 week before</option>
                <option value="ONE_MONTH_BEFORE">1 month before</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setReminderModalPlace(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveReminder}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              Save Reminder
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * 3. CREATE TRIP PLAN MODAL
   */
  function renderTripCreateModal() {
    if (!isTripModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Luggage className="w-5 h-5 text-pink-400" />
              <h3 className="text-sm font-bold text-white">Create Trip Plan</h3>
            </div>
            <button onClick={() => setIsTripModalOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateTrip} className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Trip Name *</label>
              <input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="e.g. Japan Trip 2027"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Destination / Country</label>
              <input
                type="text"
                value={tripDestination}
                onChange={(e) => setTripDestination(e.target.value)}
                placeholder="e.g. Tokyo & Kyoto, Japan"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={tripStartDate}
                  onChange={(e) => setTripStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={tripEndDate}
                  onChange={(e) => setTripEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Notes / Description</label>
              <textarea
                rows={2}
                value={tripDescription}
                onChange={(e) => setTripDescription(e.target.value)}
                placeholder="Trip overview, packing checklist reminders..."
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none resize-none"
              />
            </div>

            {/* Select Places to Add */}
            {places.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center justify-between">
                  <span>Add Saved Places ({tripPlaceIds.length} selected)</span>
                  <span className="text-[10px] text-slate-500">Optional</span>
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  {places.map((p) => {
                    const isSelected = tripPlaceIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setTripPlaceIds(tripPlaceIds.filter((id) => id !== p.id));
                          } else {
                            setTripPlaceIds([...tripPlaceIds, p.id]);
                          }
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                            : 'bg-slate-900/60 hover:bg-slate-900 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold truncate">{p.name}</p>
                          {p.city && <p className="text-[10px] text-slate-500 truncate">{p.city}</p>}
                        </div>
                        <span className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                          isSelected ? 'bg-pink-600 border-pink-500 text-white font-bold' : 'border-slate-700'
                        }`}>
                          {isSelected ? '✓' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTripModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingTrip || !tripName.trim()}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-lg shadow-pink-500/25 transition cursor-pointer"
              >
                Create Trip
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /**
   * 4. TRIP DETAIL DRAWER (Shows associated Places, Notes, Photos, Expenses, Calendar)
   */
  function renderTripDetailDrawer() {
    if (!selectedTripDetail) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
        <div className="w-full max-w-2xl bg-slate-950 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 flex flex-col justify-between shadow-2xl">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  {selectedTripDetail.status}
                </span>
                <h2 className="text-xl font-extrabold text-white mt-1">
                  {selectedTripDetail.name}
                </h2>
                {selectedTripDetail.destination && (
                  <p className="text-xs text-cyan-400 font-semibold flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{selectedTripDetail.destination}</span>
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedTripDetail(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Places associated with this trip */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>Trip Places ({selectedTripDetail.places?.length || 0})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingPlacesToTrip(!isAddingPlacesToTrip)}
                  className="px-2.5 py-1 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingPlacesToTrip ? 'Done' : '+ Add Places'}</span>
                </button>
              </div>

              {/* Add Places to Trip Drawer Picker */}
              {isAddingPlacesToTrip && (
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-cyan-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400">Select places to attach:</span>
                    <span className="text-[10px] text-slate-400">Click Add to attach instantly</span>
                  </div>

                  {places.filter((p) => !selectedTripDetail.places?.some((tp) => (tp.place?.id || tp.placeId) === p.id)).length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">
                      All your saved places are already added to this trip plan!
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {places
                        .filter((p) => !selectedTripDetail.places?.some((tp) => (tp.place?.id || tp.placeId) === p.id))
                        .map((p) => (
                          <div
                            key={p.id}
                            className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{p.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{p.city || p.address || 'No address'}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddPlaceToTrip(p.id)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[11px] shrink-0 transition cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {(!selectedTripDetail.places || selectedTripDetail.places.length === 0) ? (
                <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-400">
                    No places saved under this trip yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddingPlacesToTrip(true)}
                    className="text-xs text-cyan-400 font-bold hover:underline"
                  >
                    + Add your first place to this trip
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedTripDetail.places.map((tp) => {
                    const placeId = tp.place?.id || tp.placeId;
                    return (
                      <div
                        key={tp.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 group"
                      >
                        <div
                          onClick={() => {
                            if (placeId) navigate(`/places/${placeId}`);
                          }}
                          className="min-w-0 cursor-pointer flex-1"
                        >
                          <p className="text-xs font-bold text-white hover:text-cyan-300 transition truncate">
                            {tp.place?.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{tp.place?.address || tp.place?.city}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {tp.place?.googleMapsUrl && (
                            <a
                              href={tp.place.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-cyan-300 p-1.5 rounded-lg hover:bg-slate-800 transition"
                              title="Open in Google Maps"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (placeId) handleRemovePlaceFromTrip(placeId);
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                            title="Remove from trip"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes connected with this trip */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand-400" />
                <span>Connected Notes ({selectedTripDetail.notes?.length || 0})</span>
              </h3>
              {(!selectedTripDetail.notes || selectedTripDetail.notes.length === 0) ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-900/40 rounded-xl">
                  No notes linked to this trip.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedTripDetail.notes.map((tn) => (
                    <div
                      key={tn.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <span className="text-xs font-semibold text-white">{tn.note.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setSelectedTripDetail(null)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold hover:bg-slate-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * 5. DELETE PLACE CONFIRMATION MODAL
   */
  function renderDeletePlaceModal() {
    if (!deletingPlace) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-3xl shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
            <Trash2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white">Delete Saved Place?</h3>
            <p className="text-xs text-slate-400 mt-1">
              "{deletingPlace.name}" will be removed from your saved places.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeletingPlace(null)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeletePlaceConfirm}
              className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition cursor-pointer"
            >
              Delete Place
            </button>
          </div>
        </div>
      </div>
    );
  }
};

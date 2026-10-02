import React, { useState, useEffect } from 'react';
import {
  X,
  Luggage,
  Calendar,
  MapPin,
  DollarSign,
  Hotel,
  Plane,
  Utensils,
  Ticket,
  ShoppingBag,
  Plus,
  Trash2,
  Check,
  Search,
  ExternalLink,
  Loader2,
  Sparkles,
  Compass,
  Layers,
  CheckSquare,
  FileText,
  Clock,
} from 'lucide-react';
import {
  TripPlan,
  CreateTripPlanInput,
  Place,
  TripExpenseItem,
  TripHotelDetails,
  TripTravelDetails,
  TripItineraryDay,
  TripChecklistItem,
} from '../../types';
import { tripPlansApi } from '../../services/tripPlansApi';
import { placesApi } from '../../services/placesApi';
import { useToast } from '../../contexts/ToastContext';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (trip: TripPlan) => void;
  tripToEdit?: TripPlan | null;
  initialPlaceId?: string;
}

const PRESET_COLORS = [
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#f43f5e', // Rose
  '#6366f1', // Indigo
];

const EXPENSE_CATEGORIES = [
  'Hotel / Stay',
  'Travel / Flight / Train',
  'Food & Dining',
  'Activities & Sightseeing',
  'Shopping & Souvenirs',
  'Local Transit / Cab',
  'Insurance & Visa',
  'Miscellaneous / Buffer',
];

const PACKING_SUGGESTIONS = [
  'Passport & Travel Visas',
  'Flight / Train Tickets & Hotel Vouchers',
  'Government ID / Driver’s License',
  'Debit / Credit Cards & Cash',
  'Phone & Laptop Chargers',
  'Power Bank & Universal Travel Adapter',
  'First Aid & Personal Medications',
  'Comfortable Walking Shoes',
  'Sunscreen & Sunglasses',
  'Camera & Memory Cards',
  'Weather-appropriate Clothing',
  'Toiletry Kit & Sanitizer',
];

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  tripToEdit,
  initialPlaceId,
}) => {
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'places' | 'hotel_travel' | 'expenses' | 'itinerary'>('overview');

  // Form states
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysCount, setDaysCount] = useState<number | ''>('');
  const [budget, setBudget] = useState<number | ''>('');
  const [status, setStatus] = useState('PLANNING');
  const [color, setColor] = useState('#ec4899');
  const [coverImage, setCoverImage] = useState('');

  // Places state
  const [availablePlaces, setAvailablePlaces] = useState<Place[]>([]);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
  const [placeSearch, setPlaceSearch] = useState('');

  // On-the-fly Google Maps place addition
  const [mapUrlInput, setMapUrlInput] = useState('');
  const [isResolvingMap, setIsResolvingMap] = useState(false);

  // Hotel details
  const [hotelDetails, setHotelDetails] = useState<TripHotelDetails>({
    name: '',
    address: '',
    checkIn: '',
    checkOut: '',
    cost: 0,
    roomType: '',
    notes: '',
  });

  // Travel details
  const [travelDetails, setTravelDetails] = useState<TripTravelDetails>({
    mode: 'Flight',
    departureLocation: '',
    arrivalLocation: '',
    departureTime: '',
    arrivalTime: '',
    pnrOrBookingRef: '',
    cost: 0,
    notes: '',
  });

  // Custom Expenses
  const [customExpenses, setCustomExpenses] = useState<TripExpenseItem[]>([]);
  const [newExpCategory, setNewExpCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [customCatInput, setCustomCatInput] = useState('');
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpAmount, setNewExpAmount] = useState<number | ''>('');
  const [newExpNotes, setNewExpNotes] = useState('');

  // Itinerary
  const [itinerary, setItinerary] = useState<TripItineraryDay[]>([]);

  // Checklist
  const [checklist, setChecklist] = useState<TripChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load all user's saved places for selection
  useEffect(() => {
    placesApi
      .listPlaces()
      .then((data) => setAvailablePlaces(data || []))
      .catch((err) => console.error('Failed to load places:', err));
  }, [isOpen]);

  // Initialize or reset form
  useEffect(() => {
    if (tripToEdit) {
      setName(tripToEdit.name || '');
      setDestination(tripToEdit.destination || '');
      setDescription(tripToEdit.description || '');
      setStartDate(tripToEdit.startDate ? new Date(tripToEdit.startDate).toISOString().split('T')[0] : '');
      setEndDate(tripToEdit.endDate ? new Date(tripToEdit.endDate).toISOString().split('T')[0] : '');
      setDaysCount(tripToEdit.daysCount || '');
      setBudget(tripToEdit.budget || '');
      setStatus(tripToEdit.status || 'PLANNING');
      setColor(tripToEdit.color || '#ec4899');
      setCoverImage(tripToEdit.coverImage || '');

      const existingPlaceIds = tripToEdit.places?.map((p) => p.placeId || p.place?.id).filter(Boolean) as string[] || [];
      setSelectedPlaceIds(existingPlaceIds);

      setHotelDetails(tripToEdit.hotelDetails || { name: '', address: '', checkIn: '', checkOut: '', cost: 0, notes: '', roomType: '' });
      setTravelDetails(tripToEdit.travelDetails || { mode: 'Flight', departureLocation: '', arrivalLocation: '', departureTime: '', arrivalTime: '', pnrOrBookingRef: '', cost: 0, notes: '' });
      setCustomExpenses(tripToEdit.customExpenses || []);
      setItinerary(tripToEdit.itinerary || []);
      setChecklist(tripToEdit.checklist || []);
    } else {
      setName('');
      setDestination('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setDaysCount('');
      setBudget('');
      setStatus('PLANNING');
      setColor('#ec4899');
      setCoverImage('');
      setSelectedPlaceIds(initialPlaceId ? [initialPlaceId] : []);
      setHotelDetails({ name: '', address: '', checkIn: '', checkOut: '', cost: 0, notes: '', roomType: '' });
      setTravelDetails({ mode: 'Flight', departureLocation: '', arrivalLocation: '', departureTime: '', arrivalTime: '', pnrOrBookingRef: '', cost: 0, notes: '' });
      setCustomExpenses([]);
      setItinerary([]);
      setChecklist([]);
      setActiveTab('overview');
    }
  }, [tripToEdit, isOpen, initialPlaceId]);

  // Auto calculate duration in days when start & end date change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      if (end >= start) {
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        setDaysCount(diffDays);
      }
    }
  }, [startDate, endDate]);

  if (!isOpen) return null;

  // Add a Place using Google Maps Link on the fly
  const handleResolveAndAddMapPlace = async () => {
    if (!mapUrlInput.trim()) {
      toastError('Please paste a Google Maps URL first.');
      return;
    }

    try {
      setIsResolvingMap(true);
      const resolved = await placesApi.resolveUrl(mapUrlInput.trim());

      // Save as Place in database
      const newPlace = await placesApi.createPlace({
        googleMapsUrl: mapUrlInput.trim(),
        name: resolved.name || 'Saved Place',
        description: resolved.description || undefined,
        address: resolved.address || undefined,
        city: resolved.city || undefined,
        state: resolved.state || undefined,
        country: resolved.country || undefined,
        latitude: resolved.latitude ?? undefined,
        longitude: resolved.longitude ?? undefined,
        category: resolved.category || undefined,
        rating: resolved.rating ?? undefined,
        userRatingsTotal: resolved.userRatingsTotal ?? undefined,
        phoneNumber: resolved.phoneNumber || undefined,
        website: resolved.website || undefined,
        openingHours: resolved.openingHours || undefined,
        imageUrl: resolved.imageUrl || undefined,
        photoReference: resolved.photoReference || undefined,
      });

      // Add to available places and auto-select
      setAvailablePlaces((prev) => [newPlace, ...prev]);
      if (!selectedPlaceIds.includes(newPlace.id)) {
        setSelectedPlaceIds((prev) => [...prev, newPlace.id]);
      }

      setMapUrlInput('');
      success(`Added "${newPlace.name}" to trip places!`);
    } catch (err: any) {
      toastError(err.message || 'Failed to resolve location from Maps URL.');
    } finally {
      setIsResolvingMap(false);
    }
  };

  // Toggle Place Selection
  const togglePlaceSelect = (id: string) => {
    setSelectedPlaceIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // Add Expense Item
  const handleAddExpense = () => {
    if (!newExpTitle.trim()) {
      toastError('Expense title/description is required.');
      return;
    }
    const amountVal = Number(newExpAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toastError('Please enter a valid expense amount.');
      return;
    }

    const finalCategory = customCatInput.trim() || newExpCategory;

    const newItem: TripExpenseItem = {
      id: Date.now().toString(),
      category: finalCategory,
      title: newExpTitle.trim(),
      amount: amountVal,
      currency: '₹',
      notes: newExpNotes.trim() || undefined,
      date: new Date().toISOString().split('T')[0],
    };

    setCustomExpenses([...customExpenses, newItem]);
    setNewExpTitle('');
    setNewExpAmount('');
    setNewExpNotes('');
    setCustomCatInput('');
    success('Expense item added!');
  };

  const handleRemoveExpense = (id: string) => {
    setCustomExpenses(customExpenses.filter((e) => e.id !== id));
  };

  // Add Checklist Item
  const handleAddChecklist = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!checklist.some((c) => c.text.toLowerCase() === trimmed.toLowerCase())) {
      setChecklist([...checklist, { id: Date.now().toString(), text: trimmed, isDone: false }]);
    }
    setNewChecklistText('');
  };

  const handleRemoveChecklist = (id: string) => {
    setChecklist(checklist.filter((c) => c.id !== id));
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist(checklist.map((c) => (c.id === id ? { ...c, isDone: !c.isDone } : c)));
  };

  // Total Expenses Calculation
  const totalHotelCost = Number(hotelDetails.cost) || 0;
  const totalTravelCost = Number(travelDetails.cost) || 0;
  const totalCustomExpenses = customExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const grandTotalExpenses = totalHotelCost + totalTravelCost + totalCustomExpenses;

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toastError('Trip name is required.');
      setActiveTab('overview');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: CreateTripPlanInput = {
        name: name.trim(),
        destination: destination.trim() || undefined,
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        daysCount: daysCount ? Number(daysCount) : undefined,
        budget: budget ? Number(budget) : undefined,
        status,
        color,
        coverImage: coverImage.trim() || undefined,
        placeIds: selectedPlaceIds,
        hotelDetails,
        travelDetails,
        customExpenses,
        itinerary,
        checklist,
      };

      let result: TripPlan;
      if (tripToEdit) {
        result = await tripPlansApi.updateTrip(tripToEdit.id, payload);
        success('Trip plan updated successfully!');
      } else {
        result = await tripPlansApi.createTrip(payload);
        success('New trip plan created!');
      }

      onSaved(result);
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Failed to save trip plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl text-white shadow-lg"
              style={{ backgroundColor: color }}
            >
              <Luggage className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {tripToEdit ? 'Edit Trip Plan' : 'Plan a New Trip'}
              </h2>
              <p className="text-xs text-slate-400">
                Craft your itinerary, select places, organize hotel & travel expenses
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-2 border-b border-white/10 flex items-center gap-2 overflow-x-auto bg-slate-900/50">
          {[
            { id: 'overview', label: '1. Overview & Dates', icon: Calendar },
            { id: 'places', label: `2. Places to Visit (${selectedPlaceIds.length})`, icon: MapPin },
            { id: 'hotel_travel', label: '3. Hotel & Transit', icon: Hotel },
            { id: 'expenses', label: `4. Expenses (₹${grandTotalExpenses.toLocaleString()})`, icon: DollarSign },
            { id: 'itinerary', label: '5. Itinerary & Checklist', icon: CheckSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-brand-500 text-brand-300 bg-brand-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW & DATES */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Trip Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Goa Beach Vacation 2027"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-pink-400" />
                    Destination / City / Country
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. North Goa, India"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Dates & Duration */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    Trip Schedule & Duration
                  </span>
                  {daysCount ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      ⏱ {daysCount} Days {typeof daysCount === 'number' && daysCount > 1 ? `& ${daysCount - 1} Nights` : ''}
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Or How Many Days?
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={daysCount}
                      onChange={(e) => setDaysCount(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 5"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Budget, Status & Theme Color */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Target Budget (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 50000"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Trip Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="BOOKED">Booked & Confirmed</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          color === c ? 'scale-125 ring-2 ring-white shadow-md' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Cover Image & Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cover Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Trip Overview & Notes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a brief overview of what this trip is about, who you are traveling with, goals..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PLACES & MAPS LINK */}
          {activeTab === 'places' && (
            <div className="space-y-6 animate-fade-in">
              {/* Option to Add Place on the fly with Google Maps Link */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-slate-950 border border-cyan-500/20 space-y-2">
                <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  Add a New Place using Google Maps Link
                </label>
                <p className="text-[11px] text-slate-400">
                  Paste any Google Maps link (e.g. hotel, beach, cafe, attraction) to automatically extract its name, photos, address, and add it to your trip!
                </p>
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    value={mapUrlInput}
                    onChange={(e) => setMapUrlInput(e.target.value)}
                    placeholder="https://maps.google.com/?cid=... or https://maps.app.goo.gl/..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleResolveAndAddMapPlace}
                    disabled={isResolvingMap || !mapUrlInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-all shrink-0"
                  >
                    {isResolvingMap ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Resolving...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Add from Maps</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Select from Saved Places */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Select from Saved Places ({selectedPlaceIds.length} Selected)
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Check any places you want to visit on this trip
                    </p>
                  </div>

                  <div className="relative w-48 sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={placeSearch}
                      onChange={(e) => setPlaceSearch(e.target.value)}
                      placeholder="Search places..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {availablePlaces.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-white/5 text-slate-400 text-xs">
                    No places saved yet. Paste a Google Maps URL above to add your first place!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {availablePlaces
                      .filter((p) =>
                        p.name.toLowerCase().includes(placeSearch.toLowerCase()) ||
                        (p.city && p.city.toLowerCase().includes(placeSearch.toLowerCase())) ||
                        (p.category && p.category.toLowerCase().includes(placeSearch.toLowerCase()))
                      )
                      .map((p) => {
                        const isSelected = selectedPlaceIds.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => togglePlaceSelect(p.id)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-brand-500/15 border-brand-500/40 text-white shadow-md'
                                : 'bg-slate-950/60 border-white/5 hover:border-white/20 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Thumbnail */}
                              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 overflow-hidden shrink-0">
                                {p.imageUrl ? (
                                  <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                                    <MapPin className="w-5 h-5" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <h4 className="text-xs font-bold truncate">{p.name}</h4>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {p.city ? `${p.city}, ` : ''}{p.country || p.address || 'Location'}
                                </p>
                                {p.rating && (
                                  <span className="text-[10px] text-amber-400 font-bold">
                                    ★ {p.rating}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                                isSelected
                                  ? 'bg-brand-600 border-brand-500 text-white'
                                  : 'border-white/20 text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: HOTEL & TRANSIT */}
          {activeTab === 'hotel_travel' && (
            <div className="space-y-6 animate-fade-in">
              {/* Hotel / Stay Section */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Hotel className="w-4 h-4 text-amber-400" />
                    Hotel & Accommodation
                  </span>
                  {hotelDetails.cost ? (
                    <span className="text-xs font-mono font-bold text-amber-400">
                      ₹{Number(hotelDetails.cost).toLocaleString()}
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Hotel / Resort / Airbnb Name
                    </label>
                    <input
                      type="text"
                      value={hotelDetails.name || ''}
                      onChange={(e) => setHotelDetails({ ...hotelDetails, name: e.target.value })}
                      placeholder="e.g. Taj Holiday Village Resort"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Hotel Expense Cost (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={hotelDetails.cost || ''}
                      onChange={(e) => setHotelDetails({ ...hotelDetails, cost: Number(e.target.value) || 0 })}
                      placeholder="e.g. 18000"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Check-In Date
                    </label>
                    <input
                      type="date"
                      value={hotelDetails.checkIn || ''}
                      onChange={(e) => setHotelDetails({ ...hotelDetails, checkIn: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Check-Out Date
                    </label>
                    <input
                      type="date"
                      value={hotelDetails.checkOut || ''}
                      onChange={(e) => setHotelDetails({ ...hotelDetails, checkOut: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Room Type / Notes
                    </label>
                    <input
                      type="text"
                      value={hotelDetails.roomType || ''}
                      onChange={(e) => setHotelDetails({ ...hotelDetails, roomType: e.target.value })}
                      placeholder="e.g. Sea View Villa"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Booking Reference / Address / Link
                  </label>
                  <input
                    type="text"
                    value={hotelDetails.address || ''}
                    onChange={(e) => setHotelDetails({ ...hotelDetails, address: e.target.value })}
                    placeholder="e.g. Booking #BK948271 or Sinquerim Beach, Candolim"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Travel & Transit Section */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Plane className="w-4 h-4 text-cyan-400" />
                    Travel & Transportation
                  </span>
                  {travelDetails.cost ? (
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      ₹{Number(travelDetails.cost).toLocaleString()}
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Transit Mode
                    </label>
                    <select
                      value={travelDetails.mode || 'Flight'}
                      onChange={(e) => setTravelDetails({ ...travelDetails, mode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
                    >
                      <option value="Flight">✈️ Flight</option>
                      <option value="Train">🚆 Train</option>
                      <option value="Car / Drive">🚗 Car / Drive</option>
                      <option value="Bus">🚌 Bus</option>
                      <option value="Cruise / Ferry">🚢 Cruise / Ferry</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Departure City / Airport
                    </label>
                    <input
                      type="text"
                      value={travelDetails.departureLocation || ''}
                      onChange={(e) => setTravelDetails({ ...travelDetails, departureLocation: e.target.value })}
                      placeholder="e.g. Mumbai (BOM)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Arrival Destination
                    </label>
                    <input
                      type="text"
                      value={travelDetails.arrivalLocation || ''}
                      onChange={(e) => setTravelDetails({ ...travelDetails, arrivalLocation: e.target.value })}
                      placeholder="e.g. Goa (GOX)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      PNR / Ticket / Flight Number
                    </label>
                    <input
                      type="text"
                      value={travelDetails.pnrOrBookingRef || ''}
                      onChange={(e) => setTravelDetails({ ...travelDetails, pnrOrBookingRef: e.target.value })}
                      placeholder="e.g. 6E-2045 (PNR: WXYZ89)"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Transit Expense Cost (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={travelDetails.cost || ''}
                      onChange={(e) => setTravelDetails({ ...travelDetails, cost: Number(e.target.value) || 0 })}
                      placeholder="e.g. 8500"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXPENSES BREAKDOWN & MENTIONING */}
          {activeTab === 'expenses' && (
            <div className="space-y-6 animate-fade-in">
              {/* Grand Total Expense Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Total Estimated Trip Cost
                  </span>
                  <div className="text-2xl font-black text-white">
                    ₹{grandTotalExpenses.toLocaleString()}
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400 space-y-0.5">
                  <div>Hotel: <strong className="text-white">₹{totalHotelCost.toLocaleString()}</strong></div>
                  <div>Travel: <strong className="text-white">₹{totalTravelCost.toLocaleString()}</strong></div>
                  <div>Activities/Food/Other: <strong className="text-white">₹{totalCustomExpenses.toLocaleString()}</strong></div>
                </div>
              </div>

              {/* Add New Expense Form (Dropdown & Custom Mentioning) */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  Add Expenses (Select Category or Mention Custom)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Category (Dropdown)
                    </label>
                    <select
                      value={newExpCategory}
                      onChange={(e) => setNewExpCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Or Mention Custom Category:
                    </label>
                    <input
                      type="text"
                      value={customCatInput}
                      onChange={(e) => setCustomCatInput(e.target.value)}
                      placeholder="e.g. Scuba Diving, Scooty Rental"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newExpAmount}
                      onChange={(e) => setNewExpAmount(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 2500"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Title / Description *
                    </label>
                    <input
                      type="text"
                      value={newExpTitle}
                      onChange={(e) => setNewExpTitle(e.target.value)}
                      placeholder="e.g. Seafood Dinner at Fishermans Wharf, Water sports package"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddExpense}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Expenses
                    </button>
                  </div>
                </div>
              </div>

              {/* Expenses Table / List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Logged Trip Expenses ({customExpenses.length})
                </span>

                {customExpenses.length === 0 ? (
                  <div className="p-6 text-center bg-slate-950/40 rounded-2xl border border-white/5 text-slate-500 text-xs">
                    No custom food, sightseeing, or rental expenses added yet. Use the form above to add any items!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customExpenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {exp.category}
                          </span>
                          <span className="font-semibold text-white">{exp.title}</span>
                          {exp.notes && (
                            <span className="text-slate-400 text-[11px]">({exp.notes})</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-emerald-400">
                            ₹{exp.amount.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExpense(exp.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ITINERARY & CHECKLIST */}
          {activeTab === 'itinerary' && (
            <div className="space-y-6 animate-fade-in">
              {/* Packing Checklist */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-purple-400" />
                    Trip Packing List & Checklist
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {checklist.filter((c) => c.isDone).length} of {checklist.length} packed
                  </span>
                </div>

                {/* Add new custom checklist item */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklist(newChecklistText);
                      }
                    }}
                    placeholder="Type an item (e.g. Scuba gear, Passport, Power bank) and press Enter"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddChecklist(newChecklistText)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                  >
                    Add Item
                  </button>
                </div>

                {/* Quick Add Suggestions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">Quick suggestions:</span>
                  {PACKING_SUGGESTIONS.map((sug) => {
                    const exists = checklist.some((c) => c.text === sug);
                    if (exists) return null;
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddChecklist(sug)}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                      >
                        + {sug}
                      </button>
                    );
                  })}
                </div>

                {/* Checklist items list */}
                {checklist.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {checklist.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                          item.isDone
                            ? 'bg-purple-950/20 border-purple-500/30 text-purple-300 line-through'
                            : 'bg-slate-900/60 border-white/5 text-slate-200'
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer select-none min-w-0">
                          <input
                            type="checkbox"
                            checked={item.isDone}
                            onChange={() => handleToggleChecklist(item.id)}
                            className="rounded text-purple-600 bg-slate-800 border-white/20"
                          />
                          <span className="truncate">{item.text}</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleRemoveChecklist(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 ml-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {activeTab !== 'overview' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'places') setActiveTab('overview');
                    if (activeTab === 'hotel_travel') setActiveTab('places');
                    if (activeTab === 'expenses') setActiveTab('hotel_travel');
                    if (activeTab === 'itinerary') setActiveTab('expenses');
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Previous
                </button>
              )}

              {activeTab !== 'itinerary' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'overview') setActiveTab('places');
                    if (activeTab === 'places') setActiveTab('hotel_travel');
                    if (activeTab === 'hotel_travel') setActiveTab('expenses');
                    if (activeTab === 'expenses') setActiveTab('itinerary');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-colors"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 shadow-lg shadow-pink-500/25 flex items-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{tripToEdit ? 'Save Changes' : 'Create Trip Plan'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

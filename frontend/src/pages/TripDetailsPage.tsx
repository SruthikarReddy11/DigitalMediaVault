import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Luggage,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Hotel,
  Plane,
  Utensils,
  Ticket,
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ExternalLink,
  Search,
  CheckSquare,
  FileText,
  AlertCircle,
  Share2,
  Compass,
  Phone,
  Globe,
  Loader2,
  Sparkles,
  X,
  Check,
} from 'lucide-react';
import { TripPlan, Place, TripExpenseItem, TripItineraryDay, TripChecklistItem } from '../types';
import { tripPlansApi } from '../services/tripPlansApi';
import { placesApi } from '../services/placesApi';
import { useToast } from '../contexts/ToastContext';
import { formatDate } from '../utils/formatters';
import { CreateTripModal } from '../components/trips/CreateTripModal';

export const TripDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active section tab
  const [activeTab, setActiveTab] = useState<'itinerary' | 'expenses' | 'places' | 'logistics' | 'checklist'>('itinerary');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Add Place to Trip Modal State
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [placeSearch, setPlaceSearch] = useState('');
  const [mapsUrlInput, setMapsUrlInput] = useState('');
  const [isResolvingMap, setIsResolvingMap] = useState(false);

  // Quick Add Expense State
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expCategory, setExpCategory] = useState('Food & Dining');
  const [customExpCategory, setCustomExpCategory] = useState('');
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState<number | ''>('');
  const [expNotes, setExpNotes] = useState('');

  // Quick Add Checklist Item
  const [newChecklistText, setNewChecklistText] = useState('');

  const fetchTripDetails = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await tripPlansApi.getTripById(id);
      setTrip(data);
    } catch (err: any) {
      toastError(err.message || 'Failed to load trip details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  // Load saved places when add place modal opens
  useEffect(() => {
    if (isAddPlaceOpen) {
      placesApi.listPlaces().then((p) => setSavedPlaces(p || [])).catch(() => {});
    }
  }, [isAddPlaceOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Loading trip itinerary & details...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center space-y-4 text-center">
        <Luggage className="w-12 h-12 text-slate-600" />
        <h2 className="text-lg font-bold text-white">Trip Plan Not Found</h2>
        <button
          onClick={() => navigate('/plans')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
        >
          Back to Trip Plans
        </button>
      </div>
    );
  }

  // Cost calculations
  const hotelCost = Number(trip.hotelDetails?.cost) || 0;
  const travelCost = Number(trip.travelDetails?.cost) || 0;
  const customExpenses = trip.customExpenses || [];
  const customCost = customExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalCost = hotelCost + travelCost + customCost;

  // Breakdown by category
  const categoryTotals: Record<string, number> = {};
  if (hotelCost > 0) categoryTotals['Hotel & Stay'] = hotelCost;
  if (travelCost > 0) categoryTotals['Travel & Transit'] = travelCost;
  for (const e of customExpenses) {
    const cat = e.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount || 0);
  }

  // Checklist completion
  const checklist = trip.checklist || [];
  const packedCount = checklist.filter((c) => c.isDone).length;

  // Attached places
  const places = trip.places?.map((p) => p.place).filter(Boolean) || [];

  // Toggle Checklist Item in database
  const handleToggleChecklist = async (itemId: string) => {
    const updatedChecklist = checklist.map((item) =>
      item.id === itemId ? { ...item, isDone: !item.isDone } : item
    );
    setTrip({ ...trip, checklist: updatedChecklist });

    try {
      await tripPlansApi.updateTrip(trip.id, { checklist: updatedChecklist });
    } catch {
      // Revert if error
      setTrip(trip);
    }
  };

  // Add Checklist item in database
  const handleAddChecklist = async () => {
    if (!newChecklistText.trim()) return;
    const newItem = { id: Date.now().toString(), text: newChecklistText.trim(), isDone: false };
    const updated = [...checklist, newItem];
    setTrip({ ...trip, checklist: updated });
    setNewChecklistText('');

    try {
      await tripPlansApi.updateTrip(trip.id, { checklist: updated });
      success('Item added to packing list!');
    } catch {
      setTrip(trip);
    }
  };

  // Delete Checklist item
  const handleDeleteChecklist = async (itemId: string) => {
    const updated = checklist.filter((c) => c.id !== itemId);
    setTrip({ ...trip, checklist: updated });
    try {
      await tripPlansApi.updateTrip(trip.id, { checklist: updated });
    } catch {
      setTrip(trip);
    }
  };

  // Quick Add Expense
  const handleAddQuickExpense = async () => {
    if (!expTitle.trim() || !expAmount || Number(expAmount) <= 0) {
      toastError('Please enter a valid title and amount.');
      return;
    }

    const finalCat = customExpCategory.trim() || expCategory;
    const newExp: TripExpenseItem = {
      id: Date.now().toString(),
      category: finalCat,
      title: expTitle.trim(),
      amount: Number(expAmount),
      currency: '₹',
      notes: expNotes.trim() || undefined,
      date: new Date().toISOString().split('T')[0],
    };

    const updatedExpenses = [...customExpenses, newExp];
    setTrip({ ...trip, customExpenses: updatedExpenses });
    setIsAddExpenseOpen(false);
    setExpTitle('');
    setExpAmount('');
    setExpNotes('');
    setCustomExpCategory('');

    try {
      await tripPlansApi.updateTrip(trip.id, { customExpenses: updatedExpenses });
      success('Expense added to trip!');
    } catch (err: any) {
      toastError(err.message || 'Failed to save expense.');
      setTrip(trip);
    }
  };

  // Remove Expense
  const handleRemoveExpense = async (expId: string) => {
    const updated = customExpenses.filter((e) => e.id !== expId);
    setTrip({ ...trip, customExpenses: updated });

    try {
      await tripPlansApi.updateTrip(trip.id, { customExpenses: updated });
      success('Expense removed.');
    } catch {
      setTrip(trip);
    }
  };

  // Add Place from Maps Link
  const handleAddFromMapUrl = async () => {
    if (!mapsUrlInput.trim()) return;

    try {
      setIsResolvingMap(true);
      const res = await tripPlansApi.createAndAddPlaceFromMapUrl(trip.id, mapsUrlInput.trim());
      setTrip(res.trip);
      setMapsUrlInput('');
      setIsAddPlaceOpen(false);
      success(`Added "${res.place.name}" to trip!`);
    } catch (err: any) {
      toastError(err.message || 'Failed to add place from Maps URL.');
    } finally {
      setIsResolvingMap(false);
    }
  };

  // Add Existing Place to Trip
  const handleAddExistingPlace = async (placeId: string) => {
    try {
      const updated = await tripPlansApi.addPlaceToTrip(trip.id, placeId);
      setTrip(updated);
      setIsAddPlaceOpen(false);
      success('Place added to trip!');
    } catch (err: any) {
      toastError(err.message || 'Failed to add place.');
    }
  };

  // Remove Place from Trip
  const handleRemovePlace = async (placeId: string) => {
    try {
      const updated = await tripPlansApi.removePlaceFromTrip(trip.id, placeId);
      setTrip(updated);
      success('Place removed from trip.');
    } catch (err: any) {
      toastError(err.message || 'Failed to remove place.');
    }
  };

  // Delete entire trip
  const handleDeleteTrip = async () => {
    if (!window.confirm(`Are you sure you want to delete "${trip.name}"?`)) return;

    try {
      await tripPlansApi.deleteTrip(trip.id);
      success('Trip plan deleted.');
      navigate('/plans');
    } catch (err: any) {
      toastError(err.message || 'Failed to delete trip.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Navigation & Action Row */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/plans')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Trip Plans</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Edit Plan</span>
          </button>

          <button
            onClick={handleDeleteTrip}
            className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            title="Delete Trip"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Presentation Header */}
      <div
        className="relative rounded-3xl overflow-hidden border border-white/15 bg-slate-900 shadow-2xl"
        style={{ borderTopColor: trip.color || '#ec4899', borderTopWidth: 5 }}
      >
        {/* Cover Background */}
        <div className="relative h-48 sm:h-64 w-full bg-slate-950 overflow-hidden">
          {trip.coverImage ? (
            <img
              src={trip.coverImage}
              alt={trip.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${trip.color || '#ec4899'}33, #020617 80%)`,
              }}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          {/* Floating Details on Cover */}
          <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {trip.destination && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 backdrop-blur-md">
                    <MapPin className="w-3.5 h-3.5" />
                    {trip.destination}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-white border border-white/15 backdrop-blur-md">
                  {trip.status}
                </span>
                {trip.daysCount && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
                    ⏱ {trip.daysCount} Days {trip.daysCount > 1 ? `& ${trip.daysCount - 1} Nights` : ''}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {trip.name}
              </h1>

              {(trip.startDate || trip.endDate) && (
                <p className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {trip.startDate ? formatDate(trip.startDate) : 'Start'}
                    {' — '}
                    {trip.endDate ? formatDate(trip.endDate) : 'End'}
                  </span>
                </p>
              )}
            </div>

            {/* Quick Summary Pill */}
            <div className="p-3 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/10 shrink-0 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Total Expenses
              </span>
              <span className="text-xl font-mono font-black text-emerald-400">
                ₹{totalCost.toLocaleString()}
              </span>
              {trip.budget && (
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Target Budget: ₹{trip.budget.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Duration */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Trip Duration</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-white">
            {trip.daysCount ? `${trip.daysCount} Days` : 'Flexible'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {trip.daysCount && trip.daysCount > 1 ? `${trip.daysCount - 1} Nights Stay` : 'Day Trip'}
          </div>
        </div>

        {/* Expenses */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Total Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-mono font-black text-emerald-400">
            ₹{totalCost.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {Object.keys(categoryTotals).length} categories
          </div>
        </div>

        {/* Places */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Places to Visit</span>
            <Compass className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-white">
            {places.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Saved locations linked
          </div>
        </div>

        {/* Packing Checklist */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Packing List</span>
            <CheckSquare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-purple-400">
            {checklist.length > 0 ? `${packedCount}/${checklist.length}` : '0 Items'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {checklist.length > 0
              ? `${Math.round((packedCount / checklist.length) * 100)}% packed`
              : 'Add items below'}
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-md overflow-x-auto">
        {[
          { id: 'itinerary', label: '1. Day-by-Day Itinerary', icon: Calendar },
          { id: 'expenses', label: `2. Expenses & Budget (₹${totalCost.toLocaleString()})`, icon: DollarSign },
          { id: 'places', label: `3. Places to Visit (${places.length})`, icon: MapPin },
          { id: 'logistics', label: '4. Hotel & Travel Transit', icon: Hotel },
          { id: 'checklist', label: `5. Packing Checklist (${packedCount}/${checklist.length})`, icon: CheckSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-lg shadow-pink-500/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREAS */}

      {/* TAB 1: ITINERARY */}
      {activeTab === 'itinerary' && (
        <div className="space-y-6 animate-fade-in">
          {trip.description && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                Trip Overview & Notes
              </h3>
              <p className="whitespace-pre-line">{trip.description}</p>
            </div>
          )}

          {/* Generated Days Itinerary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-400" />
                <span>Daily Schedule Timeline</span>
              </h3>
            </div>

            {Array.from({ length: trip.daysCount || 3 }).map((_, idx) => {
              const dayNum = idx + 1;
              const matchingPlace = places[idx] || null;

              return (
                <div
                  key={dayNum}
                  className="p-5 rounded-3xl bg-slate-900/60 border border-white/10 relative pl-12 space-y-3 group hover:border-pink-500/30 transition"
                >
                  {/* Day Number Badge */}
                  <div
                    className="absolute left-4 top-5 w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-md"
                    style={{ backgroundColor: trip.color || '#ec4899' }}
                  >
                    {dayNum}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <h4 className="text-sm font-bold text-white">
                      Day {dayNum}: {matchingPlace ? matchingPlace.name : `Day ${dayNum} Exploration`}
                    </h4>
                    {matchingPlace?.city && (
                      <span className="text-[11px] text-pink-400 font-medium">
                        📍 {matchingPlace.city}
                      </span>
                    )}
                  </div>

                  {matchingPlace && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-white/5">
                      {matchingPlace.imageUrl && (
                        <img
                          src={matchingPlace.imageUrl}
                          alt={matchingPlace.name}
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white">{matchingPlace.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{matchingPlace.address}</div>
                        {matchingPlace.bestTimeToVisit && (
                          <div className="text-[10px] text-amber-400 mt-0.5">
                            ⏰ Best time: {matchingPlace.bestTimeToVisit}
                          </div>
                        )}
                      </div>
                      <a
                        href={matchingPlace.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-pink-600 text-white text-[11px] font-semibold flex items-center gap-1 transition"
                      >
                        <span>Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  <div className="text-xs text-slate-400 leading-relaxed">
                    Plan for morning sightseeing, local culinary exploration, and evening relaxation.
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES & BUDGET BREAKDOWN */}
      {activeTab === 'expenses' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Cost Breakdown Bar */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Total Estimated & Logged Expenses
                </span>
                <div className="text-3xl font-mono font-black text-white">
                  ₹{totalCost.toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense Item</span>
              </button>
            </div>

            {/* Category Distribution Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/10">
              {Object.entries(categoryTotals).map(([cat, amt]) => (
                <div key={cat} className="p-3 rounded-2xl bg-slate-950/60 border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-semibold truncate">{cat}</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    ₹{amt.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {totalCost > 0 ? `${Math.round((amt / totalCost) * 100)}% of total` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Add Expense Modal / Drawer */}
          {isAddExpenseOpen && (
            <div className="p-5 rounded-3xl bg-slate-900 border border-emerald-500/30 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  Add New Expense to Trip
                </h4>
                <button onClick={() => setIsAddExpenseOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Category (Dropdown)
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none"
                  >
                    <option value="Food & Dining">🍽️ Food & Dining</option>
                    <option value="Activities & Sightseeing">🎟️ Activities & Sightseeing</option>
                    <option value="Hotel & Stay">🏨 Hotel / Stay</option>
                    <option value="Travel & Transit">✈️ Travel & Transit</option>
                    <option value="Shopping & Souvenirs">🛍️ Shopping</option>
                    <option value="Miscellaneous / Buffer">💡 Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Or Mention Custom Category
                  </label>
                  <input
                    type="text"
                    value={customExpCategory}
                    onChange={(e) => setCustomExpCategory(e.target.value)}
                    placeholder="e.g. Scuba Dive, Scooter Rent"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 2500"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    placeholder="e.g. Beachside Dinner, Watersports tickets"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleAddQuickExpense}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Check className="w-4 h-4" />
                    Save Expense
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Expenses Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Itemized Expenses ({customExpenses.length + (hotelCost ? 1 : 0) + (travelCost ? 1 : 0)})
            </h4>

            <div className="space-y-2">
              {/* Hotel row if set */}
              {hotelCost > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Hotel & Stay
                    </span>
                    <span className="font-bold text-white">{trip.hotelDetails?.name || 'Hotel Stay'}</span>
                    {trip.hotelDetails?.roomType && (
                      <span className="text-slate-400 text-[11px]">({trip.hotelDetails.roomType})</span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    ₹{hotelCost.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Travel row if set */}
              {travelCost > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Travel & Transit
                    </span>
                    <span className="font-bold text-white">
                      {trip.travelDetails?.mode || 'Flight/Train'}: {trip.travelDetails?.departureLocation || ''} → {trip.travelDetails?.arrivalLocation || ''}
                    </span>
                    {trip.travelDetails?.pnrOrBookingRef && (
                      <span className="text-slate-400 text-[11px]">({trip.travelDetails.pnrOrBookingRef})</span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    ₹{travelCost.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Custom logged expenses */}
              {customExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between text-xs hover:border-white/20 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {exp.category}
                    </span>
                    <span className="font-bold text-white">{exp.title}</span>
                    {exp.notes && (
                      <span className="text-slate-400 text-[11px]">({exp.notes})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      ₹{exp.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleRemoveExpense(exp.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLACES TO VISIT */}
      {activeTab === 'places' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Places on this Trip ({places.length})
              </h3>
              <p className="text-xs text-slate-400">
                Locations scheduled to visit with Google Maps links and photos
              </p>
            </div>

            <button
              onClick={() => setIsAddPlaceOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Place</span>
            </button>
          </div>

          {/* Add Place Dialog Modal */}
          {isAddPlaceOpen && (
            <div className="p-5 rounded-3xl bg-slate-900 border border-pink-500/30 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  Add Place to Trip
                </h4>
                <button onClick={() => setIsAddPlaceOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Add directly via Maps Link */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                <span className="text-[11px] font-bold text-cyan-300">
                  Option 1: Paste any Google Maps link:
                </span>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={mapsUrlInput}
                    onChange={(e) => setMapsUrlInput(e.target.value)}
                    placeholder="https://maps.google.com/?cid=... or https://maps.app.goo.gl/..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
                  />
                  <button
                    onClick={handleAddFromMapUrl}
                    disabled={isResolvingMap || !mapsUrlInput.trim()}
                    className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1 disabled:opacity-50"
                  >
                    {isResolvingMap ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Resolve & Add</span>
                  </button>
                </div>
              </div>

              {/* Select from existing saved places */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-300">
                  Option 2: Select from your saved places:
                </span>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {savedPlaces
                    .filter((p) => !places.some((ep) => ep.id === p.id))
                    .map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-white/5 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <MapPin className="w-4 h-4 m-2 text-slate-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{p.city || p.address}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddExistingPlace(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-semibold"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Places Grid */}
          {places.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-white/5 space-y-2">
              <Compass className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-white">No places added yet</div>
              <p className="text-xs text-slate-400">
                Click "Add Place" above to attach your favorite destinations or paste Google Maps links.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {places.map((place) => (
                <div
                  key={place.id}
                  className="rounded-3xl bg-slate-900/80 border border-white/10 overflow-hidden flex flex-col justify-between hover:border-pink-500/40 transition group"
                >
                  <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                    {place.imageUrl ? (
                      <img
                        src={place.imageUrl}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <MapPin className="w-10 h-10" />
                      </div>
                    )}
                    {place.rating && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-amber-400 border border-white/10">
                        ★ {place.rating}
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{place.name}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{place.address || place.city}</p>
                      {place.bestTimeToVisit && (
                        <p className="text-[10px] text-amber-300 mt-1">
                          ⏰ Best time: {place.bestTimeToVisit}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <a
                        href={place.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-pink-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Google Maps</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>

                      <button
                        onClick={() => handleRemovePlace(place.id)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                        title="Remove from trip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: HOTEL & TRAVEL LOGISTICS */}
      {activeTab === 'logistics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Hotel Details Card */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Hotel className="w-4 h-4 text-amber-400" />
                Hotel & Accommodation
              </span>
              {hotelCost > 0 && (
                <span className="text-xs font-mono font-bold text-amber-400">
                  ₹{hotelCost.toLocaleString()}
                </span>
              )}
            </div>

            {trip.hotelDetails?.name ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Hotel Name:</span>
                  <span className="text-sm font-bold text-white">{trip.hotelDetails.name}</span>
                </div>

                {trip.hotelDetails.roomType && (
                  <div>
                    <span className="text-slate-400 text-[11px] block">Room Type:</span>
                    <span className="font-semibold text-slate-200">{trip.hotelDetails.roomType}</span>
                  </div>
                )}

                {(trip.hotelDetails.checkIn || trip.hotelDetails.checkOut) && (
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Check-in:</span>
                      <span className="font-bold text-white">{trip.hotelDetails.checkIn || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Check-out:</span>
                      <span className="font-bold text-white">{trip.hotelDetails.checkOut || 'N/A'}</span>
                    </div>
                  </div>
                )}

                {trip.hotelDetails.address && (
                  <div>
                    <span className="text-slate-400 text-[11px] block">Booking Ref / Location:</span>
                    <span className="text-slate-300 font-mono text-[11px]">{trip.hotelDetails.address}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No accommodation details added yet. Click "Edit Plan" to add hotel and booking information.
              </div>
            )}
          </div>

          {/* Travel & Transit Logistics Card */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Plane className="w-4 h-4 text-cyan-400" />
                Travel & Transportation
              </span>
              {travelCost > 0 && (
                <span className="text-xs font-mono font-bold text-cyan-400">
                  ₹{travelCost.toLocaleString()}
                </span>
              )}
            </div>

            {trip.travelDetails?.mode || trip.travelDetails?.departureLocation ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                    {trip.travelDetails?.mode || 'Transit'}
                  </span>
                  <span className="font-bold text-white">
                    {trip.travelDetails?.departureLocation || 'Origin'} → {trip.travelDetails?.arrivalLocation || 'Destination'}
                  </span>
                </div>

                {trip.travelDetails?.pnrOrBookingRef && (
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                    <span className="text-[10px] text-slate-400 block">PNR / Ticket Booking Reference:</span>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {trip.travelDetails.pnrOrBookingRef}
                    </span>
                  </div>
                )}

                {trip.travelDetails?.notes && (
                  <div>
                    <span className="text-slate-400 text-[11px] block">Transit Notes:</span>
                    <span className="text-slate-300">{trip.travelDetails.notes}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No flight or transit details added yet. Click "Edit Plan" to add transportation logs.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PACKING CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-purple-400" />
                  <span>Packing & Preparation Checklist</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {packedCount} of {checklist.length} items packed ({checklist.length > 0 ? Math.round((packedCount / checklist.length) * 100) : 0}%)
                </p>
              </div>

              {checklist.length > 0 && (
                <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all"
                    style={{ width: `${(packedCount / checklist.length) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Add new item */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklist();
                  }
                }}
                placeholder="Add packing item (e.g. Passports, Chargers, Swimwear)..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleAddChecklist}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition"
              >
                Add Item
              </button>
            </div>

            {/* List */}
            {checklist.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Your packing list is empty. Add essential travel items above!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-xs transition ${
                      item.isDone
                        ? 'bg-purple-950/20 border-purple-500/30 text-purple-300'
                        : 'bg-slate-950/60 border-white/5 text-slate-200'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer select-none min-w-0">
                      <input
                        type="checkbox"
                        checked={item.isDone}
                        onChange={() => handleToggleChecklist(item.id)}
                        className="w-4 h-4 rounded text-purple-600 bg-slate-800 border-white/20 focus:ring-purple-500"
                      />
                      <span className={`truncate ${item.isDone ? 'line-through opacity-70' : 'font-semibold'}`}>
                        {item.text}
                      </span>
                    </label>

                    <button
                      onClick={() => handleDeleteChecklist(item.id)}
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

      {/* Edit Modal */}
      <CreateTripModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={(updated) => setTrip(updated)}
        tripToEdit={trip}
      />
    </div>
  );
};

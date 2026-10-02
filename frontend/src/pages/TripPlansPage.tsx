import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Luggage,
  Plus,
  Search,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Sparkles,
  Plane,
  CheckCircle2,
} from 'lucide-react';
import { TripPlan } from '../types';
import { tripPlansApi } from '../services/tripPlansApi';
import { useToast } from '../contexts/ToastContext';
import { TripCard } from '../components/trips/TripCard';
import { CreateTripModal } from '../components/trips/CreateTripModal';

const STATUS_FILTERS = ['ALL', 'PLANNING', 'BOOKED', 'ONGOING', 'COMPLETED'];

export const TripPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [trips, setTrips] = useState<TripPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<TripPlan | null>(null);

  const fetchTrips = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await tripPlansApi.listTrips();
      setTrips(data || []);
    } catch (err: any) {
      toastError(err.message || 'Failed to load trip plans.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleOpenCreate = () => {
    setTripToEdit(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (trip: TripPlan) => {
    setTripToEdit(trip);
    setIsCreateModalOpen(true);
  };

  const handleViewDetails = (trip: TripPlan) => {
    navigate(`/plans/${trip.id}`);
  };

  const handleDeleteTrip = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this trip plan?')) return;

    try {
      await tripPlansApi.deleteTrip(id);
      setTrips((prev) => prev.filter((t) => t.id !== id));
      success('Trip plan deleted.');
    } catch (err: any) {
      toastError(err.message || 'Failed to delete trip.');
    }
  };

  const handleTripSaved = () => {
    fetchTrips();
  };

  // Metrics
  const totalTrips = trips.length;
  const bookedOrOngoing = trips.filter(
    (t) => t.status === 'BOOKED' || t.status === 'ONGOING'
  ).length;
  const completedTrips = trips.filter((t) => t.status === 'COMPLETED').length;
  const totalBudgetAcrossTrips = trips.reduce((sum, t) => {
    const hotelCost = Number(t.hotelDetails?.cost) || 0;
    const travelCost = Number(t.travelDetails?.cost) || 0;
    const customCost = (t.customExpenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);
    return sum + hotelCost + travelCost + customCost;
  }, 0);

  // Filtered trips
  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.destination && t.destination.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || t.status.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-pink-500/10 text-pink-300 border border-pink-500/20">
              Trip Itineraries & Logistics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Luggage className="w-7 h-7 text-pink-400" />
            <span>Trip Planner</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Select places or add from Google Maps, plan your hotel, track travel & food expenses, and organize day-by-day vacation itineraries.
          </p>
        </div>

        <div>
          <button
            onClick={handleOpenCreate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-pink-500/25 transition-all duration-200 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Plan a New Trip</span>
          </button>
        </div>
      </div>

      {/* Analytics & Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Trips */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Total Trips</span>
            <Luggage className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalTrips}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Vacations & plans</div>
        </div>

        {/* Booked / Ongoing */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Booked / Ongoing</span>
            <Plane className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{bookedOrOngoing}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Ready to travel</div>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{completedTrips}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Past adventures</div>
        </div>

        {/* Total Expenses */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">Estimated Cost</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-black text-white">
            ₹{totalBudgetAcrossTrips.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all plans</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trips by name or destination..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {STATUS_FILTERS.map((s) => {
            const isSelected = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-500/25'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {s === 'ALL' ? 'All Trips' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Trips Content Grid */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-400">Loading trip plans...</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center p-6 bg-slate-900/30 rounded-3xl border border-white/5 space-y-4">
          <div className="p-4 rounded-3xl bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-inner">
            <Luggage className="w-12 h-12 stroke-[1.5]" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-bold text-white">No trip plans found</h3>
            <p className="text-xs text-slate-400">
              {search || statusFilter !== 'ALL'
                ? 'No trips match your search or filter. Try clearing filters to view all.'
                : 'Start planning your getaway! Choose places to visit, log hotel and travel costs, and build your vacation schedule.'}
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-pink-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Trip Plan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onViewDetails={handleViewDetails}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteTrip}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Trip Modal */}
      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSaved={handleTripSaved}
        tripToEdit={tripToEdit}
      />
    </div>
  );
};

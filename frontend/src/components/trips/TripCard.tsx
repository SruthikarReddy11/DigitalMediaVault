import React from 'react';
import {
  Luggage,
  MapPin,
  Calendar,
  Hotel,
  Plane,
  DollarSign,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Compass,
} from 'lucide-react';
import { TripPlan } from '../../types';
import { formatDate } from '../../utils/formatters';

interface TripCardProps {
  trip: TripPlan;
  onViewDetails: (trip: TripPlan) => void;
  onEdit: (trip: TripPlan) => void;
  onDelete: (id: string) => void;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const placesCount = trip.places?.length ?? trip._count?.places ?? 0;
  const hotelCost = Number(trip.hotelDetails?.cost) || 0;
  const travelCost = Number(trip.travelDetails?.cost) || 0;
  const customCost = (trip.customExpenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalExpenses = hotelCost + travelCost + customCost;

  const checklistItems = trip.checklist || [];
  const packedCount = checklistItems.filter((c) => c.isDone).length;

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'BOOKED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            Booked
          </span>
        );
      case 'ONGOING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Ongoing
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30">
            Planning
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onViewDetails(trip)}
      className="group relative bg-slate-900/70 hover:bg-slate-900/95 border border-white/10 hover:border-pink-500/40 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/10 flex flex-col cursor-pointer"
      style={{ borderTopColor: trip.color || '#ec4899', borderTopWidth: 4 }}
    >
      {/* Cover Image or Gradient Top Banner */}
      <div className="relative aspect-[16/8] w-full bg-slate-950 overflow-hidden">
        {trip.coverImage ? (
          <img
            src={trip.coverImage}
            alt={trip.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${trip.color || '#ec4899'}22, #020617)`,
            }}
          >
            <Luggage className="w-12 h-12 text-slate-700 stroke-[1.2]" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
          {getStatusBadge(trip.status)}

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white backdrop-blur-md border border-white/10 transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-slate-900 border border-white/15 shadow-2xl py-1 z-30">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onEdit(trip);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 text-left"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                    Edit Trip
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDelete(trip.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Trip
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Duration pill at bottom left */}
        <div className="absolute bottom-3 left-3 pointer-events-none">
          <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            {trip.daysCount ? `${trip.daysCount} Days` : 'Trip Plan'}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Destination */}
          {trip.destination && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-pink-400 mb-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{trip.destination}</span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors line-clamp-1">
            {trip.name}
          </h3>

          {/* Dates */}
          {(trip.startDate || trip.endDate) && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {trip.startDate ? formatDate(trip.startDate) : 'Start'}
                {' - '}
                {trip.endDate ? formatDate(trip.endDate) : 'End'}
              </span>
            </div>
          )}

          {/* Key Metrics Summary Pills */}
          <div className="flex flex-wrap gap-1.5 pt-3">
            {/* Places Count */}
            <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" />
              {placesCount} {placesCount === 1 ? 'place' : 'places'}
            </span>

            {/* Hotel Pill */}
            {trip.hotelDetails?.name && (
              <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1 truncate max-w-[130px]">
                <Hotel className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{trip.hotelDetails.name}</span>
              </span>
            )}

            {/* Travel Pill */}
            {trip.travelDetails?.mode && (
              <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1">
                <Plane className="w-3 h-3 text-cyan-400" />
                {trip.travelDetails.mode}
              </span>
            )}

            {/* Total Expense Pill */}
            {totalExpenses > 0 && (
              <span className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ₹{totalExpenses.toLocaleString()}
              </span>
            )}
          </div>

          {/* Checklist progress if present */}
          {checklistItems.length > 0 && (
            <div className="pt-3">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>Packing Checklist</span>
                <span className="font-semibold text-slate-300">
                  {packedCount}/{checklistItems.length}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all"
                  style={{ width: `${(packedCount / checklistItems.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition">
            View Itinerary & Details
          </span>
          <div className="p-1.5 rounded-xl bg-slate-800 text-slate-400 group-hover:bg-pink-600 group-hover:text-white transition">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

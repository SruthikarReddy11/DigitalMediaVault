import React from 'react';
import {
  Plus,
  ShieldAlert,
  Search,
  X,
  Clock,
  Calendar as CalendarIcon,
  ChevronRight,
  Sparkles,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { CalendarEvent, CalendarEventType } from '../../types';
import {
  EVENT_TYPES,
  isExpiryEvent,
  cleanEventTitle,
  formatExpiryCountdown,
  getEventTypeConfig,
  getPriorityConfig,
} from '../../utils/calendarHelpers';

interface CalendarSidebarProps {
  onNewEvent: () => void;
  onSaveExpiry: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedType: CalendarEventType | 'ALL' | 'EXPIRIES';
  onTypeChange: (type: CalendarEventType | 'ALL' | 'EXPIRIES') => void;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  onNewEvent,
  onSaveExpiry,
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  events,
  onSelectEvent,
}) => {
  // Compute upcoming events and expiries
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Expiries count
  const expiryEvents = events.filter((e) => isExpiryEvent(e));
  const totalExpiriesCount = expiryEvents.length;

  // Upcoming items (sorted by startTime)
  const upcomingItems = [...events]
    .filter((e) => {
      const t = new Date(e.startTime).getTime();
      // Include events starting today or in future, or uncompleted expiries within 30 days
      return t >= todayStart - 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 6);

  return (
    <aside className="w-full lg:w-80 xl:w-88 shrink-0 space-y-5">
      {/* Primary Action Buttons */}
      <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-sm space-y-2.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Quick Actions
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
          {/* New Event Button */}
          <button
            type="button"
            onClick={onNewEvent}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all duration-200"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Add New Event</span>
          </button>

          {/* Save Expiry Date Button */}
          <button
            type="button"
            onClick={onSaveExpiry}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all duration-200"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 text-slate-950" />
            <span>Save Expiry Date</span>
          </button>
        </div>
      </div>

      {/* Quick Search */}
      <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-sm space-y-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Search & Filters
        </span>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events & expiries..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-8 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Categories / Type filters */}
        <div className="space-y-1 pt-1">
          {/* All option */}
          <button
            type="button"
            onClick={() => onTypeChange('ALL')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
              selectedType === 'ALL'
                ? 'bg-slate-200 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>All Events</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                selectedType === 'ALL'
                  ? 'bg-slate-950 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {events.length}
            </span>
          </button>

          {/* Expiries Dedicated Filter */}
          <button
            type="button"
            onClick={() => onTypeChange('EXPIRIES')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition border ${
              selectedType === 'EXPIRIES'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 ring-1 ring-amber-500/40 shadow-md font-bold'
                : 'border-transparent text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Expiries & Renewals</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                selectedType === 'EXPIRIES'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {totalExpiriesCount}
            </span>
          </button>

          {/* Standard Categories */}
          <div className="grid grid-cols-2 gap-1 pt-1">
            {EVENT_TYPES.slice(0, 8).map((t) => {
              const isSelected = selectedType === t.value;
              const count = events.filter((e) => e.type === t.value).length;
              return (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => onTypeChange(t.value)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition border ${
                    isSelected
                      ? `${t.bgClass} ${t.borderClass} ${t.textClass} font-bold ring-1 ring-white/10`
                      : 'border-transparent bg-slate-950/30 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.dotColor}`} />
                    <span className="truncate">{t.label}</span>
                  </div>
                  {count > 0 && (
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-1">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Expiries & Events Watchlist */}
      <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            Upcoming Watchlist
          </span>
          <span className="text-[10px] font-bold text-slate-500">
            {upcomingItems.length} listed
          </span>
        </div>

        {upcomingItems.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 space-y-1">
            <Sparkles className="w-5 h-5 mx-auto text-slate-600 mb-1" />
            <p>No upcoming events or expiries</p>
            <p className="text-[10px] text-slate-600">Click Add Event or Save Expiry</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingItems.map((ev) => {
              const isExpiry = isExpiryEvent(ev);
              const countdown = isExpiry
                ? formatExpiryCountdown(ev.startTime)
                : null;
              const typeConfig = getEventTypeConfig(ev.type);
              const cleanTitle = cleanEventTitle(ev.title);

              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer group ${
                    isExpiry
                      ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
                      : 'bg-slate-950/40 hover:bg-slate-800/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isExpiry ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${typeConfig.dotColor}`}
                        />
                      )}
                      <span
                        className={`text-xs font-semibold truncate group-hover:text-white transition ${
                          isExpiry ? 'text-amber-200' : 'text-slate-200'
                        } ${ev.isCompleted ? 'line-through opacity-60' : ''}`}
                      >
                        {cleanTitle}
                      </span>
                    </div>

                    {countdown ? (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 border ${countdown.badgeClass}`}
                      >
                        {countdown.text}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {new Date(ev.startTime).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500">
                    <span className="truncate">
                      {ev.allDay
                        ? 'All Day'
                        : new Date(ev.startTime).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {ev.attachments?.length > 0 && (
                        <Paperclip className="w-2.5 h-2.5 text-slate-400" />
                      )}
                      {ev.isCompleted && (
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      )}
                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly Summary Quick Stats */}
      <div className="p-3.5 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-brand-400" />
          <span>Active In Schedule</span>
        </div>
        <div className="flex items-center gap-2 font-mono font-bold text-white text-xs">
          <span>{events.length} events</span>
          <span className="text-slate-600">•</span>
          <span className="text-amber-400">{totalExpiriesCount} expiries</span>
        </div>
      </div>
    </aside>
  );
};

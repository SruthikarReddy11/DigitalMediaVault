import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Calendar as CalendarIcon,
  Filter,
} from 'lucide-react';
import { CalendarEventType } from '../../types';
import { EVENT_TYPES } from '../../utils/calendarHelpers';

export type CalendarViewMode = 'month' | 'week' | 'day';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  selectedType: CalendarEventType | 'ALL';
  onTypeChange: (type: CalendarEventType | 'ALL') => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onNewEvent: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  selectedType,
  onTypeChange,
  searchTerm,
  onSearchChange,
  onNewEvent,
}) => {
  const getHeaderTitle = () => {
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    if (viewMode === 'month') {
      return `${monthName} ${year}`;
    }

    if (viewMode === 'week') {
      // Find start (Mon) and end (Sun)
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(currentDate);
      start.setDate(diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const startMonth = start.toLocaleString('default', { month: 'short' });
      const endMonth = end.toLocaleString('default', { month: 'short' });

      if (startMonth === endMonth) {
        return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${year}`;
      }
      return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${year}`;
    }

    // Day view
    return currentDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Navigation & Title */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
            <button
              onClick={onPrev}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onToday}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              Today
            </button>
            <button
              onClick={onNext}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-brand-400" />
            <span>{getHeaderTitle()}</span>
          </h2>
        </div>

        {/* View Mode switcher + Search + New Event */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode tabs */}
          <div className="flex items-center p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
            {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  viewMode === mode
                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Quick search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-36 sm:w-48 pl-8 pr-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          {/* New Event Button */}
          <button
            onClick={onNewEvent}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => onTypeChange('ALL')}
          className={`px-3 py-1 rounded-xl font-semibold transition whitespace-nowrap ${
            selectedType === 'ALL'
              ? 'bg-slate-200 text-slate-950 shadow-md font-bold'
              : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Categories
        </button>

        {EVENT_TYPES.map((t) => {
          const isSelected = selectedType === t.value;
          return (
            <button
              key={t.value}
              onClick={() => onTypeChange(t.value)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition whitespace-nowrap border ${
                isSelected
                  ? `${t.bgClass} ${t.borderClass} ${t.textClass} font-bold ring-1 ring-white/20`
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${t.dotColor}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

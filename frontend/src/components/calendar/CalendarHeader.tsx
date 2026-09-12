import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  ShieldAlert,
} from 'lucide-react';

export type CalendarViewMode = 'month' | 'week' | 'day';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewEvent?: () => void;
  onSaveExpiry?: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  onNewEvent,
  onSaveExpiry,
}) => {
  const getHeaderTitle = () => {
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    if (viewMode === 'month') {
      return `${monthName} ${year}`;
    }

    if (viewMode === 'week') {
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
    <div className="p-3.5 sm:p-4 bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all duration-200">
      {/* Navigation & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl shadow-inner">
          <button
            type="button"
            onClick={onPrev}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95"
          >
            Today
          </button>
          <button
            type="button"
            onClick={onNext}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-white tracking-tight flex items-center gap-2 truncate">
          <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-400 shrink-0" />
          <span className="truncate">{getHeaderTitle()}</span>
        </h2>
      </div>

      {/* Right Controls: View Switcher & Mobile Quick Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-2.5">
        {/* Mobile-only action buttons */}
        {onNewEvent && (
          <div className="flex lg:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={onNewEvent}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow transition"
              title="Add Event"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Event</span>
            </button>
            {onSaveExpiry && (
              <button
                type="button"
                onClick={onSaveExpiry}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow transition"
                title="Save Expiry Date"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Expiry</span>
              </button>
            )}
          </div>
        )}

        {/* View Mode Switcher tabs */}
        <div className="flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-xl shadow-inner">
          {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-200 ${
                viewMode === mode
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20 font-bold scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

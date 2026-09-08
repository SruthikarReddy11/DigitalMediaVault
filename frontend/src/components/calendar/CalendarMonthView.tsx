import React, { useState } from 'react';
import {
  CalendarEvent,
} from '../../types';
import {
  getEventTypeConfig,
  getPriorityConfig,
} from '../../utils/calendarHelpers';
import {
  Paperclip,
  CheckCircle2,
  X,
  Plus,
  Clock,
} from 'lucide-react';

interface CalendarMonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEvent: (date: Date) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  currentDate,
  events,
  onSelectEvent,
  onCreateEvent,
}) => {
  const [popoverDay, setPopoverDay] = useState<{ date: Date; events: CalendarEvent[] } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month
  const firstDayOfMonth = new Date(year, month, 1);
  // Last day of month
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Day of week for 1st day (0 = Sun, 1 = Mon ... 6 = Sat).
  // We want week starting on Monday (Mon = 0, Sun = 6)
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

  // Total days in month
  const totalDays = lastDayOfMonth.getDate();

  // Days from previous month to fill the first row
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays: { dayNum: number; date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    prevMonthDays.push({
      dayNum: d,
      date: new Date(year, month - 1, d),
      isCurrentMonth: false,
    });
  }

  // Days in current month
  const currentMonthDays: { dayNum: number; date: Date; isCurrentMonth: boolean }[] = [];
  for (let d = 1; d <= totalDays; d++) {
    currentMonthDays.push({
      dayNum: d,
      date: new Date(year, month, d),
      isCurrentMonth: true,
    });
  }

  // Days from next month to fill grid to multiple of 7 (35 or 42)
  const cellsCount = prevMonthDays.length + currentMonthDays.length;
  const remainingCells = cellsCount % 7 === 0 ? 0 : 7 - (cellsCount % 7);
  const nextMonthDays: { dayNum: number; date: Date; isCurrentMonth: boolean }[] = [];
  for (let d = 1; d <= remainingCells; d++) {
    nextMonthDays.push({
      dayNum: d,
      date: new Date(year, month + 1, d),
      isCurrentMonth: false,
    });
  }

  const allGridDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Helper to test if two dates are same day
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const today = new Date();

  // Get events falling on a specific date
  const getEventsForDay = (date: Date) => {
    return events.filter((ev) => {
      const s = new Date(ev.startTime);
      const e = new Date(ev.endTime);

      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

      return s <= dayEnd && e >= dayStart;
    });
  };

  const weekDayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="relative bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Week days header row */}
      <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/60 text-center py-2.5">
        {weekDayHeaders.map((header, idx) => (
          <div
            key={header}
            className={`text-[11px] font-bold uppercase tracking-wider ${
              idx >= 5 ? 'text-indigo-400/80' : 'text-slate-400'
            }`}
          >
            {header}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/80">
        {allGridDays.map((item, index) => {
          const isToday = isSameDay(item.date, today);
          const dayEvents = getEventsForDay(item.date);
          const maxVisible = 3;
          const visibleEvents = dayEvents.slice(0, maxVisible);
          const overflowCount = dayEvents.length - maxVisible;

          return (
            <div
              key={index}
              onClick={() => onCreateEvent(item.date)}
              className={`min-h-[110px] sm:min-h-[125px] p-1.5 sm:p-2 flex flex-col justify-between transition group cursor-pointer hover:bg-slate-800/30 ${
                item.isCurrentMonth ? 'bg-transparent' : 'bg-slate-950/40 opacity-40'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isToday
                      ? 'bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/30 ring-2 ring-brand-400/40'
                      : item.isCurrentMonth
                      ? 'text-slate-300 group-hover:text-white'
                      : 'text-slate-500'
                  }`}
                >
                  {item.dayNum}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateEvent(item.date);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white rounded-md transition"
                  title="Add event on this date"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Event Chips */}
              <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                {visibleEvents.map((ev) => {
                  const typeConfig = getEventTypeConfig(ev.type);
                  const priorityConfig = getPriorityConfig(ev.priority);

                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(ev);
                      }}
                      className={`px-1.5 py-0.5 rounded-md border text-[10px] sm:text-[11px] font-medium flex items-center gap-1 transition cursor-pointer truncate ${
                        typeConfig.bgClass
                      } ${typeConfig.borderClass} ${typeConfig.textClass} hover:brightness-125 ${
                        ev.isCompleted ? 'opacity-50 line-through' : ''
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityConfig.dotColor}`} />

                      {!ev.allDay && (
                        <span className="opacity-80 text-[9px] shrink-0">
                          {new Date(ev.startTime).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      )}

                      <span className="truncate font-semibold flex-1">{ev.title}</span>

                      {ev.attachments?.length > 0 && (
                        <Paperclip className="w-2.5 h-2.5 shrink-0 opacity-70" />
                      )}

                      {ev.isCompleted && (
                        <CheckCircle2 className="w-2.5 h-2.5 shrink-0 text-emerald-400" />
                      )}
                    </div>
                  );
                })}

                {/* Overflow count button */}
                {overflowCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPopoverDay({ date: item.date, events: dayEvents });
                    }}
                    className="w-full text-left text-[10px] font-bold text-brand-400 hover:text-brand-300 px-1 py-0.5 rounded hover:bg-brand-500/10 transition"
                  >
                    +{overflowCount} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overflow Day Popover Modal */}
      {popoverDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-sm font-bold text-white">
                {popoverDay.date.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <button
                onClick={() => setPopoverDay(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1.5">
              {popoverDay.events.map((ev) => {
                const typeConfig = getEventTypeConfig(ev.type);
                const priorityConfig = getPriorityConfig(ev.priority);

                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setPopoverDay(null);
                      onSelectEvent(ev);
                    }}
                    className={`p-2 rounded-xl border text-xs flex items-center justify-between transition cursor-pointer ${
                      typeConfig.bgClass
                    } ${typeConfig.borderClass} ${typeConfig.textClass} hover:brightness-125 ${
                      ev.isCompleted ? 'opacity-60 line-through' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${priorityConfig.dotColor}`} />
                      <span className="font-semibold truncate">{ev.title}</span>
                    </div>

                    <span className="text-[10px] opacity-75 shrink-0 ml-2">
                      {ev.allDay
                        ? 'All Day'
                        : new Date(ev.startTime).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                const d = popoverDay.date;
                setPopoverDay(null);
                onCreateEvent(d);
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add event on this date
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

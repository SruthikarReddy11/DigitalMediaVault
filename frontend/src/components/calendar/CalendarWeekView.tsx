import React, { useRef, useEffect } from 'react';
import { CalendarEvent } from '../../types';
import {
  getEventTypeConfig,
  getPriorityConfig,
  formatEventTime,
} from '../../utils/calendarHelpers';
import { Paperclip, CheckCircle2 } from 'lucide-react';

interface CalendarWeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEvent: (date: Date) => void;
}

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  currentDate,
  events,
  onSelectEvent,
  onCreateEvent,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Compute Monday of the current week
  const dayOfWeek = currentDate.getDay();
  const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const weekStart = new Date(currentDate);
  weekStart.setDate(diff);

  // 7 days of this week
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDays.push(d);
  }

  const today = new Date();
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  // 24 hours array (0 to 23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Auto-scroll to 8 AM on initial load
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 8 * 60; // 8 AM (~480px)
    }
  }, []);

  const getEventsForDay = (date: Date) => {
    return events.filter((ev) => {
      const s = new Date(ev.startTime);
      const e = new Date(ev.endTime);

      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

      return s <= dayEnd && e >= dayStart;
    });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col h-[700px]">
      {/* Sticky Header: 7 Days */}
      <div className="grid grid-cols-8 border-b border-slate-800 bg-slate-950/80 shrink-0">
        {/* Time column spacer */}
        <div className="p-3 text-[11px] font-bold text-slate-500 border-r border-slate-800 text-center uppercase tracking-wider">
          GMT
        </div>

        {weekDays.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className={`p-2.5 text-center border-r border-slate-800 last:border-r-0 ${
                isToday ? 'bg-brand-500/10' : ''
              }`}
            >
              <p className="text-[11px] font-semibold text-slate-400 uppercase">
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </p>
              <div className="flex justify-center mt-0.5">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isToday
                      ? 'bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md'
                      : 'text-white'
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable Hourly Timeline */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative">
        <div className="grid grid-cols-8 relative min-h-[1440px]">
          {/* Time gutter (column 1) */}
          <div className="border-r border-slate-800 bg-slate-950/40 select-none">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[60px] border-b border-slate-800/60 pr-2 pt-1 text-right text-[10px] text-slate-500 font-mono"
              >
                {hour === 0
                  ? '12 AM'
                  : hour < 12
                  ? `${hour} AM`
                  : hour === 12
                  ? '12 PM'
                  : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* 7 Days Columns */}
          {weekDays.map((day) => {
            const isToday = isSameDay(day, today);
            const dayEvents = getEventsForDay(day);

            return (
              <div
                key={day.toISOString()}
                className={`relative border-r border-slate-800/70 last:border-r-0 ${
                  isToday ? 'bg-brand-500/[0.02]' : ''
                }`}
              >
                {/* 24 Hour Slots Grid */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    onClick={() => {
                      const d = new Date(day);
                      d.setHours(hour, 0, 0, 0);
                      onCreateEvent(d);
                    }}
                    className="h-[60px] border-b border-slate-800/40 hover:bg-slate-800/30 transition cursor-pointer"
                  />
                ))}

                {/* Events overlay */}
                {dayEvents.map((ev) => {
                  const s = new Date(ev.startTime);
                  const e = new Date(ev.endTime);

                  // Calculate start minute from midnight
                  const startMin = s.getHours() * 60 + s.getMinutes();
                  const durationMin = Math.max(
                    30,
                    (e.getTime() - s.getTime()) / (1000 * 60)
                  );

                  // 1 minute = 1px height
                  const topPx = startMin;
                  const heightPx = Math.min(1440 - topPx, durationMin);

                  const typeConfig = getEventTypeConfig(ev.type);
                  const priorityConfig = getPriorityConfig(ev.priority);

                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(ev);
                      }}
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                      }}
                      className={`absolute left-1 right-1 rounded-xl p-2 border shadow-lg overflow-hidden cursor-pointer transition hover:brightness-125 z-10 ${
                        typeConfig.bgClass
                      } ${typeConfig.borderClass} ${typeConfig.textClass} ${
                        ev.isCompleted ? 'opacity-60 line-through' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityConfig.dotColor}`}
                        />
                        <span className="text-xs font-bold truncate leading-tight">
                          {ev.title}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] opacity-80 mt-1">
                        <span>{formatEventTime(ev.startTime, ev.endTime, ev.allDay)}</span>
                        {ev.attachments?.length > 0 && (
                          <Paperclip className="w-2.5 h-2.5 shrink-0" />
                        )}
                        {ev.isCompleted && (
                          <CheckCircle2 className="w-2.5 h-2.5 shrink-0 text-emerald-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

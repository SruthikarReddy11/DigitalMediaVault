import React, { useRef, useEffect } from 'react';
import { CalendarEvent } from '../../types';
import {
  getEventTypeConfig,
  getPriorityConfig,
  formatEventTime,
} from '../../utils/calendarHelpers';
import {
  Paperclip,
  CheckCircle2,
  CheckSquare,
  Clock,
  MapPin,
} from 'lucide-react';

interface CalendarDayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onCreateEvent: (date: Date) => void;
}

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  currentDate,
  events,
  onSelectEvent,
  onCreateEvent,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 8 * 60; // scroll to 8 AM
    }
  }, []);

  const dayEvents = events.filter((ev) => {
    const s = new Date(ev.startTime);
    const e = new Date(ev.endTime);

    const dayStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      0,
      0,
      0
    );
    const dayEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      23,
      59,
      59
    );

    return s <= dayEnd && e >= dayStart;
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col h-[700px]">
      {/* Day header banner */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">
            {currentDate.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </h3>
          <p className="text-xs text-slate-400">
            {dayEvents.length} scheduled event{dayEvents.length === 1 ? '' : 's'} today
          </p>
        </div>
      </div>

      {/* 24-Hour Timeline */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative">
        <div className="flex relative min-h-[1440px]">
          {/* Hour labels */}
          <div className="w-20 border-r border-slate-800 bg-slate-950/40 shrink-0 select-none">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[60px] border-b border-slate-800/60 pr-3 pt-1 text-right text-[10px] text-slate-500 font-mono"
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

          {/* Time Slot Area */}
          <div className="flex-1 relative">
            {/* Clickable hour blocks */}
            {hours.map((hour) => (
              <div
                key={hour}
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setHours(hour, 0, 0, 0);
                  onCreateEvent(d);
                }}
                className="h-[60px] border-b border-slate-800/40 hover:bg-slate-800/25 transition cursor-pointer"
              />
            ))}

            {/* Positioned Events */}
            {dayEvents.map((ev) => {
              const s = new Date(ev.startTime);
              const e = new Date(ev.endTime);

              const startMin = s.getHours() * 60 + s.getMinutes();
              const durationMin = Math.max(
                45,
                (e.getTime() - s.getTime()) / (1000 * 60)
              );

              const topPx = startMin;
              const heightPx = Math.min(1440 - topPx, durationMin);

              const typeConfig = getEventTypeConfig(ev.type);
              const priorityConfig = getPriorityConfig(ev.priority);
              const TypeIcon = typeConfig.icon;

              const completedTasks = ev.checklist?.filter((c) => c.isCompleted).length || 0;
              const totalTasks = ev.checklist?.length || 0;

              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  style={{
                    top: `${topPx}px`,
                    height: `${heightPx}px`,
                  }}
                  className={`absolute left-3 right-3 rounded-2xl p-3 border shadow-xl overflow-hidden cursor-pointer transition hover:brightness-125 z-10 flex flex-col justify-between ${
                    typeConfig.bgClass
                  } ${typeConfig.borderClass} ${typeConfig.textClass} ${
                    ev.isCompleted ? 'opacity-60 line-through' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${priorityConfig.dotColor}`}
                        />
                        <span className="text-xs sm:text-sm font-extrabold truncate">
                          {ev.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/20 font-bold">
                          {typeConfig.label}
                        </span>
                        {ev.isCompleted && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs opacity-80">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatEventTime(ev.startTime, ev.endTime, ev.allDay)}
                      </span>

                      {ev.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          {ev.location}
                        </span>
                      )}
                    </div>

                    {ev.description && heightPx > 80 && (
                      <p className="text-xs opacity-75 line-clamp-2 leading-relaxed pt-1">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  {/* Badges footer */}
                  <div className="flex items-center gap-3 pt-1 text-[11px] font-medium opacity-90 border-t border-white/10 mt-1">
                    {totalTasks > 0 && (
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3 text-amber-400" />
                        <span>
                          {completedTasks}/{totalTasks} tasks
                        </span>
                      </span>
                    )}

                    {ev.attachments?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Paperclip className="w-3 h-3 text-blue-400" />
                        <span>{ev.attachments.length} attached</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

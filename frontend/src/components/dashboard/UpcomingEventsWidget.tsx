import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Paperclip,
  ArrowRight,
  Plus,
  CalendarCheck2,
} from 'lucide-react';
import { CalendarEvent, CreateEventPayload, UpdateEventPayload } from '../../types';
import { calendarApi } from '../../services/calendarApi';
import {
  getEventTypeConfig,
  getPriorityConfig,
  formatEventTime,
} from '../../utils/calendarHelpers';
import { formatDate } from '../../utils/formatters';
import { EventModal } from '../calendar/EventModal';
import { useToast } from '../../contexts/ToastContext';

export const UpcomingEventsWidget: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadUpcoming = async () => {
    try {
      setLoading(true);
      const list = await calendarApi.getUpcomingEvents(5);
      setEvents(list || []);
    } catch (err) {
      console.error('Failed to load upcoming events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpcoming();

    const handleUpdate = () => loadUpcoming();
    window.addEventListener('calendar_events_updated', handleUpdate);
    return () => window.removeEventListener('calendar_events_updated', handleUpdate);
  }, []);

  const handleSaveEvent = async (data: CreateEventPayload | UpdateEventPayload) => {
    await calendarApi.createEvent(data as CreateEventPayload);
    success('Event created');
    setIsModalOpen(false);
    loadUpcoming();
    window.dispatchEvent(new CustomEvent('calendar_events_updated'));
  };

  return (
    <>
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-brand-600/20 to-indigo-600/20 text-brand-400 border border-brand-500/30 rounded-2xl">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Upcoming Schedule</h3>
              <p className="text-xs text-slate-400">Events, meetings & smart reminders</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-brand-400" />
              <span>Add</span>
            </button>
            <Link
              to="/calendar"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
            >
              Open Calendar <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Events list */}
        {loading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-slate-950/60 border border-slate-800/80 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="p-6 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl text-center space-y-2">
            <p className="text-xs text-slate-400">No upcoming events or reminders scheduled.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 bg-brand-600/20 text-brand-300 border border-brand-500/30 rounded-xl text-xs font-semibold hover:bg-brand-600/30 transition"
            >
              Schedule an Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {events.map((ev) => {
              const typeConfig = getEventTypeConfig(ev.type);
              const priorityConfig = getPriorityConfig(ev.priority);

              const completedChecklist = ev.checklist?.filter((c) => c.isCompleted).length || 0;
              const totalChecklist = ev.checklist?.length || 0;

              return (
                <div
                  key={ev.id}
                  onClick={() => navigate('/calendar')}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-lg ${
                    typeConfig.bgClass
                  } ${typeConfig.borderClass} hover:brightness-110`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeConfig.bgClass} ${typeConfig.borderClass} ${typeConfig.textClass}`}
                      >
                        {typeConfig.label}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${priorityConfig.dotColor}`} />
                    </div>

                    <p className="text-xs font-bold text-white truncate">{ev.title}</p>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-300 opacity-90">
                      <Clock className="w-3 h-3 text-brand-400 shrink-0" />
                      <span className="truncate">
                        {formatDate(ev.startTime)} •{' '}
                        {formatEventTime(ev.startTime, ev.endTime, ev.allDay)}
                      </span>
                    </div>
                  </div>

                  {/* Footer status & attachments */}
                  <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                    {totalChecklist > 0 ? (
                      <span>
                        {completedChecklist}/{totalChecklist} tasks done
                      </span>
                    ) : (
                      <span>{ev.location || 'No location set'}</span>
                    )}

                    {ev.attachments?.length > 0 && (
                      <span className="flex items-center gap-1 text-blue-300">
                        <Paperclip className="w-3 h-3" />
                        {ev.attachments.length}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveEvent}
        />
      )}
    </>
  );
};

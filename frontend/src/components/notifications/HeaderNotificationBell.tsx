import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Clock,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Calendar as CalendarIcon,
  ChevronRight,
  AlarmClock,
  Sparkles,
} from 'lucide-react';
import { calendarApi } from '../../services/calendarApi';
import { CalendarReminder } from '../../types';
import { getEventTypeConfig, getPriorityConfig } from '../../utils/calendarHelpers';

export const HeaderNotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [reminders, setReminders] = useState<CalendarReminder[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('pdl_reminder_sound') !== 'false';
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevTriggeredCount = useRef<number>(0);

  // Play a gentle modern electronic chime via Web Audio API
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  const fetchReminders = async () => {
    try {
      const list = await calendarApi.getActiveReminders();
      setReminders(list || []);

      // Check if new reminders have triggered to play chime
      const triggeredCount = list.filter((r) => r.status === 'SENT').length;
      if (triggeredCount > prevTriggeredCount.current && prevTriggeredCount.current !== 0) {
        playChime();
      }
      prevTriggeredCount.current = triggeredCount;
    } catch (err) {
      // Fail quietly
    }
  };

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 30 * 1000); // 30s poll

    const handleUpdate = () => fetchReminders();
    window.addEventListener('calendar_events_updated', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('calendar_events_updated', handleUpdate);
    };
  }, [soundEnabled]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('pdl_reminder_sound', String(next));
  };

  const handleDismiss = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await calendarApi.dismissReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to dismiss reminder:', err);
    }
  };

  const handleSnooze = async (e: React.MouseEvent, id: string, minutes = 15) => {
    e.stopPropagation();
    try {
      await calendarApi.snoozeReminder(id, minutes);
      fetchReminders();
    } catch (err) {
      console.error('Failed to snooze reminder:', err);
    }
  };

  const handleCompleteEvent = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    try {
      await calendarApi.toggleComplete(eventId, true);
      setReminders((prev) => prev.filter((r) => r.eventId !== eventId));
      window.dispatchEvent(new CustomEvent('calendar_events_updated'));
    } catch (err) {
      console.error('Failed to complete event:', err);
    }
  };

  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // Group reminders: Due Now/Overdue, Today, Upcoming
  const dueNowOrOverdue = reminders.filter(
    (r) => r.status === 'SENT' || new Date(r.triggerTime) <= now
  );

  const dueTodayLater = reminders.filter(
    (r) =>
      r.status === 'PENDING' &&
      new Date(r.triggerTime) > now &&
      new Date(r.triggerTime) <= todayEnd
  );

  const upcomingSoon = reminders.filter(
    (r) => r.status === 'PENDING' && new Date(r.triggerTime) > todayEnd
  );

  const totalBadges = dueNowOrOverdue.length + dueTodayLater.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 text-slate-400 hover:text-white bg-slate-900/80 border border-white/[0.08] hover:border-slate-700 rounded-xl transition cursor-pointer"
        aria-label="Notifications"
        title="Calendar & Smart Reminders"
      >
        <Bell className={`w-4 h-4 ${dueNowOrOverdue.length > 0 ? 'text-amber-400 animate-bounce' : ''}`} />

        {totalBadges > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 ring-2 ring-slate-950 animate-in zoom-in-50 duration-150">
            {totalBadges > 9 ? '9+' : totalBadges}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <AlarmClock className="w-4 h-4 text-brand-400" />
              <h4 className="text-xs font-bold text-white tracking-tight">
                Smart Reminders
              </h4>
              {totalBadges > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-brand-500/20 text-brand-300 text-[10px] font-bold">
                  {totalBadges} Active
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleSound}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title={soundEnabled ? 'Mute reminder chime' : 'Enable reminder chime'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-brand-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
            </div>
          </div>

          {/* Body List */}
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-3 divide-y divide-slate-800/60">
            {reminders.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-300">All caught up!</p>
                <p className="text-[10px] text-slate-500">No active or pending reminders right now.</p>
              </div>
            ) : (
              <>
                {/* 1. Overdue / Due Now */}
                {dueNowOrOverdue.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      Due Now / Overdue ({dueNowOrOverdue.length})
                    </p>
                    {dueNowOrOverdue.map((r) => {
                      const ev = r.event;
                      const typeConfig = ev ? getEventTypeConfig(ev.type) : null;
                      return (
                        <div
                          key={r.id}
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/calendar');
                          }}
                          className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 hover:border-red-500/50 transition cursor-pointer space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white group-hover:text-brand-300 transition truncate">
                                {ev?.title || 'Reminder'}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-red-300/80 mt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {new Date(r.triggerTime).toLocaleTimeString([], {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {typeConfig && (
                                  <span className="opacity-75">• {typeConfig.label}</span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={(e) => handleDismiss(e, r.id)}
                              className="text-slate-500 hover:text-white p-1 rounded-md"
                              title="Dismiss"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick Action buttons */}
                          <div className="flex items-center gap-2 pt-1 border-t border-red-500/20">
                            {ev && (
                              <button
                                onClick={(e) => handleCompleteEvent(e, ev.id)}
                                className="px-2 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Done</span>
                              </button>
                            )}

                            <button
                              onClick={(e) => handleSnooze(e, r.id, 15)}
                              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition"
                            >
                              Snooze 15m
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Today */}
                {dueTodayLater.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Due Today ({dueTodayLater.length})
                    </p>
                    {dueTodayLater.map((r) => {
                      const ev = r.event;
                      return (
                        <div
                          key={r.id}
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/calendar');
                          }}
                          className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex items-center justify-between gap-2 group"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                              {ev?.title || 'Reminder'}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              At{' '}
                              {new Date(r.triggerTime).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>

                          <button
                            onClick={(e) => handleDismiss(e, r.id)}
                            className="text-slate-500 hover:text-white p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. Upcoming */}
                {upcomingSoon.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Upcoming ({upcomingSoon.length})
                    </p>
                    {upcomingSoon.slice(0, 5).map((r) => {
                      const ev = r.event;
                      return (
                        <div
                          key={r.id}
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/calendar');
                          }}
                          className="p-2 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs text-slate-300 truncate">{ev?.title}</p>
                            <p className="text-[10px] text-slate-500">
                              {new Date(r.triggerTime).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              •{' '}
                              {new Date(r.triggerTime).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>

                          <button
                            onClick={(e) => handleDismiss(e, r.id)}
                            className="text-slate-600 hover:text-white p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer: View Full Calendar */}
          <div className="p-2.5 border-t border-slate-800 bg-slate-950/80 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/calendar');
              }}
              className="w-full py-1.5 px-3 rounded-xl bg-brand-600/15 hover:bg-brand-600/25 border border-brand-500/30 text-brand-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Open Vault Calendar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import {
  CalendarEventType,
  CalendarEventPriority,
} from '../types';
import {
  Calendar,
  Clock,
  CheckSquare,
  AlertCircle,
  BookOpen,
  Cake,
  Flame,
  Users,
  Tag,
} from 'lucide-react';

export const EVENT_TYPES: {
  value: CalendarEventType;
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotColor: string;
  icon: any;
}[] = [
  {
    value: 'MEETING',
    label: 'Meeting',
    color: '#3b82f6',
    bgClass: 'bg-blue-500/15',
    borderClass: 'border-blue-500/30',
    textClass: 'text-blue-300',
    dotColor: 'bg-blue-400',
    icon: Users,
  },
  {
    value: 'REMINDER',
    label: 'Reminder',
    color: '#10b981',
    bgClass: 'bg-emerald-500/15',
    borderClass: 'border-emerald-500/30',
    textClass: 'text-emerald-300',
    dotColor: 'bg-emerald-400',
    icon: Clock,
  },
  {
    value: 'TASK',
    label: 'Task',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/15',
    borderClass: 'border-amber-500/30',
    textClass: 'text-amber-300',
    dotColor: 'bg-amber-400',
    icon: CheckSquare,
  },
  {
    value: 'PERSONAL',
    label: 'Personal',
    color: '#8b5cf6',
    bgClass: 'bg-purple-500/15',
    borderClass: 'border-purple-500/30',
    textClass: 'text-purple-300',
    dotColor: 'bg-purple-400',
    icon: Calendar,
  },
  {
    value: 'IMPORTANT',
    label: 'Important',
    color: '#ef4444',
    bgClass: 'bg-red-500/15',
    borderClass: 'border-red-500/30',
    textClass: 'text-red-300',
    dotColor: 'bg-red-400',
    icon: AlertCircle,
  },
  {
    value: 'STUDY',
    label: 'Study & Exam',
    color: '#f97316',
    bgClass: 'bg-orange-500/15',
    borderClass: 'border-orange-500/30',
    textClass: 'text-orange-300',
    dotColor: 'bg-orange-400',
    icon: BookOpen,
  },
  {
    value: 'BIRTHDAY',
    label: 'Birthday',
    color: '#ec4899',
    bgClass: 'bg-pink-500/15',
    borderClass: 'border-pink-500/30',
    textClass: 'text-pink-300',
    dotColor: 'bg-pink-400',
    icon: Cake,
  },
  {
    value: 'DEADLINE',
    label: 'Deadline',
    color: '#f43f5e',
    bgClass: 'bg-rose-500/15',
    borderClass: 'border-rose-500/30',
    textClass: 'text-rose-300',
    dotColor: 'bg-rose-400',
    icon: Flame,
  },
  {
    value: 'OTHER',
    label: 'Other',
    color: '#64748b',
    bgClass: 'bg-slate-500/15',
    borderClass: 'border-slate-500/30',
    textClass: 'text-slate-300',
    dotColor: 'bg-slate-400',
    icon: Tag,
  },
];

export const getEventTypeConfig = (type: CalendarEventType) => {
  return EVENT_TYPES.find((t) => t.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1];
};

export const getPriorityConfig = (priority: CalendarEventPriority) => {
  switch (priority) {
    case 'CRITICAL':
      return {
        label: 'Critical',
        bgClass: 'bg-red-500/20 text-red-300 border-red-500/40',
        dotColor: 'bg-red-500 animate-pulse',
      };
    case 'HIGH':
      return {
        label: 'High',
        bgClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dotColor: 'bg-amber-400',
      };
    case 'NORMAL':
      return {
        label: 'Normal',
        bgClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        dotColor: 'bg-blue-400',
      };
    case 'LOW':
    default:
      return {
        label: 'Low',
        bgClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
        dotColor: 'bg-slate-400',
      };
  }
};

export const formatEventTime = (startTime: string, endTime: string, allDay?: boolean) => {
  if (allDay) return 'All Day';
  const start = new Date(startTime);
  const end = new Date(endTime);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return `${formatTime(start)} – ${formatTime(end)}`;
};

export const REMINDER_OFFSET_OPTIONS = [
  { label: 'At event start', value: 0 },
  { label: '5 minutes before', value: 5 },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 },
  { label: '1 day before', value: 1440 },
  { label: '2 days before', value: 2880 },
  { label: '1 week before', value: 10080 },
];

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

export const EXPIRY_REMINDER_OPTIONS = [
  { label: 'On expiry date (0d)', value: 0 },
  { label: '1 day before (24h)', value: 1440 },
  { label: '3 days before', value: 4320 },
  { label: '7 days before (1 week)', value: 10080 },
  { label: '15 days before', value: 21600 },
  { label: '30 days before (1 month)', value: 43200 },
  { label: '60 days before (2 months)', value: 86400 },
];

export interface ExpiryPreset {
  id: string;
  label: string;
  defaultTitle: string;
  iconName: string;
  descriptionPlaceholder: string;
  defaultCategory: CalendarEventType;
}

export const EXPIRY_PRESETS: ExpiryPreset[] = [
  {
    id: 'passport',
    label: 'Passport Expiry',
    defaultTitle: 'Passport Expiry',
    iconName: 'FileText',
    descriptionPlaceholder: 'Passport number, issuing country, renewal requirements...',
    defaultCategory: 'DEADLINE',
  },
  {
    id: 'license',
    label: 'Driving License',
    defaultTitle: 'Driving License Expiry',
    iconName: 'Car',
    descriptionPlaceholder: 'License number, class, RTO/DMV location...',
    defaultCategory: 'DEADLINE',
  },
  {
    id: 'insurance',
    label: 'Insurance Policy',
    defaultTitle: 'Insurance Policy Renewal',
    iconName: 'Shield',
    descriptionPlaceholder: 'Policy number, insurer, coverage details, premium due date...',
    defaultCategory: 'IMPORTANT',
  },
  {
    id: 'warranty',
    label: 'Product Warranty',
    defaultTitle: 'Product Warranty Expiry',
    iconName: 'ShieldCheck',
    descriptionPlaceholder: 'Product serial number, purchase store, warranty period...',
    defaultCategory: 'REMINDER',
  },
  {
    id: 'subscription',
    label: 'Subscription / Cloud',
    defaultTitle: 'Subscription Renewal',
    iconName: 'CreditCard',
    descriptionPlaceholder: 'Plan details, auto-renew status, billing frequency...',
    defaultCategory: 'REMINDER',
  },
  {
    id: 'visa',
    label: 'Visa / Permit / ID',
    defaultTitle: 'Visa / Residence Permit Expiry',
    iconName: 'Stamp',
    descriptionPlaceholder: 'Visa type, country, sponsor/agency...',
    defaultCategory: 'DEADLINE',
  },
  {
    id: 'contract',
    label: 'Lease / Contract / Cert',
    defaultTitle: 'Contract / Certification Expiry',
    iconName: 'FileCheck',
    descriptionPlaceholder: 'Contract or certificate title, agreement parties, renewal terms...',
    defaultCategory: 'IMPORTANT',
  },
  {
    id: 'custom',
    label: 'Custom Expiry',
    defaultTitle: 'Important Expiry Date',
    iconName: 'Clock',
    descriptionPlaceholder: 'Notes, important reference numbers or renewal links...',
    defaultCategory: 'DEADLINE',
  },
];

export const isExpiryEvent = (ev: { title: string; description?: string | null; type?: string }): boolean => {
  if (!ev) return false;
  const title = (ev.title || '').toLowerCase();
  const desc = (ev.description || '').toLowerCase();
  return (
    title.includes('[expiry]') ||
    title.includes('expiry') ||
    title.includes('expires') ||
    title.includes('renewal') ||
    desc.includes('#expiry') ||
    desc.includes('expiry')
  );
};

export const cleanEventTitle = (title: string): string => {
  if (!title) return '';
  return title.replace(/^\[EXPIRY\]\s*/i, '').trim();
};

export const formatExpiryCountdown = (dateStr: string): {
  text: string;
  badgeClass: string;
  isUrgent: boolean;
  isExpired: boolean;
  daysDiff: number;
} => {
  const target = new Date(dateStr);
  const now = new Date();
  // Normalize both to start of day
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const diffMs = targetDay - todayDay;
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) {
    const absDays = Math.abs(days);
    return {
      text: absDays === 1 ? 'Expired yesterday' : `Expired ${absDays}d ago`,
      badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
      isUrgent: true,
      isExpired: true,
      daysDiff: days,
    };
  }

  if (days === 0) {
    return {
      text: 'Expires Today',
      badgeClass: 'bg-red-500/25 text-red-200 border-red-500/50 animate-pulse font-bold',
      isUrgent: true,
      isExpired: false,
      daysDiff: 0,
    };
  }

  if (days === 1) {
    return {
      text: 'Expires Tomorrow',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold',
      isUrgent: true,
      isExpired: false,
      daysDiff: 1,
    };
  }

  if (days <= 7) {
    return {
      text: `Expires in ${days} days`,
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      isUrgent: true,
      isExpired: false,
      daysDiff: days,
    };
  }

  if (days <= 30) {
    return {
      text: `In ${days} days`,
      badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      isUrgent: false,
      isExpired: false,
      daysDiff: days,
    };
  }

  return {
    text: `In ${days} days`,
    badgeClass: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
    isUrgent: false,
    isExpired: false,
    daysDiff: days,
  };
};

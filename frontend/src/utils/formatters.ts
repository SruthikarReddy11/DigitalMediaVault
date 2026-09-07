export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDetailedDateTime(dateString?: string | null): {
  date: string;
  time: string;
  full: string;
} {
  if (!dateString) {
    return { date: '—', time: '—', full: '—' };
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { date: '—', time: '—', full: '—' };
  }

  const datePart = date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }); // e.g. "07 Sep 2026"

  const timePart = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }); // e.g. "06:45:12 PM"

  return {
    date: datePart,
    time: timePart,
    full: `${datePart}, ${timePart}`,
  };
}

export function calculateAge(dob?: string | null): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export interface TrashRetentionInfo {
  deletedDate: string;        // e.g. "07 Sep 2026"
  deletedTime: string;        // e.g. "06:45 PM"
  deletedFull: string;        // e.g. "07 Sep 2026, 06:45 PM"
  daysRemaining: number;      // e.g. 28 (0 to 30)
  hoursRemaining: number;     // e.g. 672
  percentRemaining: number;   // e.g. 93.3% (0 to 100)
  statusText: string;         // e.g. "28 days left" or "Expires today" or "Expiring soon"
  badgeColor: {
    bg: string;
    text: string;
    border: string;
    progress: string;
    dot: string;
    chip: string;
  };
  isUrgent: boolean;          // <= 3 days left
  isWarning: boolean;         // <= 7 days left
}

export function getTrashRetentionInfo(deletedAt?: string | null, retentionDays = 30): TrashRetentionInfo {
  if (!deletedAt) {
    return {
      deletedDate: '—',
      deletedTime: '—',
      deletedFull: '—',
      daysRemaining: retentionDays,
      hoursRemaining: retentionDays * 24,
      percentRemaining: 100,
      statusText: `${retentionDays} days left`,
      badgeColor: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        progress: 'bg-emerald-500',
        dot: 'bg-emerald-400',
        chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      },
      isUrgent: false,
      isWarning: false,
    };
  }

  const d = new Date(deletedAt);
  if (isNaN(d.getTime())) {
    return {
      deletedDate: '—',
      deletedTime: '—',
      deletedFull: '—',
      daysRemaining: retentionDays,
      hoursRemaining: retentionDays * 24,
      percentRemaining: 100,
      statusText: `${retentionDays} days left`,
      badgeColor: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        progress: 'bg-emerald-500',
        dot: 'bg-emerald-400',
        chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      },
      isUrgent: false,
      isWarning: false,
    };
  }

  const deletedDate = d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const deletedTime = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const deletedFull = `${deletedDate}, ${deletedTime}`;

  const expiryMs = d.getTime() + retentionDays * 24 * 60 * 60 * 1000;
  const msRemaining = expiryMs - Date.now();
  const totalMs = retentionDays * 24 * 60 * 60 * 1000;

  const hoursRemaining = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60)));
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const percentRemaining = Math.max(0, Math.min(100, (msRemaining / totalMs) * 100));

  let statusText = `${daysRemaining} days left`;
  if (msRemaining <= 0) {
    statusText = 'Expiring soon';
  } else if (daysRemaining === 1) {
    statusText = hoursRemaining <= 1 ? '< 1 hour left' : `${hoursRemaining} hours left`;
  } else if (daysRemaining === 0) {
    statusText = 'Expires today';
  }

  const isUrgent = daysRemaining <= 3;
  const isWarning = daysRemaining > 3 && daysRemaining <= 7;

  let badgeColor = {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    progress: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    dot: 'bg-emerald-400',
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  };

  if (isUrgent) {
    badgeColor = {
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      progress: 'bg-gradient-to-r from-rose-600 to-red-500',
      dot: 'bg-rose-400 animate-ping',
      chip: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20',
    };
  } else if (isWarning) {
    badgeColor = {
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      progress: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      dot: 'bg-amber-400',
      chip: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    };
  }

  return {
    deletedDate,
    deletedTime,
    deletedFull,
    daysRemaining,
    hoursRemaining,
    percentRemaining,
    statusText,
    badgeColor,
    isUrgent,
    isWarning,
  };
}


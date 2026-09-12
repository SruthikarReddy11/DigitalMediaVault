import React, { useState } from 'react';
import {
  X,
  Clock,
  MapPin,
  FileText,
  Paperclip,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Bell,
  Repeat,
  Download,
  Eye,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { CalendarEvent, FileItem } from '../../types';
import {
  getEventTypeConfig,
  getPriorityConfig,
  formatEventTime,
  REMINDER_OFFSET_OPTIONS,
  isExpiryEvent,
  cleanEventTitle,
  formatExpiryCountdown,
} from '../../utils/calendarHelpers';
import { calendarApi } from '../../services/calendarApi';
import { formatBytes, formatDate } from '../../utils/formatters';
import { getMediaUrl } from '../../services/api';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => Promise<void>;
  onRefresh: () => void;
  onPreviewFile?: (file: FileItem) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
  onEdit,
  onDelete,
  onRefresh,
  onPreviewFile,
}) => {
  const [isTogglingComplete, setIsTogglingComplete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  if (!isOpen || !event) return null;

  const typeConfig = getEventTypeConfig(event.type);
  const priorityConfig = getPriorityConfig(event.priority);
  const TypeIcon = typeConfig.icon;

  const handleToggleComplete = async () => {
    try {
      setIsTogglingComplete(true);
      await calendarApi.toggleComplete(event.masterEventId || event.id, !event.isCompleted);
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    } finally {
      setIsTogglingComplete(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      setIsDeleting(true);
      await onDelete(event.masterEventId || event.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete event:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleChecklistItem = async (itemId: string, currentVal: boolean) => {
    try {
      await calendarApi.toggleChecklistItem(event.masterEventId || event.id, itemId, !currentVal);
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle checklist item:', err);
    }
  };

  const handleAddChecklistItem = async () => {
    if (!newChecklistTitle.trim()) return;
    try {
      setIsAddingItem(true);
      await calendarApi.addChecklistItem(event.masterEventId || event.id, newChecklistTitle.trim());
      setNewChecklistTitle('');
      onRefresh();
    } catch (err) {
      console.error('Failed to add checklist item:', err);
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    try {
      await calendarApi.deleteChecklistItem(event.masterEventId || event.id, itemId);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete checklist item:', err);
    }
  };

  const handleFileClick = (attFile: any) => {
    if (!attFile) return;
    if (onPreviewFile) {
      onPreviewFile(attFile as FileItem);
    } else {
      window.open(getMediaUrl(attFile.streamUrl), '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Top banner / Category styling */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex flex-wrap items-center gap-2">
            {isExpiryEvent(event) ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Expiry Tracker</span>
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${typeConfig.bgClass} ${typeConfig.borderClass} ${typeConfig.textClass}`}
              >
                <TypeIcon className="w-3.5 h-3.5" />
                <span>{typeConfig.label}</span>
              </span>
            )}

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${priorityConfig.bgClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${priorityConfig.dotColor}`} />
              <span>{priorityConfig.label}</span>
            </span>

            {isExpiryEvent(event) && (() => {
              const cd = formatExpiryCountdown(event.startTime);
              return (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold border ${cd.badgeClass}`}>
                  {cd.text}
                </span>
              );
            })()}

            {event.isCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                Done
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onClose();
                onEdit(event);
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Edit event"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
              title="Delete event"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Title */}
          <div>
            <h2
              className={`text-xl font-black text-white leading-tight ${
                event.isCompleted ? 'line-through text-slate-400' : ''
              }`}
            >
              {cleanEventTitle(event.title)}
            </h2>

            {/* Time & Recurrence */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Clock className="w-4 h-4 text-brand-400" />
                <span>
                  {formatDate(event.startTime)} •{' '}
                  {formatEventTime(event.startTime, event.endTime, event.allDay)}
                </span>
              </span>

              {event.recurrenceRule && event.recurrenceRule !== 'NONE' && (
                <span className="flex items-center gap-1 text-purple-300 font-medium px-2 py-0.5 bg-purple-500/10 rounded-md border border-purple-500/20">
                  <Repeat className="w-3.5 h-3.5" />
                  <span>Repeats {event.recurrenceRule.toLowerCase()}</span>
                </span>
              )}
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-2">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {/* Complete Toggle Action Bar */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">
              {event.isCompleted ? 'This event is completed' : 'Mark this event as finished'}
            </span>
            <button
              onClick={handleToggleComplete}
              disabled={isTogglingComplete}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                event.isCompleted
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25'
              }`}
            >
              {isTogglingComplete ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>{event.isCompleted ? 'Reopen Event' : 'Mark as Done'}</span>
            </button>
          </div>

          {/* Description */}
          {event.description && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Notes & Description
              </span>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                {event.description}
              </p>
            </div>
          )}

          {/* Checklist */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                Checklist (
                {event.checklist?.filter((c) => c.isCompleted).length || 0}/
                {event.checklist?.length || 0})
              </span>
            </div>

            {/* Checklist Items list */}
            {event.checklist && event.checklist.length > 0 && (
              <div className="space-y-1.5">
                {event.checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/50 border border-slate-800 text-xs transition group hover:border-slate-700"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleChecklistItem(item.id, item.isCompleted)}
                      className="flex items-center gap-2 text-left flex-1 cursor-pointer select-none"
                    >
                      {item.isCompleted ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0" />
                      )}
                      <span
                        className={`truncate ${
                          item.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {item.title}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Checklist Item inline */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add subtask..."
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                disabled={isAddingItem || !newChecklistTitle.trim()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

          {/* Attached Files */}
          {event.attachments && event.attachments.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                Attached Files ({event.attachments.length})
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {event.attachments.map((att) => {
                  const file = att.file;
                  if (!file) return null;
                  return (
                    <div
                      key={att.id}
                      onClick={() => handleFileClick(file)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-brand-500/50 cursor-pointer transition group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden text-brand-400 font-bold text-xs">
                        {file.fileType === 'IMAGE' && file.streamUrl ? (
                          <img
                            src={getMediaUrl(file.streamUrl)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                          {file.originalName}
                        </p>
                        <p className="text-[10px] text-slate-500">{formatBytes(file.size)}</p>
                      </div>

                      <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 transition" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reminders summary */}
          {event.reminders && event.reminders.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-emerald-400" />
                Configured Reminders
              </span>

              <div className="flex flex-wrap gap-2">
                {event.reminders.map((r) => {
                  const opt = REMINDER_OFFSET_OPTIONS.find((o) => o.value === r.timeOffsetMinutes);
                  return (
                    <span
                      key={r.id}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-1.5"
                    >
                      <span>{opt ? opt.label : `${r.timeOffsetMinutes}m before`}</span>
                      <span className="text-[10px] text-emerald-400/70">({r.status})</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

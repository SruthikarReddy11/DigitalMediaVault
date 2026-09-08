import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Paperclip,
  CheckSquare,
  Plus,
  Trash2,
  Bell,
  Repeat,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  CalendarEvent,
  CalendarEventType,
  CalendarEventPriority,
  CreateEventPayload,
  UpdateEventPayload,
  FileItem,
} from '../../types';
import {
  EVENT_TYPES,
  REMINDER_OFFSET_OPTIONS,
} from '../../utils/calendarHelpers';
import { FilePickerModal } from './FilePickerModal';
import { formatBytes } from '../../utils/formatters';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: CalendarEvent | null;
  initialDate?: Date | null;
  onSave: (data: CreateEventPayload | UpdateEventPayload) => Promise<void>;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  initialDate,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CalendarEventType>('REMINDER');
  const [priority, setPriority] = useState<CalendarEventPriority>('NORMAL');
  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [recurrenceRule, setRecurrenceRule] = useState<string>('NONE');

  // Reminders list
  const [reminderOffsets, setReminderOffsets] = useState<number[]>([15]);

  // Checklist items
  const [checklist, setChecklist] = useState<{ id?: string; title: string; isCompleted: boolean }[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');

  // Attachments
  const [attachedFiles, setAttachedFiles] = useState<{ id: string; name: string; size?: number }[]>([]);
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatLocalTime = (d: Date) => {
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  };

  useEffect(() => {
    if (!isOpen) return;

    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      setType(eventToEdit.type);
      setPriority(eventToEdit.priority);
      setAllDay(eventToEdit.allDay);
      setLocation(eventToEdit.location || '');
      setRecurrenceRule(eventToEdit.recurrenceRule || 'NONE');

      const s = new Date(eventToEdit.startTime);
      const e = new Date(eventToEdit.endTime);
      setStartDate(formatLocalDate(s));
      setStartTime(formatLocalTime(s));
      setEndDate(formatLocalDate(e));
      setEndTime(formatLocalTime(e));

      setReminderOffsets(
        eventToEdit.reminders?.length
          ? eventToEdit.reminders.map((r) => r.timeOffsetMinutes)
          : [15]
      );

      setChecklist(
        eventToEdit.checklist?.map((c) => ({
          id: c.id,
          title: c.title,
          isCompleted: c.isCompleted,
        })) || []
      );

      setAttachedFiles(
        eventToEdit.attachments?.map((a) => ({
          id: a.fileId,
          name: a.file?.originalName || 'Attached File',
          size: a.file?.size,
        })) || []
      );
    } else {
      // New event defaults
      const d = initialDate ? new Date(initialDate) : new Date();
      setTitle('');
      setDescription('');
      setType('REMINDER');
      setPriority('NORMAL');
      setAllDay(false);
      setLocation('');
      setRecurrenceRule('NONE');

      setStartDate(formatLocalDate(d));
      setStartTime('09:00');
      setEndDate(formatLocalDate(d));
      setEndTime('10:00');

      setReminderOffsets([15]);
      setChecklist([]);
      setAttachedFiles([]);
    }
    setErrorMsg('');
  }, [isOpen, eventToEdit, initialDate]);

  if (!isOpen) return null;

  const handleAddChecklistItem = () => {
    if (!newChecklistTitle.trim()) return;
    setChecklist((prev) => [...prev, { title: newChecklistTitle.trim(), isCompleted: false }]);
    setNewChecklistTitle('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddReminderOffset = (offset: number) => {
    if (!reminderOffsets.includes(offset)) {
      setReminderOffsets((prev) => [...prev, offset].sort((a, b) => a - b));
    }
  };

  const handleRemoveReminderOffset = (offset: number) => {
    setReminderOffsets((prev) => prev.filter((o) => o !== offset));
  };

  const handleSelectedFilesFromPicker = (files: FileItem[]) => {
    const mapped = files.map((f) => ({
      id: f.id,
      name: f.originalName,
      size: f.size,
    }));
    setAttachedFiles((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newlyAdded = mapped.filter((m) => !existingIds.has(m.id));
      return [...prev, ...newlyAdded];
    });
  };

  const handleRemoveAttachment = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Event title is required');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');

      const startDateTime = allDay
        ? new Date(`${startDate}T00:00:00`)
        : new Date(`${startDate}T${startTime}:00`);

      const endDateTime = allDay
        ? new Date(`${endDate || startDate}T23:59:59`)
        : new Date(`${endDate || startDate}T${endTime}:00`);

      if (endDateTime < startDateTime) {
        setErrorMsg('End time cannot be earlier than start time');
        setSaving(false);
        return;
      }

      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        allDay,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        location: location.trim() || undefined,
        recurrenceRule: recurrenceRule !== 'NONE' ? recurrenceRule : undefined,
        reminderOffsets,
        checklist,
        attachmentFileIds: attachedFiles.map((a) => a.id),
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error('Failed to save event:', err);
      setErrorMsg(err.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-400" />
              {eventToEdit ? 'Edit Event & Reminder' : 'New Calendar Event'}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
            {errorMsg && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Event Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Media Production Review, Project Deadline..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
              />
            </div>

            {/* Type and Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {EVENT_TYPES.slice(0, 6).map((t) => (
                    <button
                      type="button"
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium border transition ${
                        type === t.value
                          ? `${t.bgClass} ${t.borderClass} ${t.textClass} font-bold ring-1 ring-brand-500/30`
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${t.dotColor}`} />
                      <span className="truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'] as CalendarEventPriority[]).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition ${
                        priority === p
                          ? p === 'CRITICAL'
                            ? 'bg-red-500/20 border-red-500/50 text-red-300 ring-1 ring-red-500/30'
                            : p === 'HIGH'
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/30'
                            : p === 'NORMAL'
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 ring-1 ring-blue-500/30'
                            : 'bg-slate-700/40 border-slate-600 text-slate-200'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-400" />
                  Date & Time Schedule
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-0 cursor-pointer"
                  />
                  <span>All-day event</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">Starts</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                    {!allDay && (
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-28 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">Ends</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                    {!allDay && (
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-28 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Recurrence Selector */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-3">
                <Repeat className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-xs text-slate-400 shrink-0">Repeat:</span>
                <select
                  value={recurrenceRule}
                  onChange={(e) => setRecurrenceRule(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="NONE">Does not repeat</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKDAYS">Every Weekday (Mon–Fri)</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
            </div>

            {/* Smart Reminders */}
            <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-emerald-400" />
                  Smart Reminders
                </span>
                <select
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) handleAddReminderOffset(val);
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-emerald-400 focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>
                    + Add Reminder
                  </option>
                  {REMINDER_OFFSET_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                {reminderOffsets.map((offset) => {
                  const opt = REMINDER_OFFSET_OPTIONS.find((o) => o.value === offset);
                  return (
                    <span
                      key={offset}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs"
                    >
                      <span>{opt ? opt.label : `${offset}m before`}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveReminderOffset(offset)}
                        className="text-emerald-400 hover:text-emerald-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Checklist items */}
            <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                Tasks Checklist ({checklist.filter((c) => c.isCompleted).length}/{checklist.length})
              </span>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add a task item..."
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              {checklist.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {checklist.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                    >
                      <span className="text-slate-300 truncate">{item.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(idx)}
                        className="text-slate-500 hover:text-red-400 ml-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attached Vault Media Files */}
            <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                  Attached Media & Files ({attachedFiles.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsFilePickerOpen(true)}
                  className="px-3 py-1 bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Attach Drive Files
                </button>
              </div>

              {attachedFiles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300"
                    >
                      <span className="truncate max-w-[180px]">{file.name}</span>
                      {file.size ? (
                        <span className="text-[10px] text-slate-500">
                          ({formatBytes(file.size)})
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(file.id)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No files attached to this event.</p>
              )}
            </div>

            {/* Location & Description */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Location / Meeting Link
                </label>
                <input
                  type="text"
                  placeholder="e.g. Studio Room 2, Zoom URL, or Office"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Description / Private Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Add details, agenda, notes, or links..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition resize-none"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg shadow-brand-500/25 transition active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{eventToEdit ? 'Update Event' : 'Create Event'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* File Picker Submodal */}
      <FilePickerModal
        isOpen={isFilePickerOpen}
        onClose={() => setIsFilePickerOpen(false)}
        alreadySelectedIds={attachedFiles.map((a) => a.id)}
        onSelectFiles={handleSelectedFilesFromPicker}
      />
    </>
  );
};

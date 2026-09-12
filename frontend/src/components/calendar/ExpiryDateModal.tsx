import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  Calendar,
  Clock,
  FileText,
  Paperclip,
  Plus,
  Trash2,
  Bell,
  Check,
  Car,
  ShieldCheck,
  CreditCard,
  Stamp,
  FileCheck,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  CreateEventPayload,
  CalendarEventPriority,
  FileItem,
} from '../../types';
import {
  EXPIRY_PRESETS,
  EXPIRY_REMINDER_OPTIONS,
  ExpiryPreset,
} from '../../utils/calendarHelpers';
import { FilePickerModal } from './FilePickerModal';
import { formatBytes } from '../../utils/formatters';

interface ExpiryDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  onSave: (data: CreateEventPayload) => Promise<void>;
}

export const ExpiryDateModal: React.FC<ExpiryDateModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  onSave,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<ExpiryPreset>(EXPIRY_PRESETS[0]);
  const [title, setTitle] = useState(EXPIRY_PRESETS[0].defaultTitle);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<CalendarEventPriority>('HIGH');

  // Reminders (default 30 days, 7 days, and 1 day before)
  const [selectedReminders, setSelectedReminders] = useState<number[]>([1440, 10080, 43200]);

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

  useEffect(() => {
    if (!isOpen) return;

    const base = initialDate ? new Date(initialDate) : new Date();
    // Default expiry date: if initialDate is provided use it, otherwise set 30 days from now
    if (!initialDate) {
      base.setDate(base.getDate() + 30);
    }
    setExpiryDate(formatLocalDate(base));
    setSelectedPreset(EXPIRY_PRESETS[0]);
    setTitle(EXPIRY_PRESETS[0].defaultTitle);
    setReferenceNumber('');
    setNotes('');
    setPriority('HIGH');
    setSelectedReminders([1440, 10080, 43200]);
    setAttachedFiles([]);
    setErrorMsg('');
  }, [isOpen, initialDate]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: ExpiryPreset) => {
    setSelectedPreset(preset);
    setTitle(preset.defaultTitle);
  };

  const toggleReminder = (offset: number) => {
    setSelectedReminders((prev) =>
      prev.includes(offset) ? prev.filter((o) => o !== offset) : [...prev, offset].sort((a, b) => a - b)
    );
  };

  const handleSelectedFiles = (files: FileItem[]) => {
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

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileText':
        return FileText;
      case 'Car':
        return Car;
      case 'Shield':
        return Shield;
      case 'ShieldCheck':
        return ShieldCheck;
      case 'CreditCard':
        return CreditCard;
      case 'Stamp':
        return Stamp;
      case 'FileCheck':
        return FileCheck;
      default:
        return Clock;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Item title is required');
      return;
    }
    if (!expiryDate) {
      setErrorMsg('Expiry date is required');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');

      const startDateTime = new Date(`${expiryDate}T09:00:00`);
      const endDateTime = new Date(`${expiryDate}T18:00:00`);

      let fullDescription = notes.trim();
      if (referenceNumber.trim()) {
        fullDescription = `Document / Ref #: ${referenceNumber.trim()}${
          fullDescription ? `\n\n${fullDescription}` : ''
        }`;
      }
      // Append tag for discovery
      fullDescription = `${fullDescription ? `${fullDescription}\n\n` : ''}#expiry #category-${selectedPreset.id}`;

      const payload: CreateEventPayload = {
        title: `[EXPIRY] ${title.trim()}`,
        description: fullDescription,
        type: selectedPreset.defaultCategory,
        priority,
        allDay: true,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        isImportant: true,
        reminderOffsets: selectedReminders,
        attachmentFileIds: attachedFiles.map((a) => a.id),
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error('Failed to save expiry date:', err);
      setErrorMsg(err.message || 'Failed to save expiry date');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-6">
          {/* Top glowing accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>Save Expiry Date</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Expiry Tracker
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track expiration dates for documents, warranties, licenses & subscriptions
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
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

            {/* Expiry Category Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Choose Expiry Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EXPIRY_PRESETS.map((preset) => {
                  const Icon = getPresetIcon(preset.iconName);
                  const isSelected = selectedPreset.id === preset.id;
                  return (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium border transition-all text-left ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-slate-950/40 border-slate-800/90 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span className="truncate font-semibold">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title & Reference Number */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Item / Document Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. US Passport, MacBook Pro AppleCare Warranty..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ref / ID / Policy # (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. K1234567"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Expiry Date and Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Expiry Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition cursor-pointer [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Urgency / Priority
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['NORMAL', 'HIGH', 'CRITICAL'] as CalendarEventPriority[]).map((p) => (
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
                            : 'bg-blue-500/20 border-blue-500/50 text-blue-300 ring-1 ring-blue-500/30'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Smart Reminders Offsets */}
            <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  Automated Reminders Before Expiry
                </span>
                <span className="text-[11px] text-amber-400 font-medium">
                  {selectedReminders.length} reminder{selectedReminders.length === 1 ? '' : 's'} active
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EXPIRY_REMINDER_OPTIONS.map((opt) => {
                  const isActive = selectedReminders.includes(opt.value);
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => toggleReminder(opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        isActive
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold ring-1 ring-amber-500/30'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {isActive ? <Check className="w-3.5 h-3.5 text-amber-400" /> : null}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes / Details */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Notes, Renewal Link or Instructions
              </label>
              <textarea
                rows={2}
                placeholder={selectedPreset.descriptionPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition resize-none"
              />
            </div>

            {/* Document / File Attachments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                  Attach Scanned Document or Warranty Receipt
                </label>
                <button
                  type="button"
                  onClick={() => setIsFilePickerOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Choose Vault Files</span>
                </button>
              </div>

              {attachedFiles.length > 0 ? (
                <div className="space-y-1.5">
                  {attachedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                        <span className="truncate">{file.name}</span>
                        {file.size && (
                          <span className="text-[10px] text-slate-500 shrink-0">
                            ({formatBytes(file.size)})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(file.id)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  No files attached yet. You can attach passport scans, PDFs, receipts, or warranties.
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 active:scale-95 transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Saving Expiry...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 text-slate-950" />
                    <span>Save Expiry Date</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* File Picker Modal */}
      {isFilePickerOpen && (
        <FilePickerModal
          isOpen={isFilePickerOpen}
          onClose={() => setIsFilePickerOpen(false)}
          onSelectFiles={handleSelectedFiles}
          alreadySelectedIds={attachedFiles.map((a) => a.id)}
        />
      )}
    </>
  );
};

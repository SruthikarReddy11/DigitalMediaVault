import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { SecureContact, ContactInput } from '../../types';
import {
  User,
  Phone,
  Tag,
  Briefcase,
  Mail,
  MapPin,
  FileText,
  Star,
  Palette,
  Sparkles,
} from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  contact?: SecureContact | null;
  onClose: () => void;
  onSave: (data: ContactInput) => Promise<void>;
}

const CATEGORY_PRESETS = [
  'Personal',
  'Family',
  'Work',
  'Friend',
  'Emergency',
  'Doctor',
  'Business',
  'Service',
];

const COLOR_PALETTE = [
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#6366f1', // Indigo
];

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  contact,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactType, setContactType] = useState('Personal');
  const [isCustomType, setIsCustomType] = useState(false);
  const [customType, setCustomType] = useState('');
  const [occupation, setOccupation] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [color, setColor] = useState('#06b6d4');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setPhoneNumber(contact.phoneNumber);
      const isPreset = CATEGORY_PRESETS.includes(contact.contactType);
      if (isPreset) {
        setContactType(contact.contactType);
        setIsCustomType(false);
        setCustomType('');
      } else {
        setContactType('Other');
        setIsCustomType(true);
        setCustomType(contact.contactType);
      }
      setOccupation(contact.occupation || '');
      setEmail(contact.email || '');
      setAddress(contact.address || '');
      setNotes(contact.notes || '');
      setIsFavorite(contact.isFavorite);
      setColor(contact.color || '#06b6d4');
    } else {
      setName('');
      setPhoneNumber('');
      setContactType('Personal');
      setIsCustomType(false);
      setCustomType('');
      setOccupation('');
      setEmail('');
      setAddress('');
      setNotes('');
      setIsFavorite(false);
      setColor('#06b6d4');
    }
    setErrorMsg(null);
  }, [contact, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Contact name is required.');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMsg('Phone number is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const effectiveType = isCustomType ? customType.trim() || 'Personal' : contactType;

    try {
      await onSave({
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        contactType: effectiveType,
        occupation: occupation.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
        isFavorite,
        color,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <User className="w-4 h-4" />
          </div>
          <span className="font-bold text-white text-base">
            {contact ? 'Edit Secure Contact Cell' : 'Add New Secure Contact Cell'}
          </span>
        </div>
      }
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs animate-shake">
            {errorMsg}
          </div>
        )}

        {/* 1. Name of the contact & Favorite */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Contact Name *</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Alexander Vance"
              required
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-white/10 focus:border-cyan-500/60 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Favorite</label>
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition ${
                isFavorite
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950/50 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              <span>{isFavorite ? 'Starred' : 'Normal'}</span>
            </button>
          </div>
        </div>

        {/* 2. Phone Number & Contact Tag */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Phone Number *</span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. +1 (555) 234-5678"
              required
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-white/10 focus:border-emerald-500/60 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 font-mono transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              <span>Contact Classification</span>
            </label>
            <div className="flex gap-2">
              <select
                value={contactType}
                onChange={(e) => {
                  const val = e.target.value;
                  setContactType(val);
                  setIsCustomType(val === 'Other');
                }}
                className="w-full px-3 py-2.5 bg-slate-950/70 border border-white/10 focus:border-cyan-500/60 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition cursor-pointer"
              >
                {CATEGORY_PRESETS.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-white">
                    {cat}
                  </option>
                ))}
                <option value="Other" className="bg-slate-900 text-white">
                  Custom Tag...
                </option>
              </select>
            </div>
            {isCustomType && (
              <input
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Enter custom category..."
                className="w-full mt-1.5 px-3 py-2 bg-slate-950 border border-cyan-500/40 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* 3. Occupation & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              <span>Occupation / Role</span>
            </label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g. Chief Financial Officer"
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-white/10 focus:border-indigo-500/60 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex.vance@vault.io"
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-white/10 focus:border-cyan-500/60 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 font-mono transition"
            />
          </div>
        </div>

        {/* 4. Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Address (Physical / Postal)</span>
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            placeholder="e.g. Suite 420, 800 Market St, San Francisco, CA"
            className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-white/10 focus:border-rose-500/60 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500/30 resize-none transition"
          />
        </div>

        {/* 5. Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Private Notes (Optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Add any private notes, extensions, or secure memos..."
            className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-white/10 focus:border-slate-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none resize-none transition"
          />
        </div>

        {/* 6. Color theme for cell badge */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>Avatar Theme Color</span>
          </label>
          <div className="flex items-center gap-2 pt-1">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-xl transition-all duration-200 transform ${
                  color === c
                    ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-950 shadow-md'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/20 border border-white/10 transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{contact ? 'Update Contact Cell' : 'Save Contact Cell'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

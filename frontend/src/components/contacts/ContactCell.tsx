import React, { useState } from 'react';
import {
  Phone,
  User,
  Briefcase,
  Mail,
  MapPin,
  Star,
  Edit2,
  Trash2,
  Copy,
  Check,
  Tag,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { SecureContact } from '../../types';

interface ContactCellProps {
  contact: SecureContact;
  onEdit: (contact: SecureContact) => void;
  onDelete: (contact: SecureContact) => void;
  onToggleFavorite: (id: string) => void;
}

export const ContactCell: React.FC<ContactCellProps> = ({
  contact,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  // Helper to extract clean digits for WhatsApp and Tel
  const cleanDigits = contact.phoneNumber.replace(/\D/g, '');

  // Generate initials for avatar
  const initials = contact.name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'C';

  // Category badge styles
  const getCategoryColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'family':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'work':
      case 'business':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'emergency':
        return 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse';
      case 'friend':
      case 'friends':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'doctor':
      case 'health':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    }
  };

  return (
    <div className="group relative bg-slate-900/70 hover:bg-slate-900/95 border border-white/[0.08] hover:border-cyan-500/40 rounded-3xl p-5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between space-y-4">
      {/* Cell Header: Avatar + Contact Name + Action Buttons */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Avatar Initials Badge */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-white text-base shadow-inner border border-white/20 shrink-0 select-none"
            style={{
              background: `linear-gradient(135deg, ${contact.color || '#06b6d4'}, #3b82f6)`,
            }}
          >
            {initials}
          </div>

          <div className="min-w-0 space-y-1">
            {/* 1. Name of the contact */}
            <h3 className="font-bold text-base text-white truncate leading-tight group-hover:text-cyan-300 transition">
              {contact.name}
            </h3>

            {/* 2. Contact Type / Category Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getCategoryColor(
                  contact.contactType
                )}`}
              >
                <Tag className="w-2.5 h-2.5" />
                <span>{contact.contactType || 'Personal'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Favorite & Options */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggleFavorite(contact.id)}
            className={`p-2 rounded-xl transition ${
              contact.isFavorite
                ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                : 'text-slate-500 hover:text-white hover:bg-slate-800/80'
            }`}
            title={contact.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
          >
            <Star className={`w-4 h-4 ${contact.isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => onEdit(contact)}
            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition"
            title="Edit contact"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(contact)}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
            title="Delete contact"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Details Cells */}
      <div className="space-y-2.5 pt-2 border-t border-white/[0.06] text-xs">
        {/* 3. Phone Number */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-white/[0.05] hover:border-emerald-500/30 transition group/phone">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-medium">Phone Number</p>
              <a
                href={`tel:${contact.phoneNumber}`}
                className="font-mono text-xs font-bold text-emerald-300 hover:text-emerald-200 transition truncate block tracking-wide"
                title="Click to call"
              >
                {contact.phoneNumber}
              </a>
            </div>
          </div>

          {/* Phone Actions: Copy & Direct Call & WhatsApp */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => copyToClipboard(contact.phoneNumber, 'phone', e)}
              className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition"
              title="Copy phone number"
            >
              {copiedField === 'phone' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            {cleanDigits && (
              <a
                href={`https://wa.me/${cleanDigits}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                title="Message on WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* 4. Occupation */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-950/40 border border-white/[0.03]">
          <Briefcase className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Occupation
            </span>
            <span className="text-slate-200 font-medium truncate block">
              {contact.occupation || '—'}
            </span>
          </div>
        </div>

        {/* 5. Email */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/40 border border-white/[0.03]">
          <div className="flex items-center gap-2.5 min-w-0">
            <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                Email
              </span>
              {contact.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="text-cyan-300 hover:text-cyan-200 transition truncate block font-mono text-[11px]"
                >
                  {contact.email}
                </a>
              ) : (
                <span className="text-slate-500 text-[11px]">—</span>
              )}
            </div>
          </div>

          {contact.email && (
            <button
              onClick={(e) => copyToClipboard(contact.email!, 'email', e)}
              className="p-1 text-slate-400 hover:text-cyan-300 rounded transition"
              title="Copy email"
            >
              {copiedField === 'email' ? (
                <Check className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* 6. Address */}
        <div className="flex items-start justify-between px-3 py-2 rounded-xl bg-slate-950/40 border border-white/[0.03]">
          <div className="flex items-start gap-2.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                Address
              </span>
              <p className="text-slate-300 font-medium text-[11px] line-clamp-2 leading-relaxed">
                {contact.address || '—'}
              </p>
            </div>
          </div>

          {contact.address && (
            <div className="flex items-center gap-0.5 shrink-0 ml-2">
              <button
                onClick={(e) => copyToClipboard(contact.address!, 'address', e)}
                className="p-1 text-slate-400 hover:text-white rounded transition"
                title="Copy address"
              >
                {copiedField === 'address' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  contact.address
                )}`}
                target="_blank"
                rel="noreferrer"
                className="p-1 text-slate-400 hover:text-cyan-400 rounded transition"
                title="View on Google Maps"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Optional Notes Pill */}
      {contact.notes && (
        <div className="pt-2 border-t border-white/[0.04] text-[11px] text-slate-400 italic line-clamp-2">
          "{contact.notes}"
        </div>
      )}
    </div>
  );
};

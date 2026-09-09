import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PhoneCall,
  UserPlus,
  Lock,
  Search,
  Grid,
  List,
  Download,
  Star,
  Tag,
  Phone,
  User,
  Briefcase,
  Mail,
  MapPin,
  Sparkles,
  ShieldCheck,
  Filter,
  Check,
  Copy,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { SecureContact, ContactInput } from '../types';
import { contactsApi } from '../services/contactsApi';
import { useToast } from '../contexts/ToastContext';
import { ContactUnlockGate } from '../components/contacts/ContactUnlockGate';
import { ContactCell } from '../components/contacts/ContactCell';
import { ContactModal } from '../components/contacts/ContactModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const ContactsPage: React.FC = () => {
  const { success, error } = useToast();

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => contactsApi.isUnlocked());
  const [contacts, setContacts] = useState<SecureContact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Search and Filters
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [favoriteOnly, setFavoriteOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [modalTarget, setModalTarget] = useState<{
    isOpen: boolean;
    contact?: SecureContact | null;
  }>({
    isOpen: false,
    contact: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<SecureContact | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    if (!contactsApi.isUnlocked()) return;
    setIsLoading(true);
    try {
      const data = await contactsApi.getContacts();
      setContacts(data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        contactsApi.lock();
        setIsUnlocked(false);
      } else {
        error(err.message || 'Failed to load contacts.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    if (isUnlocked) {
      fetchContacts();
    }
  }, [isUnlocked, fetchContacts]);

  // Lock vault handler
  const handleLockVault = () => {
    contactsApi.lock();
    setIsUnlocked(false);
    setContacts([]);
    success('Contacts vault safely locked');
  };

  // Re-lock on unmount for security
  useEffect(() => {
    return () => {
      // Keep session token in memory/sessionStorage during active session, but re-lock if needed
    };
  }, []);

  // Save (Create or Update)
  const handleSaveContact = async (data: ContactInput) => {
    try {
      if (modalTarget.contact) {
        const updated = await contactsApi.updateContact(modalTarget.contact.id, data);
        setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        success(`Contact "${updated.name}" updated`);
      } else {
        const created = await contactsApi.createContact(data);
        setContacts((prev) => [created, ...prev]);
        success(`Contact "${created.name}" added`);
      }
    } catch (err: any) {
      error(err.message || 'Failed to save contact');
      throw err;
    }
  };

  // Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await contactsApi.deleteContact(deleteTarget.id);
      setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      success(`Contact "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (err: any) {
      error(err.message || 'Failed to delete contact');
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (id: string) => {
    try {
      const updated = await contactsApi.toggleFavorite(id);
      setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err: any) {
      error(err.message || 'Failed to toggle favorite');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (contacts.length === 0) return;

    const headers = ['Name', 'Phone Number', 'Contact Type', 'Occupation', 'Email', 'Address', 'Notes'];
    const rows = contacts.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phoneNumber.replace(/"/g, '""')}"`,
      `"${(c.contactType || 'Personal').replace(/"/g, '""')}"`,
      `"${(c.occupation || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VaultMedia_Contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Contacts exported successfully');
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => {
      if (c.contactType) set.add(c.contactType);
    });
    return Array.from(set);
  }, [contacts]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      if (favoriteOnly && !contact.isFavorite) return false;
      if (activeCategory !== 'ALL' && contact.contactType?.toLowerCase() !== activeCategory.toLowerCase()) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = contact.name.toLowerCase().includes(q);
        const matchesPhone = contact.phoneNumber.toLowerCase().includes(q);
        const matchesOccupation = (contact.occupation || '').toLowerCase().includes(q);
        const matchesEmail = (contact.email || '').toLowerCase().includes(q);
        const matchesAddress = (contact.address || '').toLowerCase().includes(q);
        const matchesType = (contact.contactType || '').toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesOccupation || matchesEmail || matchesAddress || matchesType;
      }

      return true;
    });
  }, [contacts, search, activeCategory, favoriteOnly]);

  const favoritesCount = useMemo(() => contacts.filter((c) => c.isFavorite).length, [contacts]);

  // If locked, render security gate
  if (!isUnlocked) {
    return <ContactUnlockGate onUnlocked={() => setIsUnlocked(true)} />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Modals */}
      <ContactModal
        isOpen={modalTarget.isOpen}
        contact={modalTarget.contact}
        onClose={() => setModalTarget({ isOpen: false, contact: null })}
        onSave={handleSaveContact}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Contact Cell"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete Contact"
        isDangerous
      />

      {/* 2. Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-900/80 border border-white/[0.08] backdrop-blur-xl rounded-3xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-600/30 border border-white/20">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Secure Contacts & Phone Vault
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Password Unlocked
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Encrypted phone numbers, identity cells, and personal contact directories
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setModalTarget({ isOpen: true, contact: null })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 border border-white/20 transition active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={contacts.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition disabled:opacity-40"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={handleLockVault}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-semibold transition active:scale-95"
            title="Lock contacts vault"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Section</span>
          </button>
        </div>
      </div>

      {/* 3. Search, Filter Chips & View Mode Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone number, occupation, email, address..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/70 border border-white/10 focus:border-cyan-500/60 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition backdrop-blur-md"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-white/10 rounded-2xl shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition ${
                viewMode === 'grid'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grid / Cells View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl transition ${
                viewMode === 'table'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Pills & Favorites Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => {
              setActiveCategory('ALL');
              setFavoriteOnly(false);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
              activeCategory === 'ALL' && !favoriteOnly
                ? 'bg-white text-slate-950 font-bold shadow-md'
                : 'bg-slate-900/70 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            All Contacts ({contacts.length})
          </button>

          <button
            onClick={() => {
              setFavoriteOnly(!favoriteOnly);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
              favoriteOnly
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-900/70 border border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoriteOnly ? 'fill-current' : ''}`} />
            <span>Favorites ({favoritesCount})</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setFavoriteOnly(false);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
                activeCategory === cat && !favoriteOnly
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/70 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {cat} ({contacts.filter((c) => c.contactType?.toLowerCase() === cat.toLowerCase()).length})
            </button>
          ))}
        </div>
      </div>

      {/* 4. Main Content: Empty State / Grid Cells / Table */}
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Loading encrypted contacts...</p>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-slate-900/40 border border-white/[0.08] rounded-3xl p-8 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 mx-auto">
            <PhoneCall className="w-8 h-8 text-cyan-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">
              {search || activeCategory !== 'ALL' || favoriteOnly
                ? 'No matching contacts found'
                : 'No Contacts Saved Yet'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search || activeCategory !== 'ALL' || favoriteOnly
                ? 'Try adjusting your search terms or clearing your category filters.'
                : 'Securely store and organize phone numbers, addresses, emails, and job details in password-protected cells.'}
            </p>
          </div>
          <button
            onClick={() => setModalTarget({ isOpen: true, contact: null })}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-cyan-600/25 border border-white/10 active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add First Contact Cell</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CELLS VIEW: Each cell prominently displays phone number, name, contact/category, occupation, email, address */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <ContactCell
              key={contact.id}
              contact={contact}
              onEdit={(c) => setModalTarget({ isOpen: true, contact: c })}
              onDelete={(c) => setDeleteTarget(c)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      ) : (
        /* TABLE CELLS VIEW */
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="px-4 py-3.5">Name</th>
                  <th className="px-4 py-3.5">Phone Number</th>
                  <th className="px-4 py-3.5">Contact Tag</th>
                  <th className="px-4 py-3.5">Occupation</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Address</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-white/[0.02] transition">
                    {/* Name */}
                    <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] text-white shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${contact.color || '#06b6d4'}, #3b82f6)`,
                          }}
                        >
                          {contact.name[0]?.toUpperCase() || 'C'}
                        </div>
                        <span>{contact.name}</span>
                        {contact.isFavorite && (
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" />
                        )}
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${contact.phoneNumber}`}
                          className="font-mono font-bold text-emerald-300 hover:text-emerald-200"
                        >
                          {contact.phoneNumber}
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(contact.phoneNumber);
                            setCopiedId(contact.id);
                            setTimeout(() => setCopiedId(null), 1500);
                          }}
                          className="p-1 text-slate-500 hover:text-slate-300 transition"
                          title="Copy phone"
                        >
                          {copiedId === contact.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Contact Tag */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {contact.contactType || 'Personal'}
                      </span>
                    </td>

                    {/* Occupation */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                      {contact.occupation || '—'}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-cyan-300 hover:text-cyan-200 font-mono text-[11px]"
                        >
                          {contact.email}
                        </a>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    {/* Address */}
                    <td className="px-4 py-3 max-w-xs truncate text-slate-300">
                      {contact.address || '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleFavorite(contact.id)}
                          className={`p-1.5 rounded-lg transition ${
                            contact.isFavorite ? 'text-amber-400' : 'text-slate-500 hover:text-white'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${contact.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => setModalTarget({ isOpen: true, contact })}
                          className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(contact)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

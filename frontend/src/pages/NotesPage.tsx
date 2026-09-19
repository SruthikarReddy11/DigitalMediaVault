import React, { useState, useEffect, useMemo } from 'react';
import {
  StickyNote,
  Plus,
  Search,
  Pin,
  Archive,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Tag,
  Paperclip,
  Check,
  X,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { notesApi } from '../services/notesApi';
import { Note, CreateNoteInput } from '../types';

const COLOR_PALETTES = [
  { name: 'Purple', bg: 'bg-purple-950/40', border: 'border-purple-500/30', accent: '#8b5cf6', ring: 'ring-purple-500/50' },
  { name: 'Cyan', bg: 'bg-cyan-950/40', border: 'border-cyan-500/30', accent: '#06b6d4', ring: 'ring-cyan-500/50' },
  { name: 'Indigo', bg: 'bg-indigo-950/40', border: 'border-indigo-500/30', accent: '#6366f1', ring: 'ring-indigo-500/50' },
  { name: 'Emerald', bg: 'bg-emerald-950/40', border: 'border-emerald-500/30', accent: '#10b981', ring: 'ring-emerald-500/50' },
  { name: 'Rose', bg: 'bg-rose-950/40', border: 'border-rose-500/30', accent: '#f43f5e', ring: 'ring-rose-500/50' },
  { name: 'Amber', bg: 'bg-amber-950/40', border: 'border-amber-500/30', accent: '#f59e0b', ring: 'ring-amber-500/50' },
];

export const NotesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVED' | 'HIDDEN'>('ACTIVE');
  const [notes, setNotes] = useState<Note[]>([]);
  const [hiddenNotes, setHiddenNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Hidden Notes Vault State
  const [isHiddenUnlocked, setIsHiddenUnlocked] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [hiddenAuthError, setHiddenAuthError] = useState('');
  const [isAuthorizingHidden, setIsAuthorizingHidden] = useState(false);

  // Create / Edit Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorTags, setEditorTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [editorColor, setEditorColor] = useState('#8b5cf6');
  const [editorIsPinned, setEditorIsPinned] = useState(false);
  const [editorIsHidden, setEditorIsHidden] = useState(false);
  const [editorIsProtected, setEditorIsProtected] = useState(false);
  const [editorPassword, setEditorPassword] = useState('');
  const [editorCurrentPassword, setEditorCurrentPassword] = useState('');
  const [editorError, setEditorError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Individual Note Unlock Modal State
  const [unlockingNoteId, setUnlockingNoteId] = useState<string | null>(null);
  const [notePassword, setNotePassword] = useState('');
  const [noteUnlockError, setNoteUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Note Protection Settings Modal State
  const [protectingNote, setProtectingNote] = useState<Note | null>(null);
  const [protectCurrentPass, setProtectCurrentPass] = useState('');
  const [protectNewPass, setProtectNewPass] = useState('');
  const [protectConfirmPass, setProtectConfirmPass] = useState('');
  const [protectAction, setProtectAction] = useState<'SET' | 'CHANGE' | 'REMOVE'>('SET');
  const [protectError, setProtectError] = useState('');

  // Delete Confirmation Modal
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);

  // Fetch standard notes
  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const data = await notesApi.listNotes({
        isArchived: activeTab === 'ARCHIVED',
        search: searchQuery || undefined,
        tag: selectedTag || undefined,
      });
      setNotes(data || []);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch hidden notes when unlocked
  const fetchHiddenNotes = async () => {
    try {
      setIsLoading(true);
      const data = await notesApi.listHiddenNotes({
        search: searchQuery || undefined,
        tag: selectedTag || undefined,
      });
      setHiddenNotes(data || []);
      setIsHiddenUnlocked(true);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setIsHiddenUnlocked(false);
        notesApi.setHiddenToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'HIDDEN') {
      const token = notesApi.getHiddenToken();
      if (token) {
        fetchHiddenNotes();
      } else {
        setIsHiddenUnlocked(false);
        setIsLoading(false);
      }
    } else {
      fetchNotes();
    }
  }, [activeTab, searchQuery, selectedTag]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const list = activeTab === 'HIDDEN' ? hiddenNotes : notes;
    const set = new Set<string>();
    list.forEach((n) => n.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [notes, hiddenNotes, activeTab]);

  // Handle Hidden Notes Vault Unlock
  const handleUnlockHiddenVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountPassword) return;

    try {
      setIsAuthorizingHidden(true);
      setHiddenAuthError('');
      await notesApi.unlockHidden(accountPassword);
      setAccountPassword('');
      setIsHiddenUnlocked(true);
      await fetchHiddenNotes();
    } catch (err: any) {
      setHiddenAuthError(err.response?.data?.error?.message || 'Incorrect password.');
    } finally {
      setIsAuthorizingHidden(false);
    }
  };

  const handleLockHiddenVault = () => {
    notesApi.setHiddenToken(null);
    setIsHiddenUnlocked(false);
    setHiddenNotes([]);
  };

  // Handle Open Create Modal
  const openCreateModal = () => {
    setEditingNote(null);
    setEditorTitle('');
    setEditorContent('');
    setEditorTags([]);
    setEditorColor('#8b5cf6');
    setEditorIsPinned(false);
    setEditorIsHidden(activeTab === 'HIDDEN');
    setEditorIsProtected(false);
    setEditorPassword('');
    setEditorCurrentPassword('');
    setEditorError('');
    setIsEditorOpen(true);
  };

  // Handle Open Edit Modal
  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setEditorTitle(note.title);
    setEditorContent(note.content || '');
    setEditorTags(note.tags || []);
    setEditorColor(note.color || '#8b5cf6');
    setEditorIsPinned(note.isPinned);
    setEditorIsHidden(note.isHidden);
    setEditorIsProtected(note.isPasswordProtected);
    setEditorPassword('');
    setEditorCurrentPassword('');
    setEditorError('');
    setIsEditorOpen(true);
  };

  // Handle Save Note
  const handleSaveNote = async () => {
    if (!editorTitle.trim()) {
      setEditorError('Title is required');
      return;
    }

    if (editorIsProtected && !editingNote && !editorPassword) {
      setEditorError('Password is required for password-protected note');
      return;
    }

    try {
      setIsSaving(true);
      setEditorError('');

      if (editingNote) {
        await notesApi.updateNote(editingNote.id, {
          title: editorTitle.trim(),
          content: editorContent,
          tags: editorTags,
          color: editorColor,
          isPinned: editorIsPinned,
          isHidden: editorIsHidden,
          currentPassword: editorCurrentPassword || undefined,
        });
      } else {
        const payload: CreateNoteInput = {
          title: editorTitle.trim(),
          content: editorContent,
          tags: editorTags,
          color: editorColor,
          isPinned: editorIsPinned,
          isHidden: editorIsHidden,
          isPasswordProtected: editorIsProtected,
          password: editorIsProtected ? editorPassword : undefined,
        };
        await notesApi.createNote(payload);
      }

      setIsEditorOpen(false);
      if (activeTab === 'HIDDEN') fetchHiddenNotes();
      else fetchNotes();
    } catch (err: any) {
      setEditorError(err.response?.data?.error?.message || 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Individual Note Unlock
  const handleUnlockNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockingNoteId || !notePassword) return;

    try {
      setIsUnlocking(true);
      setNoteUnlockError('');
      const unlocked = await notesApi.unlockNote(unlockingNoteId, notePassword);

      // Update state with decrypted note content
      const updateList = (list: Note[]) =>
        list.map((n) => (n.id === unlocked.id ? { ...n, content: unlocked.content, isLocked: false } : n));

      setNotes(updateList);
      setHiddenNotes(updateList);
      setUnlockingNoteId(null);
      setNotePassword('');
    } catch (err: any) {
      setNoteUnlockError(err.response?.data?.error?.message || 'Incorrect note password');
    } finally {
      setIsUnlocking(false);
    }
  };

  // Handle Password Protection Management
  const handleUpdateProtection = async () => {
    if (!protectingNote) return;

    try {
      setProtectError('');
      if (protectAction === 'SET') {
        if (!protectNewPass || protectNewPass.length < 4) {
          setProtectError('Password must be at least 4 characters');
          return;
        }
        if (protectNewPass !== protectConfirmPass) {
          setProtectError('Passwords do not match');
          return;
        }
        await notesApi.updateNote(protectingNote.id, {
          enablePassword: true,
          newPassword: protectNewPass,
        });
      } else if (protectAction === 'CHANGE') {
        if (!protectCurrentPass) {
          setProtectError('Current password is required');
          return;
        }
        if (!protectNewPass || protectNewPass.length < 4) {
          setProtectError('New password must be at least 4 characters');
          return;
        }
        if (protectNewPass !== protectConfirmPass) {
          setProtectError('Passwords do not match');
          return;
        }
        await notesApi.updateNote(protectingNote.id, {
          currentPassword: protectCurrentPass,
          newPassword: protectNewPass,
        });
      } else if (protectAction === 'REMOVE') {
        if (!protectCurrentPass) {
          setProtectError('Current password is required to remove protection');
          return;
        }
        await notesApi.updateNote(protectingNote.id, {
          disablePassword: true,
          currentPassword: protectCurrentPass,
        });
      }

      setProtectingNote(null);
      setProtectCurrentPass('');
      setProtectNewPass('');
      setProtectConfirmPass('');
      if (activeTab === 'HIDDEN') fetchHiddenNotes();
      else fetchNotes();
    } catch (err: any) {
      setProtectError(err.response?.data?.error?.message || 'Action failed');
    }
  };

  // Quick action toggles
  const handleTogglePin = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    try {
      await notesApi.togglePin(note.id);
      if (activeTab === 'HIDDEN') fetchHiddenNotes();
      else fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleArchive = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    try {
      await notesApi.toggleArchive(note.id);
      if (activeTab === 'HIDDEN') fetchHiddenNotes();
      else fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleHide = async (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    try {
      await notesApi.toggleHide(note.id);
      if (activeTab === 'HIDDEN') fetchHiddenNotes();
      else fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingNote) return;
    try {
      await notesApi.deleteNote(deletingNote.id);
      setDeletingNote(null);
      if (activeTab === 'HIDDEN') fetchHiddenNotes();
      else fetchNotes();
    } catch (err) {
      console.error(err);
    }
  };

  const activeNotesList = activeTab === 'HIDDEN' ? hiddenNotes : notes;
  const pinnedNotes = activeNotesList.filter((n) => n.isPinned);
  const otherNotes = activeNotesList.filter((n) => !n.isPinned);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Header */}
      <div className="border-b border-white/[0.08] bg-slate-950/60 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Title & Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20 ring-1 ring-white/20">
                <StickyNote className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-white tracking-tight">Personal Notes</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    AES-256
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Encrypted notes, checklists, code snippets & sensitive thoughts
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/25 border border-brand-400/30 flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Note</span>
              </button>
            </div>
          </div>

          {/* Subheader: Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-white/[0.06]">
            {/* View Tabs */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/[0.08]">
              <button
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'ACTIVE'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Notes
              </button>
              <button
                onClick={() => setActiveTab('ARCHIVED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'ARCHIVED'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archived</span>
              </button>
              <button
                onClick={() => setActiveTab('HIDDEN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'HIDDEN'
                    ? 'bg-purple-600 text-white shadow ring-1 ring-purple-400/30'
                    : 'text-purple-400 hover:text-purple-300'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hidden Vault</span>
                {isHiddenUnlocked && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes & tags..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-white/[0.08] focus:border-brand-500 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tags bar */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
              <Tag className="w-3 h-3 text-slate-500 shrink-0 mr-1" />
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition shrink-0 ${
                  selectedTag === null
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 font-bold'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition shrink-0 flex items-center gap-1 ${
                    selectedTag === tag
                      ? 'bg-brand-500 text-white font-bold'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>#{tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hidden Notes Vault Gate */}
        {activeTab === 'HIDDEN' && !isHiddenUnlocked && (
          <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-slate-900/80 border border-purple-500/30 backdrop-blur-2xl shadow-2xl shadow-purple-950/40 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 ring-2 ring-purple-400/30 mb-5">
              <KeyRound className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-lg font-black text-white tracking-tight mb-2">
              Hidden Notes Vault
            </h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              These notes are strictly isolated and never returned in standard queries.
              Please enter your VaultXMedia account password to access.
            </p>

            <form onSubmit={handleUnlockHiddenVault} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  placeholder="Enter account password"
                  autoFocus
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition text-center tracking-wider"
                />
              </div>

              {hiddenAuthError && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2 justify-center">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{hiddenAuthError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthorizingHidden || !accountPassword}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-purple-500/30 border border-purple-400/30 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isAuthorizingHidden ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Unlock Hidden Vault</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Hidden Vault Banner when Unlocked */}
        {activeTab === 'HIDDEN' && isHiddenUnlocked && (
          <div className="mb-6 p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-purple-200">Hidden Notes Vault Unlocked</h4>
                <p className="text-[11px] text-purple-400/80">
                  Notes here are invisible to unauthorized viewers and outside normal searches.
                </p>
              </div>
            </div>

            <button
              onClick={handleLockHiddenVault}
              className="px-3 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Vault</span>
            </button>
          </div>
        )}

        {/* Notes Grid */}
        {(! (activeTab === 'HIDDEN' && !isHiddenUnlocked)) && (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-48 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse p-4 space-y-3"
                  >
                    <div className="h-4 bg-slate-800 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-800/60 rounded-md w-full" />
                    <div className="h-3 bg-slate-800/60 rounded-md w-5/6" />
                  </div>
                ))}
              </div>
            ) : activeNotesList.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-500">
                  <StickyNote className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-300">
                  {searchQuery ? 'No notes matching search' : 'No notes found'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? 'Try adjusting your search keywords or tags filter.'
                    : activeTab === 'HIDDEN'
                    ? 'You have not hidden any notes yet. Mark sensitive notes as hidden to keep them isolated.'
                    : 'Click "New Note" to create your first personal note.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={openCreateModal}
                    className="mt-2 px-4 py-2 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/40 text-brand-300 text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create a Note</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pinned Section */}
                {pinnedNotes.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Pin className="w-3.5 h-3.5 text-brand-400" />
                      <span>Pinned Notes ({pinnedNotes.length})</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pinnedNotes.map((note) => renderNoteCard(note))}
                    </div>
                  </div>
                )}

                {/* Other / Unpinned Section */}
                {otherNotes.length > 0 && (
                  <div className="space-y-3">
                    {pinnedNotes.length > 0 && (
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Other Notes ({otherNotes.length})
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {otherNotes.map((note) => renderNoteCard(note))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* RENDER NOTE CARD HELPER */}
      {renderModals()}
    </div>
  );

  function renderNoteCard(note: Note) {
    const isLocked = note.isLocked;

    return (
      <div
        key={note.id}
        onClick={() => {
          if (isLocked) {
            setUnlockingNoteId(note.id);
            setNotePassword('');
            setNoteUnlockError('');
          } else {
            openEditModal(note);
          }
        }}
        className="group relative rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
        style={{ borderLeftColor: note.color || '#8b5cf6', borderLeftWidth: 4 }}
      >
        {/* Card Header */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition line-clamp-2">
              {note.title}
            </h3>

            {/* Top right badges & pin */}
            <div className="flex items-center gap-1 shrink-0">
              {note.isPasswordProtected && (
                <span
                  className={`p-1 rounded-md text-[10px] ${
                    isLocked ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                  title={isLocked ? 'Password Protected (Locked)' : 'Decrypted'}
                >
                  {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </span>
              )}

              {note.isHidden && (
                <span
                  className="p-1 rounded-md bg-purple-500/20 text-purple-300 text-[10px]"
                  title="Hidden in normal view"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </span>
              )}

              <button
                onClick={(e) => handleTogglePin(e, note)}
                className={`p-1 rounded-md transition ${
                  note.isPinned
                    ? 'text-brand-400 bg-brand-500/10'
                    : 'text-slate-500 hover:text-white opacity-0 group-hover:opacity-100'
                }`}
                title={note.isPinned ? 'Unpin note' : 'Pin note'}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Content or Locked Placeholder */}
          {isLocked ? (
            <div className="py-5 px-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-1.5 my-2">
              <Lock className="w-5 h-5 text-amber-400 mx-auto" />
              <p className="text-xs font-bold text-slate-300">Content Encrypted</p>
              <p className="text-[10px] text-slate-500">Click to enter password & decrypt</p>
            </div>
          ) : (
            <div className="text-xs text-slate-300/90 whitespace-pre-wrap line-clamp-4 font-normal leading-relaxed">
              {note.content || <span className="text-slate-500 italic">Empty note</span>}
            </div>
          )}

          {/* Attachments & Tags */}
          <div className="pt-2 flex flex-wrap items-center gap-1.5">
            {note.attachments && note.attachments.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md border border-white/[0.05]">
                <Paperclip className="w-3 h-3" />
                <span>{note.attachments.length}</span>
              </span>
            )}

            {note.tags?.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium text-brand-300 bg-brand-500/15 px-2 py-0.5 rounded-md border border-brand-500/20"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Card Footer: Date & Quick Actions */}
        <div className="px-4 py-2.5 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Password Protection button */}
            <button
              onClick={() => {
                setProtectingNote(note);
                setProtectAction(note.isPasswordProtected ? 'CHANGE' : 'SET');
                setProtectError('');
              }}
              className="p-1 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 transition"
              title={note.isPasswordProtected ? 'Change / Remove password' : 'Password protect note'}
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>

            {/* Archive button */}
            <button
              onClick={(e) => handleToggleArchive(e, note)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
              title={note.isArchived ? 'Unarchive' : 'Archive'}
            >
              <Archive className="w-3.5 h-3.5" />
            </button>

            {/* Hide button */}
            <button
              onClick={(e) => handleToggleHide(e, note)}
              className="p-1 text-slate-400 hover:text-purple-300 rounded hover:bg-slate-800 transition"
              title={note.isHidden ? 'Unhide note' : 'Hide note in vault'}
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>

            {/* Delete button */}
            <button
              onClick={() => setDeletingNote(note)}
              className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition"
              title="Delete note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderModals() {
    return (
      <>
        {/* 1. NOTE CREATE / EDIT MODAL */}
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {editingNote ? 'Edit Note' : 'Create New Note'}
                  </h3>
                </div>

                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Title */}
                <div>
                  <input
                    type="text"
                    value={editorTitle}
                    onChange={(e) => setEditorTitle(e.target.value)}
                    placeholder="Note Title"
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-brand-500 rounded-xl text-base font-bold text-white placeholder-slate-500 focus:outline-none transition"
                  />
                </div>

                {/* Content */}
                <div>
                  <textarea
                    rows={8}
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    placeholder="Write your note, checklist, or sensitive thoughts here..."
                    className="w-full p-4 bg-slate-950/80 border border-slate-800 focus:border-brand-500 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition resize-none leading-relaxed font-mono"
                  />
                </div>

                {/* Color and Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Color Palette */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Card Color Accent
                    </label>
                    <div className="flex items-center gap-2">
                      {COLOR_PALETTES.map((pal) => (
                        <button
                          key={pal.accent}
                          type="button"
                          onClick={() => setEditorColor(pal.accent)}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            editorColor === pal.accent
                              ? 'scale-125 ring-2 ring-white shadow-lg'
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: pal.accent }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Tags (Press Enter to add)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && tagInput.trim()) {
                            e.preventDefault();
                            if (!editorTags.includes(tagInput.trim())) {
                              setEditorTags([...editorTags, tagInput.trim()]);
                            }
                            setTagInput('');
                          }
                        }}
                        placeholder="Add tag..."
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
                      />
                    </div>
                    {/* Tags preview */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {editorTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1"
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
                            onClick={() => setEditorTags(editorTags.filter((t) => t !== tag))}
                            className="hover:text-red-300"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Protection & Vault Options */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Pin className="w-3.5 h-3.5 text-brand-400" />
                        <span>Pin Note to Top</span>
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={editorIsPinned}
                      onChange={(e) => setEditorIsPinned(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-brand-600 focus:ring-brand-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <EyeOff className="w-3.5 h-3.5 text-purple-400" />
                        <span>Hide Note</span>
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Only accessible inside the authenticated Hidden Notes vault
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={editorIsHidden}
                      onChange={(e) => setEditorIsHidden(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                    />
                  </div>

                  {/* Password protect checkbox (only on new note, or if already protected) */}
                  {!editingNote && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Password Protect & Encrypt</span>
                          </p>
                          <p className="text-[10px] text-slate-500">
                            AES-256-GCM encryption with custom note password
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={editorIsProtected}
                          onChange={(e) => setEditorIsProtected(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 text-amber-600 focus:ring-amber-500"
                        />
                      </div>

                      {editorIsProtected && (
                        <div className="pl-5 pt-1">
                          <input
                            type="password"
                            value={editorPassword}
                            onChange={(e) => setEditorPassword(e.target.value)}
                            placeholder="Set note password (min 4 chars)"
                            className="w-full px-3 py-1.5 bg-slate-950 border border-amber-500/40 rounded-lg text-xs text-white focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* If editing an already protected note, require current password to update content */}
                  {editingNote && editingNote.isPasswordProtected && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                      <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Note is Encrypted</span>
                      </p>
                      <input
                        type="password"
                        value={editorCurrentPassword}
                        onChange={(e) => setEditorCurrentPassword(e.target.value)}
                        placeholder="Enter note password to save changes"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {editorError && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{editorError}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950/60">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/30 border border-brand-400/30 transition flex items-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingNote ? 'Update Note' : 'Create Note'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. INDIVIDUAL NOTE UNLOCK MODAL */}
        {unlockingNoteId && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Unlock Protected Note</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter this note's individual password to decrypt its content.
                </p>
              </div>

              <form onSubmit={handleUnlockNote} className="space-y-3">
                <input
                  type="password"
                  value={notePassword}
                  onChange={(e) => setNotePassword(e.target.value)}
                  placeholder="Note password"
                  autoFocus
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none text-center"
                />

                {noteUnlockError && (
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold">
                    {noteUnlockError}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setUnlockingNoteId(null)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUnlocking || !notePassword}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isUnlocking ? (
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Decrypt</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. PASSWORD PROTECTION SETTINGS MODAL */}
        {protectingNote && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Password Protection</h3>
                </div>
                <button
                  onClick={() => setProtectingNote(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action selection */}
              {protectingNote.isPasswordProtected && (
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setProtectAction('CHANGE')}
                    className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                      protectAction === 'CHANGE' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setProtectAction('REMOVE')}
                    className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                      protectAction === 'REMOVE' ? 'bg-red-500/20 text-red-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Remove Protection
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {protectingNote.isPasswordProtected && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={protectCurrentPass}
                      onChange={(e) => setProtectCurrentPass(e.target.value)}
                      placeholder="Current note password"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                )}

                {protectAction !== 'REMOVE' && (
                  <>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">New Password</label>
                      <input
                        type="password"
                        value={protectNewPass}
                        onChange={(e) => setProtectNewPass(e.target.value)}
                        placeholder="Min 4 characters"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={protectConfirmPass}
                        onChange={(e) => setProtectConfirmPass(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {protectError && (
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold">
                    {protectError}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProtectingNote(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateProtection}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    protectAction === 'REMOVE'
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  {protectAction === 'REMOVE' ? 'Remove Protection' : 'Save Password'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. PERMANENT DELETE CONFIRMATION MODAL */}
        {deletingNote && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-red-500/30 rounded-3xl shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Delete Note?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  "{deletingNote.title}" will be permanently deleted. This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingNote(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
};

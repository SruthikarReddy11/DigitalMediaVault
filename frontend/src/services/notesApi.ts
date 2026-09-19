import { api } from './api';
import { Note, CreateNoteInput, UpdateNoteInput, NoteFilters } from '../types';

let sessionHiddenToken: string | null = null;

export const notesApi = {
  getHiddenToken(): string | null {
    return sessionHiddenToken || sessionStorage.getItem('vxd_notes_hidden_token');
  },

  setHiddenToken(token: string | null) {
    sessionHiddenToken = token;
    if (token) {
      sessionStorage.setItem('vxd_notes_hidden_token', token);
    } else {
      sessionStorage.removeItem('vxd_notes_hidden_token');
    }
  },

  /**
   * Authenticate and unlock Hidden Notes vault
   */
  unlockHidden: async (password: string): Promise<{ success: boolean; token: string }> => {
    const res = await api.post('/notes/hidden/unlock', { password });
    if (res.data?.data?.token) {
      notesApi.setHiddenToken(res.data.data.token);
    }
    return res.data.data;
  },

  /**
   * Fetch standard non-hidden notes
   */
  listNotes: async (filters: NoteFilters = {}): Promise<Note[]> => {
    const res = await api.get('/notes', { params: filters });
    return res.data.data;
  },

  /**
   * Fetch hidden notes (requires signed token)
   */
  listHiddenNotes: async (filters: NoteFilters = {}): Promise<Note[]> => {
    const token = notesApi.getHiddenToken();
    const res = await api.get('/notes/hidden', {
      headers: token ? { 'x-notes-hidden-token': token } : {},
      params: filters,
    });
    return res.data.data;
  },

  /**
   * Fetch single note
   */
  getNoteById: async (id: string): Promise<Note> => {
    const token = notesApi.getHiddenToken();
    const res = await api.get(`/notes/${id}`, {
      headers: token ? { 'x-notes-hidden-token': token } : {},
    });
    return res.data.data;
  },

  /**
   * Create a new note
   */
  createNote: async (data: CreateNoteInput): Promise<Note> => {
    const res = await api.post('/notes', data);
    return res.data.data;
  },

  /**
   * Update existing note
   */
  updateNote: async (id: string, data: UpdateNoteInput): Promise<Note> => {
    const res = await api.put(`/notes/${id}`, data);
    return res.data.data;
  },

  /**
   * Unlock an individual password-protected note
   */
  unlockNote: async (id: string, password: string): Promise<Note> => {
    const res = await api.post(`/notes/${id}/unlock`, { password });
    return res.data.data;
  },

  /**
   * Delete a note permanently
   */
  deleteNote: async (id: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/notes/${id}`);
    return res.data.data;
  },

  /**
   * Toggle pin
   */
  togglePin: async (id: string): Promise<Note> => {
    const res = await api.patch(`/notes/${id}/pin`);
    return res.data.data;
  },

  /**
   * Toggle archive
   */
  toggleArchive: async (id: string): Promise<Note> => {
    const res = await api.patch(`/notes/${id}/archive`);
    return res.data.data;
  },

  /**
   * Toggle hide
   */
  toggleHide: async (id: string): Promise<Note> => {
    const res = await api.patch(`/notes/${id}/hide`);
    return res.data.data;
  },
};

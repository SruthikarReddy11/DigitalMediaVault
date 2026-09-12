import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  FolderPlus,
  Palette,
  Check,
  Shield,
  Sparkles,
} from 'lucide-react';
import { ProductSection, CreateSectionInput, UpdateSectionInput } from '../../types/product';
import { productsApi } from '../../services/productsApi';
import { useToast } from '../../contexts/ToastContext';

interface CreateSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (section: ProductSection) => void;
  sectionToEdit?: ProductSection | null;
}

const COLOR_PRESETS = [
  { name: 'Indigo', value: '#6366f1', bg: 'bg-indigo-500' },
  { name: 'Emerald', value: '#10b981', bg: 'bg-emerald-500' },
  { name: 'Amber', value: '#f59e0b', bg: 'bg-amber-500' },
  { name: 'Rose', value: '#f43f5e', bg: 'bg-rose-500' },
  { name: 'Teal', value: '#14b8a6', bg: 'bg-teal-500' },
  { name: 'Purple', value: '#a855f7', bg: 'bg-purple-500' },
  { name: 'Fuchsia', value: '#d946ef', bg: 'bg-fuchsia-500' },
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500' },
];

export const CreateSectionModal: React.FC<CreateSectionModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  sectionToEdit,
}) => {
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [removePassword, setRemovePassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sectionToEdit) {
      setName(sectionToEdit.name || '');
      setDescription(sectionToEdit.description || '');
      setSelectedColor(sectionToEdit.color || '#6366f1');
      setIsLocked(sectionToEdit.isLocked || false);
      setPassword('');
      setConfirmPassword('');
      setRemovePassword(false);
    } else {
      setName('');
      setDescription('');
      setSelectedColor('#6366f1');
      setIsLocked(false);
      setPassword('');
      setConfirmPassword('');
      setRemovePassword(false);
    }
  }, [sectionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      error('Please enter a section name');
      return;
    }

    if (isLocked && !sectionToEdit && !password) {
      error('Please enter a password for this locked section');
      return;
    }

    if (isLocked && password && password !== confirmPassword) {
      error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      if (sectionToEdit) {
        const updateData: UpdateSectionInput = {
          name: trimmedName,
          description: description.trim() || undefined,
          color: selectedColor,
        };

        if (removePassword) {
          updateData.removePassword = true;
        } else if (password) {
          updateData.password = password;
        }

        const updated = await productsApi.updateSection(sectionToEdit.id, updateData);
        success(`Section "${updated.name}" updated!`);
        onSaved(updated);
      } else {
        const createData: CreateSectionInput = {
          name: trimmedName,
          description: description.trim() || undefined,
          color: selectedColor,
          password: isLocked && password ? password : undefined,
        };

        const created = await productsApi.createSection(createData);
        success(`Section "${created.name}" created!`);
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to save section');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-6">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: selectedColor }}
            >
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {sectionToEdit ? 'Edit Product Section' : 'Create Product Section'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Organize your items into custom lists & secret vaults
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Section Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Section Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Diwali Shopping, Tech Setup, Summer Fits, Secret Gifts"
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          {/* Optional Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Description <span className="text-slate-500 text-[11px] font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief note about the purpose of this section..."
              rows={2}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none transition"
            />
          </div>

          {/* Color Accent Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-brand-400" />
              <span>Accent Color</span>
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedColor(c.value)}
                  className={`w-8 h-8 rounded-xl ${c.bg} transition-all flex items-center justify-center cursor-pointer shadow-md ${
                    selectedColor === c.value
                      ? 'ring-2 ring-white scale-110 shadow-lg'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.name}
                >
                  {selectedColor === c.value && <Check className="w-4 h-4 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Password Protection Card */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl transition ${
                    isLocked ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    Lock Section with Password
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Require a password to view items in this section
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => {
                  if (sectionToEdit && sectionToEdit.isLocked && isLocked) {
                    // Toggling off existing locked section
                    setRemovePassword(true);
                    setIsLocked(false);
                  } else {
                    setRemovePassword(false);
                    setIsLocked(!isLocked);
                  }
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  isLocked ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isLocked ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Password input fields if locked */}
            {isLocked && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-fade-in">
                {sectionToEdit?.isLocked && !removePassword && !password ? (
                  <div className="flex items-center justify-between text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      Currently password-protected
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Enter new password below to change
                    </span>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={sectionToEdit?.isLocked ? 'New Password' : 'Enter Password'}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  Keep this password safe. Products in this section will be concealed until unlocked.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{sectionToEdit ? 'Save Changes' : 'Create Section'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

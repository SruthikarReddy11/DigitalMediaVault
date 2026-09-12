import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, Shield, KeyRound } from 'lucide-react';
import { ProductSection } from '../../types/product';
import { productsApi } from '../../services/productsApi';
import { useToast } from '../../contexts/ToastContext';

interface UnlockSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: ProductSection | null;
  onUnlocked: (sectionId: string) => void;
}

export const UnlockSectionModal: React.FC<UnlockSectionModalProps> = ({
  isOpen,
  onClose,
  section,
  onUnlocked,
}) => {
  const { success, error } = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen || !section) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      error('Please enter the password');
      return;
    }

    setIsVerifying(true);
    try {
      const verified = await productsApi.verifySectionPassword(section.id, password);
      if (verified) {
        success(`"${section.name}" unlocked!`);
        onUnlocked(section.id);
        onClose();
      } else {
        error('Incorrect password');
      }
    } catch (err: any) {
      error(err.message || 'Incorrect password');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-center space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Icon & Section Indicator */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl relative"
            style={{ backgroundColor: `${section.color}25` }}
          >
            <Lock className="w-8 h-8" style={{ color: section.color }} />
            <div
              className="absolute -inset-1 rounded-2xl blur-lg opacity-40"
              style={{ backgroundColor: section.color }}
            />
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-white">{section.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              This section is locked. Enter password to view products.
            </p>
          </div>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="space-y-4 text-left">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter section password"
              autoFocus
              className="w-full bg-slate-950/90 border border-slate-700/90 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 pr-10 shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isVerifying || !password}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isVerifying ? 'Checking...' : 'Unlock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

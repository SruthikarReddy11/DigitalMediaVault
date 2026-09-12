import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Check,
  FolderPlus,
  Lock,
  ShoppingBag,
  Layers,
} from 'lucide-react';
import { SavedProduct, ProductSection } from '../../types/product';
import { productsApi } from '../../services/productsApi';
import { useToast } from '../../contexts/ToastContext';

interface AddToSectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: SavedProduct | null;
  onOpenCreateSection?: () => void;
}

export const AddToSectionDialog: React.FC<AddToSectionDialogProps> = ({
  isOpen,
  onClose,
  product,
  onOpenCreateSection,
}) => {
  const { success, error } = useToast();
  const [sections, setSections] = useState<ProductSection[]>([]);
  const [assignedSectionIds, setAssignedSectionIds] = useState<string[]>([]);
  const [initialAssignedIds, setInitialAssignedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      loadData();
    }
  }, [isOpen, product]);

  const loadData = async () => {
    if (!product) return;
    setIsLoading(true);
    try {
      const [allSections, productSections] = await Promise.all([
        productsApi.getSections(),
        productsApi.getProductSections(product.id),
      ]);
      setSections(allSections);
      const assignedIds = productSections.map((s) => s.id);
      setAssignedSectionIds(assignedIds);
      setInitialAssignedIds(assignedIds);
    } catch (err: any) {
      console.error('Failed to load sections for product:', err);
      error('Failed to load sections');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  const toggleSection = (sectionId: string) => {
    if (assignedSectionIds.includes(sectionId)) {
      setAssignedSectionIds(assignedSectionIds.filter((id) => id !== sectionId));
    } else {
      setAssignedSectionIds([...assignedSectionIds, sectionId]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Find sections to add to
      const toAdd = assignedSectionIds.filter((id) => !initialAssignedIds.includes(id));
      // Find sections to remove from
      const toRemove = initialAssignedIds.filter((id) => !assignedSectionIds.includes(id));

      await Promise.all([
        ...toAdd.map((sectionId) =>
          productsApi.addProductsToSection(sectionId, [product.id])
        ),
        ...toRemove.map((sectionId) =>
          productsApi.removeProductFromSection(sectionId, product.id)
        ),
      ]);

      success('Section assignments updated!');
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to update sections');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Organize into Sections</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                {product.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sections Checklist */}
        <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading sections...</div>
          ) : sections.length === 0 ? (
            <div className="py-8 text-center space-y-2 text-slate-500">
              <FolderPlus className="w-8 h-8 mx-auto stroke-[1.5]" />
              <p className="text-xs">No sections created yet.</p>
              {onOpenCreateSection && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCreateSection();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Your First Section</span>
                </button>
              )}
            </div>
          ) : (
            sections.map((section) => {
              const isChecked = assignedSectionIds.includes(section.id);
              return (
                <div
                  key={section.id}
                  onClick={() => toggleSection(section.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer ${
                    isChecked
                      ? 'bg-brand-600/15 border-brand-500/50 shadow-md shadow-brand-500/10'
                      : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: section.color }}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{section.name}</span>
                        {section.isLocked && (
                          <span title="Password-protected">
                            <Lock className="w-3 h-3 text-amber-400" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {section.totalItems} item{section.totalItems !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                      isChecked
                        ? 'bg-brand-600 border-brand-500 text-white'
                        : 'border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          {onOpenCreateSection ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateSection();
              }}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Section</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

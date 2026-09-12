import React from 'react';
import {
  Plus,
  Lock,
  Unlock,
  Layers,
  Edit2,
  Trash2,
  X,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { ProductSection } from '../../types/product';

interface ProductSectionsBarProps {
  sections: ProductSection[];
  selectedSectionId: string | null;
  onSelectSection: (sectionId: string | null) => void;
  onNewSection: () => void;
  onEditSection: (section: ProductSection) => void;
  onDeleteSection: (sectionId: string) => void;
  onOpenAddProducts: (section: ProductSection) => void;
  unlockedSectionIds: string[];
  onRelockSection: (sectionId: string) => void;
  totalProductsCount: number;
}

export const ProductSectionsBar: React.FC<ProductSectionsBarProps> = ({
  sections,
  selectedSectionId,
  onSelectSection,
  onNewSection,
  onEditSection,
  onDeleteSection,
  onOpenAddProducts,
  unlockedSectionIds,
  onRelockSection,
  totalProductsCount,
}) => {
  const activeSection = sections.find((s) => s.id === selectedSectionId) || null;

  return (
    <div className="space-y-3">
      {/* Horizontal Chip Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {/* All Products Chip */}
        <button
          type="button"
          onClick={() => onSelectSection(null)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            selectedSectionId === null
              ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
              : 'bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-brand-400" />
          <span>All Vault</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800/80 text-slate-300 font-mono">
            {totalProductsCount}
          </span>
        </button>

        {/* User Sections Chips */}
        {sections.map((section) => {
          const isSelected = selectedSectionId === section.id;
          const isUnlocked = unlockedSectionIds.includes(section.id);

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelectSection(section.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'text-white border shadow-lg'
                  : 'bg-slate-900/60 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800/80'
              }`}
              style={{
                backgroundColor: isSelected ? `${section.color}20` : undefined,
                borderColor: isSelected ? `${section.color}70` : undefined,
                boxShadow: isSelected ? `0 4px 20px ${section.color}20` : undefined,
              }}
            >
              {/* Color indicator dot */}
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: section.color }}
              />

              <span>{section.name}</span>

              {/* Password Lock Indicator */}
              {section.isLocked && (
                <span title={isUnlocked ? 'Unlocked' : 'Password Protected'}>
                  {isUnlocked ? (
                    <Unlock className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                  )}
                </span>
              )}

              {/* Item Count Badge */}
              <span
                className="px-1.5 py-0.2 rounded-full text-[10px] font-mono shrink-0"
                style={{
                  backgroundColor: isSelected ? `${section.color}35` : 'rgba(30, 41, 59, 0.8)',
                  color: isSelected ? '#fff' : '#94a3b8',
                }}
              >
                {section.totalItems}
              </span>
            </button>
          );
        })}

        {/* + New Section Button */}
        <button
          type="button"
          onClick={onNewSection}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-brand-600/20 border border-dashed border-slate-700 hover:border-brand-500/50 text-brand-400 hover:text-brand-300 text-xs font-bold transition shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Section</span>
        </button>
      </div>

      {/* Active Section Banner */}
      {activeSection && (
        <div
          className="p-4 sm:p-5 rounded-3xl border transition-all animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
          style={{
            backgroundColor: `${activeSection.color}10`,
            borderColor: `${activeSection.color}35`,
          }}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            {/* Section Badge Avatar */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0"
              style={{ backgroundColor: activeSection.color }}
            >
              <Layers className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {activeSection.name}
                </h3>

                {activeSection.isLocked && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Lock className="w-3 h-3" />
                    <span>Protected</span>
                  </span>
                )}

                <span className="text-xs text-slate-400 font-medium">
                  • {activeSection.totalItems} product{activeSection.totalItems !== 1 ? 's' : ''}
                </span>

                {activeSection.totalValue && activeSection.totalValue > 0 ? (
                  <span className="text-xs text-emerald-400 font-bold">
                    • ₹{activeSection.totalValue.toLocaleString('en-IN')} total
                  </span>
                ) : null}
              </div>

              {activeSection.description && (
                <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                  {activeSection.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* + Add Products to this Section */}
            <button
              type="button"
              onClick={() => onOpenAddProducts(activeSection)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-black shadow-md active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Products</span>
            </button>

            {/* Relock Button if locked and unlocked */}
            {activeSection.isLocked && unlockedSectionIds.includes(activeSection.id) && (
              <button
                type="button"
                onClick={() => onRelockSection(activeSection.id)}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition cursor-pointer"
                title="Relock this section"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Relock</span>
              </button>
            )}

            {/* Edit Section */}
            <button
              type="button"
              onClick={() => onEditSection(activeSection)}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition cursor-pointer"
              title="Edit Section Details"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Delete Section */}
            <button
              type="button"
              onClick={() => onDeleteSection(activeSection.id)}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/80 transition cursor-pointer"
              title="Delete Section (Keeps Products)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Close / Return to All */}
            <button
              type="button"
              onClick={() => onSelectSection(null)}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 transition cursor-pointer"
              title="View All Products"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

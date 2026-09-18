import React, { useState } from 'react';
import {
  Zap,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarCheck,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import {
  ExpenseType,
  CreateExpensePayload,
  PREDEFINED_EXPENSE_CATEGORIES,
  PREDEFINED_INCOME_CATEGORIES,
  PREDEFINED_PAYMENT_METHODS,
} from '../../services/expenseApi';

interface SaveExpensePromptBannerProps {
  onOpenDetailedModal: (defaultType?: ExpenseType) => void;
  onQuickSave: (payload: CreateExpensePayload) => Promise<any>;
  hasExpenses: boolean;
  activeCount: number;
}

export const SaveExpensePromptBanner: React.FC<SaveExpensePromptBannerProps> = ({
  onOpenDetailedModal,
  onQuickSave,
  hasExpenses,
  activeCount,
}) => {
  const [quickType, setQuickType] = useState<ExpenseType>('EXPENSE');
  const [quickAmount, setQuickAmount] = useState<string>('');
  const [quickCategory, setQuickCategory] = useState<string>('Food');
  const [quickPaymentMethod, setQuickPaymentMethod] = useState<string>('UPI');
  const [quickDescription, setQuickDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(quickAmount);
    if (isNaN(amt) || amt <= 0 || !quickCategory.trim()) {
      return;
    }

    try {
      setIsSaving(true);
      await onQuickSave({
        type: quickType,
        amount: amt,
        currency: 'INR',
        date: new Date().toISOString(),
        category: quickCategory,
        paymentMethod: quickPaymentMethod,
        description: quickDescription.trim() || undefined,
      });

      setQuickAmount('');
      setQuickDescription('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTypeToggle = (type: ExpenseType) => {
    setQuickType(type);
    if (type === 'INCOME') {
      setQuickCategory('Salary');
    } else {
      setQuickCategory('Food');
    }
  };

  const categories = quickType === 'INCOME' ? PREDEFINED_INCOME_CATEGORIES : PREDEFINED_EXPENSE_CATEGORIES;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-indigo-950/40 border border-brand-500/20 shadow-xl backdrop-blur-xl p-5 md:p-6 mb-6">
      {/* Background glow accents */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Row */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30 shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Record Your Daily Expenses
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {hasExpenses
                ? `You have ${activeCount} transactions logged. Record your expenses below to keep your analytics up to date.`
                : 'Log your expenses with category, payment method, and amount. Your analytics and charts update in real-time.'}
            </p>
          </div>
        </div>

        {/* Modal open button */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => onOpenDetailedModal(quickType)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Add Detailed Transaction
          </button>
        </div>
      </div>

      {/* Inline Quick Form */}
      <div className="relative z-10 pt-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Quick Entry
        </p>

        <form
          onSubmit={handleQuickSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center"
        >
          {/* Type Toggle (2 cols on lg) */}
          <div className="lg:col-span-2 flex bg-slate-950/70 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => handleTypeToggle('EXPENSE')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                quickType === 'EXPENSE'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeToggle('INCOME')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                quickType === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Income
            </button>
          </div>

          {/* Amount (2 cols on lg) */}
          <div className="lg:col-span-2 relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
              ₹
            </span>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
              placeholder="Amount"
              className="w-full pl-7 pr-2.5 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Category (3 cols on lg) */}
          <div className="lg:col-span-3">
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method (2 cols on lg) */}
          <div className="lg:col-span-2">
            <select
              value={quickPaymentMethod}
              onChange={(e) => setQuickPaymentMethod(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {PREDEFINED_PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm} className="bg-slate-900 text-white">
                  {pm}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Description (2 cols on lg) */}
          <div className="lg:col-span-2">
            <input
              type="text"
              value={quickDescription}
              onChange={(e) => setQuickDescription(e.target.value)}
              placeholder="Description (Optional)"
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Save Button (1 col on lg) */}
          <div className="lg:col-span-1">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2 px-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : showSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

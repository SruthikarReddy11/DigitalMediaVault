import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Tag,
  Calendar,
  CreditCard,
  FileText,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { Expense, ExpenseType, CreateExpensePayload, UpdateExpensePayload } from '../../services/expenseApi';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseToEdit?: Expense | null;
  defaultType?: ExpenseType;
  onSubmit: (payload: CreateExpensePayload | UpdateExpensePayload) => Promise<any>;
}

const EXPENSE_CATEGORIES = [
  'Rent & Housing',
  'Groceries',
  'Food & Dining',
  'Travel & Transport',
  'Utilities & Bills',
  'Shopping',
  'Electronics & Gadgets',
  'Healthcare',
  'Education',
  'Entertainment',
  'Personal Care',
  'Gifts & Donations',
  'Other',
];

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Investment & Dividends',
  'Rental Income',
  'Gifts & Reimbursements',
  'Bonus / Incentive',
  'Other',
];

const PAYMENT_METHODS = [
  'UPI',
  'Cash',
  'Credit Card',
  'Debit Card',
  'Net Banking',
  'Bank Transfer',
  'Other',
];

const COMMON_PERSON_SUGGESTIONS = [
  'Landlord',
  'Amazon',
  'Swiggy / Zomato',
  'Supermarket',
  'Electricity Board',
  'Uber / Ola',
  'Company / Employer',
  'Freelance Client',
  'Friend / Colleague',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expenseToEdit,
  defaultType = 'EXPENSE',
  onSubmit,
}) => {
  const [type, setType] = useState<ExpenseType>(defaultType);
  const [amount, setAmount] = useState<string>('');
  const [person, setPerson] = useState<string>('');
  const [category, setCategory] = useState<string>('Food & Dining');
  const [reason, setReason] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [date, setDate] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expenseToEdit) {
      setType(expenseToEdit.type);
      setAmount(String(expenseToEdit.amount));
      setPerson(expenseToEdit.person);
      setCategory(expenseToEdit.category);
      setReason(expenseToEdit.reason);
      setPaymentMethod(expenseToEdit.paymentMethod || 'UPI');
      // Format to YYYY-MM-DDTHH:mm for datetime-local input
      const d = new Date(expenseToEdit.date);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDate(localIso);
      setTags((expenseToEdit.tags || []).join(', '));
    } else {
      setType(defaultType);
      setAmount('');
      setPerson('');
      setCategory(defaultType === 'INCOME' ? 'Salary' : 'Food & Dining');
      setReason('');
      setPaymentMethod('UPI');
      const now = new Date();
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDate(localIso);
      setTags('');
    }
    setError(null);
  }, [expenseToEdit, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleTypeChange = (newType: ExpenseType) => {
    setType(newType);
    if (newType === 'INCOME' && !INCOME_CATEGORIES.includes(category)) {
      setCategory(INCOME_CATEGORIES[0]);
    } else if (newType === 'EXPENSE' && !EXPENSE_CATEGORIES.includes(category)) {
      setCategory(EXPENSE_CATEGORIES[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (!person.trim()) {
      setError(type === 'INCOME' ? 'Please specify who the money is received from' : 'Please specify the person or merchant paid to');
      return;
    }
    if (!category.trim()) {
      setError('Please select or specify a category / reason category');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a specific reason or description');
      return;
    }

    try {
      setIsSubmitting(true);
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        type,
        amount: numAmount,
        currency: 'INR',
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        person: person.trim(),
        category: category.trim(),
        reason: reason.trim(),
        paymentMethod: paymentMethod.trim(),
        tags: tagList,
      };

      await onSubmit(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                type === 'INCOME'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {type === 'INCOME' ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {expenseToEdit ? 'Edit Transaction' : 'Record New Transaction'}
              </h2>
              <p className="text-xs text-slate-400">
                {type === 'INCOME'
                  ? 'Log incoming funds, salary, or revenue'
                  : 'Track outgoing payments, bills, and spending'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              {error}
            </div>
          )}

          {/* Type Selector Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Transaction Flow
            </label>
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-950/60 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => handleTypeChange('EXPENSE')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  type === 'EXPENSE'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Outgoing Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('INCOME')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  type === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                Incoming Income
              </button>
            </div>
          </div>

          {/* Amount & Currency */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-lg">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white font-mono text-xl focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-600"
              />
            </div>
          </div>

          {/* Person / Counterparty */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {type === 'INCOME' ? 'Received From (Person / Source) *' : 'Paid To (Person / Merchant) *'}
              </label>
            </div>
            <input
              type="text"
              required
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder={type === 'INCOME' ? 'e.g. Employer, Client name, Friend' : 'e.g. Suresh Landlord, Swiggy, Amazon, Grocer'}
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-600"
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-slate-500 self-center mr-1">Quick:</span>
              {COMMON_PERSON_SUGGESTIONS.slice(0, 5).map((sugg) => (
                <button
                  key={sugg}
                  type="button"
                  onClick={() => setPerson(sugg)}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5 transition-colors"
                >
                  {sugg}
                </button>
              ))}
            </div>
          </div>

          {/* Category / Reason Classification */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Category / Classification *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-950/30 rounded-xl border border-white/5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium text-left truncate transition-all ${
                    category === cat
                      ? type === 'INCOME'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Reason / Detailed Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Specific Reason / Purpose *
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Monthly flat maintenance fee, Flight ticket to Mumbai, Project milestone payment..."
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-600 resize-none"
            />
          </div>

          {/* Date & Payment Method Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm} className="bg-slate-900 text-white">
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Tags (comma separated, optional)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. urgent, tax-deductible, personal, trip-2026"
              className="w-full px-3.5 py-2 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-600"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
                type === 'INCOME'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-brand-600 hover:bg-brand-500 shadow-brand-600/30'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {expenseToEdit ? 'Update Expense' : 'Save Expense'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

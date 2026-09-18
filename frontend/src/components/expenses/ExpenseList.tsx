import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  User,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';
import { Expense, ExpenseType, ExpenseFilters } from '../../services/expenseApi';

interface ExpenseListProps {
  expenses: Expense[];
  isLoading: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onExportCsv: () => void;
  filters: ExpenseFilters;
  onFilterChange: (newFilters: ExpenseFilters) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  isLoading,
  onEdit,
  onDelete,
  onExportCsv,
  filters,
  onFilterChange,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleTypeFilter = (type?: ExpenseType) => {
    onFilterChange({ ...filters, type });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'date_desc') onFilterChange({ ...filters, sortBy: 'date', sortOrder: 'desc' });
    else if (val === 'date_asc') onFilterChange({ ...filters, sortBy: 'date', sortOrder: 'asc' });
    else if (val === 'amount_desc') onFilterChange({ ...filters, sortBy: 'amount', sortOrder: 'desc' });
    else if (val === 'amount_asc') onFilterChange({ ...filters, sortBy: 'amount', sortOrder: 'asc' });
  };

  const confirmDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      onDelete(id);
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-5 md:p-6 shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">
            Recorded Transactions History
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            View, search, filter, and manage all your logged financial entries
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export CSV */}
          <button
            type="button"
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          {/* Sort Selector */}
          <select
            onChange={handleSortChange}
            defaultValue="date_desc"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 border border-white/10 text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="date_desc">Newest Date First</option>
            <option value="date_asc">Oldest Date First</option>
            <option value="amount_desc">Highest Amount First</option>
            <option value="amount_asc">Lowest Amount First</option>
          </select>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={handleSearchChange}
            placeholder="Search by person, reason, category..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-white/10 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => handleTypeFilter(undefined)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              !filters.type
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleTypeFilter('EXPENSE')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filters.type === 'EXPENSE'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Expenses
          </button>
          <button
            type="button"
            onClick={() => handleTypeFilter('INCOME')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filters.type === 'INCOME'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      {/* Transaction Rows / Cards */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Loading transactions...
        </div>
      ) : expenses.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <p className="text-sm font-semibold text-white">No transactions found</p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search criteria or log a new transaction above.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {expenses.map((item) => {
            const isIncome = item.type === 'INCOME';
            const dateObj = new Date(item.date);
            const dateFormatted = dateObj.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const timeFormatted = dateObj.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-white/5 hover:border-white/15 hover:bg-slate-950/70 transition-all"
              >
                {/* Left: Icon & Meta */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        {item.category}
                      </span>
                      {item.person && (
                        <span className="text-xs text-slate-300 font-medium">
                          • {item.person}
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/5">
                        {item.paymentMethod || 'UPI'}
                      </span>
                    </div>

                    {(item.description || item.reason) && (
                      <p className="text-xs text-slate-300 mt-0.5">
                        {item.description || item.reason}
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-[11px] text-slate-400 mt-0.5 italic">
                        Note: {item.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {dateFormatted} at {timeFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                  <div className="text-right">
                    <span
                      className={`text-base sm:text-lg font-black font-mono ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}₹
                      {item.amount.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Edit transaction"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

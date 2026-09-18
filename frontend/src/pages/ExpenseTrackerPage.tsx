import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  BarChart3,
  ListOrdered,
  FileSpreadsheet,
} from 'lucide-react';
import {
  expenseApi,
  Expense,
  ExpenseAnalytics,
  ExpenseFilters,
  ExpenseType,
  CreateExpensePayload,
  UpdateExpensePayload,
} from '../services/expenseApi';
import { useToast } from '../contexts/ToastContext';
import { SaveExpensePromptBanner } from '../components/expenses/SaveExpensePromptBanner';
import { ExpenseAnalyticsDashboard } from '../components/expenses/ExpenseAnalyticsDashboard';
import { ExpenseList } from '../components/expenses/ExpenseList';
import { ExpenseModal } from '../components/expenses/ExpenseModal';

export const ExpenseTrackerPage: React.FC = () => {
  const { success, error } = useToast();

  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filters, setFilters] = useState<ExpenseFilters>({
    sortBy: 'date',
    sortOrder: 'desc',
    limit: 100,
  });

  // Active view tab: "dashboard" (Analytics & Breakdown) vs "transactions" (Table list)
  const [viewMode, setViewMode] = useState<'dashboard' | 'transactions'>('dashboard');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [modalDefaultType, setModalDefaultType] = useState<ExpenseType>('EXPENSE');

  // Fetch all data
  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [analyticsRes, listRes] = await Promise.all([
        expenseApi.getExpenseAnalytics(),
        expenseApi.getExpenses(filters),
      ]);

      setAnalytics(analyticsRes);
      setExpenses(listRes.data || []);
    } catch (err: any) {
      error(err.message || 'Failed to load expense data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Quick Save from Banner
  const handleQuickSave = async (payload: CreateExpensePayload) => {
    try {
      await expenseApi.createExpense(payload);
      success('Transaction logged successfully!', 'Expense Saved');
      await fetchData(true);
    } catch (err: any) {
      error(err.message || 'Failed to log expense');
      throw err;
    }
  };

  // Handle Seed Sample Data
  const handleSeedSampleData = async () => {
    try {
      const res = await expenseApi.seedSampleExpenses();
      success(`Added ${res.count} realistic sample transactions across 5 months!`, 'Sample Data Ready');
      await fetchData(true);
    } catch (err: any) {
      error(err.message || 'Failed to seed sample data');
      throw err;
    }
  };

  // Handle Modal Save (Create or Update)
  const handleModalSubmit = async (payload: CreateExpensePayload | UpdateExpensePayload) => {
    if (expenseToEdit) {
      await expenseApi.updateExpense(expenseToEdit.id, payload as UpdateExpensePayload);
      success('Transaction updated successfully!');
    } else {
      await expenseApi.createExpense(payload as CreateExpensePayload);
      success('New transaction recorded successfully!');
    }
    await fetchData(true);
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    try {
      await expenseApi.deleteExpense(id);
      success('Transaction deleted');
      await fetchData(true);
    } catch (err: any) {
      error(err.message || 'Failed to delete transaction');
    }
  };

  // Handle Export CSV
  const handleExportCsv = async () => {
    try {
      const blob = await expenseApi.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense_tracker_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success('CSV file downloaded');
    } catch (err: any) {
      error(err.message || 'Failed to export CSV');
    }
  };

  // Open modal helper
  const openNewTransactionModal = (type: ExpenseType = 'EXPENSE') => {
    setExpenseToEdit(null);
    setModalDefaultType(type);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Expense) => {
    setExpenseToEdit(item);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 pt-2 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Title & Top Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/25 border border-white/10">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Expense Tracker
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Analytics Pro
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Track incoming & outgoing expenses by date, person, and reason with AI peak analytics
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition-colors"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => openNewTransactionModal('INCOME')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all shadow-sm"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            + Add Income
          </button>

          <button
            type="button"
            onClick={() => openNewTransactionModal('EXPENSE')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Prominent Save Expense Reminder & 3-Second Quick Logger */}
      <SaveExpensePromptBanner
        onOpenDetailedModal={openNewTransactionModal}
        onQuickSave={handleQuickSave}
        onSeedSampleData={handleSeedSampleData}
        hasExpenses={expenses.length > 0}
        activeCount={expenses.length}
      />

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between my-5">
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'dashboard'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics & Peak Insights
          </button>
          <button
            type="button"
            onClick={() => setViewMode('transactions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'transactions'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            All Transactions ({expenses.length})
          </button>
        </div>

        {viewMode === 'dashboard' && (
          <button
            type="button"
            onClick={() => setViewMode('transactions')}
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold hidden sm:flex items-center gap-1"
          >
            View transaction table &rarr;
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading && !analytics ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Crunching financial analytics...</p>
        </div>
      ) : viewMode === 'dashboard' ? (
        analytics && (
          <div className="space-y-8">
            <ExpenseAnalyticsDashboard
              analytics={analytics}
              onSelectMonth={(m) => {
                setFilters((prev) => ({ ...prev, search: m }));
                setViewMode('transactions');
              }}
            />

            {/* Quick mini-list of recent transactions below the dashboard */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Recent Activity Log
                </h3>
                <button
                  type="button"
                  onClick={() => setViewMode('transactions')}
                  className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
                >
                  See all {expenses.length} entries &rarr;
                </button>
              </div>
              <ExpenseList
                expenses={expenses.slice(0, 5)}
                isLoading={false}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onExportCsv={handleExportCsv}
                filters={filters}
                onFilterChange={setFilters}
              />
            </div>
          </div>
        )
      ) : (
        <ExpenseList
          expenses={expenses}
          isLoading={isLoading}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onExportCsv={handleExportCsv}
          filters={filters}
          onFilterChange={setFilters}
        />
      )}

      {/* Transaction Modal (Add / Edit) */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {}}
        expenseToEdit={expenseToEdit}
        defaultType={modalDefaultType}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

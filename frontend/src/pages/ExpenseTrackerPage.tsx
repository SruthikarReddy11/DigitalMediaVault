import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  BarChart3,
  Receipt,
  Download,
  PieChart,
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

  // Top-level Navigation Page: "tracker" (Expenses Tracker & History) vs "analytics" (Dedicated Visual Analytics Page)
  const [activePage, setActivePage] = useState<'tracker' | 'analytics'>('tracker');

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

  // Handle Quick Save
  const handleQuickSave = async (payload: CreateExpensePayload) => {
    try {
      await expenseApi.createExpense(payload);
      success('Expense recorded successfully!');
      await fetchData(true);
    } catch (err: any) {
      error(err.message || 'Failed to record expense');
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
      success('Transaction recorded successfully!');
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
      a.download = `expenses_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success('CSV exported successfully');
    } catch (err: any) {
      error(err.message || 'Failed to export CSV');
    }
  };

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
      {/* Header Bar */}
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
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Securely track and analyze your expenses, income, and savings
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition-colors"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => openNewTransactionModal('INCOME')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all shadow-sm"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            + Income
          </button>

          <button
            type="button"
            onClick={() => openNewTransactionModal('EXPENSE')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            + Record Expense
          </button>
        </div>
      </div>

      {/* SEPARATE PAGE TABS AT TOP LIKE ANALYTICS */}
      <div className="flex items-center justify-between my-4 p-1.5 bg-slate-900/90 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActivePage('tracker')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activePage === 'tracker'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/25 border border-brand-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Expenses & Tracker
          </button>

          <button
            type="button"
            onClick={() => setActivePage('analytics')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activePage === 'analytics'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics & Charts
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2 pr-3">
          <span>Total Transactions:</span>
          <span className="font-mono font-bold text-white px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
            {expenses.length}
          </span>
        </div>
      </div>

      {/* TAB PAGE 1: EXPENSES & TRACKER */}
      {activePage === 'tracker' && (
        <div className="space-y-6">
          {/* Save Expense Prompt Banner with Fast Quick Logger */}
          <SaveExpensePromptBanner
            onOpenDetailedModal={openNewTransactionModal}
            onQuickSave={handleQuickSave}
            hasExpenses={expenses.length > 0}
            activeCount={expenses.length}
          />

          {/* Quick Overview Summary Cards */}
          {analytics?.hasData && (
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-rose-500/20">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Expenses
                </span>
                <span className="text-lg sm:text-xl font-black font-mono text-rose-400 mt-1 block">
                  ₹{analytics.summary.totalExpense.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Income
                </span>
                <span className="text-lg sm:text-xl font-black font-mono text-emerald-400 mt-1 block">
                  ₹{analytics.summary.totalIncome.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-brand-500/20">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Net Savings
                </span>
                <span className={`text-lg sm:text-xl font-black font-mono mt-1 block ${
                  analytics.summary.savings >= 0 ? 'text-indigo-400' : 'text-rose-400'
                }`}>
                  {analytics.summary.savings >= 0 ? '+' : ''}₹{analytics.summary.savings.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {/* Filterable Transactions List */}
          <ExpenseList
            expenses={expenses}
            isLoading={isLoading}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onExportCsv={handleExportCsv}
            filters={filters}
            onFilterChange={setFilters}
          />
        </div>
      )}

      {/* TAB PAGE 2: SEPARATE ANALYTICS PAGE WITH PIE, BAR, & TREND GRAPHS */}
      {activePage === 'analytics' && (
        <div className="space-y-6">
          {analytics ? (
            <ExpenseAnalyticsDashboard analytics={analytics} />
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Generating analytics charts...</p>
            </div>
          )}
        </div>
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

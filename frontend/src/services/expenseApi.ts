import { api } from './api';

export type ExpenseType = 'EXPENSE' | 'INCOME';

export const PREDEFINED_EXPENSE_CATEGORIES = [
  'Food',
  'Groceries',
  'Transport',
  'Rent',
  'Utilities',
  'Shopping',
  'Education',
  'Healthcare',
  'Entertainment',
  'Travel',
  'Subscriptions',
  'EMI/Loans',
  'Other',
] as const;

export const PREDEFINED_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Investments',
  'Rental Income',
  'Gifts',
  'Other',
] as const;

export const PREDEFINED_PAYMENT_METHODS = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'Cash',
  'Net Banking',
  'Bank Transfer',
  'Other',
] as const;

export interface Expense {
  id: string;
  userId: string;
  type: ExpenseType;
  amount: number;
  currency: string;
  date: string;
  category: string;
  paymentMethod: string;
  description?: string | null;
  notes?: string | null;
  person?: string | null;
  reason?: string | null;
  receiptUrl?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpensePayload {
  type: ExpenseType;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  description?: string;
  notes?: string;
  person?: string;
  currency?: string;
  tags?: string[];
}

export interface UpdateExpensePayload {
  type?: ExpenseType;
  amount?: number;
  category?: string;
  date?: string;
  paymentMethod?: string;
  description?: string;
  notes?: string;
  person?: string;
  currency?: string;
  tags?: string[];
}

export interface ExpenseFilters {
  search?: string;
  type?: ExpenseType;
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'date' | 'amount' | 'createdAt' | 'category';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CategorySpendingItem {
  category: string;
  totalAmount: number;
  count: number;
  percentageOfTotal: number;
  averagePerTx: number;
  color: string;
}

export interface MonthlySpendingItem {
  key: string;
  year: number;
  month: number;
  monthName: string;
  shortMonth: string;
  totalExpense: number;
  totalIncome: number;
  netCashFlow: number;
  savingsRate: number;
  transactionCount: number;
  momExpenseChangePct: number | null;
  topCategory: { name: string; amount: number } | null;
  categorySpends: Record<string, number>;
}

export interface SpendingTrendPoint {
  date: string;
  expense: number;
  income: number;
  cumulativeExpense: number;
}

export interface PaymentMethodItem {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface ExpenseAnalytics {
  hasData: boolean;
  currency: string;
  summary: {
    totalIncome: number;
    totalExpense: number;
    savings: number;
    savingsRate: number;
    totalTransactions: number;
    expenseCount: number;
    incomeCount: number;
    averageMonthlyExpense: number;
  };
  monthlyData: MonthlySpendingItem[];
  monthlySpending: MonthlySpendingItem[];
  categoryWiseSpending: CategorySpendingItem[];
  categoryBreakdown: {
    outgoing: CategorySpendingItem[];
    incoming: CategorySpendingItem[];
  };
  paymentMethodBreakdown: PaymentMethodItem[];
  spendingTrends: SpendingTrendPoint[];
  peakMonthAnalysis: {
    peakMonthKey: string;
    peakMonthName: string;
    shortMonth: string;
    totalExpense: number;
    totalIncome: number;
    netCashFlow: number;
    meanMonthlyExpense: number;
    excessOverAverage: number;
    percentAboveAverage: number;
    topDriverCategories: Array<{
      category: string;
      peakSpend: number;
      baselineSpend: number;
      surplus: number;
      percentageSurplus: number;
      contributionToExcessPct: number;
    }>;
    largestExpense: {
      id: string;
      amount: number;
      description: string;
      category: string;
      date: string;
    } | null;
    diagnosticInsights: string[];
  } | null;
}

export const expenseApi = {
  /**
   * Get filtered list of expenses
   */
  async getExpenses(filters: ExpenseFilters = {}) {
    const params: any = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params[k] = v;
    });
    const res = await api.get('/expenses', { params });
    return res.data;
  },

  /**
   * Create expense or income
   */
  async createExpense(data: CreateExpensePayload): Promise<Expense> {
    const res = await api.post('/expenses', data);
    return res.data.data;
  },

  /**
   * Get expense by ID
   */
  async getExpenseById(id: string): Promise<Expense> {
    const res = await api.get(`/expenses/${id}`);
    return res.data.data;
  },

  /**
   * Update expense
   */
  async updateExpense(id: string, data: UpdateExpensePayload): Promise<Expense> {
    const res = await api.put(`/expenses/${id}`, data);
    return res.data.data;
  },

  /**
   * Delete expense
   */
  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },

  /**
   * Get analytics
   */
  async getExpenseAnalytics(): Promise<ExpenseAnalytics> {
    const res = await api.get('/expenses/analytics');
    return res.data.data;
  },

  /**
   * Clear sample/demo data if any
   */
  async clearSampleExpenses(): Promise<{ deleted: number }> {
    const res = await api.post('/expenses/clear-sample');
    return res.data.data;
  },

  /**
   * Export CSV
   */
  async exportCsv(): Promise<Blob> {
    const res = await api.get('/expenses/export', {
      responseType: 'blob',
    });
    return res.data;
  },
};

import { api } from './api';

export type ExpenseType = 'EXPENSE' | 'INCOME';

export interface Expense {
  id: string;
  userId: string;
  type: ExpenseType;
  amount: number;
  currency: string;
  date: string;
  person: string;
  category: string;
  reason: string;
  paymentMethod: string;
  receiptUrl?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpensePayload {
  type: ExpenseType;
  amount: number;
  currency?: string;
  date: string;
  person: string;
  category: string;
  reason: string;
  paymentMethod?: string;
  receiptUrl?: string | null;
  tags?: string[];
}

export interface UpdateExpensePayload {
  type?: ExpenseType;
  amount?: number;
  currency?: string;
  date?: string;
  person?: string;
  category?: string;
  reason?: string;
  paymentMethod?: string;
  receiptUrl?: string | null;
  tags?: string[];
}

export interface ExpenseFilters {
  search?: string;
  type?: ExpenseType;
  category?: string;
  person?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'date' | 'amount' | 'createdAt' | 'person' | 'category';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CategoryBreakdownItem {
  category: string;
  totalAmount: number;
  count: number;
  percentageOfTotal: number;
  averagePerTx: number;
}

export interface PersonBreakdownItem {
  person: string;
  totalAmount: number;
  count: number;
  percentage: number;
}

export interface MonthlyDataItem {
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
  largestExpense: {
    id: string;
    amount: number;
    person: string;
    reason: string;
    category: string;
    date: string;
  } | null;
  topCategory: { name: string; amount: number } | null;
  topPerson: { name: string; amount: number } | null;
  categorySpends: Record<string, number>;
}

export interface PeakMonthDriverCategory {
  category: string;
  peakSpend: number;
  baselineSpend: number;
  surplus: number;
  percentageSurplus: number;
  contributionToExcessPct: number;
}

export interface PeakMonthAnalysis {
  peakMonthKey: string;
  peakMonthName: string;
  shortMonth: string;
  totalExpense: number;
  totalIncome: number;
  netCashFlow: number;
  meanMonthlyExpense: number;
  stdDevMonthlyExpense: number;
  excessOverAverage: number;
  percentAboveAverage: number;
  isSignificantSpike: boolean;
  topDriverCategories: PeakMonthDriverCategory[];
  largestExpense: {
    id: string;
    amount: number;
    person: string;
    reason: string;
    category: string;
    date: string;
  } | null;
  topPerson: { name: string; amount: number } | null;
  spendDriverStyle: 'HIGH_TICKET_PURCHASES' | 'HIGH_TRANSACTION_VOLUME' | 'BALANCED';
  spendDriverExplanation: string;
  diagnosticInsights: string[];
}

export interface ExpenseAnalytics {
  hasData: boolean;
  currency: string;
  summary: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    savingsRate: number;
    totalTransactions: number;
    expenseCount: number;
    incomeCount: number;
    averageMonthlyExpense: number;
  };
  monthlyData: MonthlyDataItem[];
  categoryBreakdown: {
    outgoing: CategoryBreakdownItem[];
    incoming: CategoryBreakdownItem[];
  };
  personBreakdown: {
    topPayees: PersonBreakdownItem[];
    topPayers: PersonBreakdownItem[];
  };
  peakMonthAnalysis: PeakMonthAnalysis | null;
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
   * Get analytics & peak month diagnosis
   */
  async getExpenseAnalytics(): Promise<ExpenseAnalytics> {
    const res = await api.get('/expenses/analytics');
    return res.data.data;
  },

  /**
   * Seed realistic sample data
   */
  async seedSampleExpenses(): Promise<{ count: number }> {
    const res = await api.post('/expenses/seed-sample');
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

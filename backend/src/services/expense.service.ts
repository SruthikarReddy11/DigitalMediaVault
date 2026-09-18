import { prisma } from '../database/prisma';
import { ExpenseType } from '@prisma/client';

export interface CreateExpenseDTO {
  type?: ExpenseType | 'EXPENSE' | 'INCOME';
  amount: number;
  currency?: string;
  date: string | Date;
  category: string;
  paymentMethod?: string;
  description?: string;
  notes?: string;
  person?: string;
  reason?: string;
  receiptUrl?: string;
  tags?: string[];
}

export interface UpdateExpenseDTO {
  type?: ExpenseType | 'EXPENSE' | 'INCOME';
  amount?: number;
  currency?: string;
  date?: string | Date;
  category?: string;
  paymentMethod?: string;
  description?: string;
  notes?: string;
  person?: string;
  reason?: string;
  receiptUrl?: string | null;
  tags?: string[];
}

export interface ExpenseFilterDTO {
  search?: string;
  type?: ExpenseType | 'EXPENSE' | 'INCOME';
  category?: string;
  person?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'date' | 'amount' | 'createdAt' | 'category';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MonthlyBucket {
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
    description: string;
    person?: string | null;
    category: string;
    date: Date;
  } | null;
  categorySpends: Record<string, number>;
}

export class ExpenseService {
  /**
   * Create a new expense or income record
   */
  public static async createExpense(userId: string, data: CreateExpenseDTO) {
    if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
      throw new Error('A valid positive amount is required');
    }
    if (!data.category || !data.category.trim()) {
      throw new Error('Category is required');
    }

    const type = data.type === 'INCOME' ? ExpenseType.INCOME : ExpenseType.EXPENSE;
    const date = data.date ? new Date(data.date) : new Date();
    const desc = data.description?.trim() || data.reason?.trim() || '';
    const notes = data.notes?.trim() || '';
    const person = data.person?.trim() || '';

    return await prisma.expense.create({
      data: {
        userId,
        type,
        amount: Number(data.amount),
        currency: data.currency || 'INR',
        date,
        category: data.category.trim(),
        description: desc || null,
        reason: desc || data.category.trim(),
        notes: notes || null,
        person: person || null,
        paymentMethod: data.paymentMethod?.trim() || 'UPI',
        receiptUrl: data.receiptUrl?.trim() || null,
        tags: Array.isArray(data.tags) ? data.tags.map((t) => t.trim()).filter(Boolean) : [],
      },
    });
  }

  /**
   * List expenses with flexible filtering, searching, and pagination
   */
  public static async listExpenses(userId: string, filters: ExpenseFilterDTO = {}) {
    const where: any = { userId };

    if (filters.type) {
      where.type = filters.type === 'INCOME' ? ExpenseType.INCOME : ExpenseType.EXPENSE;
    }

    if (filters.category && filters.category !== 'ALL') {
      where.category = { equals: filters.category, mode: 'insensitive' };
    }

    if (filters.person) {
      where.person = { contains: filters.person, mode: 'insensitive' };
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined) where.amount.gte = Number(filters.minAmount);
      if (filters.maxAmount !== undefined) where.amount.lte = Number(filters.maxAmount);
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { category: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { reason: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
        { person: { contains: q, mode: 'insensitive' } },
        { paymentMethod: { contains: q, mode: 'insensitive' } },
      ];
    }

    const sortBy = filters.sortBy || 'date';
    const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';

    const page = filters.page ? Math.max(1, Number(filters.page)) : 1;
    const limit = filters.limit ? Math.max(1, Number(filters.limit)) : 50;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single expense
   */
  public static async getExpenseById(userId: string, id: string) {
    const item = await prisma.expense.findFirst({
      where: { id, userId },
    });
    if (!item) {
      throw new Error('Expense record not found');
    }
    return item;
  }

  /**
   * Update expense
   */
  public static async updateExpense(userId: string, id: string, data: UpdateExpenseDTO) {
    const existing = await prisma.expense.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new Error('Expense record not found');
    }

    const updateData: any = {};
    if (data.type !== undefined) {
      updateData.type = data.type === 'INCOME' ? ExpenseType.INCOME : ExpenseType.EXPENSE;
    }
    if (data.amount !== undefined) {
      const amt = Number(data.amount);
      if (isNaN(amt) || amt <= 0) throw new Error('Amount must be positive');
      updateData.amount = amt;
    }
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.category !== undefined) updateData.category = data.category.trim();
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod.trim();
    if (data.description !== undefined) {
      updateData.description = data.description.trim() || null;
      updateData.reason = data.description.trim() || updateData.category || existing.category;
    }
    if (data.reason !== undefined && data.description === undefined) {
      updateData.reason = data.reason.trim();
      updateData.description = data.reason.trim() || null;
    }
    if (data.notes !== undefined) updateData.notes = data.notes.trim() || null;
    if (data.person !== undefined) updateData.person = data.person.trim() || null;
    if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl;
    if (data.tags !== undefined) {
      updateData.tags = Array.isArray(data.tags) ? data.tags.map((t) => t.trim()).filter(Boolean) : [];
    }

    return await prisma.expense.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete expense
   */
  public static async deleteExpense(userId: string, id: string) {
    const existing = await prisma.expense.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new Error('Expense record not found');
    }
    return await prisma.expense.delete({ where: { id } });
  }

  /**
   * Clear any sample/demo expenses for user
   */
  public static async clearSampleExpenses(userId: string) {
    const res = await prisma.expense.deleteMany({
      where: {
        userId,
        tags: { hasSome: ['Sample', 'QuickLog'] },
      },
    });
    return { deleted: res.count };
  }

  /**
   * Advanced Data Analytics Algorithm Engine:
   * - Calculates Total Expenses, Total Income, and Net Savings
   * - Category-wise spending breakdown with percentages and counts
   * - Monthly spending and income trends
   * - Daily spending timeline trends
   * - Payment method distribution
   * - "Which month expenses are more and why" diagnostic algorithm
   */
  public static async getExpenseAnalytics(userId: string, _options: { year?: number; months?: number } = {}) {
    const allExpenses = await prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    if (allExpenses.length === 0) {
      return {
        hasData: false,
        currency: 'INR',
        summary: {
          totalIncome: 0,
          totalExpense: 0,
          savings: 0,
          savingsRate: 0,
          totalTransactions: 0,
          expenseCount: 0,
          incomeCount: 0,
          averageMonthlyExpense: 0,
        },
        monthlyData: [],
        monthlySpending: [],
        categoryWiseSpending: [],
        categoryBreakdown: { outgoing: [], incoming: [] },
        paymentMethodBreakdown: [],
        spendingTrends: [],
        personBreakdown: { topPayees: [], topPayers: [] },
        peakMonthAnalysis: null,
      };
    }

    const currency = allExpenses[0]?.currency || 'INR';

    let totalIncome = 0;
    let totalExpense = 0;
    let expenseCount = 0;
    let incomeCount = 0;

    const monthBuckets: Record<string, MonthlyBucket> = {};
    const overallCategoryExpense: Record<string, { amount: number; count: number }> = {};
    const overallCategoryIncome: Record<string, { amount: number; count: number }> = {};
    const paymentMethodsMap: Record<string, { amount: number; count: number }> = {};
    const dailySpendingMap: Record<string, { date: string; expense: number; income: number }> = {};
    const overallPersonExpense: Record<string, { amount: number; count: number }> = {};
    const overallPersonIncome: Record<string, { amount: number; count: number }> = {};

    for (const item of allExpenses) {
      const d = new Date(item.date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const monthName = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const shortMonth = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      const dayKey = d.toISOString().split('T')[0];

      if (!dailySpendingMap[dayKey]) {
        dailySpendingMap[dayKey] = { date: dayKey, expense: 0, income: 0 };
      }

      if (!monthBuckets[monthKey]) {
        monthBuckets[monthKey] = {
          key: monthKey,
          year,
          month,
          monthName,
          shortMonth,
          totalExpense: 0,
          totalIncome: 0,
          netCashFlow: 0,
          savingsRate: 0,
          transactionCount: 0,
          momExpenseChangePct: null,
          largestExpense: null,
          categorySpends: {},
        };
      }

      const bucket = monthBuckets[monthKey];
      bucket.transactionCount += 1;

      // Payment method tracking
      const pm = item.paymentMethod || 'UPI';
      if (!paymentMethodsMap[pm]) {
        paymentMethodsMap[pm] = { amount: 0, count: 0 };
      }
      paymentMethodsMap[pm].amount += item.amount;
      paymentMethodsMap[pm].count += 1;

      if (item.type === ExpenseType.EXPENSE) {
        totalExpense += item.amount;
        expenseCount += 1;
        bucket.totalExpense += item.amount;
        bucket.categorySpends[item.category] = (bucket.categorySpends[item.category] || 0) + item.amount;
        dailySpendingMap[dayKey].expense += item.amount;

        if (!overallCategoryExpense[item.category]) {
          overallCategoryExpense[item.category] = { amount: 0, count: 0 };
        }
        overallCategoryExpense[item.category].amount += item.amount;
        overallCategoryExpense[item.category].count += 1;

        if (item.person) {
          if (!overallPersonExpense[item.person]) overallPersonExpense[item.person] = { amount: 0, count: 0 };
          overallPersonExpense[item.person].amount += item.amount;
          overallPersonExpense[item.person].count += 1;
        }

        if (!bucket.largestExpense || item.amount > bucket.largestExpense.amount) {
          bucket.largestExpense = {
            id: item.id,
            amount: item.amount,
            description: item.description || item.reason || item.category,
            person: item.person,
            category: item.category,
            date: item.date,
          };
        }
      } else {
        totalIncome += item.amount;
        incomeCount += 1;
        bucket.totalIncome += item.amount;
        dailySpendingMap[dayKey].income += item.amount;

        if (!overallCategoryIncome[item.category]) {
          overallCategoryIncome[item.category] = { amount: 0, count: 0 };
        }
        overallCategoryIncome[item.category].amount += item.amount;
        overallCategoryIncome[item.category].count += 1;

        if (item.person) {
          if (!overallPersonIncome[item.person]) overallPersonIncome[item.person] = { amount: 0, count: 0 };
          overallPersonIncome[item.person].amount += item.amount;
          overallPersonIncome[item.person].count += 1;
        }
      }
    }

    // Monthly List
    const sortedMonthKeys = Object.keys(monthBuckets).sort();
    const monthlyList: Array<MonthlyBucket & { topCategory: { name: string; amount: number } | null }> = [];

    for (let i = 0; i < sortedMonthKeys.length; i++) {
      const key = sortedMonthKeys[i];
      const b = monthBuckets[key];
      b.netCashFlow = b.totalIncome - b.totalExpense;
      b.savingsRate = b.totalIncome > 0 ? Math.max(-100, Math.min(100, ((b.totalIncome - b.totalExpense) / b.totalIncome) * 100)) : 0;

      if (i > 0) {
        const prev = monthBuckets[sortedMonthKeys[i - 1]];
        if (prev.totalExpense > 0) {
          b.momExpenseChangePct = Number((((b.totalExpense - prev.totalExpense) / prev.totalExpense) * 100).toFixed(1));
        }
      }

      let topCatName = '';
      let topCatAmt = 0;
      for (const [cat, amt] of Object.entries(b.categorySpends)) {
        if (amt > topCatAmt) {
          topCatAmt = amt;
          topCatName = cat;
        }
      }

      monthlyList.push({
        ...b,
        topCategory: topCatName ? { name: topCatName, amount: topCatAmt } : null,
      });
    }

    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Number(((savings / totalIncome) * 100).toFixed(1)) : 0;
    const activeExpenseMonthsCount = monthlyList.filter((m) => m.totalExpense > 0).length || 1;
    const averageMonthlyExpense = Number((totalExpense / activeExpenseMonthsCount).toFixed(2));

    // Category-wise spending
    const categoryPalette = [
      '#f43f5e', '#6366f1', '#06b6d4', '#10b981', '#f59e0b',
      '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#84cc16',
      '#eab308', '#f97316', '#64748b'
    ];

    const categoryWiseSpending = Object.entries(overallCategoryExpense)
      .map(([name, data], idx) => ({
        category: name,
        totalAmount: data.amount,
        count: data.count,
        percentageOfTotal: totalExpense > 0 ? Number(((data.amount / totalExpense) * 100).toFixed(1)) : 0,
        averagePerTx: data.count > 0 ? Number((data.amount / data.count).toFixed(2)) : 0,
        color: categoryPalette[idx % categoryPalette.length],
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const categoryIncomingList = Object.entries(overallCategoryIncome)
      .map(([name, data], idx) => ({
        category: name,
        totalAmount: data.amount,
        count: data.count,
        percentageOfTotal: totalIncome > 0 ? Number(((data.amount / totalIncome) * 100).toFixed(1)) : 0,
        averagePerTx: data.count > 0 ? Number((data.amount / data.count).toFixed(2)) : 0,
        color: categoryPalette[(idx + 4) % categoryPalette.length],
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // Payment methods
    const paymentMethodBreakdown = Object.entries(paymentMethodsMap)
      .map(([method, data]) => ({
        method,
        amount: data.amount,
        count: data.count,
        percentage: (totalExpense + totalIncome) > 0 ? Number(((data.amount / (totalExpense + totalIncome)) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Spending Trends (Chronological daily points)
    const sortedDays = Object.keys(dailySpendingMap).sort();
    let cumulativeExpense = 0;
    const spendingTrends = sortedDays.map((d) => {
      cumulativeExpense += dailySpendingMap[d].expense;
      return {
        date: d,
        expense: dailySpendingMap[d].expense,
        income: dailySpendingMap[d].income,
        cumulativeExpense,
      };
    });

    // Peak Month Analytics ("Which month his expenses are more and why")
    const expenseMonths = monthlyList.filter((m) => m.totalExpense > 0);
    let peakMonthAnalysis: any = null;

    if (expenseMonths.length > 0) {
      let peak = expenseMonths[0];
      for (const m of expenseMonths) {
        if (m.totalExpense > peak.totalExpense) {
          peak = m;
        }
      }

      const meanMonthlyExpense = totalExpense / expenseMonths.length;
      const excessOverAverage = Math.max(0, peak.totalExpense - meanMonthlyExpense);
      const percentAboveAverage =
        meanMonthlyExpense > 0 ? Number((((peak.totalExpense - meanMonthlyExpense) / meanMonthlyExpense) * 100).toFixed(1)) : 0;

      const otherMonths = expenseMonths.filter((m) => m.key !== peak.key);
      const otherMonthsCount = Math.max(1, otherMonths.length);

      const categorySurpluses = Object.entries(peak.categorySpends).map(([category, peakSpend]) => {
        const baselineTotal = otherMonths.reduce((sum, m) => sum + (m.categorySpends[category] || 0), 0);
        const baselineSpend = baselineTotal / otherMonthsCount;
        const surplus = Math.max(0, peakSpend - baselineSpend);
        const percentageSurplus =
          baselineSpend > 0 ? Number((((peakSpend - baselineSpend) / baselineSpend) * 100).toFixed(1)) : 100;
        const contributionToExcessPct =
          excessOverAverage > 0 ? Number(((surplus / excessOverAverage) * 100).toFixed(1)) : 0;

        return {
          category,
          peakSpend,
          baselineSpend: Number(baselineSpend.toFixed(2)),
          surplus: Number(surplus.toFixed(2)),
          percentageSurplus,
          contributionToExcessPct,
        };
      }).sort((a, b) => b.surplus - a.surplus);

      const topDriverCategories = categorySurpluses.slice(0, 3);

      const diagnosticInsights: string[] = [];
      diagnosticInsights.push(
        `Highest expenses recorded in ${peak.monthName} (₹${peak.totalExpense.toLocaleString('en-IN')}), which is ${percentAboveAverage}% higher than your monthly average of ₹${meanMonthlyExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}.`
      );

      if (topDriverCategories.length > 0 && topDriverCategories[0].surplus > 0) {
        diagnosticInsights.push(
          `Primary driver was "${topDriverCategories[0].category}" exceeding normal monthly spend by +₹${topDriverCategories[0].surplus.toLocaleString('en-IN')} (+${topDriverCategories[0].percentageSurplus}%).`
        );
      }

      if (peak.largestExpense) {
        diagnosticInsights.push(
          `Largest single transaction: ₹${peak.largestExpense.amount.toLocaleString('en-IN')} on ${peak.largestExpense.category} (${peak.largestExpense.description}).`
        );
      }

      peakMonthAnalysis = {
        peakMonthKey: peak.key,
        peakMonthName: peak.monthName,
        shortMonth: peak.shortMonth,
        totalExpense: peak.totalExpense,
        totalIncome: peak.totalIncome,
        netCashFlow: peak.netCashFlow,
        meanMonthlyExpense: Number(meanMonthlyExpense.toFixed(2)),
        excessOverAverage: Number(excessOverAverage.toFixed(2)),
        percentAboveAverage,
        topDriverCategories,
        largestExpense: peak.largestExpense,
        diagnosticInsights,
      };
    }

    return {
      hasData: true,
      currency,
      summary: {
        totalIncome,
        totalExpense,
        savings,
        savingsRate,
        totalTransactions: allExpenses.length,
        expenseCount,
        incomeCount,
        averageMonthlyExpense,
      },
      monthlyData: monthlyList,
      monthlySpending: monthlyList,
      categoryWiseSpending,
      categoryBreakdown: {
        outgoing: categoryWiseSpending,
        incoming: categoryIncomingList,
      },
      paymentMethodBreakdown,
      spendingTrends,
      peakMonthAnalysis,
    };
  }

  /**
   * Export expenses as CSV format
   */
  public static async exportExpensesCsv(userId: string) {
    const expenses = await prisma.expense.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    const headers = ['Date', 'Type', 'Amount', 'Currency', 'Category', 'Description', 'Notes', 'Payment Method'];
    const rows = expenses.map((e) => [
      `"${new Date(e.date).toISOString().split('T')[0]}"`,
      `"${e.type}"`,
      e.amount,
      `"${e.currency}"`,
      `"${(e.category || '').replace(/"/g, '""')}"`,
      `"${(e.description || e.reason || '').replace(/"/g, '""')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
      `"${(e.paymentMethod || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

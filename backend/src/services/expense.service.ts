import { prisma } from '../database/prisma';
import { ExpenseType } from '@prisma/client';

export interface CreateExpenseDTO {
  type?: ExpenseType | 'EXPENSE' | 'INCOME';
  amount: number;
  currency?: string;
  date: string | Date;
  person: string;
  category: string;
  reason: string;
  paymentMethod?: string;
  receiptUrl?: string;
  tags?: string[];
}

export interface UpdateExpenseDTO {
  type?: ExpenseType | 'EXPENSE' | 'INCOME';
  amount?: number;
  currency?: string;
  date?: string | Date;
  person?: string;
  category?: string;
  reason?: string;
  paymentMethod?: string;
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
  sortBy?: 'date' | 'amount' | 'createdAt' | 'person' | 'category';
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
    person: string;
    reason: string;
    category: string;
    date: Date;
  } | null;
  categorySpends: Record<string, number>;
  personSpends: Record<string, number>;
}

export class ExpenseService {
  /**
   * Create a new expense or income record
   */
  public static async createExpense(userId: string, data: CreateExpenseDTO) {
    if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
      throw new Error('A valid positive amount is required');
    }
    if (!data.person || !data.person.trim()) {
      throw new Error('Person name is required');
    }
    if (!data.category || !data.category.trim()) {
      throw new Error('Category/reason category is required');
    }
    if (!data.reason || !data.reason.trim()) {
      throw new Error('Specific reason or description is required');
    }

    const type = data.type === 'INCOME' ? ExpenseType.INCOME : ExpenseType.EXPENSE;
    const date = data.date ? new Date(data.date) : new Date();

    return await prisma.expense.create({
      data: {
        userId,
        type,
        amount: Number(data.amount),
        currency: data.currency || 'INR',
        date,
        person: data.person.trim(),
        category: data.category.trim(),
        reason: data.reason.trim(),
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
        // Include full end date
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
        { person: { contains: q, mode: 'insensitive' } },
        { reason: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
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
      throw new Error('Expense transaction not found');
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
      throw new Error('Expense transaction not found');
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
    if (data.person !== undefined) updateData.person = data.person.trim();
    if (data.category !== undefined) updateData.category = data.category.trim();
    if (data.reason !== undefined) updateData.reason = data.reason.trim();
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod.trim();
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
      throw new Error('Expense transaction not found');
    }
    return await prisma.expense.delete({ where: { id } });
  }

  /**
   * Seed realistic sample data across several months to test analytics & algorithms
   */
  public static async seedSampleExpenses(userId: string) {
    // Current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // Sample dataset covering the last 5 months
    const sampleItems = [
      // 4 months ago: Normal month
      { type: ExpenseType.INCOME, amount: 75000, person: 'TechCorp Pvt Ltd', category: 'Salary', reason: 'Monthly Salary Credit', monthsAgo: 4, day: 1 },
      { type: ExpenseType.EXPENSE, amount: 18000, person: 'Suresh Landlord', category: 'Rent & Housing', reason: 'Apartment Monthly Rent', monthsAgo: 4, day: 3 },
      { type: ExpenseType.EXPENSE, amount: 6400, person: 'BigBasket', category: 'Groceries', reason: 'Monthly pantry & vegetable supply', monthsAgo: 4, day: 5 },
      { type: ExpenseType.EXPENSE, amount: 2500, person: 'Electricity Board', category: 'Utilities & Bills', reason: 'Power & Water bill', monthsAgo: 4, day: 8 },
      { type: ExpenseType.EXPENSE, amount: 3200, person: 'Swiggy / Zomato', category: 'Food & Dining', reason: 'Weekend family dinner', monthsAgo: 4, day: 15 },
      { type: ExpenseType.EXPENSE, amount: 1500, person: 'Airtel Broadband', category: 'Utilities & Bills', reason: 'Fiber internet bill', monthsAgo: 4, day: 20 },

      // 3 months ago: Normal month with slight savings
      { type: ExpenseType.INCOME, amount: 75000, person: 'TechCorp Pvt Ltd', category: 'Salary', reason: 'Monthly Salary Credit', monthsAgo: 3, day: 1 },
      { type: ExpenseType.INCOME, amount: 12000, person: 'Apex Client', category: 'Freelance', reason: 'UI/UX Design Contract milestone', monthsAgo: 3, day: 14 },
      { type: ExpenseType.EXPENSE, amount: 18000, person: 'Suresh Landlord', category: 'Rent & Housing', reason: 'Apartment Monthly Rent', monthsAgo: 3, day: 3 },
      { type: ExpenseType.EXPENSE, amount: 5800, person: 'Nature Basket', category: 'Groceries', reason: 'Organic veggies & groceries', monthsAgo: 3, day: 6 },
      { type: ExpenseType.EXPENSE, amount: 2800, person: 'Swiggy', category: 'Food & Dining', reason: 'Office lunches and meals', monthsAgo: 3, day: 12 },
      { type: ExpenseType.EXPENSE, amount: 4500, person: 'Zara / Myntra', category: 'Shopping', reason: 'Formal shirts & casuals', monthsAgo: 3, day: 18 },
      { type: ExpenseType.EXPENSE, amount: 1600, person: 'Fuel Station', category: 'Travel & Transport', reason: 'Monthly petrol refuel', monthsAgo: 3, day: 22 },

      // 2 months ago: PEAK EXPENSE MONTH! (Heavy travel, electronics purchase, vacation dining)
      { type: ExpenseType.INCOME, amount: 75000, person: 'TechCorp Pvt Ltd', category: 'Salary', reason: 'Monthly Salary Credit', monthsAgo: 2, day: 1 },
      { type: ExpenseType.EXPENSE, amount: 18000, person: 'Suresh Landlord', category: 'Rent & Housing', reason: 'Apartment Monthly Rent', monthsAgo: 2, day: 2 },
      { type: ExpenseType.EXPENSE, amount: 28500, person: 'MakeMyTrip / Indigo', category: 'Travel & Transport', reason: 'Flight tickets & Goa Resort booking for annual vacation', monthsAgo: 2, day: 5 },
      { type: ExpenseType.EXPENSE, amount: 34999, person: 'Croma Electronics', category: 'Electronics & Gadgets', reason: 'New Tablet & Noise Cancelling Headphones', monthsAgo: 2, day: 10 },
      { type: ExpenseType.EXPENSE, amount: 9800, person: 'Fisherman Wharf & Beach Shacks', category: 'Food & Dining', reason: 'Vacation dining & seafood dinners', monthsAgo: 2, day: 14 },
      { type: ExpenseType.EXPENSE, amount: 7200, person: 'Supermarket Goa', category: 'Groceries', reason: 'Vacation supplies and snacks', monthsAgo: 2, day: 15 },
      { type: ExpenseType.EXPENSE, amount: 4200, person: 'Goa Car Rentals', category: 'Travel & Transport', reason: 'Self-drive Thar rental for 4 days', monthsAgo: 2, day: 16 },
      { type: ExpenseType.EXPENSE, amount: 3100, person: 'Electricity Board', category: 'Utilities & Bills', reason: 'Power & AC bill', monthsAgo: 2, day: 25 },

      // 1 month ago: Post-vacation recovery month
      { type: ExpenseType.INCOME, amount: 75000, person: 'TechCorp Pvt Ltd', category: 'Salary', reason: 'Monthly Salary Credit', monthsAgo: 1, day: 1 },
      { type: ExpenseType.EXPENSE, amount: 18000, person: 'Suresh Landlord', category: 'Rent & Housing', reason: 'Apartment Monthly Rent', monthsAgo: 1, day: 3 },
      { type: ExpenseType.EXPENSE, amount: 6100, person: 'Blinkit / Zepto', category: 'Groceries', reason: 'Daily staples & household items', monthsAgo: 1, day: 7 },
      { type: ExpenseType.EXPENSE, amount: 3400, person: 'Zomato', category: 'Food & Dining', reason: 'Team lunch celebration', monthsAgo: 1, day: 14 },
      { type: ExpenseType.EXPENSE, amount: 2200, person: 'Apollo Pharmacy', category: 'Healthcare', reason: 'Annual health checkup & supplements', monthsAgo: 1, day: 19 },
      { type: ExpenseType.EXPENSE, amount: 2000, person: 'Fuel Station', category: 'Travel & Transport', reason: 'City commute fuel', monthsAgo: 1, day: 26 },

      // Current month: Active spend
      { type: ExpenseType.INCOME, amount: 75000, person: 'TechCorp Pvt Ltd', category: 'Salary', reason: 'Monthly Salary Credit', monthsAgo: 0, day: 1 },
      { type: ExpenseType.INCOME, amount: 8500, person: 'Rahul Sharma', category: 'Gifts & Reimbursements', reason: 'Shared trip split reimbursement', monthsAgo: 0, day: 4 },
      { type: ExpenseType.EXPENSE, amount: 18000, person: 'Suresh Landlord', category: 'Rent & Housing', reason: 'Apartment Monthly Rent', monthsAgo: 0, day: 2 },
      { type: ExpenseType.EXPENSE, amount: 5400, person: 'Instamart', category: 'Groceries', reason: 'Fresh veggies & fruits', monthsAgo: 0, day: 5 },
      { type: ExpenseType.EXPENSE, amount: 2900, person: 'Cafe Coffee Day / Starbucks', category: 'Food & Dining', reason: 'Weekend coffee meetups', monthsAgo: 0, day: 8 },
      { type: ExpenseType.EXPENSE, amount: 3800, person: 'Amazon India', category: 'Shopping', reason: 'Desk ergonomic accessories & books', monthsAgo: 0, day: 11 },
    ];

    const recordsToInsert = sampleItems.map((item) => {
      const targetDate = new Date(currentYear, currentMonth - item.monthsAgo, item.day, 12, 0, 0);
      return {
        userId,
        type: item.type,
        amount: item.amount,
        currency: 'INR',
        date: targetDate,
        person: item.person,
        category: item.category,
        reason: item.reason,
        paymentMethod: 'UPI',
        tags: ['Sample'],
      };
    });

    await prisma.expense.createMany({
      data: recordsToInsert,
    });

    return { count: recordsToInsert.length };
  }

  /**
   * Advanced Data Analytics Algorithm Engine:
   * - Calculates monthly income and expenses breakdown
   * - Compares Month-over-Month (MoM) cash flow trends
   * - Pinpoints the peak spending month and performs rigorous root-cause analysis ("why" expenses are higher)
   * - Analyzes top spending reasons/categories, counterparties (persons), and single outlier transactions
   */
  public static async getExpenseAnalytics(userId: string, _options: { year?: number; months?: number } = {}) {
    // Fetch all user transactions
    const where: any = { userId };
    const allExpenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    if (allExpenses.length === 0) {
      return {
        hasData: false,
        summary: {
          totalIncome: 0,
          totalExpense: 0,
          netBalance: 0,
          savingsRate: 0,
          totalTransactions: 0,
          expenseCount: 0,
          incomeCount: 0,
          averageMonthlyExpense: 0,
        },
        monthlyData: [],
        categoryBreakdown: { outgoing: [], incoming: [] },
        personBreakdown: { topPayees: [], topPayers: [] },
        peakMonthAnalysis: null,
      };
    }

    // Currency symbol (take from first item or default INR)
    const currency = allExpenses[0]?.currency || 'INR';

    // 1. Overall Summary Calculations
    let totalIncome = 0;
    let totalExpense = 0;
    let expenseCount = 0;
    let incomeCount = 0;

    // Monthly maps: key = "YYYY-MM"
    const monthBuckets: Record<string, MonthlyBucket> = {};
    const overallCategoryExpense: Record<string, { amount: number; count: number }> = {};
    const overallCategoryIncome: Record<string, { amount: number; count: number }> = {};
    const overallPersonExpense: Record<string, { amount: number; count: number }> = {};
    const overallPersonIncome: Record<string, { amount: number; count: number }> = {};

    for (const item of allExpenses) {
      const d = new Date(item.date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const monthName = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const shortMonth = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });

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
          personSpends: {},
        };
      }

      const bucket = monthBuckets[monthKey];
      bucket.transactionCount += 1;

      if (item.type === ExpenseType.EXPENSE) {
        totalExpense += item.amount;
        expenseCount += 1;
        bucket.totalExpense += item.amount;

        // Category spend in month
        bucket.categorySpends[item.category] = (bucket.categorySpends[item.category] || 0) + item.amount;

        // Person spend in month
        bucket.personSpends[item.person] = (bucket.personSpends[item.person] || 0) + item.amount;

        // Overall category spend
        if (!overallCategoryExpense[item.category]) {
          overallCategoryExpense[item.category] = { amount: 0, count: 0 };
        }
        overallCategoryExpense[item.category].amount += item.amount;
        overallCategoryExpense[item.category].count += 1;

        // Overall person expense
        if (!overallPersonExpense[item.person]) {
          overallPersonExpense[item.person] = { amount: 0, count: 0 };
        }
        overallPersonExpense[item.person].amount += item.amount;
        overallPersonExpense[item.person].count += 1;

        // Largest expense tracking in this month
        if (!bucket.largestExpense || item.amount > bucket.largestExpense.amount) {
          bucket.largestExpense = {
            id: item.id,
            amount: item.amount,
            person: item.person,
            reason: item.reason,
            category: item.category,
            date: item.date,
          };
        }
      } else {
        totalIncome += item.amount;
        incomeCount += 1;
        bucket.totalIncome += item.amount;

        // Overall category income
        if (!overallCategoryIncome[item.category]) {
          overallCategoryIncome[item.category] = { amount: 0, count: 0 };
        }
        overallCategoryIncome[item.category].amount += item.amount;
        overallCategoryIncome[item.category].count += 1;

        // Overall person income
        if (!overallPersonIncome[item.person]) {
          overallPersonIncome[item.person] = { amount: 0, count: 0 };
        }
        overallPersonIncome[item.person].amount += item.amount;
        overallPersonIncome[item.person].count += 1;
      }
    }

    // Sort month keys chronologically
    const sortedMonthKeys = Object.keys(monthBuckets).sort();
    const monthlyList: Array<MonthlyBucket & { topCategory: { name: string; amount: number } | null; topPerson: { name: string; amount: number } | null }> = [];

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

      // Top category for this month
      let topCatName = '';
      let topCatAmt = 0;
      for (const [cat, amt] of Object.entries(b.categorySpends)) {
        if (amt > topCatAmt) {
          topCatAmt = amt;
          topCatName = cat;
        }
      }

      // Top person for this month
      let topPersonName = '';
      let topPersonAmt = 0;
      for (const [p, amt] of Object.entries(b.personSpends)) {
        if (amt > topPersonAmt) {
          topPersonAmt = amt;
          topPersonName = p;
        }
      }

      monthlyList.push({
        ...b,
        topCategory: topCatName ? { name: topCatName, amount: topCatAmt } : null,
        topPerson: topPersonName ? { name: topPersonName, amount: topPersonAmt } : null,
      });
    }

    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Number(((netBalance / totalIncome) * 100).toFixed(1)) : 0;
    const activeExpenseMonthsCount = monthlyList.filter((m) => m.totalExpense > 0).length || 1;
    const averageMonthlyExpense = Number((totalExpense / activeExpenseMonthsCount).toFixed(2));

    // 2. Data Analytics Algorithm: "Which month expenses are more and why?"
    // Filter months that had expenses
    const expenseMonths = monthlyList.filter((m) => m.totalExpense > 0);

    let peakMonthAnalysis: any = null;

    if (expenseMonths.length > 0) {
      // Find peak month (highest total expense)
      let peak = expenseMonths[0];
      for (const m of expenseMonths) {
        if (m.totalExpense > peak.totalExpense) {
          peak = m;
        }
      }

      // Baseline statistics across all active expense months
      const meanMonthlyExpense = totalExpense / expenseMonths.length;

      // Calculate variance and standard deviation
      const variance =
        expenseMonths.length > 1
          ? expenseMonths.reduce((acc, m) => acc + Math.pow(m.totalExpense - meanMonthlyExpense, 2), 0) /
            (expenseMonths.length - 1)
          : 0;
      const stdDevMonthlyExpense = Math.sqrt(variance);

      // Excess calculation
      const excessOverAverage = Math.max(0, peak.totalExpense - meanMonthlyExpense);
      const percentAboveAverage =
        meanMonthlyExpense > 0 ? Number((((peak.totalExpense - meanMonthlyExpense) / meanMonthlyExpense) * 100).toFixed(1)) : 0;

      // Anomaly status
      const isSignificantSpike =
        expenseMonths.length > 1 && (percentAboveAverage >= 25 || peak.totalExpense > meanMonthlyExpense + 1.2 * stdDevMonthlyExpense);

      // --- ROOT CAUSE DECOMPOSITION ("WHY") ---
      // 1. Category Variance Analysis:
      // Compare each category's spend in the peak month against its average in other months
      const otherMonths = expenseMonths.filter((m) => m.key !== peak.key);
      const otherMonthsCount = Math.max(1, otherMonths.length);

      interface CategorySurplus {
        category: string;
        peakSpend: number;
        baselineSpend: number;
        surplus: number;
        percentageSurplus: number;
        contributionToExcessPct: number;
      }

      const categorySurpluses: CategorySurplus[] = [];

      for (const [category, peakSpend] of Object.entries(peak.categorySpends)) {
        // Average spend in other months for this category
        const baselineTotal = otherMonths.reduce((sum, m) => sum + (m.categorySpends[category] || 0), 0);
        const baselineSpend = baselineTotal / otherMonthsCount;
        const surplus = Math.max(0, peakSpend - baselineSpend);
        const percentageSurplus =
          baselineSpend > 0 ? Number((((peakSpend - baselineSpend) / baselineSpend) * 100).toFixed(1)) : 100;
        const contributionToExcessPct =
          excessOverAverage > 0 ? Number(((surplus / excessOverAverage) * 100).toFixed(1)) : 0;

        categorySurpluses.push({
          category,
          peakSpend,
          baselineSpend: Number(baselineSpend.toFixed(2)),
          surplus: Number(surplus.toFixed(2)),
          percentageSurplus,
          contributionToExcessPct,
        });
      }

      // Sort by surplus amount descending
      categorySurpluses.sort((a, b) => b.surplus - a.surplus);
      const topDriverCategories = categorySurpluses.slice(0, 3);

      // 2. Spending Behavior Factor (Ticket Size vs Transaction Frequency)
      const avgTransactionsPerMonth =
        expenseMonths.reduce((sum, m) => sum + m.transactionCount, 0) / expenseMonths.length;
      const avgExpenseTicketOverall = expenseCount > 0 ? totalExpense / expenseCount : 0;
      const peakMonthAvgTicket =
        peak.transactionCount > 0 ? peak.totalExpense / peak.transactionCount : 0;

      const ticketSizeFactor = avgExpenseTicketOverall > 0 ? peakMonthAvgTicket / avgExpenseTicketOverall : 1;
      const frequencyFactor = avgTransactionsPerMonth > 0 ? peak.transactionCount / avgTransactionsPerMonth : 1;

      let spendDriverStyle: 'HIGH_TICKET_PURCHASES' | 'HIGH_TRANSACTION_VOLUME' | 'BALANCED';
      let spendDriverExplanation = '';

      if (ticketSizeFactor > 1.3 && ticketSizeFactor > frequencyFactor) {
        spendDriverStyle = 'HIGH_TICKET_PURCHASES';
        spendDriverExplanation =
          'The spike was largely driven by high-value, expensive transactions rather than frequent small purchases.';
      } else if (frequencyFactor > 1.3 && frequencyFactor > ticketSizeFactor) {
        spendDriverStyle = 'HIGH_TRANSACTION_VOLUME';
        spendDriverExplanation =
          'The surge was driven by an unusually high volume of transactions throughout the month.';
      } else {
        spendDriverStyle = 'BALANCED';
        spendDriverExplanation =
          'The spending surge was a combination of both higher transaction amounts and slightly increased purchase frequency.';
      }

      // 3. Automated Human-Readable Diagnostic Insights
      const diagnosticInsights: string[] = [];

      diagnosticInsights.push(
        `Your highest spending occurred in ${peak.monthName} with total expenses of ₹${peak.totalExpense.toLocaleString('en-IN')}, which was ${percentAboveAverage}% higher than your typical monthly average of ₹${meanMonthlyExpense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}.`
      );

      if (topDriverCategories.length > 0 && topDriverCategories[0].surplus > 0) {
        const primary = topDriverCategories[0];
        const secondary = topDriverCategories[1];
        if (secondary && secondary.surplus > 0) {
          diagnosticInsights.push(
            `Main Drivers: Spending in "${primary.category}" was ₹${primary.surplus.toLocaleString('en-IN')} higher than usual (+${primary.percentageSurplus}%), followed by "${secondary.category}" which exceeded baseline by ₹${secondary.surplus.toLocaleString('en-IN')}.`
          );
        } else {
          diagnosticInsights.push(
            `Main Driver: An unexpected surge in "${primary.category}" accounted for ₹${primary.surplus.toLocaleString('en-IN')} over the usual baseline (+${primary.percentageSurplus}%).`
          );
        }
      }

      if (peak.largestExpense) {
        diagnosticInsights.push(
          `Largest Single Expense: ₹${peak.largestExpense.amount.toLocaleString('en-IN')} paid to "${peak.largestExpense.person}" for "${peak.largestExpense.reason}" on ${new Date(peak.largestExpense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.`
        );
      }

      if (peak.topPerson && peak.topPerson.amount > 0) {
        diagnosticInsights.push(
          `Top Payee: "${peak.topPerson.name}" received ₹${peak.topPerson.amount.toLocaleString('en-IN')} in total during ${peak.shortMonth}.`
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
        stdDevMonthlyExpense: Number(stdDevMonthlyExpense.toFixed(2)),
        excessOverAverage: Number(excessOverAverage.toFixed(2)),
        percentAboveAverage,
        isSignificantSpike,
        topDriverCategories,
        largestExpense: peak.largestExpense,
        topPerson: peak.topPerson,
        spendDriverStyle,
        spendDriverExplanation,
        diagnosticInsights,
      };
    }

    // 3. Overall Category Breakdown lists (sorted by spend)
    const categoryOutgoingList = Object.entries(overallCategoryExpense)
      .map(([name, data]) => ({
        category: name,
        totalAmount: data.amount,
        count: data.count,
        percentageOfTotal: totalExpense > 0 ? Number(((data.amount / totalExpense) * 100).toFixed(1)) : 0,
        averagePerTx: data.count > 0 ? Number((data.amount / data.count).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const categoryIncomingList = Object.entries(overallCategoryIncome)
      .map(([name, data]) => ({
        category: name,
        totalAmount: data.amount,
        count: data.count,
        percentageOfTotal: totalIncome > 0 ? Number(((data.amount / totalIncome) * 100).toFixed(1)) : 0,
        averagePerTx: data.count > 0 ? Number((data.amount / data.count).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // 4. Counterparty Breakdown (Persons)
    const topPayees = Object.entries(overallPersonExpense)
      .map(([person, data]) => ({
        person,
        totalAmount: data.amount,
        count: data.count,
        percentage: totalExpense > 0 ? Number(((data.amount / totalExpense) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    const topPayers = Object.entries(overallPersonIncome)
      .map(([person, data]) => ({
        person,
        totalAmount: data.amount,
        count: data.count,
        percentage: totalIncome > 0 ? Number(((data.amount / totalIncome) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    return {
      hasData: true,
      currency,
      summary: {
        totalIncome,
        totalExpense,
        netBalance,
        savingsRate,
        totalTransactions: allExpenses.length,
        expenseCount,
        incomeCount,
        averageMonthlyExpense,
      },
      monthlyData: monthlyList,
      categoryBreakdown: {
        outgoing: categoryOutgoingList,
        incoming: categoryIncomingList,
      },
      personBreakdown: {
        topPayees,
        topPayers,
      },
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

    const headers = ['Date', 'Type', 'Amount', 'Currency', 'Person', 'Category', 'Reason', 'Payment Method', 'Tags'];
    const rows = expenses.map((e) => [
      `"${new Date(e.date).toISOString().split('T')[0]}"`,
      `"${e.type}"`,
      e.amount,
      `"${e.currency}"`,
      `"${(e.person || '').replace(/"/g, '""')}"`,
      `"${(e.category || '').replace(/"/g, '""')}"`,
      `"${(e.reason || '').replace(/"/g, '""')}"`,
      `"${(e.paymentMethod || '').replace(/"/g, '""')}"`,
      `"${(e.tags || []).join('; ')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

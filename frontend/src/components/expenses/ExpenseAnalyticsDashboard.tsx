import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  PiggyBank,
  Calendar,
  CalendarDays,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  CreditCard,
  Crown,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Target,
  Sparkles,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';
import { ExpenseAnalytics } from '../../services/expenseApi';

interface ExpenseAnalyticsDashboardProps {
  analytics: ExpenseAnalytics;
  onSelectMonth?: (monthKey: string) => void;
}

export const ExpenseAnalyticsDashboard: React.FC<ExpenseAnalyticsDashboardProps> = ({
  analytics,
  onSelectMonth,
}) => {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'all' | 'expense_only' | 'cashflow' | 'daily_budget' | 'pie' | 'monthly'>('all');

  // Tooltip states for separate charts
  const [hoveredExpenseOnly, setHoveredExpenseOnly] = useState<{
    date: string;
    expense: number;
    x: number;
    y: number;
  } | null>(null);

  const [hoveredCashflow, setHoveredCashflow] = useState<{
    date: string;
    expense: number;
    income: number;
    x: number;
    y: number;
  } | null>(null);

  // View modes: 'bar' (default, matches reference image) or 'line'
  const [dailyExpenseChartType, setDailyExpenseChartType] = useState<'bar' | 'line'>('bar');
  const [cashflowChartType, setCashflowChartType] = useState<'bar' | 'line'>('bar');

  // Daily Expense Target Budget threshold (set according to user request: below 200)
  const DAILY_TARGET_BUDGET = 200;

  if (!analytics.hasData) {
    return (
      <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-white/10 text-slate-400">
        <Activity className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-40 animate-pulse" />
        <h3 className="text-base font-semibold text-white">No Expense Records Yet</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Start recording your expenses in the form above. Once you add transactions, this analytics page will display interactive pie charts, monthly comparison bars, daily budget tracking, and spending trend graphs.
        </p>
      </div>
    );
  }

  const { summary, monthlySpending, categoryWiseSpending, spendingTrends, paymentMethodBreakdown, peakMonthAnalysis } = analytics;
  const currencySymbol = '₹';

  // --- Month Navigation & Day-Wise Expenses ---
  const currentMonthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    if (analytics.monthlySpending && analytics.monthlySpending.length > 0) {
      const hasCurrent = analytics.monthlySpending.some((m) => m.key === currentMonthKey);
      return hasCurrent ? currentMonthKey : analytics.monthlySpending[analytics.monthlySpending.length - 1].key;
    }
    return currentMonthKey;
  });

  const [selectedYear, selectedMonth] = useMemo(() => {
    const parts = selectedMonthKey.split('-').map(Number);
    return [parts[0] || new Date().getFullYear(), parts[1] || (new Date().getMonth() + 1)];
  }, [selectedMonthKey]);

  const selectedMonthDate = useMemo(() => new Date(selectedYear, selectedMonth - 1, 1), [selectedYear, selectedMonth]);
  const selectedMonthName = useMemo(() => selectedMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }), [selectedMonthDate]);
  const currentMonthName = useMemo(() => new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }), []);
  const daysInMonth = useMemo(() => new Date(selectedYear, selectedMonth, 0).getDate(), [selectedYear, selectedMonth]);

  const handlePrevMonth = () => {
    let y = selectedYear;
    let m = selectedMonth - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    const nextKey = `${y}-${String(m).padStart(2, '0')}`;
    setSelectedMonthKey(nextKey);
    onSelectMonth?.(nextKey);
  };

  const handleNextMonth = () => {
    let y = selectedYear;
    let m = selectedMonth + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    const nextKey = `${y}-${String(m).padStart(2, '0')}`;
    setSelectedMonthKey(nextKey);
    onSelectMonth?.(nextKey);
  };

  // Map of all daily records across all time
  const dailySpendingLookup = useMemo(() => {
    const map = new Map<string, { expense: number; income: number }>();
    (spendingTrends || []).forEach((p) => {
      map.set(p.date, { expense: p.expense, income: p.income });
    });
    return map;
  }, [spendingTrends]);

  // Construct day-wise calendar for all 1..daysInMonth
  // If user has no expense on that day, expense is 0
  const monthDailyData = useMemo(() => {
    const points = [];
    let totalExpense = 0;
    let totalIncome = 0;
    let daysWithExpense = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${selectedMonthKey}-${dayStr}`;
      const data = dailySpendingLookup.get(dateStr) || { expense: 0, income: 0 };

      if (data.expense > 0) {
        daysWithExpense++;
        totalExpense += data.expense;
      }
      totalIncome += data.income;

      points.push({
        date: dateStr,
        dayNumber: day,
        dayLabel: `${String(selectedMonth).padStart(2, '0')}-${dayStr}`,
        expense: data.expense,
        income: data.income,
      });
    }

    const hasData = totalExpense > 0 || totalIncome > 0;

    return {
      points,
      totalExpense,
      totalIncome,
      daysWithExpense,
      hasData,
    };
  }, [selectedMonthKey, selectedYear, selectedMonth, daysInMonth, dailySpendingLookup]);

  const trendPoints = monthDailyData.points;

  // --- 1. Category Pie Chart Calculations ---
  const totalCatSpend = categoryWiseSpending.reduce((sum, c) => sum + c.totalAmount, 0) || 1;
  let cumulativeAngle = 0;

  const pieSlices = categoryWiseSpending.map((cat, idx) => {
    const sliceAngle = (cat.totalAmount / totalCatSpend) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    cumulativeAngle += sliceAngle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const radius = 90;
    const innerRadius = 55;
    const cx = 110;
    const cy = 110;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const ix1 = cx + innerRadius * Math.cos(endRad);
    const iy1 = cy + innerRadius * Math.sin(endRad);
    const ix2 = cx + innerRadius * Math.cos(startRad);
    const iy2 = cy + innerRadius * Math.sin(startRad);

    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    const pathData = `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${ix1} ${iy1}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2}
      Z
    `;

    return {
      ...cat,
      index: idx,
      pathData,
      sliceAngle,
    };
  });

  const activeCategory = activeCategoryIndex !== null ? categoryWiseSpending[activeCategoryIndex] : null;

  // --- 2. GRAPH 1: DAILY EXPENSE ONLY (LOW SCALE ₹0 - ₹200) ---
  const maxExpenseInTrend = Math.max(...trendPoints.map((p) => p.expense), 0);
  const expenseScaleMax = maxExpenseInTrend > DAILY_TARGET_BUDGET
    ? Math.ceil(maxExpenseInTrend * 1.15)
    : DAILY_TARGET_BUDGET;

  const chartSvgWidth = Math.max(760, daysInMonth * 26 + 80);
  const chartSvgHeight = 230;
  const paddingLeft = 55;
  const paddingRight = 35;
  const paddingTop = 28;
  const paddingBottom = 35;

  const plotWidth = chartSvgWidth - paddingLeft - paddingRight;
  const plotHeight = chartSvgHeight - paddingTop - paddingBottom;

  const getChartX = (idx: number) =>
    paddingLeft + (idx / Math.max(1, daysInMonth - 1)) * plotWidth;

  const getExpenseOnlyY = (val: number) =>
    paddingTop + plotHeight - (Math.min(val, expenseScaleMax) / expenseScaleMax) * plotHeight;

  const expenseOnlyPolyline = trendPoints
    .map((p, i) => `${getChartX(i)},${getExpenseOnlyY(p.expense)}`)
    .join(' ');

  const expenseOnlyArea =
    trendPoints.length > 0
      ? `M ${getChartX(0)},${paddingTop + plotHeight} L ${trendPoints
          .map((p, i) => `${getChartX(i)},${getExpenseOnlyY(p.expense)}`)
          .join(' L ')} L ${getChartX(trendPoints.length - 1)},${paddingTop + plotHeight} Z`
      : '';

  const budgetLineY = getExpenseOnlyY(DAILY_TARGET_BUDGET);

  const daysWithinBudgetCount = trendPoints.filter((p) => p.expense <= DAILY_TARGET_BUDGET).length;
  const budgetComplianceRate = daysInMonth > 0
    ? Math.round((daysWithinBudgetCount / daysInMonth) * 100)
    : 100;

  // --- 3. GRAPH 2: SEPARATE DEDICATED GRAPH FOR DAILY INCOME VS EXPENSE ---
  const maxCashflowVal = Math.max(
    ...trendPoints.map((p) => Math.max(p.expense, p.income)),
    100
  );
  const cashflowScaleMax = Math.ceil(maxCashflowVal * 1.15);
  const cfSvgWidth = Math.max(780, daysInMonth * 26 + 140);
  const cfSvgHeight = 270;
  const cfPadLeft = 70;
  const cfPadRight = 95;
  const cfPadTop = 45;
  const cfPadBottom = 35;
  const cfPlotWidth = cfSvgWidth - cfPadLeft - cfPadRight;
  const cfPlotHeight = cfSvgHeight - cfPadTop - cfPadBottom;

  const getCashflowX = (idx: number) =>
    cfPadLeft + (idx / Math.max(1, daysInMonth - 1)) * cfPlotWidth;

  const getCashflowY = (val: number) =>
    cfPadTop + cfPlotHeight - (Math.min(val, cashflowScaleMax) / cashflowScaleMax) * cfPlotHeight;

  const cashflowIncomePolyline = trendPoints
    .map((p, i) => `${getCashflowX(i)},${getCashflowY(p.income)}`)
    .join(' ');

  const cashflowExpensePolyline = trendPoints
    .map((p, i) => `${getCashflowX(i)},${getCashflowY(p.expense)}`)
    .join(' ');

  const cashflowIncomeArea =
    trendPoints.length > 0
      ? `M ${cfPadLeft},${cfPadTop + cfPlotHeight} L ${trendPoints
          .map((p, i) => `${getCashflowX(i)},${getCashflowY(p.income)}`)
          .join(' L ')} L ${cfPadLeft + cfPlotWidth},${cfPadTop + cfPlotHeight} Z`
      : '';

  const cashflowExpenseArea =
    trendPoints.length > 0
      ? `M ${cfPadLeft},${cfPadTop + cfPlotHeight} L ${trendPoints
          .map((p, i) => `${getCashflowX(i)},${getCashflowY(p.expense)}`)
          .join(' L ')} L ${cfPadLeft + cfPlotWidth},${cfPadTop + cfPlotHeight} Z`
      : '';

  // --- 4. Monthly Bar Chart Scale ---
  const maxMonthValue = Math.max(
    ...monthlySpending.map((m) => Math.max(m.totalExpense, m.totalIncome)),
    1000
  );

  return (
    <div className="space-y-6">
      {/* Top Chart Navigation Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-white/10">
          {[
            { id: 'all', label: 'All Visualizations', icon: Layers },
            { id: 'expense_only', label: 'Daily Expense (≤ ₹200)', icon: LineIcon },
            { id: 'cashflow', label: 'Daily Income vs Expense (Bar Graph)', icon: BarChart3 },
            { id: 'daily_budget', label: 'Daily Budget Bar Gauge', icon: Target },
            { id: 'pie', label: 'Category Pie Chart', icon: PieIcon },
            { id: 'monthly', label: 'Monthly Comparison', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveChartTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeChartTab === tab.id
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Daily Target Indicator Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-xs text-slate-300">
          <Target className="w-3.5 h-3.5 text-emerald-400" />
          <span>Daily Budget Target: <strong className="text-white font-mono">₹{DAILY_TARGET_BUDGET}</strong></span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1"></span>
        </div>
      </div>

      {/* Top Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-rose-500/20 shadow-lg relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {currencySymbol}{summary.totalExpense.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.expenseCount} recorded payments
          </p>
        </div>

        {/* Total Income */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-emerald-500/20 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Income
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {currencySymbol}{summary.totalIncome.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary.incomeCount} incoming credits
          </p>
        </div>

        {/* Net Savings */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-brand-500/20 shadow-lg relative overflow-hidden group hover:border-brand-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Net Savings
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              summary.savings >= 0 ? 'text-indigo-400' : 'text-rose-400'
            }`}
          >
            {summary.savings >= 0 ? '+' : ''}
            {currencySymbol}{summary.savings.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Savings Rate:</span>
            <span className={`font-bold ${summary.savingsRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summary.savingsRate}%
            </span>
          </p>
        </div>

        {/* Daily Target Compliance */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-emerald-500/20 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              ≤ ₹200 Target Adherence
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {budgetComplianceRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {daysWithinBudgetCount} of {trendPoints.length} days below ₹200
          </p>
        </div>
      </div>

      {/* GRAPH 1: DAILY EXPENSE ONLY (WITH MONTH NAVIGATION & 0 FOR EMPTY DAYS) */}
      {(activeChartTab === 'all' || activeChartTab === 'expense_only') && (
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/10 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <LineIcon className="w-4 h-4 text-rose-400" />
                <h3 className="text-base font-bold text-white">
                  Spending Trends (Daily Expenses)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                  Scale: ₹0 – ₹{expenseScaleMax}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Day-wise expenses for <strong className="text-white">{selectedMonthName}</strong> (Target: ≤ ₹{DAILY_TARGET_BUDGET}/day)
              </p>
            </div>

            {/* Month Navigator & View Mode Controls */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
              {/* Month Switcher Navigator */}
              <div className="flex items-center bg-slate-950/90 p-0.5 rounded-xl border border-white/10 shadow-inner">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  title="Previous Month"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-white">
                  <CalendarDays className="w-3.5 h-3.5 text-brand-400" />
                  <span>{selectedMonthName}</span>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  title="Next Month"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Jump to current month button if on another month */}
              {selectedMonthKey !== currentMonthKey && (
                <button
                  type="button"
                  onClick={() => setSelectedMonthKey(currentMonthKey)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  Current
                </button>
              )}

              {/* Toggle Between Bar Graph and Line Graph */}
              <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setDailyExpenseChartType('bar')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    dailyExpenseChartType === 'bar'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3 h-3" />
                  Bar Graph
                </button>
                <button
                  type="button"
                  onClick={() => setDailyExpenseChartType('line')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    dailyExpenseChartType === 'line'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LineIcon className="w-3 h-3" />
                  Line Graph
                </button>
              </div>

              {/* Target Limit Badge */}
              <span className="flex items-center gap-1.5 text-emerald-300 ml-1">
                <span className="w-3.5 h-0.5 border-b-2 border-dashed border-emerald-400" />
                ≤ ₹{DAILY_TARGET_BUDGET} Limit
              </span>
            </div>
          </div>

          {monthDailyData.hasData ? (
            <div className="relative w-full overflow-x-auto pt-2">
              {/* Tooltip Overlay */}
              {hoveredExpenseOnly && (
                <div
                  className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-950/95 border border-white/20 p-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs min-w-[160px]"
                  style={{
                    left: `${(hoveredExpenseOnly.x / chartSvgWidth) * 100}%`,
                    top: `${Math.max(15, hoveredExpenseOnly.y - 12)}px`,
                  }}
                >
                  <div className="font-bold text-white border-b border-white/10 pb-1 mb-1 flex items-center justify-between">
                    <span>{hoveredExpenseOnly.date}</span>
                    <span className="text-[10px] text-slate-400">Day {parseInt(hoveredExpenseOnly.date.slice(8), 10)}</span>
                  </div>

                  <div className={`font-mono font-bold text-sm ${hoveredExpenseOnly.expense > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    Spent: {currencySymbol}{hoveredExpenseOnly.expense.toLocaleString('en-IN')}
                  </div>

                  <div className="mt-1 pt-1 border-t border-white/10">
                    {hoveredExpenseOnly.expense === 0 ? (
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-slate-500" />
                        No expenses on this day (₹0)
                      </span>
                    ) : hoveredExpenseOnly.expense <= DAILY_TARGET_BUDGET ? (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Within Target (₹{DAILY_TARGET_BUDGET - hoveredExpenseOnly.expense} saved)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Over target by ₹{hoveredExpenseOnly.expense - DAILY_TARGET_BUDGET}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <svg viewBox={`0 0 ${chartSvgWidth} ${chartSvgHeight}`} className="w-full h-60 select-none">
                <defs>
                  <linearGradient id="expenseOnlyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Value Gridlines and Labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const val = Math.round(expenseScaleMax * (1 - ratio));
                  const yPos = paddingTop + ratio * plotHeight;
                  return (
                    <g key={ratio}>
                      <line
                        x1={paddingLeft}
                        y1={yPos}
                        x2={chartSvgWidth - paddingRight}
                        y2={yPos}
                        stroke="rgba(255,255,255,0.08)"
                        strokeDasharray={ratio === 1 ? 'none' : '3 3'}
                      />
                      <text
                        x={paddingLeft - 8}
                        y={yPos + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="#94a3b8"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        ₹{val}
                      </text>
                    </g>
                  );
                })}

                {/* Target ₹200 Budget Line */}
                <line
                  x1={paddingLeft}
                  y1={budgetLineY}
                  x2={chartSvgWidth - paddingRight}
                  y2={budgetLineY}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                />
                <text
                  x={chartSvgWidth - paddingRight - 4}
                  y={budgetLineY - 6}
                  textAnchor="end"
                  fontSize="9"
                  fill="#10b981"
                  fontWeight="bold"
                >
                  🎯 ₹{DAILY_TARGET_BUDGET} Limit
                </text>

                {/* Render Either Bar Graph or Line Graph */}
                {dailyExpenseChartType === 'bar' ? (
                  // Bar Graph Mode: Every day of the month is rendered
                  trendPoints.map((p) => {
                    const slotWidth = plotWidth / daysInMonth;
                    const bWidth = Math.min(18, Math.max(8, slotWidth - 8));
                    const bx = paddingLeft + (p.dayNumber - 1) * slotWidth + (slotWidth - bWidth) / 2;
                    const bHeight = p.expense > 0 ? Math.max(4, (Math.min(p.expense, expenseScaleMax) / expenseScaleMax) * plotHeight) : 0;
                    const by = paddingTop + plotHeight - bHeight;
                    const isHovered = hoveredExpenseOnly?.date === p.date;
                    const isUnderBudget = p.expense <= DAILY_TARGET_BUDGET;

                    if (p.expense === 0) {
                      // Empty day: render "0" text right above baseline + subtle dot
                      return (
                        <g
                          key={`exp-bar-${p.date}`}
                          className="cursor-pointer group"
                          onMouseEnter={() =>
                            setHoveredExpenseOnly({
                              date: p.date,
                              expense: 0,
                              x: bx + bWidth / 2,
                              y: paddingTop + plotHeight,
                            })
                          }
                          onMouseLeave={() => setHoveredExpenseOnly(null)}
                        >
                          <circle
                            cx={bx + bWidth / 2}
                            cy={paddingTop + plotHeight}
                            r={isHovered ? 3 : 1.5}
                            fill={isHovered ? '#94a3b8' : '#475569'}
                            className="transition-all"
                          />
                          <text
                            x={bx + bWidth / 2}
                            y={paddingTop + plotHeight - 4}
                            textAnchor="middle"
                            fontSize="8"
                            fill="#64748b"
                            fontFamily="monospace"
                            fontWeight="600"
                          >
                            0
                          </text>
                        </g>
                      );
                    }

                    // Day with expense: render vertical bar + amount label on top
                    return (
                      <g
                        key={`exp-bar-${p.date}`}
                        className="cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredExpenseOnly({
                            date: p.date,
                            expense: p.expense,
                            x: bx + bWidth / 2,
                            y: by,
                          })
                        }
                        onMouseLeave={() => setHoveredExpenseOnly(null)}
                      >
                        <rect
                          x={bx}
                          y={by}
                          width={bWidth}
                          height={bHeight}
                          rx="3"
                          className={`transition-all duration-200 ${
                            isHovered
                              ? 'filter drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] fill-rose-400'
                              : isUnderBudget
                              ? 'fill-rose-500 hover:fill-rose-400'
                              : 'fill-amber-500 hover:fill-amber-400'
                          }`}
                        />
                        {/* Numerical value on top of bar */}
                        <text
                          x={bx + bWidth / 2}
                          y={Math.max(paddingTop + 10, by - 5)}
                          textAnchor="middle"
                          fontSize="8.5"
                          fill={isUnderBudget ? '#fecdd3' : '#fde68a'}
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ₹{p.expense}
                        </text>
                      </g>
                    );
                  })
                ) : (
                  // Line Graph Mode across month days
                  <>
                    {expenseOnlyArea && <path d={expenseOnlyArea} fill="url(#expenseOnlyGrad)" />}
                    {trendPoints.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={expenseOnlyPolyline}
                        className="drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                      />
                    )}
                    {trendPoints.map((p, i) => {
                      const cx = getChartX(i);
                      const cy = getExpenseOnlyY(p.expense);
                      const isHovered = hoveredExpenseOnly?.date === p.date;
                      const isUnderBudget = p.expense <= DAILY_TARGET_BUDGET;

                      return (
                        <g
                          key={`exp-node-${p.date}`}
                          className="cursor-pointer"
                          onMouseEnter={() =>
                            setHoveredExpenseOnly({
                              date: p.date,
                              expense: p.expense,
                              x: cx,
                              y: cy,
                            })
                          }
                          onMouseLeave={() => setHoveredExpenseOnly(null)}
                        >
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isHovered ? 6 : p.expense > 0 ? 4 : 2}
                            className={`transition-all duration-150 ${
                              p.expense === 0
                                ? 'fill-slate-600'
                                : isUnderBudget
                                ? 'fill-rose-500 stroke-slate-950 stroke-2'
                                : 'fill-amber-400 stroke-slate-950 stroke-2'
                            }`}
                          />
                          <text
                            x={cx}
                            y={cy - 8}
                            textAnchor="middle"
                            fontSize="8"
                            fill={p.expense === 0 ? '#64748b' : isUnderBudget ? '#fecdd3' : '#fde68a'}
                            fontFamily="monospace"
                            fontWeight={p.expense > 0 ? 'bold' : 'normal'}
                          >
                            {p.expense > 0 ? `₹${p.expense}` : '0'}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}

                {/* X-Axis Dates */}
                {trendPoints.map((p, i) => {
                  const step = Math.ceil(daysInMonth / 10);
                  const shouldShowLabel = i % step === 0 || i === daysInMonth - 1 || p.date.endsWith('-01');
                  if (!shouldShowLabel) return null;

                  const slotWidth = plotWidth / daysInMonth;
                  const cx = paddingLeft + (p.dayNumber - 1) * slotWidth + slotWidth / 2;

                  return (
                    <text
                      key={`date-${p.date}`}
                      x={cx}
                      y={chartSvgHeight - 10}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#94a3b8"
                      fontFamily="monospace"
                    >
                      {p.dayLabel}
                    </text>
                  );
                })}
              </svg>

              {/* Bottom Quick Metrics for Selected Month */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] pt-3 border-t border-white/5 bg-slate-950/40 rounded-xl p-2.5 mt-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Month Total Spend</span>
                  <span className="font-mono font-bold text-rose-400">
                    ₹{monthDailyData.totalExpense.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Avg Daily Spend</span>
                  <span className="font-mono font-bold text-amber-300">
                    ₹{Math.round(monthDailyData.totalExpense / daysInMonth)} / day
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Active Spend Days</span>
                  <span className="font-mono font-bold text-slate-200">
                    {monthDailyData.daysWithExpense} of {daysInMonth} days
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Target Adherence</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {budgetComplianceRate}% days below ₹{DAILY_TARGET_BUDGET}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* NO DATA FOUND STATE FOR THIS MONTH */
            <div className="py-14 text-center bg-slate-950/40 rounded-2xl border border-white/5 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/60 border border-white/10 flex items-center justify-center text-slate-400">
                <CalendarX className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  No Data Found for {selectedMonthName}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  No expense records were found for {selectedMonthName}.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedMonthKey(currentMonthKey)}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow transition-all"
                >
                  Go to Current Month ({currentMonthName})
                </button>
                {monthlySpending.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedMonthKey(monthlySpending[monthlySpending.length - 1].key)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-all"
                  >
                    View Latest Active Month ({monthlySpending[monthlySpending.length - 1].monthName})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GRAPH 2: SEPARATE DEDICATED GROUPED BAR GRAPH CHART FOR DAILY INCOME VS EXPENSE (MATCHES REFERENCE IMAGE) */}
      {(activeChartTab === 'all' || activeChartTab === 'cashflow') && (
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/10 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Daily Income vs Expense Comparison (Grouped Bar Chart)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Clustered Bar Graph
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Side-by-side grouped vertical bars showing outgoing expenses and incoming earnings for <strong className="text-white">{selectedMonthName}</strong>
              </p>
            </div>

            {/* Month Navigator, View Mode Toggle & Legend */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
              {/* Month Switcher Navigator */}
              <div className="flex items-center bg-slate-950/90 p-0.5 rounded-xl border border-white/10 shadow-inner">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  title="Previous Month"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-white">
                  <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                  <span>{selectedMonthName}</span>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  title="Next Month"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Jump to current month button if on another month */}
              {selectedMonthKey !== currentMonthKey && (
                <button
                  type="button"
                  onClick={() => setSelectedMonthKey(currentMonthKey)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 hover:bg-brand-500/30 transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  Current
                </button>
              )}

              <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setCashflowChartType('bar')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    cashflowChartType === 'bar'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3 h-3" />
                  Bar Graph
                </button>
                <button
                  type="button"
                  onClick={() => setCashflowChartType('line')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    cashflowChartType === 'line'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LineIcon className="w-3 h-3" />
                  Line Graph
                </button>
              </div>

              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-3 h-3 bg-amber-500 rounded-sm" />
                Expense (Yellow)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-3 bg-emerald-500 rounded-sm" />
                Income (Green)
              </span>
            </div>
          </div>

          {monthDailyData.hasData ? (
            <div className="relative w-full overflow-x-auto pt-2">
              {/* Tooltip Overlay */}
              {hoveredCashflow && (
                <div
                  className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-950/95 border border-white/20 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs min-w-[170px]"
                  style={{
                    left: `${(hoveredCashflow.x / cfSvgWidth) * 100}%`,
                    top: `${Math.max(15, hoveredCashflow.y - 15)}px`,
                  }}
                >
                  <div className="font-bold text-white border-b border-white/10 pb-1 mb-1.5 flex items-center justify-between">
                    <span>{hoveredCashflow.date}</span>
                    <span className="text-[10px] text-slate-400">Daily Cashflow</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-emerald-400 font-mono font-bold">
                      <span className="text-[11px] font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Income:
                      </span>
                      <span>+{currencySymbol}{hoveredCashflow.income.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center text-rose-400 font-mono font-bold">
                      <span className="text-[11px] font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500" /> Expense:
                      </span>
                      <span>-{currencySymbol}{hoveredCashflow.expense.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center border-t border-white/10 pt-1 font-mono font-bold text-xs">
                      <span className="text-[10px] text-slate-300 font-normal">Net:</span>
                      <span className={hoveredCashflow.income - hoveredCashflow.expense >= 0 ? 'text-indigo-300' : 'text-rose-400'}>
                        {hoveredCashflow.income - hoveredCashflow.expense >= 0 ? '+' : ''}
                        {currencySymbol}{(hoveredCashflow.income - hoveredCashflow.expense).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {cashflowChartType === 'bar' ? (
                /* GROUPED BAR GRAPH SVG (EXACTLY MATCHES USER'S REFERENCE IMAGE) */
                <svg viewBox={`0 0 ${cfSvgWidth} ${cfSvgHeight}`} className="w-full h-64 select-none">
                  {/* Centered Chart Title at Top */}
                  <text
                    x={cfPadLeft + cfPlotWidth / 2}
                    y={22}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="13"
                    fontWeight="bold"
                    letterSpacing="0.3"
                  >
                    Daily Income &amp; Expense Comparison for {selectedMonthName}
                  </text>

                  {/* Left Rotated Y-Axis Label: Amount (₹) */}
                  <text
                    x={20}
                    y={cfPadTop + cfPlotHeight / 2}
                    transform={`rotate(-90 20 ${cfPadTop + cfPlotHeight / 2})`}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="11"
                    fontWeight="700"
                    letterSpacing="0.5"
                  >
                    Amount ({currencySymbol})
                  </text>

                  {/* Horizontal Dotted Gridlines & Y-Axis Scale Values */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const val = Math.round(cashflowScaleMax * (1 - ratio));
                    const yPos = cfPadTop + ratio * cfPlotHeight;
                    return (
                      <g key={ratio}>
                        <line
                          x1={cfPadLeft}
                          y1={yPos}
                          x2={cfPadLeft + cfPlotWidth}
                          y2={yPos}
                          stroke="rgba(255,255,255,0.12)"
                          strokeDasharray="2 3"
                        />
                        <text
                          x={cfPadLeft - 8}
                          y={yPos + 4}
                          textAnchor="end"
                          fontSize="10"
                          fill="#94a3b8"
                          fontFamily="monospace"
                          fontWeight="600"
                        >
                          ₹{val >= 1000 ? `${Math.round(val / 1000)}k` : val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Right-Side Legend (Yellow = Expense, Green = Income) */}
                  <g transform={`translate(${cfPadLeft + cfPlotWidth + 12}, ${cfPadTop + cfPlotHeight / 2 - 20})`}>
                    {/* Expense (Golden Yellow) */}
                    <rect x="0" y="0" width="12" height="12" rx="2" fill="#eab308" />
                    <text x="16" y="10" fill="#fde047" fontSize="10.5" fontWeight="600">
                      Expense
                    </text>

                    {/* Income (Forest Green) */}
                    <rect x="0" y="20" width="12" height="12" rx="2" fill="#16a34a" />
                    <text x="16" y="30" fill="#86efac" fontSize="10.5" fontWeight="600">
                      Income
                    </text>
                  </g>

                  {/* Grouped Vertical Bars For Each Date */}
                  {trendPoints.map((p, i) => {
                    const groupW = cfPlotWidth / daysInMonth;
                    const bWidth = Math.min(18, Math.max(5, (groupW - 6) / 2));
                    const groupCenterX = cfPadLeft + (i + 0.5) * groupW;

                    // Expense Bar (Yellow - Left)
                    const expHeight = p.expense > 0 ? Math.max(4, (p.expense / cashflowScaleMax) * cfPlotHeight) : 0;
                    const expY = cfPadTop + cfPlotHeight - expHeight;
                    const expX = groupCenterX - bWidth - 0.5;

                    // Income Bar (Green - Right)
                    const incHeight = p.income > 0 ? Math.max(4, (p.income / cashflowScaleMax) * cfPlotHeight) : 0;
                    const incY = cfPadTop + cfPlotHeight - incHeight;
                    const incX = groupCenterX + 0.5;

                    const isHovered = hoveredCashflow?.date === p.date;
                    const hasBothZero = p.expense === 0 && p.income === 0;

                    return (
                      <g
                        key={`bar-group-${p.date}`}
                        className="cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredCashflow({
                            date: p.date,
                            expense: p.expense,
                            income: p.income,
                            x: groupCenterX,
                            y: Math.min(expY, incY),
                          })
                        }
                        onMouseLeave={() => setHoveredCashflow(null)}
                      >
                        {/* Background subtle hover highlight column */}
                        {isHovered && (
                          <rect
                            x={groupCenterX - groupW / 2 + 2}
                            y={cfPadTop}
                            width={groupW - 4}
                            height={cfPlotHeight}
                            fill="rgba(255,255,255,0.04)"
                            rx="4"
                          />
                        )}

                        {/* If both are zero, display single 0 above baseline */}
                        {hasBothZero ? (
                          <g>
                            <circle
                              cx={groupCenterX}
                              cy={cfPadTop + cfPlotHeight}
                              r={1.5}
                              fill="#475569"
                            />
                            <text
                              x={groupCenterX}
                              y={cfPadTop + cfPlotHeight - 5}
                              textAnchor="middle"
                              fontSize="8"
                              fill="#64748b"
                              fontFamily="monospace"
                            >
                              0
                            </text>
                          </g>
                        ) : (
                          <>
                            {/* Expense Bar (Yellow) */}
                            {p.expense > 0 ? (
                              <>
                                <rect
                                  x={expX}
                                  y={expY}
                                  width={bWidth}
                                  height={expHeight}
                                  rx="1.5"
                                  className={`transition-all duration-150 ${
                                    isHovered
                                      ? 'fill-amber-300 filter drop-shadow-[0_0_6px_rgba(234,179,8,0.7)]'
                                      : 'fill-amber-500 hover:fill-amber-400'
                                  }`}
                                />
                                <text
                                  x={expX + bWidth / 2}
                                  y={Math.max(cfPadTop + 10, expY - 4)}
                                  textAnchor="middle"
                                  fontSize="7.5"
                                  fill="#fef08a"
                                  fontFamily="monospace"
                                  fontWeight="bold"
                                >
                                  {p.expense >= 1000 ? `${(p.expense / 1000).toFixed(1)}k` : p.expense}
                                </text>
                              </>
                            ) : (
                              /* Expense is 0, show 0 on expense side */
                              <text
                                x={expX + bWidth / 2}
                                y={cfPadTop + cfPlotHeight - 5}
                                textAnchor="middle"
                                fontSize="7.5"
                                fill="#64748b"
                                fontFamily="monospace"
                              >
                                0
                              </text>
                            )}

                            {/* Income Bar (Green) */}
                            {p.income > 0 && (
                              <>
                                <rect
                                  x={incX}
                                  y={incY}
                                  width={bWidth}
                                  height={incHeight}
                                  rx="1.5"
                                  className={`transition-all duration-150 ${
                                    isHovered
                                      ? 'fill-emerald-300 filter drop-shadow-[0_0_6px_rgba(22,163,74,0.7)]'
                                      : 'fill-emerald-600 hover:fill-emerald-500'
                                  }`}
                                />
                                <text
                                  x={incX + bWidth / 2}
                                  y={Math.max(cfPadTop + 10, incY - 4)}
                                  textAnchor="middle"
                                  fontSize="7.5"
                                  fill="#bbf7d0"
                                  fontFamily="monospace"
                                  fontWeight="bold"
                                >
                                  {p.income >= 1000 ? `${(p.income / 1000).toFixed(1)}k` : p.income}
                                </text>
                              </>
                            )}
                          </>
                        )}

                        {/* Date label centered below the bar pair (Day number) */}
                        <text
                          x={groupCenterX}
                          y={cfSvgHeight - 10}
                          textAnchor="middle"
                          fontSize="8.5"
                          fill={isHovered ? '#ffffff' : '#94a3b8'}
                          fontFamily="monospace"
                          fontWeight={isHovered ? 'bold' : 'normal'}
                        >
                          {p.dayNumber}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              ) : (
                /* DUAL LINE GRAPH MODE (ALTERNATIVE VIEW) */
                <svg viewBox={`0 0 ${cfSvgWidth} ${cfSvgHeight}`} className="w-full h-64 select-none">
                  <defs>
                    <linearGradient id="cashflowIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="cashflowExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Y-Axis Value Gridlines and Labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const val = Math.round(cashflowScaleMax * (1 - ratio));
                    const yPos = cfPadTop + ratio * cfPlotHeight;
                    return (
                      <g key={ratio}>
                        <line
                          x1={cfPadLeft}
                          y1={yPos}
                          x2={cfPadLeft + cfPlotWidth}
                          y2={yPos}
                          stroke="rgba(255,255,255,0.08)"
                          strokeDasharray={ratio === 1 ? 'none' : '3 3'}
                        />
                        <text
                          x={cfPadLeft - 8}
                          y={yPos + 4}
                          textAnchor="end"
                          fontSize="10"
                          fill="#94a3b8"
                          fontFamily="monospace"
                          fontWeight="600"
                        >
                          ₹{val >= 1000 ? `${Math.round(val / 1000)}k` : val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Shaded Areas */}
                  {cashflowIncomeArea && <path d={cashflowIncomeArea} fill="url(#cashflowIncomeGrad)" />}
                  {cashflowExpenseArea && <path d={cashflowExpenseArea} fill="url(#cashflowExpenseGrad)" />}

                  {/* Income Curve (Emerald) */}
                  {trendPoints.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={cashflowIncomePolyline}
                      className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    />
                  )}

                  {/* Expense Curve (Amber) */}
                  {trendPoints.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={cashflowExpensePolyline}
                      className="drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                    />
                  )}

                  {/* Nodes for each date */}
                  {trendPoints.map((p, i) => {
                    const cx = getCashflowX(i);
                    const cyExp = getCashflowY(p.expense);
                    const cyInc = getCashflowY(p.income);
                    const isHovered = hoveredCashflow?.date === p.date;

                    return (
                      <g
                        key={`cf-node-${p.date}`}
                        className="cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredCashflow({
                            date: p.date,
                            expense: p.expense,
                            income: p.income,
                            x: cx,
                            y: Math.min(cyExp, cyInc),
                          })
                        }
                        onMouseLeave={() => setHoveredCashflow(null)}
                      >
                        {p.income > 0 && Math.abs(cyInc - cyExp) > 4 && (
                          <line
                            x1={cx}
                            y1={cyInc}
                            x2={cx}
                            y2={cyExp}
                            stroke="rgba(255,255,255,0.2)"
                            strokeDasharray="2 2"
                          />
                        )}

                        {/* Income Node (Green) */}
                        {p.income > 0 && (
                          <circle
                            cx={cx}
                            cy={cyInc}
                            r={isHovered ? 6 : 4}
                            className="fill-emerald-400 stroke-slate-950 stroke-2"
                          />
                        )}

                        {/* Expense Node (Amber) */}
                        <circle
                          cx={cx}
                          cy={cyExp}
                          r={isHovered ? 6 : p.expense > 0 ? 4 : 2}
                          className={p.expense > 0 ? 'fill-amber-400 stroke-slate-950 stroke-2' : 'fill-slate-600'}
                        />

                        <text
                          x={cx}
                          y={cyExp - 7}
                          textAnchor="middle"
                          fontSize="7.5"
                          fill={p.expense === 0 ? '#64748b' : '#fde047'}
                          fontFamily="monospace"
                          fontWeight={p.expense > 0 ? 'bold' : 'normal'}
                        >
                          {p.expense > 0 ? (p.expense >= 1000 ? `${(p.expense / 1000).toFixed(1)}k` : p.expense) : '0'}
                        </text>
                      </g>
                    );
                  })}

                  {/* X-Axis Dates */}
                  {trendPoints.map((p, i) => {
                    const step = Math.ceil(daysInMonth / 10);
                    const shouldShowLabel = i % step === 0 || i === daysInMonth - 1 || p.date.endsWith('-01');
                    if (!shouldShowLabel) return null;

                    const cx = getCashflowX(i);
                    return (
                      <text
                        key={`cf-date-${p.date}`}
                        x={cx}
                        y={cfSvgHeight - 10}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#94a3b8"
                        fontFamily="monospace"
                      >
                        {p.dayNumber}
                      </text>
                    );
                  })}
                </svg>
              )}

              {/* Bottom Quick Metric Highlights for Selected Month */}
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-3 border-t border-white/5 bg-slate-950/40 rounded-xl p-2.5 mt-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">{selectedMonthName} Total Income</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ₹{monthDailyData.totalIncome.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{selectedMonthName} Total Expense</span>
                  <span className="font-mono font-bold text-rose-400">
                    ₹{monthDailyData.totalExpense.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Net Cashflow</span>
                  <span className={`font-mono font-bold ${monthDailyData.totalIncome >= monthDailyData.totalExpense ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {monthDailyData.totalIncome >= monthDailyData.totalExpense ? '+' : ''}₹{(monthDailyData.totalIncome - monthDailyData.totalExpense).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* NO DATA FOUND STATE FOR THIS MONTH */
            <div className="py-14 text-center bg-slate-950/40 rounded-2xl border border-white/5 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/60 border border-white/10 flex items-center justify-center text-slate-400">
                <CalendarX className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  No Data Found for {selectedMonthName}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  No transactions were found for {selectedMonthName}.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedMonthKey(currentMonthKey)}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow transition-all"
                >
                  Go to Current Month ({currentMonthName})
                </button>
                {monthlySpending.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedMonthKey(monthlySpending[monthlySpending.length - 1].key)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-all"
                  >
                    View Latest Active Month ({monthlySpending[monthlySpending.length - 1].monthName})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* GRAPH 3: DAILY EXPENSE BAR GAUGE VS ₹200 TARGET */}
      {(activeChartTab === 'all' || activeChartTab === 'daily_budget') && (
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/10 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Daily Spending vs ₹200 Target Limit ({selectedMonthName})
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Color-coded bars showing green when below ₹200 and red when exceeding daily allowance
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                ≤ ₹200 (Within Target)
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                &gt; ₹200 (Exceeded)
              </span>
            </div>
          </div>

          {monthDailyData.hasData ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-2">
              {trendPoints.map((p) => {
                const isUnder = p.expense <= DAILY_TARGET_BUDGET;
                const fillPct = Math.min(100, Math.round((p.expense / DAILY_TARGET_BUDGET) * 100));

                return (
                  <div
                    key={`gauge-${p.date}`}
                    className={`p-3 rounded-xl border transition-all ${
                      isUnder
                        ? 'bg-slate-950/60 border-emerald-500/20 hover:border-emerald-500/40'
                        : 'bg-slate-950/60 border-rose-500/30 hover:border-rose-500/50'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400 font-mono text-center">
                      {p.date.slice(5)}
                    </div>

                    {/* Vertical mini-bar container */}
                    <div className="w-full bg-slate-900 rounded-full h-16 my-2 flex flex-col justify-end p-0.5 relative overflow-hidden">
                      <div
                        className={`w-full rounded-full transition-all duration-500 ${
                          isUnder
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                            : 'bg-gradient-to-t from-rose-600 to-amber-500'
                        }`}
                        style={{ height: `${Math.max(4, fillPct)}%` }}
                      />
                    </div>

                    <div className="text-center">
                      <div className={`text-xs font-mono font-bold ${isUnder ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₹{p.expense}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        {isUnder ? `Saved ₹${DAILY_TARGET_BUDGET - p.expense}` : `+₹${p.expense - DAILY_TARGET_BUDGET}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center bg-slate-950/40 rounded-2xl border border-white/5 space-y-2">
              <p className="text-xs text-slate-400">
                No expense records to evaluate budget for <strong className="text-white">{selectedMonthName}</strong>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* GRAPH 4: INTERACTIVE PIE / DONUT CHART FOR CATEGORY-WISE SPENDING */}
      {(activeChartTab === 'all' || activeChartTab === 'pie') && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-brand-400" />
                Category-wise Spending Pie Chart
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hover or click slices to inspect breakdown by categories
              </p>
            </div>
            <span className="text-xs text-slate-400">
              Total Categorized: <strong>{currencySymbol}{summary.totalExpense.toLocaleString('en-IN')}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* SVG Donut / Pie */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
              <svg viewBox="0 0 220 220" className="w-56 h-56 transform -rotate-90">
                {pieSlices.map((slice) => {
                  const isHovered = activeCategoryIndex === slice.index;
                  return (
                    <path
                      key={slice.category}
                      d={slice.pathData}
                      fill={slice.color}
                      className="cursor-pointer transition-all duration-200"
                      style={{
                        transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                        transformOrigin: '110px 110px',
                        filter: isHovered ? 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' : 'none',
                        opacity: activeCategoryIndex === null || isHovered ? 1 : 0.6,
                      }}
                      onMouseEnter={() => setActiveCategoryIndex(slice.index)}
                      onMouseLeave={() => setActiveCategoryIndex(null)}
                    />
                  );
                })}
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                {activeCategory ? (
                  <>
                    <span className="text-[11px] font-bold text-slate-400 truncate max-w-[100px]">
                      {activeCategory.category}
                    </span>
                    <span className="text-base font-black font-mono text-white">
                      {currencySymbol}{activeCategory.totalAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400">
                      {activeCategory.percentageOfTotal}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Categories
                    </span>
                    <span className="text-lg font-black font-mono text-white">
                      {categoryWiseSpending.length}
                    </span>
                    <span className="text-[10px] text-slate-400">Items</span>
                  </>
                )}
              </div>
            </div>

            {/* Category Legend & Details */}
            <div className="lg:col-span-7 space-y-2 max-h-72 overflow-y-auto pr-1">
              {categoryWiseSpending.map((cat, idx) => {
                const isHovered = activeCategoryIndex === idx;
                return (
                  <div
                    key={cat.category}
                    onMouseEnter={() => setActiveCategoryIndex(idx)}
                    onMouseLeave={() => setActiveCategoryIndex(null)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isHovered
                        ? 'bg-slate-950 border-white/20 shadow-md'
                        : 'bg-slate-950/40 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-md shrink-0 shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs font-semibold text-white">
                        {cat.category}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ({cat.count} tx)
                      </span>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-white">
                        {currencySymbol}{cat.totalAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-400 w-12 text-right">
                        {cat.percentageOfTotal}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* GRAPH 5: MONTHLY INFLOW VS OUTFLOW BAR CHART */}
      {(activeChartTab === 'all' || activeChartTab === 'monthly') && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Monthly Spending & Inflow Bar Chart
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Compare month-over-month expenses against income
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                Income
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-3 h-3 rounded bg-rose-500" />
                Expenses
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {monthlySpending.map((m) => {
              const expensePct = Math.min(100, (m.totalExpense / maxMonthValue) * 100);
              const incomePct = Math.min(100, (m.totalIncome / maxMonthValue) * 100);

              return (
                <div
                  key={m.key}
                  className="p-3.5 rounded-xl bg-slate-950/50 border border-white/5 hover:border-white/15 transition-all"
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {m.monthName}
                      </span>
                      {m.momExpenseChangePct !== null && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            m.momExpenseChangePct > 0
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {m.momExpenseChangePct > 0 ? '+' : ''}
                          {m.momExpenseChangePct}% MoM
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-emerald-400">
                        In: {currencySymbol}{m.totalIncome.toLocaleString('en-IN')}
                      </span>
                      <span className="text-rose-400">
                        Out: {currencySymbol}{m.totalExpense.toLocaleString('en-IN')}
                      </span>
                      <span
                        className={`font-bold ${
                          m.netCashFlow >= 0 ? 'text-indigo-400' : 'text-rose-400'
                        }`}
                      >
                        Net: {m.netCashFlow >= 0 ? '+' : ''}{currencySymbol}{m.netCashFlow.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Dual comparative bars */}
                  <div className="space-y-1.5">
                    {/* Income */}
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(1, incomePct)}%` }}
                      />
                    </div>
                    {/* Expense */}
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(1, expensePct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GRAPH 6: CATEGORY HORIZONTAL COMPARISON BARS & PAYMENT METHOD METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Horizontal Comparison (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/60 border border-white/10 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            Category Spending Comparison
          </h3>

          <div className="space-y-3">
            {categoryWiseSpending.slice(0, 7).map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">{cat.category}</span>
                  <span className="font-mono text-slate-400">
                    {currencySymbol}{cat.totalAmount.toLocaleString('en-IN')} ({cat.percentageOfTotal}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(2, cat.percentageOfTotal)}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/60 border border-white/10 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-400" />
            Payment Methods Distribution
          </h3>

          <div className="space-y-3">
            {paymentMethodBreakdown.map((pm) => (
              <div key={pm.method} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">{pm.method}</span>
                  <span className="font-mono text-slate-400">
                    {currencySymbol}{pm.amount.toLocaleString('en-IN')} ({pm.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(3, pm.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PEAK MONTH "WHY" ALGORITHM CARD */}
      {peakMonthAnalysis && (
        <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-amber-500/30 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Which Month Expenses Were Higher and Why?
            </h3>
          </div>

          <ul className="space-y-1.5">
            {peakMonthAnalysis.diagnosticInsights.map((insight: string, idx: number) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  PiggyBank,
  Calendar,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  CreditCard,
  Crown,
  Activity,
  Layers,
  Info,
} from 'lucide-react';
import { ExpenseAnalytics } from '../../services/expenseApi';

interface ExpenseAnalyticsDashboardProps {
  analytics: ExpenseAnalytics;
  onSelectMonth?: (monthKey: string) => void;
}

export const ExpenseAnalyticsDashboard: React.FC<ExpenseAnalyticsDashboardProps> = ({
  analytics,
}) => {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'all' | 'pie' | 'bars' | 'trends'>('all');

  if (!analytics.hasData) {
    return (
      <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-white/10 text-slate-400">
        <Activity className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-40 animate-pulse" />
        <h3 className="text-base font-semibold text-white">No Expense Records Yet</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Start recording your expenses in the form above. Once you add transactions, this analytics page will display interactive pie charts, monthly comparison bars, and spending trend graphs.
        </p>
      </div>
    );
  }

  const { summary, monthlySpending, categoryWiseSpending, spendingTrends, paymentMethodBreakdown, peakMonthAnalysis } = analytics;
  const currencySymbol = '₹';

  // Maximum monthly value for bar chart scaling
  const maxMonthValue = Math.max(
    ...monthlySpending.map((m) => Math.max(m.totalExpense, m.totalIncome)),
    1000
  );

  // SVG Pie Chart Calculation
  const totalCatSpend = categoryWiseSpending.reduce((sum, c) => sum + c.totalAmount, 0) || 1;
  let cumulativeAngle = 0;

  const pieSlices = categoryWiseSpending.map((cat, idx) => {
    const sliceAngle = (cat.totalAmount / totalCatSpend) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    cumulativeAngle += sliceAngle;

    // Polar coordinates for SVG path
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const radius = 90;
    const innerRadius = 55; // Donut chart
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

  // Trend Line Chart Calculation
  const trendMax = Math.max(...spendingTrends.map((p) => Math.max(p.expense, p.income)), 500);
  const trendPoints = spendingTrends.slice(-14); // Last 14 activity days
  const trendSvgWidth = 500;
  const trendSvgHeight = 160;
  const padding = 20;

  const getX = (idx: number) =>
    padding + (idx / Math.max(1, trendPoints.length - 1)) * (trendSvgWidth - padding * 2);
  const getY = (val: number) =>
    trendSvgHeight - padding - (val / Math.max(1, trendMax)) * (trendSvgHeight - padding * 2);

  const expensePolyline = trendPoints.map((p, i) => `${getX(i)},${getY(p.expense)}`).join(' ');
  const expenseAreaPath =
    trendPoints.length > 0
      ? `M ${getX(0)},${trendSvgHeight - padding} L ${trendPolyline(trendPoints, getX, getY)} L ${getX(
          trendPoints.length - 1
        )},${trendSvgHeight - padding} Z`
      : '';

  function trendPolyline(points: typeof trendPoints, xFn: (i: number) => number, yFn: (v: number) => number) {
    return points.map((p, i) => `${xFn(i)},${yFn(p.expense)}`).join(' L ');
  }

  return (
    <div className="space-y-6">
      {/* Top Filter Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveChartTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeChartTab === 'all'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Visualizations
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('pie')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeChartTab === 'pie'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            Category Pie Chart
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('bars')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeChartTab === 'bars'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Monthly Bar Chart
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('trends')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeChartTab === 'trends'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LineIcon className="w-3.5 h-3.5" />
            Spending Trends
          </button>
        </div>

        <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Live Financial Dashboard
        </div>
      </div>

      {/* KPI Cards: Total Expenses, Total Income, Savings, Monthly Avg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-rose-500/20 shadow-lg relative overflow-hidden">
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
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-emerald-500/20 shadow-lg relative overflow-hidden">
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
            {summary.incomeCount} incoming entries
          </p>
        </div>

        {/* Savings */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-brand-500/20 shadow-lg relative overflow-hidden">
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
            <span>Rate:</span>
            <span className={`font-bold ${summary.savingsRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summary.savingsRate}%
            </span>
          </p>
        </div>

        {/* Monthly Average Spend */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Monthly Avg Spend
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {currencySymbol}{summary.averageMonthlyExpense.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across active months
          </p>
        </div>
      </div>

      {/* GRAPH 1: INTERACTIVE PIE / DONUT CHART FOR CATEGORY-WISE SPENDING */}
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

      {/* GRAPH 2: MONTHLY INFLOW VS OUTFLOW BAR CHART */}
      {(activeChartTab === 'all' || activeChartTab === 'bars') && (
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

      {/* GRAPH 3: SPENDING TRENDS LINE / AREA GRAPH & PAYMENT METHODS */}
      {(activeChartTab === 'all' || activeChartTab === 'trends') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Trend Area Chart (8 cols) */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900/60 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <LineIcon className="w-4 h-4 text-cyan-400" />
                  Spending Trends Timeline
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daily expense fluctuations over recent activity
                </p>
              </div>
            </div>

            {trendPoints.length > 1 ? (
              <div className="w-full overflow-x-auto pt-2">
                <svg viewBox={`0 0 ${trendSvgWidth} ${trendSvgHeight}`} className="w-full h-44">
                  <defs>
                    <linearGradient id="expenseTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0.25, 0.5, 0.75].map((factor) => (
                    <line
                      key={factor}
                      x1={padding}
                      y1={padding + factor * (trendSvgHeight - padding * 2)}
                      x2={trendSvgWidth - padding}
                      y2={padding + factor * (trendSvgHeight - padding * 2)}
                      stroke="rgba(255,255,255,0.06)"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Gradient Area Fill */}
                  {expenseAreaPath && <path d={expenseAreaPath} fill="url(#expenseTrendGrad)" />}

                  {/* Polyline */}
                  <polyline
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={expensePolyline}
                  />

                  {/* Data Points */}
                  {trendPoints.map((p, i) => (
                    <circle
                      key={p.date}
                      cx={getX(i)}
                      cy={getY(p.expense)}
                      r="4"
                      className="fill-rose-500 stroke-slate-900 stroke-2"
                    />
                  ))}
                </svg>

                {/* X-axis date labels */}
                <div className="flex justify-between text-[10px] text-slate-500 px-3 mt-1">
                  <span>{trendPoints[0]?.date}</span>
                  <span>{trendPoints[Math.floor(trendPoints.length / 2)]?.date}</span>
                  <span>{trendPoints[trendPoints.length - 1]?.date}</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                Need at least 2 active transaction days to plot trend curve.
              </div>
            )}
          </div>

          {/* Payment Method Distribution (4 cols) */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-900/60 border border-white/10 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              Payment Methods
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
      )}

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

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
  CheckCircle2,
  AlertTriangle,
  Target,
  Sparkles,
  Layers,
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
  const [activeChartTab, setActiveChartTab] = useState<'all' | 'trends' | 'daily_budget' | 'pie' | 'monthly'>('all');
  const [hoveredTrend, setHoveredTrend] = useState<{
    date: string;
    expense: number;
    income: number;
    x: number;
    y: number;
  } | null>(null);

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

  // --- 2. Spending Trends Timeline Graph Calculation (LOWER SCALE ADJUSTED) ---
  // The user requested: "set the graph scale to lower not higher, my daily expenses must be below 200, according to this set the graph"
  const trendPoints = spendingTrends.slice(-14); // Recent 14 activity days
  const maxDayVal = Math.max(
    ...trendPoints.map((p) => Math.max(p.expense, p.income)),
    0
  );

  // If daily amounts are below 200, scale is locked to 200.
  // If amounts exceed 200, scale ceiling smoothly expands to accommodate them.
  const trendScaleMax = maxDayVal > DAILY_TARGET_BUDGET
    ? Math.ceil(maxDayVal * 1.15)
    : DAILY_TARGET_BUDGET;

  const trendSvgWidth = 560;
  const trendSvgHeight = 230;
  const paddingLeft = 55; // room for Y-axis labels
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 35;

  const plotWidth = trendSvgWidth - paddingLeft - paddingRight;
  const plotHeight = trendSvgHeight - paddingTop - paddingBottom;

  const getTrendX = (idx: number) =>
    paddingLeft + (idx / Math.max(1, trendPoints.length - 1)) * plotWidth;

  const getTrendY = (val: number) =>
    paddingTop + plotHeight - (Math.min(val, trendScaleMax) / trendScaleMax) * plotHeight;

  // Expense Polyline & Area Path
  const expensePolylinePoints = trendPoints
    .map((p, i) => `${getTrendX(i)},${getTrendY(p.expense)}`)
    .join(' ');

  const expenseAreaPath =
    trendPoints.length > 0
      ? `M ${getTrendX(0)},${paddingTop + plotHeight} L ${trendPoints
          .map((p, i) => `${getTrendX(i)},${getTrendY(p.expense)}`)
          .join(' L ')} L ${getTrendX(trendPoints.length - 1)},${paddingTop + plotHeight} Z`
      : '';

  // Income Polyline & Area Path
  const incomePolylinePoints = trendPoints
    .map((p, i) => `${getTrendX(i)},${getTrendY(p.income)}`)
    .join(' ');

  const incomeAreaPath =
    trendPoints.length > 0
      ? `M ${getTrendX(0)},${paddingTop + plotHeight} L ${trendPoints
          .map((p, i) => `${getTrendX(i)},${getTrendY(p.income)}`)
          .join(' L ')} L ${getTrendX(trendPoints.length - 1)},${paddingTop + plotHeight} Z`
      : '';

  // Calculate Y position for the 200 budget line
  const budgetLineY = getTrendY(DAILY_TARGET_BUDGET);

  // Number of days strictly below the 200 daily budget
  const daysWithinBudgetCount = trendPoints.filter((p) => p.expense <= DAILY_TARGET_BUDGET).length;
  const budgetComplianceRate = trendPoints.length > 0
    ? Math.round((daysWithinBudgetCount / trendPoints.length) * 100)
    : 100;

  // --- 3. Monthly Inflow vs Outflow Scale ---
  const maxMonthValue = Math.max(
    ...monthlySpending.map((m) => Math.max(m.totalExpense, m.totalIncome)),
    1000
  );

  return (
    <div className="space-y-6">
      {/* Top Chart Filter Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-white/10">
          {[
            { id: 'all', label: 'All Visualizations', icon: Layers },
            { id: 'trends', label: 'Daily Trend (Scaled ≤ ₹200)', icon: LineIcon },
            { id: 'daily_budget', label: 'Daily Budget vs ₹200', icon: Target },
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
          <span>Daily Target: <strong className="text-white font-mono">₹{DAILY_TARGET_BUDGET}</strong></span>
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

      {/* GRAPH 1: REDESIGNED SPENDING TRENDS TIMELINE WITH LOWER SCALE (0 TO ₹200) */}
      {(activeChartTab === 'all' || activeChartTab === 'trends') && (
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/10 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <LineIcon className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Daily Income & Expense Line Graph
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Scale: ₹0 – ₹{trendScaleMax}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Track daily cash flow with side-by-side lines for incoming earnings and outgoing expenses (Daily Target ≤ ₹{DAILY_TARGET_BUDGET})
              </p>
            </div>

            {/* Legend & Target Badge */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3.5 h-1 bg-emerald-500 rounded-full" />
                Daily Income
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-3.5 h-1 bg-rose-500 rounded-full" />
                Daily Expense
              </span>
              <span className="flex items-center gap-1.5 text-emerald-300/80">
                <span className="w-3.5 h-0.5 border-b-2 border-dashed border-emerald-400" />
                ₹{DAILY_TARGET_BUDGET} Target Limit
              </span>
            </div>
          </div>

          {trendPoints.length > 0 ? (
            <div className="relative w-full overflow-x-auto pt-2">
              {/* Tooltip Overlay */}
              {hoveredTrend && (
                <div
                  className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-950/95 border border-white/20 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs min-w-[170px]"
                  style={{
                    left: `${(hoveredTrend.x / trendSvgWidth) * 100}%`,
                    top: `${Math.max(15, hoveredTrend.y - 15)}px`,
                  }}
                >
                  <div className="font-bold text-white border-b border-white/10 pb-1 mb-1.5 flex items-center justify-between">
                    <span>{hoveredTrend.date}</span>
                    <span className="text-[10px] text-slate-400">Daily Log</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-emerald-400 font-mono font-bold">
                      <span className="text-[11px] font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Income:
                      </span>
                      <span>+{currencySymbol}{hoveredTrend.income.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center text-rose-400 font-mono font-bold">
                      <span className="text-[11px] font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500" /> Expense:
                      </span>
                      <span>-{currencySymbol}{hoveredTrend.expense.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center border-t border-white/10 pt-1 font-mono font-bold text-xs">
                      <span className="text-[10px] text-slate-300 font-normal">Net:</span>
                      <span className={hoveredTrend.income - hoveredTrend.expense >= 0 ? 'text-indigo-300' : 'text-rose-400'}>
                        {hoveredTrend.income - hoveredTrend.expense >= 0 ? '+' : ''}
                        {currencySymbol}{(hoveredTrend.income - hoveredTrend.expense).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-1.5 pt-1 border-t border-white/10">
                    {hoveredTrend.expense <= DAILY_TARGET_BUDGET ? (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Within Target (₹{DAILY_TARGET_BUDGET - hoveredTrend.expense} saved)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Over target by ₹{hoveredTrend.expense - DAILY_TARGET_BUDGET}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <svg viewBox={`0 0 ${trendSvgWidth} ${trendSvgHeight}`} className="w-full h-60 select-none">
                <defs>
                  {/* Expense Gradient */}
                  <linearGradient id="expenseTrendGradLow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Income Gradient */}
                  <linearGradient id="incomeTrendGradLow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Value Gridlines and Labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const val = Math.round(trendScaleMax * (1 - ratio));
                  const yPos = paddingTop + ratio * plotHeight;
                  return (
                    <g key={ratio}>
                      {/* Gridline */}
                      <line
                        x1={paddingLeft}
                        y1={yPos}
                        x2={trendSvgWidth - paddingRight}
                        y2={yPos}
                        stroke="rgba(255,255,255,0.08)"
                        strokeDasharray={ratio === 1 ? 'none' : '3 3'}
                      />
                      {/* Y-Axis Label */}
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
                  x2={trendSvgWidth - paddingRight}
                  y2={budgetLineY}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                />
                <text
                  x={trendSvgWidth - paddingRight - 4}
                  y={budgetLineY - 6}
                  textAnchor="end"
                  fontSize="9"
                  fill="#10b981"
                  fontWeight="bold"
                >
                  🎯 ₹{DAILY_TARGET_BUDGET} Daily Target
                </text>

                {/* Shaded Areas */}
                {incomeAreaPath && <path d={incomeAreaPath} fill="url(#incomeTrendGradLow)" />}
                {expenseAreaPath && <path d={expenseAreaPath} fill="url(#expenseTrendGradLow)" />}

                {/* Income Polyline Curve (Emerald Green) */}
                {trendPoints.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={incomePolylinePoints}
                    className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  />
                )}

                {/* Expense Polyline Curve (Rose Red) */}
                {trendPoints.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={expensePolylinePoints}
                    className="drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                  />
                )}

                {/* Interactive Node Circles for Each Day */}
                {trendPoints.map((p, i) => {
                  const cx = getTrendX(i);
                  const cyExpense = getTrendY(p.expense);
                  const cyIncome = getTrendY(p.income);
                  const isHovered = hoveredTrend?.date === p.date;
                  const isUnderBudget = p.expense <= DAILY_TARGET_BUDGET;

                  return (
                    <g
                      key={p.date}
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setHoveredTrend({
                          date: p.date,
                          expense: p.expense,
                          income: p.income,
                          x: cx,
                          y: Math.min(cyExpense, cyIncome),
                        })
                      }
                      onMouseLeave={() => setHoveredTrend(null)}
                    >
                      {/* Vertical line connecting the two nodes if different */}
                      {p.income > 0 && Math.abs(cyIncome - cyExpense) > 4 && (
                        <line
                          x1={cx}
                          y1={cyIncome}
                          x2={cx}
                          y2={cyExpense}
                          stroke="rgba(255,255,255,0.15)"
                          strokeDasharray="2 2"
                        />
                      )}

                      {/* Income Node (Green) */}
                      {p.income > 0 && (
                        <circle
                          cx={cx}
                          cy={cyIncome}
                          r={isHovered ? 6 : 4.5}
                          className="fill-emerald-400 stroke-slate-950 stroke-2 transition-all duration-150"
                        />
                      )}

                      {/* Expense Node (Red) */}
                      <circle
                        cx={cx}
                        cy={cyExpense}
                        r={isHovered ? 6 : 4.5}
                        className={`transition-all duration-150 ${
                          isUnderBudget
                            ? 'fill-rose-500 stroke-slate-950 stroke-2'
                            : 'fill-amber-400 stroke-slate-950 stroke-2'
                        }`}
                      />
                    </g>
                  );
                })}

                {/* X-Axis Dates */}
                {trendPoints.map((p, i) => {
                  if (trendPoints.length > 8 && i % 2 !== 0 && i !== trendPoints.length - 1) return null;
                  const cx = getTrendX(i);
                  return (
                    <text
                      key={`date-${p.date}`}
                      x={cx}
                      y={trendSvgHeight - 10}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#94a3b8"
                      fontFamily="monospace"
                    >
                      {p.date.slice(5)}
                    </text>
                  );
                })}
              </svg>

              {/* Bottom Quick Metric Highlights */}
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-3 border-t border-white/5 bg-slate-950/40 rounded-xl p-2.5 mt-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Avg Daily Expense</span>
                  <span className="font-mono font-bold text-rose-400">
                    ₹{Math.round(trendPoints.reduce((acc, p) => acc + p.expense, 0) / Math.max(1, trendPoints.length))}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Avg Daily Income</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ₹{Math.round(trendPoints.reduce((acc, p) => acc + p.income, 0) / Math.max(1, trendPoints.length))}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Daily Target Limit</span>
                  <span className="font-mono font-bold text-emerald-300">
                    ≤ ₹{DAILY_TARGET_BUDGET}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              No daily transactions available to plot line chart.
            </div>
          )}
        </div>
      )}

      {/* GRAPH 2 (NEW): DAILY EXPENSE BAR GAUGE VS ₹200 TARGET */}
      {(activeChartTab === 'all' || activeChartTab === 'daily_budget') && (
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-white/10 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Daily Spending vs ₹200 Target Limit (Bar Gauge)
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
        </div>
      )}

      {/* GRAPH 3: INTERACTIVE PIE / DONUT CHART FOR CATEGORY-WISE SPENDING */}
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

      {/* GRAPH 4: MONTHLY INFLOW VS OUTFLOW BAR CHART */}
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

      {/* GRAPH 5: CATEGORY HORIZONTAL COMPARISON BARS & PAYMENT METHOD METRICS */}
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

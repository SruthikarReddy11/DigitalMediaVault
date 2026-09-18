import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  PiggyBank,
  Calendar,
  Layers,
  Crown,
  Users,
  Activity,
  CheckCircle2,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  ExpenseAnalytics,
  MonthlyDataItem,
  PeakMonthAnalysis,
} from '../../services/expenseApi';

interface ExpenseAnalyticsDashboardProps {
  analytics: ExpenseAnalytics;
  onSelectMonth?: (monthKey: string) => void;
}

export const ExpenseAnalyticsDashboard: React.FC<ExpenseAnalyticsDashboardProps> = ({
  analytics,
  onSelectMonth,
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'monthly' | 'categories' | 'counterparties'>('overview');
  const [categoryViewType, setCategoryViewType] = useState<'outgoing' | 'incoming'>('outgoing');

  if (!analytics.hasData) {
    return (
      <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-white/10 text-slate-400">
        <Activity className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-50" />
        <h3 className="text-base font-semibold text-white">No Expense Data Yet</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Start recording transactions or use the "Load Demo Data" button above to immediately visualize your monthly analytics and peak spending insights.
        </p>
      </div>
    );
  }

  const { summary, monthlyData, categoryBreakdown, personBreakdown, peakMonthAnalysis } = analytics;
  const currencySymbol = '₹';

  // Calculate max monthly value for responsive bar scaling
  const maxMonthValue = Math.max(
    ...monthlyData.map((m) => Math.max(m.totalExpense, m.totalIncome)),
    1000
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/10">
          {[
            { id: 'overview', label: 'Financial Overview', icon: Activity },
            { id: 'monthly', label: 'Month-by-Month Analytics', icon: Calendar },
            { id: 'categories', label: 'Reason & Categories', icon: Layers },
            { id: 'counterparties', label: 'People / Payees', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedTab === tab.id
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

        <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Data Analyzed: {summary.totalTransactions} transactions across {monthlyData.length} months
        </div>
      </div>

      {/* Top Stat KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-emerald-500/20 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Incoming
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {currencySymbol}
            {summary.totalIncome.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <span>{summary.incomeCount} income credits</span>
          </div>
        </div>

        {/* Total Outflow */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-rose-500/20 shadow-lg relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Outgoing
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
            {currencySymbol}
            {summary.totalExpense.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <span>{summary.expenseCount} expenses paid</span>
          </div>
        </div>

        {/* Net Savings Balance */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-brand-500/20 shadow-lg relative overflow-hidden group hover:border-brand-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Net Savings Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-black font-mono ${
              summary.netBalance >= 0 ? 'text-indigo-400' : 'text-rose-400'
            }`}
          >
            {summary.netBalance >= 0 ? '+' : ''}
            {currencySymbol}
            {summary.netBalance.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <span>Savings Rate:</span>
            <span
              className={`font-bold ${
                summary.savingsRate >= 20
                  ? 'text-emerald-400'
                  : summary.savingsRate >= 0
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {summary.savingsRate}%
            </span>
          </div>
        </div>

        {/* Average Monthly Outflow */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 shadow-lg relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Monthly Avg Spend
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            {currencySymbol}
            {summary.averageMonthlyExpense.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Across active recorded months
          </div>
        </div>
      </div>

      {/* SPECIAL SECTION: "Which month expenses are more and why" - PEAK MONTH ALGORITHM CARD */}
      {peakMonthAnalysis && (
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-amber-500/30 p-5 md:p-6 shadow-2xl overflow-hidden">
          {/* Subtle glowing halo */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white tracking-wide">
                    Expense Spike Detection: Peak Month Analysis
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Algorithmic Diagnosis
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Automated statistical anomaly detection pinpointing which month had higher expenses and exactly why.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                +{peakMonthAnalysis.percentAboveAverage}% Above Average
              </span>
            </div>
          </div>

          {/* Peak Month Key Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
            {/* 1. Peak Month Name & Amount */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Highest Expense Month
              </span>
              <div className="text-lg font-bold text-white">
                {peakMonthAnalysis.peakMonthName}
              </div>
              <div className="text-2xl font-black font-mono text-rose-400 mt-1">
                {currencySymbol}
                {peakMonthAnalysis.totalExpense.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Normal Average: {currencySymbol}
                {peakMonthAnalysis.meanMonthlyExpense.toLocaleString('en-IN')}
              </div>
            </div>

            {/* 2. Top Contributing Reason / Driver */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Top Expense Driver Reason
              </span>
              {peakMonthAnalysis.topDriverCategories.length > 0 ? (
                <>
                  <div className="text-base font-bold text-amber-300 truncate">
                    {peakMonthAnalysis.topDriverCategories[0].category}
                  </div>
                  <div className="text-sm font-semibold text-white mt-1">
                    Spike: +{currencySymbol}
                    {peakMonthAnalysis.topDriverCategories[0].surplus.toLocaleString('en-IN')} over average
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    +{peakMonthAnalysis.topDriverCategories[0].percentageSurplus}% increase vs baseline
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400">Evenly distributed spending</div>
              )}
            </div>

            {/* 3. Largest Single Payment */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Largest Single Payment
              </span>
              {peakMonthAnalysis.largestExpense ? (
                <>
                  <div className="text-lg font-black font-mono text-white">
                    {currencySymbol}
                    {peakMonthAnalysis.largestExpense.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                    To: {peakMonthAnalysis.largestExpense.person}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    Reason: {peakMonthAnalysis.largestExpense.reason}
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400">No single outlier detected</div>
              )}
            </div>
          </div>

          {/* Diagnostic Narrative & Why Breakdown */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Why was this month higher? Root Cause Breakdown:
              </h4>
            </div>

            <ul className="space-y-2">
              {peakMonthAnalysis.diagnosticInsights.map((insight: string, idx: number) => (
                <li
                  key={idx}
                  className="text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
              <li className="text-xs text-indigo-300 flex items-start gap-2.5 leading-relaxed font-medium">
                <Info className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                <span>
                  Spending Profile: <strong>{peakMonthAnalysis.spendDriverStyle.replace(/_/g, ' ')}</strong>. {peakMonthAnalysis.spendDriverExplanation}
                </span>
              </li>
            </ul>

            {/* Drivers Waterfall / Bars */}
            {peakMonthAnalysis.topDriverCategories.length > 0 && (
              <div className="pt-2 border-t border-white/5 mt-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Excess Spend Contributions by Category:
                </p>
                <div className="space-y-2">
                  {peakMonthAnalysis.topDriverCategories.map((cat: any) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-300">{cat.category}</span>
                        <span className="font-mono text-slate-400">
                          +{currencySymbol}{cat.surplus.toLocaleString('en-IN')} (+{cat.percentageSurplus}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(10, cat.contributionToExcessPct))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Tab Views */}

      {/* TAB 1: FINANCIAL OVERVIEW & MONTHLY BARS */}
      {(selectedTab === 'overview' || selectedTab === 'monthly') && (
        <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-5 md:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-white">
                Monthly Inflow vs Outflow Comparison
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Side-by-side visualization of incoming earnings vs outgoing spending over time
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                Incoming (Income)
              </div>
              <div className="flex items-center gap-1.5 text-rose-400">
                <span className="w-3 h-3 rounded bg-rose-500" />
                Outgoing (Expenses)
              </div>
            </div>
          </div>

          {/* Responsive Bar Chart */}
          <div className="space-y-4 pt-2">
            {monthlyData.map((m) => {
              const isPeak = peakMonthAnalysis?.peakMonthKey === m.key;
              const expensePercent = Math.min(100, (m.totalExpense / maxMonthValue) * 100);
              const incomePercent = Math.min(100, (m.totalIncome / maxMonthValue) * 100);

              return (
                <div
                  key={m.key}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isPeak
                      ? 'bg-amber-500/5 border-amber-500/40 shadow-md'
                      : 'bg-slate-950/40 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {m.monthName}
                      </span>
                      {isPeak && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <Crown className="w-3 h-3 text-amber-400" />
                          Peak Spend Month
                        </span>
                      )}
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

                  {/* Dual Bars Container */}
                  <div className="space-y-1.5">
                    {/* Income Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(1, incomePercent)}%` }}
                        title={`Incoming: ₹${m.totalIncome}`}
                      />
                    </div>
                    {/* Expense Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPeak ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(1, expensePercent)}%` }}
                        title={`Outgoing: ₹${m.totalExpense}`}
                      />
                    </div>
                  </div>

                  {/* Bottom Highlights */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <div>
                      {m.topCategory && (
                        <span>
                          Top Category: <strong className="text-slate-300">{m.topCategory.name}</strong> ({currencySymbol}{m.topCategory.amount.toLocaleString('en-IN')})
                        </span>
                      )}
                    </div>
                    <div>
                      {m.topPerson && (
                        <span>
                          Top Payee: <strong className="text-slate-300">{m.topPerson.name}</strong> ({currencySymbol}{m.topPerson.amount.toLocaleString('en-IN')})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES & REASONS */}
      {selectedTab === 'categories' && (
        <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-5 md:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Expense Reasons & Categories Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Analyze where your money is going and what primary reasons dominate your budget
              </p>
            </div>

            {/* Toggle incoming / outgoing */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCategoryViewType('outgoing')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  categoryViewType === 'outgoing'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Outgoing Reasons
              </button>
              <button
                type="button"
                onClick={() => setCategoryViewType('incoming')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  categoryViewType === 'incoming'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Incoming Sources
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(categoryViewType === 'outgoing'
              ? categoryBreakdown.outgoing
              : categoryBreakdown.incoming
            ).map((cat, idx) => (
              <div
                key={cat.category}
                className="p-4 rounded-xl bg-slate-950/60 border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {cat.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-white">
                      {currencySymbol}
                      {cat.totalAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-bold text-slate-400 ml-2">
                      ({cat.percentageOfTotal}%)
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden my-2">
                  <div
                    className={`h-full rounded-full ${
                      categoryViewType === 'outgoing'
                        ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}
                    style={{ width: `${Math.max(2, cat.percentageOfTotal)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{cat.count} recorded transaction{cat.count > 1 ? 's' : ''}</span>
                  <span>Avg: {currencySymbol}{cat.averagePerTx.toLocaleString('en-IN')} per entry</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: COUNTERPARTIES (PEOPLE) */}
      {selectedTab === 'counterparties' && (
        <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-5 md:p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">
              Counterparty & Person Analysis
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown of top entities, friends, landlords, and merchants paid to or received from
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Payees */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-rose-500/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Top Payees (Most Outflow)
              </h4>
              <div className="space-y-3">
                {personBreakdown.topPayees.map((p, idx) => (
                  <div
                    key={p.person}
                    className="flex items-center justify-between pb-2 border-b border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded text-[10px] font-mono flex items-center justify-center bg-white/5 text-slate-400">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-200">{p.person}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-white">
                        {currencySymbol}{p.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.count} tx ({p.percentage}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Payers */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                <ArrowDownLeft className="w-3.5 h-3.5" />
                Top Payers (Most Inflow)
              </h4>
              <div className="space-y-3">
                {personBreakdown.topPayers.map((p, idx) => (
                  <div
                    key={p.person}
                    className="flex items-center justify-between pb-2 border-b border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded text-[10px] font-mono flex items-center justify-center bg-white/5 text-slate-400">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-200">{p.person}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-white">
                        {currencySymbol}{p.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.count} tx ({p.percentage}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

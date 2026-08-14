import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/debtSimplification';
import { 
  Sparkles, TrendingUp, DollarSign, PieChart, ShieldAlert, 
  Lightbulb, RefreshCw, Award, ArrowUpRight, CheckCircle2 
} from 'lucide-react';

export const AIInsightsView: React.FC = () => {
  const { activeGroup, expenses, debtResult, members, addToast } = useApp();

  const [insights, setInsights] = useState<{
    summary: string;
    keyObservations: string[];
    savingsTips: string[];
    topSpenders: { name: string; amount: number }[];
    categoryBreakdown: { category: string; amount: number; percentage: number }[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeGroup && expenses.length > 0) {
      loadInsights();
    }
  }, [activeGroup?.id, expenses.length]);

  const loadInsights = async () => {
    if (!activeGroup) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/spending-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: activeGroup.id,
          expenses,
          groupName: activeGroup.name,
          members: activeGroup.members,
        }),
      });

      const data = await res.json();
      if (data.insights) {
        setInsights(data.insights);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load AI spending insights', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeGroup) return null;

  const currency = activeGroup.currency || 'USD';
  const totalSpend = debtResult.totalGroupSpend;

  // Calculate local category breakdown for instant visuals
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const sortedCategories = Object.entries(categoryTotals)
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      pct: totalSpend > 0 ? Math.round((amt / totalSpend) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-5">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/60 border border-purple-500/30 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-md bg-purple-500/20 text-purple-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-base text-white">
                AI Spending Intelligence & Budget Optimization
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Gemini 3.7 Flash
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Deep spending velocity analysis, category leakage detection, and group savings recommendations.
            </p>
          </div>

          <button
            onClick={loadInsights}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : 'Refresh AI Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Category Breakdown & Top Payer Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Category Breakdown Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <span>Category Spending Distribution</span>
          </h4>
          <p className="text-xs text-slate-400 mb-4">Total group outflow by consumption category.</p>

          <div className="space-y-3">
            {sortedCategories.map(cat => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-200">{cat.category}</span>
                  <span className="text-slate-400 font-mono">
                    {formatCurrency(cat.amount, currency)} ({cat.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Member Capital Contribution Board */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Capital Outflow by Member</span>
          </h4>
          <p className="text-xs text-slate-400 mb-4">Who has covered upfront expenses for the group.</p>

          <div className="space-y-2.5">
            {activeGroup.members.map(member => {
              const bal = debtResult?.memberBalances?.[member.id] || { paidTotal: 0 };
              const paidPct = totalSpend > 0 ? Math.round((bal.paidTotal / totalSpend) * 100) : 0;

              return (
                <div key={member.id} className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={member.avatar} alt={member.name} className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold text-white">{member.name}</p>
                      <p className="text-[10px] text-slate-400">{paidPct}% of group bills</p>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-emerald-400">
                    {formatCurrency(bal.paidTotal, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* AI Key Insights & Actionable Savings Recommendations */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          <span>Gemini AI Group Recommendations</span>
        </h4>

        {isLoading ? (
          <div className="py-8 text-center animate-pulse">
            <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Generating contextual group recommendations...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights?.summary && (
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-slate-200 leading-relaxed">
                <strong className="text-indigo-300 block mb-1">Executive Summary:</strong>
                {insights.summary}
              </div>
            )}

            {insights?.keyObservations && insights.keyObservations.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-300">Key Observations:</p>
                {insights.keyObservations.map((obs, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{obs}</span>
                  </div>
                ))}
              </div>
            )}

            {insights?.savingsTips && insights.savingsTips.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-300">Actionable Money-Saving Suggestions:</p>
                {insights.savingsTips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-emerald-300 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

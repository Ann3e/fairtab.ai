import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatCurrency } from '../utils/debtSimplification.js';
import { 
  TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, 
  Copy, Wallet, ShieldAlert, Sparkles 
} from 'lucide-react';

export const BalanceSummaryCards = () => {
  const { 
    activeGroup, 
    currentUser, 
    debtResult, 
    expenses, 
    openSettleModal, 
    addToast
  } = useApp();

  if (!activeGroup) return null;

  const currentBalance = currentUser?.id && debtResult?.memberBalances?.[currentUser.id]?.netBalance 
    ? debtResult.memberBalances[currentUser.id].netBalance 
    : 0;
  const isOwed = currentBalance > 0.01;
  const owes = currentBalance < -0.01;
  const isSettled = Math.abs(currentBalance) <= 0.01;

  const currency = activeGroup.currency || 'USD';
  const totalSpend = debtResult?.totalGroupSpend || 0;
  const budgetLimit = activeGroup.budgetLimit;
  const budgetPercent = budgetLimit ? Math.min(Math.round((totalSpend / budgetLimit) * 100), 100) : 0;
  const isBudgetWarning = budgetLimit && totalSpend >= budgetLimit * 0.8 && totalSpend <= budgetLimit;
  const isOverBudget = budgetLimit && totalSpend > budgetLimit;

  // Find who current user owes or who owes current user in simplified debts
  const simplifiedDebtsList = debtResult?.simplifiedDebts || [];
  const debtsUserOwes = currentUser?.id ? simplifiedDebtsList.filter(d => d.from === currentUser.id) : [];
  const debtsOwedToUser = currentUser?.id ? simplifiedDebtsList.filter(d => d.to === currentUser.id) : [];

  const copyInviteCode = () => {
    if (activeGroup?.inviteCode) {
      navigator.clipboard.writeText(activeGroup.inviteCode);
      addToast(`Invite code ${activeGroup.inviteCode} copied!`, 'info');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      {/* 1. Personalized Balance Card */}
      <div className={`rounded-2xl p-5 border shadow-sm relative overflow-hidden transition ${
        isOwed 
          ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/30' 
          : owes 
          ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/30'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Your Personal Balance
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">{currentUser.name.split(' ')[0]}</span>
            <img src={currentUser.avatar} alt={currentUser.name} className="w-5 h-5 rounded-full object-cover" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          {isOwed && (
            <span className="text-3xl font-extrabold text-emerald-400">
              +{formatCurrency(currentBalance, currency)}
            </span>
          )}
          {owes && (
            <span className="text-3xl font-extrabold text-amber-400">
              -{formatCurrency(Math.abs(currentBalance), currency)}
            </span>
          )}
          {isSettled && (
            <span className="text-3xl font-extrabold text-slate-200">
              $0.00
            </span>
          )}
        </div>

        <div className="text-xs text-slate-400 mb-4 min-h-[20px]">
          {isOwed && (
            <p className="flex items-center gap-1 text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              You get back in total from {debtsOwedToUser.length} member{debtsOwedToUser.length !== 1 ? 's' : ''}
            </p>
          )}
          {owes && (
            <p className="flex items-center gap-1 text-amber-400 font-medium">
              <TrendingDown className="w-3.5 h-3.5" />
              You owe across {debtsUserOwes.length} transfer{debtsUserOwes.length !== 1 ? 's' : ''}
            </p>
          )}
          {isSettled && (
            <p className="flex items-center gap-1 text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              You are completely settled up in this group!
            </p>
          )}
        </div>

        {/* Quick Settle CTA */}
        {owes && debtsUserOwes.length > 0 && (
          <button
            onClick={() => openSettleModal(debtsUserOwes[0].to, debtsUserOwes[0].amount)}
            className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5" />
            Settle Up {formatCurrency(debtsUserOwes[0].amount, currency)} Now
          </button>
        )}

        {isOwed && (
          <div className="text-[11px] text-slate-400 bg-slate-800/60 rounded-lg p-2 border border-slate-700/50 flex items-center justify-between">
            <span>Simplified debt engine active</span>
            <span className="text-emerald-400 font-semibold">Min-Flow Enabled</span>
          </div>
        )}
      </div>

      {/* 2. Group Total Spend Card */}
      <div className="rounded-2xl p-5 bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Group Spend
            </span>
            <span className="text-xs text-indigo-400 bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
              {expenses ? expenses.length : 0} Expenses
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white mb-2">
            {formatCurrency(totalSpend, currency)}
          </div>
          <p className="text-xs text-slate-400">
            Shared across {activeGroup.members.length} members ({activeGroup.members.map(m => m.name.split(' ')[0]).join(', ')})
          </p>
        </div>

        <div className="pt-3 border-t border-slate-800/80 mt-2 flex items-center justify-between text-xs">
          <div className="flex -space-x-1.5">
            {activeGroup.members.slice(0, 4).map(m => (
              <img key={m.id} src={m.avatar} alt={m.name} className="w-6 h-6 rounded-full border border-slate-900 object-cover" />
            ))}
          </div>
          <button 
            onClick={copyInviteCode}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition font-mono bg-slate-800/80 px-2 py-1 rounded-md text-[11px]"
            title="Click to copy invite code"
          >
            <Copy className="w-3 h-3" />
            <span>{activeGroup.inviteCode}</span>
          </button>
        </div>
      </div>

      {/* 3. Budget Limit & Health Card */}
      <div className={`rounded-2xl p-5 border shadow-sm flex flex-col justify-between ${
        isOverBudget 
          ? 'bg-rose-950/30 border-rose-500/40' 
          : isBudgetWarning 
          ? 'bg-amber-950/30 border-amber-500/40' 
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Trip Budget Cap
            </span>
            {isOverBudget ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded-full border border-rose-500/30">
                <ShieldAlert className="w-3 h-3" /> Exceeded!
              </span>
            ) : isBudgetWarning ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-500/30">
                <AlertTriangle className="w-3 h-3" /> 80% Spent
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Healthy Pace
              </span>
            )}
          </div>

          <div className="text-2xl font-bold text-white mb-1">
            {budgetLimit ? formatCurrency(budgetLimit, currency) : 'No Cap Set'}
          </div>

          {budgetLimit && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{budgetPercent}% used</span>
                <span>{formatCurrency(Math.max(0, budgetLimit - totalSpend), currency)} remaining</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverBudget ? 'bg-rose-500' : isBudgetWarning ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
          <span>AI Category Optimizer</span>
          <span className="text-indigo-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Auto-Categorized
          </span>
        </div>
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/debtSimplification';
import { 
  ArrowRight, Sparkles, Zap, Bell, Wallet, CheckCircle, 
  RotateCcw, ShieldCheck, HelpCircle, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';

export const DebtSimplificationView: React.FC = () => {
  const { 
    debtResult, 
    activeGroup, 
    members, 
    currentUser, 
    openSettleModal, 
    openReminderModal,
    settlements 
  } = useApp();

  const [useSimplified, setUseSimplified] = useState(true);

  if (!activeGroup) return null;

  const currency = activeGroup.currency || 'USD';
  const rawDebts = debtResult?.rawDebts || [];
  const simplifiedDebts = debtResult?.simplifiedDebts || [];
  const displayedDebts = useSimplified ? simplifiedDebts : rawDebts;
  const rawCount = rawDebts.length;
  const simplifiedCount = simplifiedDebts.length;
  const savedCount = Math.max(0, rawCount - simplifiedCount);

  return (
    <div className="space-y-6">
      
      {/* 1. Debt Simplification Engine Banner & Switcher */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-emerald-950/50 border border-indigo-500/30 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-md bg-indigo-500/20 text-indigo-400">
                <Zap className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-base text-white">
                Minimum-Cash-Flow Debt Simplification Engine
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Greedy matching collapses circular pairwise debts so members don't pass cash back and forth. 
              {savedCount > 0 ? (
                <span className="text-emerald-400 font-semibold ml-1">
                  Eliminated {savedCount} redundant transaction{savedCount > 1 ? 's' : ''}!
                </span>
              ) : (
                <span className="text-slate-400 ml-1">Balances are already in minimal form.</span>
              )}
            </p>
          </div>

          {/* Toggle pill */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
            <button
              onClick={() => setUseSimplified(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                useSimplified ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simplified Flow ({simplifiedCount})</span>
            </button>
            <button
              onClick={() => setUseSimplified(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                !useSimplified ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Raw Pairwise ({rawCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Settle Up Action Flow Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h4 className="text-sm font-bold text-slate-200 mb-1 flex items-center justify-between">
          <span>{useSimplified ? 'Suggested Settlement Transactions' : 'All Pairwise Balances'}</span>
          <span className="text-xs font-normal text-slate-400">{displayedDebts.length} pending transfers</span>
        </h4>
        <p className="text-xs text-slate-400 mb-4">
          Click "Settle Up" to record payment via UPI QR code, PayPal, or Cash. Or send an AI reminder.
        </p>

        {displayedDebts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">All balances are completely settled!</p>
            <p className="text-xs text-slate-400 mt-1">No pending debts found for this group.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {displayedDebts.map((debt, index) => {
              const fromUser = members.find(m => m.id === debt.from);
              const toUser = members.find(m => m.id === debt.to);
              const isCurrentUserDebtor = debt.from === currentUser.id;
              const isCurrentUserCreditor = debt.to === currentUser.id;

              return (
                <div
                  key={`${debt.from}-${debt.to}-${index}`}
                  className={`p-4 rounded-xl border transition ${
                    isCurrentUserDebtor
                      ? 'bg-amber-950/20 border-amber-500/40 shadow-xs'
                      : isCurrentUserCreditor
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-xs'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    
                    {/* Debtor info */}
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={fromUser?.avatar} alt={fromUser?.name} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{fromUser?.name}</p>
                        <p className="text-[10px] text-amber-400 font-medium">{isCurrentUserDebtor ? 'You owe' : 'Owes'}</p>
                      </div>
                    </div>

                    {/* Arrow & Amount */}
                    <div className="flex flex-col items-center shrink-0 px-2">
                      <span className="text-base font-extrabold text-white">
                        {formatCurrency(debt.amount, currency)}
                      </span>
                      <div className="flex items-center text-slate-400 text-[10px]">
                        <div className="w-6 h-[1px] bg-slate-700"></div>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                    </div>

                    {/* Creditor info */}
                    <div className="flex items-center gap-2 min-w-0 text-right justify-end">
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{toUser?.name}</p>
                        <p className="text-[10px] text-emerald-400 font-medium">{isCurrentUserCreditor ? 'Gets back' : 'Receives'}</p>
                      </div>
                      <img src={toUser?.avatar} alt={toUser?.name} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                    </div>

                  </div>

                  {/* Actions for this transaction */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                    {toUser?.upiId ? (
                      <span className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">
                        UPI: {toUser.upiId}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Direct Settlement</span>
                    )}

                    <div className="flex items-center gap-2">
                      {/* Reminder CTA (if current user is owed) */}
                      {isCurrentUserCreditor && (
                        <button
                          onClick={() => openReminderModal(debt.from, debt.amount)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Generate AI-crafted payment reminder"
                        >
                          <Bell className="w-3 h-3" />
                          <span>AI Reminder</span>
                        </button>
                      )}

                      {/* Settle Up CTA */}
                      <button
                        onClick={() => openSettleModal(debt.to, debt.amount)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                          isCurrentUserDebtor
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
                            : 'bg-slate-700 hover:bg-slate-600 text-white'
                        }`}
                      >
                        <Wallet className="w-3 h-3" />
                        <span>Settle Up</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Individual Net Balance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h4 className="text-sm font-bold text-slate-200 mb-1">
          Individual Member Balance Summary
        </h4>
        <p className="text-xs text-slate-400 mb-4">
          Calculated using relational aggregation of total paid minus total consumption shares.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {activeGroup.members.map(member => {
            const bal = debtResult?.memberBalances?.[member.id] || { paidTotal: 0, owedTotal: 0, netBalance: 0 };
            const isPos = bal.netBalance > 0.01;
            const isNeg = bal.netBalance < -0.01;

            return (
              <div 
                key={member.id}
                className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{member.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{member.upiId || member.email}</p>
                  </div>
                </div>

                <div className="space-y-1 text-xs mb-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Paid:</span>
                    <span className="text-slate-200 font-medium">{formatCurrency(bal.paidTotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Share:</span>
                    <span className="text-slate-200 font-medium">{formatCurrency(bal.owedTotal, currency)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/50 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Net:</span>
                  <span className={`font-extrabold ${
                    isPos ? 'text-emerald-400' : isNeg ? 'text-amber-400' : 'text-slate-300'
                  }`}>
                    {isPos ? '+' : isNeg ? '-' : ''}{formatCurrency(Math.abs(bal.netBalance), currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Settlement History Ledger */}
      {settlements.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <h4 className="text-sm font-bold text-slate-200 mb-1 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Settlement & Repayment History
          </h4>
          <p className="text-xs text-slate-400 mb-3">
            Real-world payments verified and recorded in the immutable group ledger.
          </p>

          <div className="space-y-2">
            {settlements.map(s => {
              const fromUser = members.find(m => m.id === s.fromMemberId);
              const toUser = members.find(m => m.id === s.toMemberId);

              return (
                <div 
                  key={s.id}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      ✓
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">
                        {fromUser?.name} paid {toUser?.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {s.date} · {s.paymentMethod?.toUpperCase()} {s.referenceId ? `(${s.referenceId})` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-sm text-emerald-400">
                      {formatCurrency(s.amount, s.currency || currency)}
                    </span>
                    <p className="text-[10px] text-slate-400">Completed</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

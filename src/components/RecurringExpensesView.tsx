import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/debtSimplification';
import { 
  Repeat, Calendar, Play, Plus, Check, Zap, 
  Clock, ShieldCheck, AlertCircle, X, Sparkles 
} from 'lucide-react';
import { ExpenseCategory } from '../types';

export const RecurringExpensesView: React.FC = () => {
  const { 
    recurringRules, 
    activeGroup, 
    members, 
    currentUser, 
    addRecurringRule, 
    triggerRecurringRule, 
    addToast 
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Utilities & Bills');
  const [interval, setInterval] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [nextDueDate, setNextDueDate] = useState('2026-09-01');
  const [autoApprove, setAutoApprove] = useState(true);

  if (!activeGroup) return null;

  const currency = activeGroup.currency || 'USD';

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || parseFloat(amount) <= 0) {
      addToast('Please provide a title and valid amount', 'error');
      return;
    }

    const numAmount = parseFloat(amount);
    const perPerson = Math.round((numAmount / activeGroup.members.length) * 100) / 100;
    const splits = activeGroup.members.map(m => ({ memberId: m.id, amount: perPerson }));

    const created = await addRecurringRule({
      title: title.trim(),
      amount: numAmount,
      currency,
      category,
      paidById: currentUser.id,
      splitType: 'equal',
      splits,
      interval,
      nextDueDate,
      autoApprove,
      active: true,
    });

    if (created) {
      setIsAddModalOpen(false);
      setTitle('');
      setAmount('');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Repeat className="w-5 h-5 text-indigo-400" />
            <span>Recurring & Scheduled Bills</span>
            <span className="text-xs bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full font-medium border border-indigo-500/30">
              {recurringRules.length} Active Rules
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-log rent, internet, streaming subscriptions, and recurring bills on fixed cycles.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Recurring Bill</span>
        </button>
      </div>

      {/* Rules list */}
      {recurringRules.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl">
          <Repeat className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white">No recurring rules configured</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Set up automatic schedules for monthly rent, WiFi utilities, or Netflix shared subscriptions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recurringRules.map(rule => {
            const payer = members.find(m => m.id === rule.paidById);

            return (
              <div
                key={rule.id}
                className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/70 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">{rule.title}</h4>
                      <p className="text-xs text-slate-400 capitalize">{rule.category} · {rule.interval} cycle</p>
                    </div>
                    <span className="text-base font-extrabold text-white">
                      {formatCurrency(rule.amount, rule.currency || currency)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Next Due: <strong className="text-slate-200">{rule.nextDueDate}</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <img src={payer?.avatar} alt={payer?.name} className="w-4 h-4 rounded-full object-cover" />
                      <span>Paid by {payer?.name.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 text-xs">
                  <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                    rule.autoApprove ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {rule.autoApprove ? 'Auto-logs on cycle' : 'Requires confirmation'}
                  </span>

                  <button
                    onClick={() => triggerRecurringRule(rule.id)}
                    className="px-3 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                    title="Simulate scheduled billing cycle right now"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Trigger Now</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add Recurring Rule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Set Up Recurring Bill</h3>
            <p className="text-xs text-slate-400 mb-4">Configure fixed cycle billing for {activeGroup.name}</p>

            <form onSubmit={handleCreateRule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bill Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Monthly Rent, WiFi, Netflix"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Interval</label>
                  <select
                    value={interval}
                    onChange={e => setInterval(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">First Scheduled Date</label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={e => setNextDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="auto-appr-cb"
                  checked={autoApprove}
                  onChange={e => setAutoApprove(e.target.checked)}
                  className="rounded-md bg-slate-900 border-slate-700 text-indigo-600"
                />
                <label htmlFor="auto-appr-cb" className="text-xs text-slate-300">
                  Auto-finalize without manual group re-confirmation
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ExpenseCategory, SplitType } from '../types';
import { formatCurrency } from '../utils/debtSimplification';
import { 
  Plus, X, Check, DollarSign, Calendar, Tag, 
  Users, Percent, Calculator, Sparkles, Repeat, AlertCircle 
} from 'lucide-react';

export const ExpenseModal: React.FC = () => {
  const { 
    isExpenseModalOpen, 
    setIsExpenseModalOpen, 
    activeGroup, 
    currentUser, 
    addExpense, 
    addToast 
  } = useApp();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Dining');
  const [paidById, setPaidById] = useState(currentUser.id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [notes, setNotes] = useState('');
  const [tax, setTax] = useState('');
  const [tip, setTip] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Custom split values per member
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activeGroup?.members) {
      const allIds = activeGroup.members.map(m => m.id);
      setSelectedMemberIds(allIds);
      setPaidById(currentUser.id);

      // default percentages
      const equalPct = Math.floor(100 / allIds.length);
      const newPcts: Record<string, string> = {};
      allIds.forEach((id, idx) => {
        newPcts[id] = idx === 0 ? (100 - equalPct * (allIds.length - 1)).toString() : equalPct.toString();
      });
      setPercentages(newPcts);
    }
  }, [activeGroup, currentUser.id, isExpenseModalOpen]);

  if (!isExpenseModalOpen || !activeGroup) return null;

  const currency = activeGroup.currency || 'USD';
  const totalAmount = (parseFloat(amount) || 0) + (parseFloat(tax) || 0) + (parseFloat(tip) || 0);

  // Toggle member participation in equal split
  const toggleMember = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
      if (selectedMemberIds.length > 1) {
        setSelectedMemberIds(selectedMemberIds.filter(id => id !== memberId));
      }
    } else {
      setSelectedMemberIds([...selectedMemberIds, memberId]);
    }
  };

  // Validation calculations for exact & percentage splits
  let splitSum = 0;
  let percentSum = 0;

  if (splitType === 'exact') {
    selectedMemberIds.forEach(id => {
      splitSum += parseFloat(exactAmounts[id]) || 0;
    });
  } else if (splitType === 'percentage') {
    selectedMemberIds.forEach(id => {
      percentSum += parseFloat(percentages[id]) || 0;
    });
  }

  const isExactValid = Math.abs(splitSum - totalAmount) < 0.05;
  const isPercentValid = Math.abs(percentSum - 100) < 0.1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || totalAmount <= 0) {
      addToast('Please provide a title and valid amount', 'error');
      return;
    }

    if (splitType === 'exact' && !isExactValid) {
      addToast(`Exact splits ($${splitSum.toFixed(2)}) must equal total ($${totalAmount.toFixed(2)})`, 'error');
      return;
    }

    if (splitType === 'percentage' && !isPercentValid) {
      addToast(`Percentages (${percentSum}%) must sum to exactly 100%`, 'error');
      return;
    }

    // Build splits array
    let splits: any[] = [];
    if (splitType === 'equal') {
      const perPerson = Math.round((totalAmount / selectedMemberIds.length) * 100) / 100;
      splits = selectedMemberIds.map((id, idx) => ({
        memberId: id,
        amount: idx === 0 
          ? Math.round((totalAmount - (perPerson * (selectedMemberIds.length - 1))) * 100) / 100 
          : perPerson,
      }));
    } else if (splitType === 'exact') {
      splits = selectedMemberIds.map(id => ({
        memberId: id,
        amount: parseFloat(exactAmounts[id]) || 0,
      }));
    } else if (splitType === 'percentage') {
      splits = selectedMemberIds.map(id => {
        const pct = parseFloat(percentages[id]) || 0;
        return {
          memberId: id,
          percentage: pct,
          amount: Math.round(((pct / 100) * totalAmount) * 100) / 100,
        };
      });
    }

    const created = await addExpense({
      title: title.trim(),
      amount: totalAmount,
      currency,
      category,
      paidById,
      date,
      splitType,
      splits,
      tax: tax ? parseFloat(tax) : undefined,
      tip: tip ? parseFloat(tip) : undefined,
      notes: notes.trim() || undefined,
      isRecurring,
      recurringInterval: isRecurring ? recurringInterval : undefined,
    });

    if (created) {
      setIsExpenseModalOpen(false);
      setTitle('');
      setAmount('');
      setTax('');
      setTip('');
      setNotes('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={() => setIsExpenseModalOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Log Shared Expense
            </h3>
            <p className="text-xs text-slate-400">
              Record expense in {activeGroup.name} with custom, equal, or percentage splitting.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Title & Amount Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Title / Merchant *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Dinner, Airbnb, Ski Passes, Groceries"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white font-medium focus:outline-hidden focus:border-indigo-500"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-base font-extrabold text-white focus:outline-hidden focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Payer & Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Paid By</label>
              <select
                value={paidById}
                onChange={e => setPaidById(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              >
                {activeGroup.members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.id === currentUser.id ? `You (${m.name})` : m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              >
                <option value="Food & Dining">Food & Dining</option>
                <option value="Groceries">Groceries</option>
                <option value="Rent & Housing">Rent & Housing</option>
                <option value="Travel & Flights">Travel & Flights</option>
                <option value="Transport & Taxi">Transport & Taxi</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Utilities & Bills">Utilities & Bills</option>
                <option value="Shopping">Shopping</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              />
            </div>
          </div>

          {/* Optional Tax & Tip */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Sales Tax ($)</label>
              <input
                type="number"
                step="0.01"
                value={tax}
                onChange={e => setTax(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tip ($)</label>
              <input
                type="number"
                step="0.01"
                value={tip}
                onChange={e => setTip(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
              />
            </div>
          </div>

          {/* Split Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Split Strategy</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSplitType('equal')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  splitType === 'equal'
                    ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Split Equally</span>
              </button>

              <button
                type="button"
                onClick={() => setSplitType('exact')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  splitType === 'exact'
                    ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Exact Amounts</span>
              </button>

              <button
                type="button"
                onClick={() => setSplitType('percentage')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  splitType === 'percentage'
                    ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>By Percentage</span>
              </button>
            </div>
          </div>

          {/* Dynamic Splitting Grid */}
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-1 border-b border-slate-800">
              <span>Member Shares</span>
              {splitType === 'exact' && (
                <span className={isExactValid ? 'text-emerald-400' : 'text-amber-400'}>
                  Total: {formatCurrency(splitSum, currency)} / {formatCurrency(totalAmount, currency)}
                </span>
              )}
              {splitType === 'percentage' && (
                <span className={isPercentValid ? 'text-emerald-400' : 'text-amber-400'}>
                  Total: {percentSum}% / 100%
                </span>
              )}
            </div>

            <div className="space-y-2">
              {activeGroup.members.map(member => {
                const isSelected = selectedMemberIds.includes(member.id);
                const equalShare = selectedMemberIds.length > 0 ? totalAmount / selectedMemberIds.length : 0;

                return (
                  <div key={member.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMember(member.id)}
                        className="rounded-md bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <img src={member.avatar} alt={member.name} className="w-6 h-6 rounded-full object-cover" />
                      <span className={`font-medium ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                        {member.name}
                      </span>
                    </div>

                    {/* Input based on split type */}
                    {isSelected && (
                      <div className="flex items-center gap-1.5">
                        {splitType === 'equal' && (
                          <span className="font-bold text-slate-200">
                            {formatCurrency(equalShare, currency)}
                          </span>
                        )}

                        {splitType === 'exact' && (
                          <input
                            type="number"
                            step="0.01"
                            value={exactAmounts[member.id] || ''}
                            onChange={e => setExactAmounts({ ...exactAmounts, [member.id]: e.target.value })}
                            placeholder="0.00"
                            className="w-24 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-right text-xs text-white font-bold"
                          />
                        )}

                        {splitType === 'percentage' && (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="1"
                              value={percentages[member.id] || ''}
                              onChange={e => setPercentages({ ...percentages, [member.id]: e.target.value })}
                              className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-right text-xs text-white font-bold"
                            />
                            <span className="text-slate-400">%</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recurring Schedule Checkbox */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring-checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                className="rounded-md bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
              />
              <label htmlFor="recurring-checkbox" className="font-semibold text-slate-300 flex items-center gap-1 cursor-pointer">
                <Repeat className="w-3.5 h-3.5 text-indigo-400" />
                Make this a recurring scheduled bill
              </label>
            </div>

            {isRecurring && (
              <select
                value={recurringInterval}
                onChange={e => setRecurringInterval(e.target.value as any)}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
              >
                <option value="monthly">Monthly Cycle</option>
                <option value="weekly">Weekly Cycle</option>
                <option value="daily">Daily Cycle</option>
                <option value="yearly">Yearly Cycle</option>
              </select>
            )}
          </div>

          {/* Notes input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Description</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Booking confirmation HM9201, dinner with drinks"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Log Expense of {formatCurrency(totalAmount, currency)}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

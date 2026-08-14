import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense, ExpenseCategory } from '../types';
import { formatCurrency } from '../utils/debtSimplification';
import { 
  Search, Filter, Plus, Receipt, AlertCircle, Trash2, 
  ChevronDown, ChevronUp, MessageSquareWarning, Sparkles,
  Utensils, ShoppingCart, Home, Plane, Car, Film, Zap, ShoppingBag, HeartPulse, HelpCircle
} from 'lucide-react';

const categoryIconMap: Record<string, React.ReactNode> = {
  'Food & Dining': <Utensils className="w-4 h-4 text-orange-400" />,
  'Groceries': <ShoppingCart className="w-4 h-4 text-emerald-400" />,
  'Rent & Housing': <Home className="w-4 h-4 text-blue-400" />,
  'Travel & Flights': <Plane className="w-4 h-4 text-indigo-400" />,
  'Transport & Taxi': <Car className="w-4 h-4 text-amber-400" />,
  'Entertainment': <Film className="w-4 h-4 text-pink-400" />,
  'Utilities & Bills': <Zap className="w-4 h-4 text-yellow-400" />,
  'Shopping': <ShoppingBag className="w-4 h-4 text-purple-400" />,
  'Health': <HeartPulse className="w-4 h-4 text-rose-400" />,
  'Other': <HelpCircle className="w-4 h-4 text-slate-400" />,
};

export const ExpenseList: React.FC = () => {
  const { 
    expenses, 
    activeGroup, 
    members, 
    currentUser, 
    deleteExpense, 
    createDispute, 
    setIsExpenseModalOpen,
    setIsVoiceModalOpen,
    setIsReceiptModalOpen,
    addToast
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [disputeModalExpense, setDisputeModalExpense] = useState<Expense | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeProposal, setDisputeProposal] = useState('');

  if (!activeGroup) return null;

  const currency = activeGroup.currency || 'USD';

  // Filtered expenses
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenDispute = (e: React.MouseEvent, expense: Expense) => {
    e.stopPropagation();
    setDisputeModalExpense(expense);
    setDisputeReason('');
    setDisputeProposal('');
  };

  const handleSubmittingDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModalExpense || !disputeReason.trim()) return;
    await createDispute(disputeModalExpense.id, disputeReason, disputeProposal);
    setDisputeModalExpense(null);
  };

  const categories = ['all', 'Food & Dining', 'Groceries', 'Rent & Housing', 'Travel & Flights', 'Transport & Taxi', 'Entertainment', 'Utilities & Bills'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
      
      {/* Top Header & Search Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Expenses & Shared Ledger</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-normal">
              {filteredExpenses.length} records
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent breakdown of receipts, individual shares, and dispute history.
          </p>
        </div>

        {/* Action button cluster */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>🎙️ Voice</span>
          </button>
          <button
            onClick={() => setIsReceiptModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>🧾 OCR Scan</span>
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-3 mb-5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search expenses by merchant, item name, or note..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table / List */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl">
          <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">No expenses found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try changing your search keywords or category filters.'
              : 'Start logging expenses using natural voice, receipt scan, or manual entry.'}
          </p>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Log First Expense
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredExpenses.map(exp => {
            const payer = members.find(m => m.id === exp.paidById);
            const isExpanded = expandedExpenseId === exp.id;
            const currentUserSplit = exp.splits?.find(s => s.memberId === currentUser.id);

            return (
              <div
                key={exp.id}
                className={`border rounded-xl transition overflow-hidden ${
                  isExpanded ? 'bg-slate-800/90 border-slate-700 shadow-md' : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                {/* Main Row */}
                <div 
                  onClick={() => setExpandedExpenseId(isExpanded ? null : exp.id)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Category Icon */}
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0">
                      {categoryIconMap[exp.category] || <Receipt className="w-5 h-5 text-indigo-400" />}
                    </div>

                    {/* Title & Payer Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm text-white truncate">{exp.title}</h4>
                        {exp.splitType && (
                          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-300 border border-slate-600/50">
                            {exp.splitType}
                          </span>
                        )}
                        {exp.disputeStatus === 'disputed' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" /> Disputed
                          </span>
                        )}
                        {exp.receiptUrl && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-500/30 flex items-center gap-0.5">
                            <Receipt className="w-2.5 h-2.5" /> Receipt
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <img src={payer?.avatar} alt={payer?.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                          <span className="text-slate-300">{payer?.id === currentUser.id ? 'You paid' : `${payer?.name || 'Someone'} paid`}</span>
                        </span>
                        <span>·</span>
                        <span>{exp.date}</span>
                        {exp.notes && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[150px] text-slate-400 italic">"{exp.notes}"</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount and User Share Badge */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-extrabold text-white">
                        {formatCurrency(exp.amount, exp.currency || currency)}
                      </div>
                      <div className="text-[11px]">
                        {exp.paidById === currentUser.id ? (
                          <span className="text-emerald-400 font-semibold">
                            You lent {formatCurrency(exp.amount - (currentUserSplit?.amount || 0), currency)}
                          </span>
                        ) : currentUserSplit ? (
                          <span className="text-amber-400 font-semibold">
                            Your share: {formatCurrency(currentUserSplit.amount, currency)}
                          </span>
                        ) : (
                          <span className="text-slate-400">Not involved</span>
                        )}
                      </div>
                    </div>

                    <div className="text-slate-400 pl-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Split Breakdown & Actions */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-700/60 bg-slate-900/40 text-xs">
                    
                    {/* Itemized Line Items (if available) */}
                    {exp.items && exp.items.length > 0 && (
                      <div className="mb-3">
                        <p className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          Itemized Line Items
                        </p>
                        <div className="space-y-1 bg-slate-900/80 rounded-xl p-2.5 border border-slate-800">
                          {exp.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between py-1 border-b border-slate-800/60 last:border-0">
                              <span className="text-slate-200 font-medium">{item.name}</span>
                              <div className="flex items-center gap-3">
                                <div className="flex -space-x-1">
                                  {item.assignedMemberIds.map(mid => {
                                    const m = members.find(mem => mem.id === mid);
                                    return (
                                      <img 
                                        key={mid} 
                                        src={m?.avatar} 
                                        alt={m?.name} 
                                        title={m?.name} 
                                        className="w-4 h-4 rounded-full border border-slate-900 object-cover" 
                                      />
                                    );
                                  })}
                                </div>
                                <span className="font-bold text-slate-100">{formatCurrency(item.price, currency)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Member Splits Table */}
                    <div>
                      <p className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-1.5">
                        Individual Member Shares
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {exp.splits?.map(split => {
                          const m = members.find(mem => mem.id === split.memberId);
                          const isCur = split.memberId === currentUser.id;
                          return (
                            <div 
                              key={split.memberId} 
                              className={`p-2 rounded-xl border flex items-center justify-between ${
                                isCur ? 'bg-indigo-950/40 border-indigo-500/40' : 'bg-slate-800/60 border-slate-700/50'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <img src={m?.avatar} alt={m?.name} className="w-5 h-5 rounded-full object-cover" />
                                <span className="font-medium truncate text-slate-200">{m?.name.split(' ')[0]}</span>
                              </div>
                              <span className="font-bold text-white shrink-0">
                                {formatCurrency(split.amount, currency)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Row Footer Actions */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800">
                      <button
                        onClick={(e) => handleOpenDispute(e, exp)}
                        className="text-amber-400 hover:text-amber-300 font-medium text-xs flex items-center gap-1 transition"
                      >
                        <MessageSquareWarning className="w-3.5 h-3.5" />
                        <span>Question Split / Open Dispute</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${exp.title}"?`)) {
                            deleteExpense(exp.id);
                          }
                        }}
                        className="text-slate-500 hover:text-rose-400 text-xs flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Expense</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dispute Modal */}
      {disputeModalExpense && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <MessageSquareWarning className="w-5 h-5 text-amber-400" />
              Propose Expense Dispute
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Disputing "{disputeModalExpense.title}" (${disputeModalExpense.amount.toFixed(2)}). All members will be notified in group chat.
            </p>

            <form onSubmit={handleSubmittingDispute} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for dispute *
                </label>
                <textarea
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  placeholder="e.g., I did not participate in this dinner, or my item was charged twice..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-hidden focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Proposed split adjustment (optional)
                </label>
                <input
                  type="text"
                  value={disputeProposal}
                  onChange={e => setDisputeProposal(e.target.value)}
                  placeholder="e.g., Exclude Elena, split $120 equally between Alex and Raj"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeModalExpense(null)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
                >
                  Submit Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

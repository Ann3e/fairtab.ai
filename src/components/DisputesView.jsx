import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatCurrency } from '../utils/debtSimplification.js';
import { 
  MessageSquareWarning, CheckCircle, Send 
} from 'lucide-react';

export const DisputesView = () => {
  const { 
    disputes, 
    expenses, 
    members, 
    activeGroup, 
    resolveDispute, 
    addDisputeComment
  } = useApp();

  const [commentText, setCommentText] = useState({});

  if (!activeGroup) return null;

  const currency = activeGroup.currency || 'USD';
  const groupDisputes = (disputes || []).filter(d => {
    const exp = expenses.find(e => e.id === d.expenseId);
    return exp !== undefined;
  });

  const handleSendComment = (disputeId) => {
    const text = commentText[disputeId];
    if (!text || !text.trim()) return;
    addDisputeComment(disputeId, text.trim());
    setCommentText({ ...commentText, [disputeId]: '' });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
      
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageSquareWarning className="w-5 h-5 text-amber-400" />
          <span>Expense Disputes & Split Arbitration</span>
          <span className="text-xs bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full font-medium border border-amber-500/30">
            {groupDisputes.filter(d => d.status === 'open').length} Open
          </span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Democratic dispute resolution workflow for questioning mistaken charges or unfair splits.
        </p>
      </div>

      {/* Disputes list */}
      {groupDisputes.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white">No active disputes!</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All group members agree with the current splits and expense allocations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupDisputes.map(dispute => {
            const exp = expenses.find(e => e.id === dispute.expenseId);
            const creator = members.find(m => m.id === dispute.createdById || m.id === dispute.raisedById);
            const isResolved = dispute.status === 'resolved' || dispute.status === 'approved' || dispute.status === 'dismissed';

            return (
              <div
                key={dispute.id}
                className={`p-4 rounded-2xl border transition ${
                  isResolved 
                    ? 'bg-slate-950/40 border-slate-800 opacity-80' 
                    : 'bg-slate-800/40 border-amber-500/40 shadow-sm'
                }`}
              >
                {/* Dispute Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <img src={creator?.avatar} alt={creator?.name} className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <span className="text-xs font-bold text-white">{creator?.name || 'Member'}</span>
                      <span className="text-xs text-slate-400 ml-1.5">questioned expense</span>
                      <span className="text-xs font-semibold text-indigo-300 ml-1.5">
                        "{exp?.title || 'Unknown'}" ({formatCurrency(exp?.amount || 0, currency)})
                      </span>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full self-start sm:self-auto ${
                    isResolved 
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse'
                  }`}>
                    {isResolved ? 'Resolved' : 'Open Dispute'}
                  </span>
                </div>

                {/* Dispute Body */}
                <div className="py-3 space-y-2 text-xs">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <p className="font-semibold text-slate-400 mb-1">Reason provided:</p>
                    <p className="text-slate-200">{dispute.reason}</p>
                  </div>

                  {dispute.proposedChanges && (
                    <div className="bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-500/30 flex items-center gap-2">
                      <span className="font-bold text-indigo-300 shrink-0">Proposal:</span>
                      <span className="text-slate-200">{dispute.proposedChanges}</span>
                    </div>
                  )}
                </div>

                {/* Comments Thread */}
                {dispute.comments && dispute.comments.length > 0 && (
                  <div className="my-2 space-y-1.5 pt-2 border-t border-slate-800">
                    <p className="text-[11px] font-semibold text-slate-400">Discussion:</p>
                    {dispute.comments.map(c => {
                      const author = members.find(m => m.id === c.authorId || m.id === c.memberId);
                      return (
                        <div key={c.id || c.timestamp} className="flex items-start gap-2 bg-slate-900/50 p-2 rounded-xl text-xs">
                          <img src={author?.avatar} alt={author?.name} className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-200 mr-1.5">{author?.name || 'Member'}:</span>
                            <span className="text-slate-300">{c.text}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Comment and Action buttons */}
                {!isResolved && (
                  <div className="space-y-2 pt-2 border-t border-slate-700/50">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText[dispute.id] || ''}
                        onChange={e => setCommentText({ ...commentText, [dispute.id]: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Enter') handleSendComment(dispute.id); }}
                        placeholder="Add a comment to this dispute..."
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                      <button
                        onClick={() => handleSendComment(dispute.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => resolveDispute(dispute.id, 'rejected')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                      >
                        Dismiss Dispute
                      </button>

                      <button
                        onClick={() => resolveDispute(dispute.id, 'approved')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Accept & Resolve Dispute</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

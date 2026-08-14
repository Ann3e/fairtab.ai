import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/debtSimplification';
import { 
  Bell, Sparkles, Copy, MessageCircle, RefreshCw, X, 
  Smile, Briefcase, Laugh, Flame 
} from 'lucide-react';

export const SmartReminderModal = () => {
  const { 
    isReminderModalOpen, 
    setIsReminderModalOpen, 
    reminderTarget, 
    activeGroup, 
    members, 
    currentUser, 
    addToast 
  } = useApp();

  const [tone, setTone] = useState('friendly');
  const [reminderMessage, setReminderMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const debtor = members.find(m => m.id === reminderTarget?.debtorId);
  const amount = reminderTarget?.amount || 0;
  const currency = activeGroup?.currency || 'USD';

  const generateAiReminder = async (selectedTone) => {
    if (!debtor || !activeGroup) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtorName: debtor.name,
          creditorName: currentUser.name,
          amount,
          currency,
          groupName: activeGroup.name,
          tone: selectedTone,
          upiId: currentUser.upiId,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setReminderMessage(data.message);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to generate reminder', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isReminderModalOpen && debtor && activeGroup) {
      generateAiReminder(tone);
    }
  }, [isReminderModalOpen, reminderTarget?.debtorId, tone]);

  if (!isReminderModalOpen || !debtor || !activeGroup) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(reminderMessage);
    addToast('Reminder message copied to clipboard!');
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(reminderMessage);
    const url = debtor.phone 
      ? `https://wa.me/${debtor.phone.replace(/[^0-9]/g, '')}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
        
        {/* Close button */}
        <button
          onClick={() => setIsReminderModalOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              AI Smart Payment Reminder
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Gemini
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Personalized reminder for {debtor.name} ({formatCurrency(amount, currency)})
            </p>
          </div>
        </div>

        {/* Tone Selector Tabs */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Select Tone Archetype
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setTone('friendly')}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                tone === 'friendly'
                  ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smile className="w-3.5 h-3.5" />
              <span>Friendly</span>
            </button>

            <button
              type="button"
              onClick={() => setTone('formal')}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                tone === 'formal'
                  ? 'bg-blue-950/70 border-blue-500 text-blue-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Formal</span>
            </button>

            <button
              type="button"
              onClick={() => setTone('funny')}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                tone === 'funny'
                  ? 'bg-amber-950/70 border-amber-500 text-amber-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Laugh className="w-3.5 h-3.5" />
              <span>Joking</span>
            </button>

            <button
              type="button"
              onClick={() => setTone('dramatic_guilt')}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                tone === 'dramatic_guilt'
                  ? 'bg-rose-950/70 border-rose-500 text-rose-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Dramatic</span>
            </button>
          </div>
        </div>

        {/* Message Preview and Editor */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">Generated Reminder Message</label>
            <button
              onClick={() => generateAiReminder(tone)}
              disabled={isGenerating}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
          </div>

          <textarea
            value={reminderMessage}
            onChange={e => setReminderMessage(e.target.value)}
            rows={4}
            className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-hidden focus:border-indigo-500 leading-relaxed font-sans"
          />
        </div>

        {/* Sharing and Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyToClipboard}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>Copy Text</span>
          </button>

          <button
            type="button"
            onClick={openWhatsApp}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Send via WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
};

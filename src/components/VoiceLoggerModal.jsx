import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { 
  Mic, MicOff, Sparkles, Check, RefreshCw, X
} from 'lucide-react';

export const VoiceLoggerModal = () => {
  const { 
    isVoiceModalOpen, 
    setIsVoiceModalOpen, 
    activeGroup, 
    members, 
    currentUser, 
    addExpense, 
    addToast 
  } = useApp();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Editable parsed fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [paidById, setPaidById] = useState('');
  const [splitType, setSplitType] = useState('equal');

  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  const samplePrompts = [
    `I paid 85 for dinner at Olive Garden, split between me, Priya and Raj`,
    `Alex paid 140 for airport Uber and highway tolls, split equally`,
    `Priya paid 280 for Whole Foods groceries, Raj owes 90 and Elena owes 70`,
    `Marcus paid 3300 for apartment rent split 35% Alex, 35% Raj, 30% Marcus`
  ];

  const startListening = () => {
    if (!speechSupported) {
      addToast('Speech recognition not supported in this browser. Please type your prompt below.', 'info');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const resultTranscript = event.results[current][0].transcript;
        setTranscript(resultTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        addToast(`Voice error: ${event.error}`, 'error');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleParseTranscript = async (textToParse) => {
    const text = textToParse || transcript;
    if (!text.trim()) {
      addToast('Please speak or enter an expense description', 'error');
      return;
    }

    setIsParsing(true);
    try {
      const res = await fetch('/api/ai/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          groupMembers: activeGroup?.members || members,
        }),
      });

      const data = await res.json();
      if (data.parsed) {
        const p = data.parsed;
        setParsedResult(p);
        setTitle(p.title || text);
        setAmount(p.amount ? p.amount.toString() : '0');
        setCategory(p.category || 'Food & Dining');
        setSplitType(p.splitType || 'equal');

        // Match payer name to member ID
        if (p.paidByName) {
          const matched = members.find(m => 
            m.name.toLowerCase().includes(p.paidByName.toLowerCase()) ||
            p.paidByName.toLowerCase().includes(m.name.toLowerCase())
          );
          setPaidById(matched ? matched.id : currentUser.id);
        } else {
          setPaidById(currentUser.id);
        }
      }
    } catch (err) {
      console.error('Parsing error:', err);
      addToast('Failed to parse with AI', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommitExpense = async () => {
    if (!activeGroup || !title || !amount || !paidById) {
      addToast('Please fill all required fields', 'error');
      return;
    }

    const numAmount = parseFloat(amount);
    const groupMembers = activeGroup.members;

    // Calculate splits
    let splits = [];
    if (splitType === 'equal') {
      const perPerson = Math.round((numAmount / groupMembers.length) * 100) / 100;
      splits = groupMembers.map((m, idx) => ({
        memberId: m.id,
        amount: idx === 0 
          ? Math.round((numAmount - (perPerson * (groupMembers.length - 1))) * 100) / 100 
          : perPerson,
      }));
    } else if (parsedResult?.involvedMembers && parsedResult.involvedMembers.length > 0) {
      splits = parsedResult.involvedMembers.map(inv => {
        const m = groupMembers.find(gm => gm.name.toLowerCase().includes(inv.name.toLowerCase())) || groupMembers[0];
        return {
          memberId: m.id,
          amount: inv.amount || Math.round((numAmount / parsedResult.involvedMembers.length) * 100) / 100,
          percentage: inv.percentage,
        };
      });
    } else {
      const perPerson = Math.round((numAmount / groupMembers.length) * 100) / 100;
      splits = groupMembers.map(m => ({ memberId: m.id, amount: perPerson }));
    }

    const created = await addExpense({
      title,
      amount: numAmount,
      currency: activeGroup.currency || 'USD',
      category,
      paidById,
      date: new Date().toISOString().split('T')[0],
      splitType,
      splits,
      notes: `Voice logged: "${transcript}"`,
    });

    if (created) {
      setIsVoiceModalOpen(false);
      setTranscript('');
      setParsedResult(null);
    }
  };

  if (!isVoiceModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl overflow-hidden relative">
        
        {/* Close button */}
        <button
          onClick={() => setIsVoiceModalOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Voice-First Expense Logging
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Gemini 3.7 Flash
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Speak your expense naturally — AI extracts amounts, categories, and splits.
            </p>
          </div>
        </div>

        {/* Voice Input Section */}
        <div className="space-y-4">
          
          {/* Big Mic Recording Button & Pulsing Waves */}
          <div className="flex flex-col items-center justify-center py-6 bg-slate-950/60 rounded-2xl border border-slate-800 relative overflow-hidden">
            
            {isListening && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-28 h-28 rounded-full bg-emerald-500/10 animate-ping" />
                <div className="w-36 h-36 rounded-full bg-emerald-500/5 animate-pulse" />
              </div>
            )}

            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition shadow-lg cursor-pointer z-10 ${
                isListening
                  ? 'bg-rose-500 hover:bg-rose-600 text-white animate-bounce'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:scale-105'
              }`}
              title={isListening ? 'Click to stop listening' : 'Click to start speaking'}
            >
              {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>

            <p className="text-xs font-semibold text-slate-300 mt-3 z-10">
              {isListening ? 'Listening... Speak now!' : 'Tap mic to speak or select a sample prompt'}
            </p>
          </div>

          {/* Transcript display & manual edit */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Spoken Transcript / Prompt:</span>
              {transcript && (
                <button 
                  onClick={() => setTranscript('')}
                  className="text-[11px] text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </label>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder='e.g. "I paid $92 for Italian dinner with Alex and Raj, split equally"'
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Preset Prompts */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 mb-1.5">Try sample voice prompt:</p>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTranscript(p);
                    handleParseTranscript(p);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-left transition cursor-pointer"
                >
                  "{p.length > 38 ? p.substring(0, 38) + '...' : p}"
                </button>
              ))}
            </div>
          </div>

          {/* Parse Button */}
          {!parsedResult && (
            <button
              onClick={() => handleParseTranscript()}
              disabled={isParsing || !transcript.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition cursor-pointer"
            >
              {isParsing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gemini AI Parsing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Parse with Gemini AI</span>
                </>
              )}
            </button>
          )}

          {/* Structured Review Card (After Gemini Parsing) */}
          {parsedResult && (
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-500/20">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Verified Structured Output
                </span>
                <button
                  onClick={() => handleParseTranscript()}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Re-parse
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Expense Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Total Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Paid By</label>
                  <select
                    value={paidById}
                    onChange={e => setPaidById(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    {activeGroup?.members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Rent & Housing">Rent & Housing</option>
                    <option value="Travel & Flights">Travel & Flights</option>
                    <option value="Transport & Taxi">Transport & Taxi</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Utilities & Bills">Utilities & Bills</option>
                  </select>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleCommitExpense}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Log to Group</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

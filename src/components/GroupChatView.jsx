import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  MessageSquare, Send, Paperclip, Mic, Play, Pause, 
  Sparkles, DollarSign, CheckCircle2, AlertCircle, Info, Smile,
  History, Clock, Tag, UserCheck, ShieldCheck, ArrowRight, CornerDownRight, Square
} from 'lucide-react';

export const GroupChatView = () => {
  const { 
    messages, 
    chatMessages, 
    activityLogs,
    expenses,
    activeGroup, 
    members, 
    currentUser, 
    sendMessage, 
    setIsVoiceModalOpen,
    setIsExpenseModalOpen,
  } = useApp();

  const [input, setInput] = useState('');
  const [viewMode, setViewMode] = useState('chat');
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [selectedExpenseToLink, setSelectedExpenseToLink] = useState('');
  const [showExpensePicker, setShowExpensePicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);

  const messageList = chatMessages || messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messageList, viewMode]);

  // Voice recording simulation timer
  useEffect(() => {
    if (isRecording) {
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  if (!activeGroup) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !selectedExpenseToLink) return;
    
    const textToSend = input.trim() || 'Shared expense reference with the group';
    await sendMessage(textToSend, 'text', {
      linkedExpenseId: selectedExpenseToLink || undefined,
    });

    setInput('');
    setSelectedExpenseToLink('');
    setShowExpensePicker(false);
  };

  const handleStopAndSendVoice = async () => {
    setIsRecording(false);
    const duration = Math.max(recordDuration, 4);
    await sendMessage(
      `🎙️ Spoken voice note (${duration}s)`, 
      'voice', 
      { audioDuration: duration }
    );
    setRecordDuration(0);
  };

  const handleSendQuickVoiceSim = async () => {
    await sendMessage(
      "🎙️ Hey everyone, I verified the shared groceries and updated the split!",
      "voice",
      { audioDuration: 6 }
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm flex flex-col h-[650px] overflow-hidden">
      
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {activeGroup.name} Activity & Chat
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {activeGroup.members?.length || 0} members · Instant shared ledger updates
            </p>
          </div>
        </div>

        {/* View mode toggle + Member Avatars Stack */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={() => setViewMode('chat')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                viewMode === 'chat'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Chat ({messageList.length})
            </button>
            <button
              onClick={() => setViewMode('activity')}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'activity'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Log ({activityLogs.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex -space-x-1.5">
            {activeGroup.members?.map(m => (
              <img 
                key={m.id} 
                src={m.avatar} 
                alt={m.name} 
                title={m.name} 
                className="w-7 h-7 rounded-full border-2 border-slate-900 object-cover" 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Feed */}
      {viewMode === 'activity' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
          {activityLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
              <History className="w-8 h-8 mb-2 opacity-50 text-indigo-400" />
              <p>No activity recorded yet for this group.</p>
            </div>
          ) : (
            activityLogs.map(log => {
              const actor = members.find(m => m.id === log.actorId) || { name: 'Member', avatar: '' };
              return (
                <div 
                  key={log.id} 
                  className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-3 text-xs"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0 mt-0.5">
                    {actor.avatar ? (
                      <img src={actor.avatar} alt={actor.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      actor.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200">
                      <span className="font-semibold text-indigo-300">{actor.name}</span> {log.details}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
          {messageList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
              <MessageSquare className="w-8 h-8 mb-2 opacity-50 text-indigo-400" />
              <p className="font-semibold text-slate-300">Welcome to #{activeGroup.name}</p>
              <p className="text-slate-500 mt-1 max-w-sm">
                Discuss split expenses, share receipt verifications, or log voice notes with all group members.
              </p>
            </div>
          ) : (
            messageList.map(msg => {
              const isMe = msg.senderId === currentUser.id;
              const sender = members.find(m => m.id === msg.senderId);
              const isSystem = msg.senderId === 'system' || msg.type === 'system';
              const linkedExp = msg.linkedExpenseId ? expenses.find(e => e.id === msg.linkedExpenseId) : null;
              const isVoice = msg.type === 'voice' || msg.type === 'voice_note';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1.5 shadow-xs max-w-md text-center">
                      <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{msg.text}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <img
                    src={sender?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={sender?.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-slate-800"
                  />

                  <div className={`max-w-[80%] sm:max-w-[70%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-1.5 text-[10px] text-slate-400 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className="font-semibold text-slate-300">{sender?.name?.split(' ')[0] || 'Member'}</span>
                      <span>·</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-xs shadow-md'
                          : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-tl-xs'
                      }`}
                    >
                      {/* Voice Note Attachment */}
                      {isVoice ? (
                        <div className="flex items-center gap-3 py-1">
                          <button
                            type="button"
                            onClick={() => setPlayingVoiceId(playingVoiceId === msg.id ? null : msg.id)}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition cursor-pointer shrink-0"
                          >
                            {playingVoiceId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                          </button>

                          <div className="flex items-center gap-1">
                            {[40, 70, 30, 90, 50, 80, 20, 60, 95, 45, 75, 30, 60, 40].map((h, idx) => (
                              <div
                                key={idx}
                                className={`w-1 rounded-full transition-all duration-300 ${
                                  playingVoiceId === msg.id ? 'bg-white animate-pulse' : 'bg-white/60'
                                }`}
                                style={{ height: `${(h / 100) * 20}px` }}
                              />
                            ))}
                          </div>

                          <span className="text-[10px] font-mono opacity-80 shrink-0">
                            0:{msg.audioDuration ? String(msg.audioDuration).padStart(2, '0') : '06'}
                          </span>
                        </div>
                      ) : (
                        <div>{msg.text}</div>
                      )}

                      {/* Linked Expense Card Tag */}
                      {linkedExp && (
                        <div className="mt-2 p-2 rounded-xl bg-slate-950/40 border border-white/10 flex items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Tag className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                            <span className="font-semibold truncate">{linkedExp.title}</span>
                          </div>
                          <span className="font-mono font-bold text-emerald-300 shrink-0">
                            ${linkedExp.amount.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Quick Action Chips & Input Form */}
      {viewMode === 'chat' && (
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 space-y-2">
          
          {/* Quick Action Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 font-medium flex items-center gap-1 shrink-0 transition cursor-pointer"
            >
              <Mic className="w-3 h-3" />
              <span>Voice Log Expense</span>
            </button>

            <button
              onClick={handleSendQuickVoiceSim}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium flex items-center gap-1 shrink-0 transition cursor-pointer"
            >
              <span>🎙️ Send Voice Note</span>
            </button>

            <button
              onClick={() => setShowExpensePicker(!showExpensePicker)}
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 shrink-0 transition cursor-pointer ${
                showExpensePicker 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Paperclip className="w-3 h-3" />
              <span>Link Expense</span>
            </button>

            <button
              onClick={() => setInput("Hey everyone, please verify the receipts from today!")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium shrink-0 transition cursor-pointer"
            >
              "Please check receipts"
            </button>
          </div>

          {/* Expense Selector Dropdown if activated */}
          {showExpensePicker && (
            <div className="p-2.5 rounded-xl bg-slate-850 border border-indigo-500/40 space-y-1.5 animate-in fade-in">
              <p className="text-[11px] font-semibold text-indigo-300">Select an expense to tag in chat:</p>
              <select
                value={selectedExpenseToLink}
                onChange={e => setSelectedExpenseToLink(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-hidden"
              >
                <option value="">-- Choose Expense --</option>
                {expenses.map(exp => (
                  <option key={exp.id} value={exp.id}>
                    {exp.title} (${exp.amount.toFixed(2)}) - {exp.date}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Real or Simulated Audio Recording Bar */}
          {isRecording ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 animate-pulse">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span>Recording voice update... (0:{String(recordDuration).padStart(2, '0')})</span>
              </div>
              <button
                type="button"
                onClick={handleStopAndSendVoice}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Send Note</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRecording(true)}
                title="Hold or click to record voice note"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer shrink-0"
              >
                <Mic className="w-4 h-4 text-emerald-400" />
              </button>

              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`Message ${activeGroup.name} members...`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
              />

              <button
                type="submit"
                disabled={!input.trim() && !selectedExpenseToLink}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition shadow-md cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}

    </div>
  );
};

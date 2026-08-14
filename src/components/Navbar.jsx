import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, Plus, Mic, Receipt, ChevronDown, Check, Copy, Sparkles, 
  Wallet, Mountain, Home, Plane, Briefcase, Tag, LogIn
} from 'lucide-react';

const categoryIcons = {
  trip: <Mountain className="w-4 h-4 text-emerald-500" />,
  home: <Home className="w-4 h-4 text-blue-500" />,
  couple: <Sparkles className="w-4 h-4 text-pink-500" />,
  office: <Briefcase className="w-4 h-4 text-amber-500" />,
  other: <Tag className="w-4 h-4 text-purple-500" />,
};

export const Navbar = () => {
  const { 
    currentUser, 
    setCurrentUser, 
    members, 
    groups, 
    activeGroup, 
    setActiveGroup, 
    setIsExpenseModalOpen, 
    setIsVoiceModalOpen, 
    setIsReceiptModalOpen,
    setIsNewGroupModalOpen,
    joinGroup,
    addToast
  } = useApp();

  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    const success = await joinGroup(joinCodeInput.trim());
    if (success) {
      setJoinCodeInput('');
      setIsJoinModalOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Group Switcher */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center shadow-md shadow-indigo-500/20 font-bold text-lg text-white">
              FT
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent hidden sm:inline">
              FairTab
            </span>
          </div>

          {/* Group Dropdown */}
          <div className="relative">
            <button
              id="group-switcher-btn"
              onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-sm font-medium transition cursor-pointer"
            >
              {activeGroup ? (
                <>
                  <span>{categoryIcons[activeGroup.category] || <Users className="w-4 h-4 text-indigo-400" />}</span>
                  <span className="max-w-[140px] sm:max-w-[200px] truncate text-slate-100 font-semibold">{activeGroup.name}</span>
                </>
              ) : (
                <span>Select Group</span>
              )}
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isGroupDropdownOpen && (
              <div 
                className="absolute left-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setIsGroupDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Your Groups
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {groups.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setActiveGroup(g)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-sm hover:bg-slate-800/80 transition ${
                        activeGroup?.id === g.id ? 'bg-indigo-950/50 text-indigo-300 font-medium' : 'text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span>{categoryIcons[g.category] || <Users className="w-4 h-4 text-slate-400" />}</span>
                        <div className="truncate">
                          <p className="truncate text-sm font-medium">{g.name}</p>
                          <p className="text-xs text-slate-400">{g.members.length} members · {g.currency}</p>
                        </div>
                      </div>
                      {activeGroup?.id === g.id && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-800 pt-1 px-2 flex flex-col gap-1">
                  <button
                    onClick={() => setIsNewGroupModalOpen(true)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-400 hover:bg-indigo-950/40 flex items-center gap-2 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create New Group
                  </button>
                  <button
                    onClick={() => setIsJoinModalOpen(true)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Join with Invite Code
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons & Multi-User Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick AI & Logging Actions */}
          <button
            id="nav-voice-log-btn"
            onClick={() => setIsVoiceModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs sm:text-sm font-medium transition cursor-pointer"
            title="Log expense using natural voice speech"
          >
            <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span className="hidden md:inline">Voice Log</span>
          </button>

          <button
            id="nav-receipt-scan-btn"
            onClick={() => setIsReceiptModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs sm:text-sm font-medium transition cursor-pointer"
            title="Scan receipt with Gemini Vision OCR"
          >
            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
            <span className="hidden md:inline">Scan Receipt</span>
          </button>

          <button
            id="nav-add-expense-btn"
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>

          {/* User Switcher Dropdown (Simulate Multi-User Roles) */}
          <div className="relative pl-1 sm:pl-2 border-l border-slate-800">
            <button
              id="user-role-switcher-btn"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500/50 transition cursor-pointer"
              title={`Logged in as ${currentUser.name}. Click to switch member perspective.`}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-indigo-500"
              />
              <div className="hidden lg:block text-left pr-1">
                <p className="text-xs font-semibold text-slate-200 leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-emerald-400 font-medium">Active Member</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {isUserDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50"
                onClick={() => setIsUserDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-800">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Simulate Member Perspective</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Switch user to test personal balances & debts</p>
                </div>
                <div className="py-1">
                  {members.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setCurrentUser(m);
                        addToast(`Switched view to ${m.name}`, 'info');
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-sm hover:bg-slate-800/80 transition cursor-pointer ${
                        currentUser.id === m.id ? 'bg-indigo-950/60 text-indigo-300 font-medium' : 'text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover" />
                        <div>
                          <p className="text-sm font-medium leading-none">{m.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{m.upiId || m.email}</p>
                        </div>
                      </div>
                      {currentUser.id === m.id && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Join Group Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Join an Existing Group</h3>
            <p className="text-sm text-slate-400 mb-4">
              Enter the 6 to 10 character invite code shared by your group organizer (e.g. TAHOE-2026, APT4B-NYC).
            </p>
            <form onSubmit={handleJoinGroup}>
              <input
                type="text"
                value={joinCodeInput}
                onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. TAHOE-2026"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-center tracking-widest text-lg focus:outline-hidden focus:border-indigo-500 mb-4"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition cursor-pointer"
                >
                  Join Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

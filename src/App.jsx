import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { BalanceSummaryCards } from './components/BalanceSummaryCards.jsx';
import { ExpenseList } from './components/ExpenseList.jsx';
import { DebtSimplificationView } from './components/DebtSimplificationView.jsx';
import { RecurringExpensesView } from './components/RecurringExpensesView.jsx';
import { GroupChatView } from './components/GroupChatView.jsx';
import { AIInsightsView } from './components/AIInsightsView.jsx';
import { ExpenseModal } from './components/ExpenseModal.jsx';
import { VoiceLoggerModal } from './components/VoiceLoggerModal.jsx';
import { ReceiptScannerModal } from './components/ReceiptScannerModal.jsx';
import { SettleUpModal } from './components/SettleUpModal.jsx';
import { SmartReminderModal } from './components/SmartReminderModal.jsx';
import { NewGroupModal } from './components/NewGroupModal.jsx';
import { ToastContainer } from './components/ToastContainer.jsx';
import { 
  Receipt, Zap, Repeat, 
  MessageSquare, Sparkles, Loader2 
} from 'lucide-react';

const MainContent = () => {
  const { 
    activeGroup, 
    isLoading, 
    expenses, 
    messages,
    debtResult
  } = useApp();

  const [activeTab, setActiveTab] = useState('expenses');

  if (isLoading && !activeGroup) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading FairTab Ledger...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* Top Financial Status Cards */}
        <BalanceSummaryCards />

        {/* View Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-5 border-b border-slate-800 scrollbar-none text-xs">
          
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Expenses & Ledger</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 opacity-80">
              {expenses ? expenses.length : 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('debts')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'debts'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Debt Simplification & Settle</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 text-emerald-400 font-mono">
              {debtResult?.simplifiedDebts ? debtResult.simplifiedDebts.length : 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('recurring')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'recurring'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span>Scheduled Bills</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Group Chat & Activity</span>
            {messages && messages.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 opacity-80">
                {messages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('insights')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Spending Intelligence</span>
          </button>

        </div>

        {/* Tab Content Panels */}
        {activeTab === 'expenses' && <ExpenseList />}
        {activeTab === 'debts' && <DebtSimplificationView />}
        {activeTab === 'recurring' && <RecurringExpensesView />}
        {activeTab === 'chat' && <GroupChatView />}
        {activeTab === 'insights' && <AIInsightsView />}

      </main>

      {/* Global Modals */}
      <ExpenseModal />
      <VoiceLoggerModal />
      <ReceiptScannerModal />
      <SettleUpModal />
      <SmartReminderModal />
      <NewGroupModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

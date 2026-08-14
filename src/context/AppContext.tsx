import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Group, Member, Expense, Settlement, RecurringRule, Dispute, GroupMessage, 
  ActivityLog, SimplifiedDebtResult 
} from '../types';
import { calculateGroupDebts } from '../utils/debtSimplification';
import { getSocket } from '../lib/socket';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}

interface AppContextType {
  members: Member[];
  currentUser: Member;
  setCurrentUser: (member: Member) => void;
  groups: Group[];
  activeGroup: Group | null;
  setActiveGroup: (group: Group) => void;
  expenses: Expense[];
  settlements: Settlement[];
  recurringRules: RecurringRule[];
  disputes: Dispute[];
  messages: GroupMessage[];
  chatMessages: GroupMessage[];
  activityLogs: ActivityLog[];
  debtResult: SimplifiedDebtResult;
  loading: boolean;
  isLoading: boolean;
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
  
  // Actions
  fetchGroupData: (groupId: string) => Promise<void>;
  createGroup: (groupData: Partial<Group> & { memberIds: string[] }) => Promise<Group | null>;
  joinGroup: (inviteCode: string) => Promise<boolean>;
  addExpense: (expenseData: Partial<Expense>) => Promise<Expense | null>;
  deleteExpense: (expenseId: string) => Promise<boolean>;
  addSettlement: (settlementData: Partial<Settlement>) => Promise<Settlement | null>;
  addRecurringRule: (ruleData: Partial<RecurringRule>) => Promise<RecurringRule | null>;
  triggerRecurringRule: (ruleId: string) => Promise<boolean>;
  createDispute: (expenseId: string, reason: string, proposedChanges?: string) => Promise<Dispute | null>;
  resolveDispute: (disputeId: string, status: 'approved' | 'rejected', updatedSplits?: any[]) => Promise<boolean>;
  addDisputeComment: (disputeId: string, text: string) => Promise<boolean>;
  sendMessage: (text: string, type?: 'text' | 'voice' | 'system' | 'expense_action', extra?: { linkedExpenseId?: string; audioDuration?: number }) => Promise<GroupMessage | null>;
  
  // Modal Triggers
  isExpenseModalOpen: boolean;
  setIsExpenseModalOpen: (open: boolean) => void;
  isVoiceModalOpen: boolean;
  setIsVoiceModalOpen: (open: boolean) => void;
  isReceiptModalOpen: boolean;
  setIsReceiptModalOpen: (open: boolean) => void;
  isSettleModalOpen: boolean;
  setIsSettleModalOpen: (open: boolean) => void;
  settleTarget: { toMemberId?: string; amount?: number } | null;
  openSettleModal: (toMemberId?: string, amount?: number) => void;
  isReminderModalOpen: boolean;
  setIsReminderModalOpen: (open: boolean) => void;
  reminderTarget: { debtorId: string; amount: number } | null;
  openReminderModal: (debtorId: string, amount: number) => void;
  isNewGroupModalOpen: boolean;
  setIsNewGroupModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<Member>({
    id: 'usr_alex',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    upiId: 'alex.rivera@okaxis',
    paypalHandle: 'alexrivera99',
    phone: '+1-555-0192',
    color: '#3B82F6',
  });
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleTarget, setSettleTarget] = useState<{ toMemberId?: string; amount?: number } | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderTarget, setReminderTarget] = useState<{ debtorId: string; amount: number } | null>(null);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `t_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch initial members and groups
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [memRes, grpRes] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/groups'),
        ]);
        const memData = await memRes.json();
        const grpData = await grpRes.json();

        if (memData.members && memData.members.length > 0) {
          setMembers(memData.members);
          setCurrentUser(memData.members[0]);
        }
        if (grpData.groups && grpData.groups.length > 0) {
          setGroups(grpData.groups);
          setActiveGroup(grpData.groups[0]);
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        addToast('Failed to load initial data from server', 'error');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [addToast]);

  // Fetch data for the active group
  const fetchGroupData = useCallback(async (groupId: string) => {
    try {
      const [expRes, setRes, recRes, dispRes, msgRes, actRes] = await Promise.all([
        fetch(`/api/groups/${groupId}/expenses`),
        fetch(`/api/groups/${groupId}/settlements`),
        fetch(`/api/groups/${groupId}/recurring`),
        fetch(`/api/groups/${groupId}/disputes`),
        fetch(`/api/groups/${groupId}/messages`),
        fetch(`/api/groups/${groupId}/activity`),
      ]);

      const [expData, setData, recData, dispData, msgData, actData] = await Promise.all([
        expRes.json(),
        setRes.json(),
        recRes.json(),
        dispRes.json(),
        msgRes.json(),
        actRes.json(),
      ]);

      setExpenses(expData.expenses || []);
      setSettlements(setData.settlements || []);
      setRecurringRules(recData.recurringRules || []);
      setDisputes(dispData.disputes || []);
      setMessages(msgData.messages || []);
      setActivityLogs(actData.activityLogs || []);
    } catch (err) {
      console.error('Error fetching group data:', err);
    }
  }, []);

  // Socket.io Real-Time synchronization
  useEffect(() => {
    if (!activeGroup?.id) return;
    const socket = getSocket();

    socket.emit('join_group', activeGroup.id);

    const handleNewMessage = (newMsg: GroupMessage) => {
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    };

    const handleExpenseAdded = (newExp: Expense) => {
      setExpenses(prev => {
        if (prev.some(e => e.id === newExp.id)) return prev;
        return [newExp, ...prev];
      });
      fetchGroupData(activeGroup.id);
    };

    const handleExpenseUpdated = (updatedExp: Expense) => {
      setExpenses(prev => prev.map(e => e.id === updatedExp.id ? updatedExp : e));
      fetchGroupData(activeGroup.id);
    };

    const handleExpenseDeleted = ({ id }: { id: string }) => {
      setExpenses(prev => prev.filter(e => e.id !== id));
      fetchGroupData(activeGroup.id);
    };

    const handleSettlementRecorded = (newStl: Settlement) => {
      setSettlements(prev => {
        if (prev.some(s => s.id === newStl.id)) return prev;
        return [newStl, ...prev];
      });
      fetchGroupData(activeGroup.id);
    };

    const handleDisputeEvent = () => {
      fetchGroupData(activeGroup.id);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('expense_added', handleExpenseAdded);
    socket.on('expense_updated', handleExpenseUpdated);
    socket.on('expense_deleted', handleExpenseDeleted);
    socket.on('settlement_recorded', handleSettlementRecorded);
    socket.on('dispute_created', handleDisputeEvent);
    socket.on('dispute_resolved', handleDisputeEvent);
    socket.on('dispute_comment_added', handleDisputeEvent);

    return () => {
      socket.emit('leave_group', activeGroup.id);
      socket.off('new_message', handleNewMessage);
      socket.off('expense_added', handleExpenseAdded);
      socket.off('expense_updated', handleExpenseUpdated);
      socket.off('expense_deleted', handleExpenseDeleted);
      socket.off('settlement_recorded', handleSettlementRecorded);
      socket.off('dispute_created', handleDisputeEvent);
      socket.off('dispute_resolved', handleDisputeEvent);
      socket.off('dispute_comment_added', handleDisputeEvent);
    };
  }, [activeGroup?.id, fetchGroupData]);

  useEffect(() => {
    if (activeGroup?.id) {
      fetchGroupData(activeGroup.id);
    }
  }, [activeGroup?.id, fetchGroupData]);

  // Calculate debts for the active group
  const debtResult = calculateGroupDebts(
    activeGroup?.members || [],
    expenses,
    settlements
  );

  // Group creation
  const createGroup = async (groupData: Partial<Group> & { memberIds: string[] }): Promise<Group | null> => {
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      });
      const data = await res.json();
      if (data.group) {
        setGroups(prev => [data.group, ...prev]);
        setActiveGroup(data.group);
        addToast(`Group "${data.group.name}" created in PostgreSQL!`);
        return data.group;
      }
      return null;
    } catch (err) {
      console.error(err);
      addToast('Failed to create group', 'error');
      return null;
    }
  };

  // Join group via code
  const joinGroup = async (inviteCode: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode, memberId: currentUser.id }),
      });
      const data = await res.json();
      if (res.ok && data.group) {
        setGroups(prev => {
          const exists = prev.some(g => g.id === data.group.id);
          return exists ? prev.map(g => g.id === data.group.id ? data.group : g) : [data.group, ...prev];
        });
        setActiveGroup(data.group);
        addToast(`Joined group "${data.group.name}"!`);
        return true;
      } else {
        addToast(data.error || 'Invalid invite code', 'error');
        return false;
      }
    } catch (err) {
      console.error(err);
      addToast('Error joining group', 'error');
      return false;
    }
  };

  // Add Expense
  const addExpense = async (expenseData: Partial<Expense>): Promise<Expense | null> => {
    if (!activeGroup) return null;
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });
      const data = await res.json();
      if (data.expense) {
        setExpenses(prev => {
          if (prev.some(e => e.id === data.expense.id)) return prev;
          return [data.expense, ...prev];
        });
        addToast(`Expense "${data.expense.title}" saved to PostgreSQL ($${data.expense.amount.toFixed(2)})`);
        fetchGroupData(activeGroup.id);
        return data.expense;
      }
      return null;
    } catch (err) {
      console.error(err);
      addToast('Failed to log expense', 'error');
      return null;
    }
  };

  // Delete Expense
  const deleteExpense = async (expenseId: string): Promise<boolean> => {
    if (!activeGroup) return false;
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/expenses/${expenseId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
        addToast('Expense deleted');
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Add Settlement
  const addSettlement = async (settlementData: Partial<Settlement>): Promise<Settlement | null> => {
    if (!activeGroup) return null;
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/settlements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settlementData),
      });
      const data = await res.json();
      if (data.settlement) {
        setSettlements(prev => {
          if (prev.some(s => s.id === data.settlement.id)) return prev;
          return [data.settlement, ...prev];
        });
        addToast(`Settlement of $${data.settlement.amount.toFixed(2)} recorded in PostgreSQL!`);
        fetchGroupData(activeGroup.id);
        return data.settlement;
      }
      return null;
    } catch (err) {
      console.error(err);
      addToast('Failed to record settlement', 'error');
      return null;
    }
  };

  // Recurring rules
  const addRecurringRule = async (ruleData: Partial<RecurringRule>): Promise<RecurringRule | null> => {
    if (!activeGroup) return null;
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/recurring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      });
      const data = await res.json();
      if (data.recurringRule) {
        setRecurringRules(prev => [data.recurringRule, ...prev]);
        addToast(`Recurring bill "${data.recurringRule.title}" saved`);
        return data.recurringRule;
      }
      return null;
    } catch (err) {
      console.error(err);
      addToast('Failed to create recurring rule', 'error');
      return null;
    }
  };

  const triggerRecurringRule = async (ruleId: string): Promise<boolean> => {
    if (!activeGroup) return false;
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/recurring/${ruleId}/trigger`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.expense) {
        setExpenses(prev => [data.expense, ...prev]);
        addToast(`Generated recurring expense "${data.expense.title}"!`);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Disputes
  const createDispute = async (expenseId: string, reason: string, proposedChanges?: string): Promise<Dispute | null> => {
    if (!activeGroup) return null;
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenseId, raisedById: currentUser.id, reason, proposedChanges }),
      });
      const data = await res.json();
      if (data.dispute) {
        setDisputes(prev => [data.dispute, ...prev]);
        setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, disputeStatus: 'disputed' } : e));
        addToast('Dispute opened for group review', 'info');
        return data.dispute;
      }
      return null;
    } catch (err) {
      console.error(err);
      addToast('Failed to create dispute', 'error');
      return null;
    }
  };

  const resolveDispute = async (disputeId: string, status: 'approved' | 'rejected', updatedSplits?: any[]): Promise<boolean> => {
    if (!activeGroup) return false;
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/disputes/${disputeId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, updatedSplits }),
      });
      const data = await res.json();
      if (data.dispute) {
        setDisputes(prev => prev.map(d => d.id === disputeId ? data.dispute : d));
        if (data.expense) {
          setExpenses(prev => prev.map(e => e.id === data.expense.id ? data.expense : e));
        }
        addToast(`Dispute ${status}!`);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const addDisputeComment = async (disputeId: string, text: string): Promise<boolean> => {
    if (!activeGroup) return false;
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/disputes/${disputeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: currentUser.id, text }),
      });
      const data = await res.json();
      if (data.dispute) {
        setDisputes(prev => prev.map(d => d.id === disputeId ? data.dispute : d));
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Group Messages
  const sendMessage = async (
    text: string, 
    type: 'text' | 'voice' | 'system' | 'expense_action' = 'text', 
    extra?: { linkedExpenseId?: string; audioDuration?: number }
  ): Promise<GroupMessage | null> => {
    if (!activeGroup) return null;
    try {
      const payload = {
        senderId: currentUser.id,
        text,
        type: type === 'voice' || type === 'text' || type === 'system' || type === 'expense_action' ? type : 'text',
        linkedExpenseId: extra?.linkedExpenseId,
        audioDuration: extra?.audioDuration,
      };

      const res = await fetch(`/api/groups/${activeGroup.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.message) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        return data.message;
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const openSettleModal = (toMemberId?: string, amount?: number) => {
    setSettleTarget({ toMemberId, amount });
    setIsSettleModalOpen(true);
  };

  const openReminderModal = (debtorId: string, amount: number) => {
    setReminderTarget({ debtorId, amount });
    setIsReminderModalOpen(true);
  };

  return (
    <AppContext.Provider
      value={{
        members,
        currentUser,
        setCurrentUser,
        groups,
        activeGroup,
        setActiveGroup,
        expenses,
        settlements,
        recurringRules,
        disputes,
        messages,
        chatMessages: messages,
        activityLogs,
        debtResult,
        loading,
        isLoading: loading,
        toasts,
        addToast,
        removeToast,
        fetchGroupData,
        createGroup,
        joinGroup,
        addExpense,
        deleteExpense,
        addSettlement,
        addRecurringRule,
        triggerRecurringRule,
        createDispute,
        resolveDispute,
        addDisputeComment,
        sendMessage,
        isExpenseModalOpen,
        setIsExpenseModalOpen,
        isVoiceModalOpen,
        setIsVoiceModalOpen,
        isReceiptModalOpen,
        setIsReceiptModalOpen,
        isSettleModalOpen,
        setIsSettleModalOpen,
        settleTarget,
        openSettleModal,
        isReminderModalOpen,
        setIsReminderModalOpen,
        reminderTarget,
        openReminderModal,
        isNewGroupModalOpen,
        setIsNewGroupModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

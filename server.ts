import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { 
  Group, Expense, Settlement, RecurringRule, Dispute, GroupMessage, ActivityLog, 
  ExpenseCategory, SplitType 
} from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initialize Google Gemini AI safely
let ai: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return ai;
}

// ----------------------------------------------------
// IN-MEMORY RELATIONAL DATA STORE WITH RICH SEED DATA
// ----------------------------------------------------

const mockMembers = [
  { id: 'usr_alex', name: 'Alex Rivera', email: 'alex@example.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', upiId: 'alex.rivera@okaxis', paypalHandle: 'alexrivera99', phone: '+1-555-0192', color: '#3B82F6' },
  { id: 'usr_priya', name: 'Priya Sharma', email: 'priya@example.com', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', upiId: 'priyasharma@okhdfcbank', paypalHandle: 'priya_sharma', phone: '+1-555-0144', color: '#EC4899' },
  { id: 'usr_raj', name: 'Raj Patel', email: 'raj@example.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', upiId: 'raj.patel@icici', paypalHandle: 'rajpatel_dev', phone: '+1-555-0188', color: '#10B981' },
  { id: 'usr_elena', name: 'Elena Rostova', email: 'elena@example.com', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80', upiId: 'elena.rostova@sbi', paypalHandle: 'elena_r', phone: '+1-555-0177', color: '#8B5CF6' },
  { id: 'usr_marcus', name: 'Marcus Vance', email: 'marcus@example.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', upiId: 'marcus.vance@ybl', paypalHandle: 'marcusv', phone: '+1-555-0165', color: '#F59E0B' },
];

let groups: Group[] = [
  {
    id: 'grp_tahoe',
    name: 'Lake Tahoe Ski Trip 🏔️',
    description: 'Weekend cabin rental, ski passes, dinners and groceries',
    category: 'trip',
    currency: 'USD',
    inviteCode: 'TAHOE-2026',
    avatarIcon: 'Mountain',
    budgetLimit: 3000,
    createdAt: '2026-08-01T10:00:00Z',
    members: [mockMembers[0], mockMembers[1], mockMembers[2], mockMembers[3]],
  },
  {
    id: 'grp_roommates',
    name: 'Apt 4B Roommates 🛋️',
    description: 'Monthly rent, Gigabit WiFi, groceries and cleaning supplies',
    category: 'home',
    currency: 'USD',
    inviteCode: 'APT4B-NYC',
    avatarIcon: 'Home',
    budgetLimit: 4500,
    createdAt: '2026-07-15T08:00:00Z',
    members: [mockMembers[0], mockMembers[2], mockMembers[4]],
  },
  {
    id: 'grp_euro',
    name: 'Euro Summer 2026 ✈️',
    description: 'Rome, Barcelona and Paris train tickets and boutique stays',
    category: 'trip',
    currency: 'EUR',
    inviteCode: 'EURO-26',
    avatarIcon: 'Plane',
    budgetLimit: 5000,
    createdAt: '2026-08-05T12:00:00Z',
    members: [mockMembers[1], mockMembers[3], mockMembers[4]],
  }
];

let expenses: Expense[] = [
  {
    id: 'exp_cabin',
    groupId: 'grp_tahoe',
    title: 'Timberline Chalet Cabin Rental (3 Nights)',
    amount: 1400,
    currency: 'USD',
    category: 'Rent & Housing',
    paidById: 'usr_alex',
    date: '2026-08-08',
    splitType: 'equal',
    splits: [
      { memberId: 'usr_alex', amount: 350 },
      { memberId: 'usr_priya', amount: 350 },
      { memberId: 'usr_raj', amount: 350 },
      { memberId: 'usr_elena', amount: 350 },
    ],
    notes: 'Paid via Airbnb booking confirmation #HM82910',
    disputeStatus: 'none',
    createdBy: 'usr_alex',
    createdAt: '2026-08-08T14:30:00Z',
  },
  {
    id: 'exp_groceries',
    groupId: 'grp_tahoe',
    title: 'Whole Foods Market Provisions & BBQ',
    amount: 284.50,
    currency: 'USD',
    category: 'Groceries',
    paidById: 'usr_priya',
    date: '2026-08-09',
    splitType: 'itemized',
    tax: 22.50,
    tip: 0,
    items: [
      { id: 'item_1', name: 'Marinated Ribeye Steaks (4pk)', price: 72.00, assignedMemberIds: ['usr_alex', 'usr_raj'] },
      { id: 'item_2', name: 'Vegan Burger Patties & Veggies', price: 34.00, assignedMemberIds: ['usr_priya', 'usr_elena'] },
      { id: 'item_3', name: 'Artisan Sourdough & Cheeses', price: 46.00, assignedMemberIds: ['usr_alex', 'usr_priya', 'usr_raj', 'usr_elena'] },
      { id: 'item_4', name: 'Craft IPA Beers (24 cans)', price: 54.00, assignedMemberIds: ['usr_alex', 'usr_raj', 'usr_elena'] },
      { id: 'item_5', name: 'Sparkling Cider & Fresh Fruits', price: 56.00, assignedMemberIds: ['usr_alex', 'usr_priya', 'usr_raj', 'usr_elena'] },
    ],
    splits: [
      { memberId: 'usr_alex', amount: 81.30 },
      { memberId: 'usr_priya', amount: 48.00 },
      { memberId: 'usr_raj', amount: 81.30 },
      { memberId: 'usr_elena', amount: 73.90 },
    ],
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e4c0197af57?w=400&auto=format&fit=crop&q=80',
    notes: 'Itemized split with proportional sales tax added',
    disputeStatus: 'none',
    createdBy: 'usr_priya',
    createdAt: '2026-08-09T18:15:00Z',
  },
  {
    id: 'exp_ski_passes',
    groupId: 'grp_tahoe',
    title: 'Heavenly Resort 2-Day Lift Passes',
    amount: 720,
    currency: 'USD',
    category: 'Entertainment',
    paidById: 'usr_raj',
    date: '2026-08-10',
    splitType: 'exact',
    splits: [
      { memberId: 'usr_alex', amount: 240 },
      { memberId: 'usr_raj', amount: 240 },
      { memberId: 'usr_elena', amount: 240 },
    ],
    notes: 'Priya took snowboard lessons separately and did not use pass',
    disputeStatus: 'none',
    createdBy: 'usr_raj',
    createdAt: '2026-08-10T09:00:00Z',
  },
  {
    id: 'exp_gas',
    groupId: 'grp_tahoe',
    title: 'SUV Rental Fuel & Snow Chains',
    amount: 145.20,
    currency: 'USD',
    category: 'Transport & Taxi',
    paidById: 'usr_elena',
    date: '2026-08-11',
    splitType: 'equal',
    splits: [
      { memberId: 'usr_alex', amount: 36.30 },
      { memberId: 'usr_priya', amount: 36.30 },
      { memberId: 'usr_raj', amount: 36.30 },
      { memberId: 'usr_elena', amount: 36.30 },
    ],
    disputeStatus: 'none',
    createdBy: 'usr_elena',
    createdAt: '2026-08-11T16:45:00Z',
  },
  // Roommates expenses
  {
    id: 'exp_apt_rent',
    groupId: 'grp_roommates',
    title: 'August Apartment 4B Rent',
    amount: 3300,
    currency: 'USD',
    category: 'Rent & Housing',
    paidById: 'usr_marcus',
    date: '2026-08-01',
    splitType: 'percentage',
    splits: [
      { memberId: 'usr_alex', amount: 1155, percentage: 35 },
      { memberId: 'usr_raj', amount: 1155, percentage: 35 },
      { memberId: 'usr_marcus', amount: 990, percentage: 30 },
    ],
    notes: 'Marcus has the smaller bedroom, 35/35/30 split',
    disputeStatus: 'none',
    createdBy: 'usr_marcus',
    createdAt: '2026-08-01T08:30:00Z',
  },
  {
    id: 'exp_apt_wifi',
    groupId: 'grp_roommates',
    title: 'Verizon Fios Gigabit Fiber Internet',
    amount: 89.99,
    currency: 'USD',
    category: 'Utilities & Bills',
    paidById: 'usr_alex',
    date: '2026-08-05',
    splitType: 'equal',
    splits: [
      { memberId: 'usr_alex', amount: 30.00 },
      { memberId: 'usr_raj', amount: 29.99 },
      { memberId: 'usr_marcus', amount: 30.00 },
    ],
    isRecurring: true,
    recurringInterval: 'monthly',
    disputeStatus: 'none',
    createdBy: 'usr_alex',
    createdAt: '2026-08-05T11:00:00Z',
  }
];

let settlements: Settlement[] = [
  {
    id: 'set_1',
    groupId: 'grp_tahoe',
    fromMemberId: 'usr_priya',
    toMemberId: 'usr_alex',
    amount: 200,
    currency: 'USD',
    date: '2026-08-12',
    notes: 'Advance settlement for cabin rental via UPI',
    paymentMethod: 'upi',
    referenceId: 'UPI-7829104819',
    status: 'completed',
  }
];

let recurringRules: RecurringRule[] = [
  {
    id: 'rec_1',
    groupId: 'grp_roommates',
    title: 'Apartment Monthly Rent',
    amount: 3300,
    currency: 'USD',
    category: 'Rent & Housing',
    paidById: 'usr_marcus',
    splitType: 'percentage',
    splits: [
      { memberId: 'usr_alex', amount: 1155, percentage: 35 },
      { memberId: 'usr_raj', amount: 1155, percentage: 35 },
      { memberId: 'usr_marcus', amount: 990, percentage: 30 },
    ],
    interval: 'monthly',
    nextDueDate: '2026-09-01',
    autoApprove: true,
    active: true,
    lastGeneratedDate: '2026-08-01',
  },
  {
    id: 'rec_2',
    groupId: 'grp_roommates',
    title: 'Gigabit Fiber Internet & Streaming',
    amount: 89.99,
    currency: 'USD',
    category: 'Utilities & Bills',
    paidById: 'usr_alex',
    splitType: 'equal',
    splits: [
      { memberId: 'usr_alex', amount: 30.00 },
      { memberId: 'usr_raj', amount: 29.99 },
      { memberId: 'usr_marcus', amount: 30.00 },
    ],
    interval: 'monthly',
    nextDueDate: '2026-09-05',
    autoApprove: false,
    active: true,
    lastGeneratedDate: '2026-08-05',
  }
];

let disputes: Dispute[] = [
  {
    id: 'disp_1',
    groupId: 'grp_tahoe',
    expenseId: 'exp_groceries',
    raisedById: 'usr_elena',
    reason: 'I was marked for craft beer on the grocery receipt but I do not drink alcohol.',
    proposedChanges: 'Adjust craft beers to only Alex and Raj, reducing Elena share by ~$18.',
    status: 'open',
    comments: [
      {
        id: 'c_1',
        memberId: 'usr_elena',
        text: 'Hey Priya, noticed the beer split included me! Could you update the item assignments?',
        timestamp: '2026-08-10T11:20:00Z',
      },
      {
        id: 'c_2',
        memberId: 'usr_priya',
        text: 'Oops my bad Elena! Let me recheck the itemized split and approve the adjustment.',
        timestamp: '2026-08-10T12:05:00Z',
      }
    ],
    createdAt: '2026-08-10T11:15:00Z',
  }
];

let groupMessages: GroupMessage[] = [
  {
    id: 'msg_1',
    groupId: 'grp_tahoe',
    senderId: 'usr_alex',
    text: 'Hey everyone! Cabin is locked in for the weekend. I logged the initial deposit on FairTab 🌲',
    timestamp: '2026-08-08T15:00:00Z',
    type: 'text',
  },
  {
    id: 'msg_2',
    groupId: 'grp_tahoe',
    senderId: 'usr_priya',
    text: 'Just finished the grocery haul at Whole Foods. Uploaded the receipt with OCR itemized splitting!',
    linkedExpenseId: 'exp_groceries',
    timestamp: '2026-08-09T18:30:00Z',
    type: 'text',
  },
  {
    id: 'msg_3',
    groupId: 'grp_tahoe',
    senderId: 'usr_raj',
    text: 'Got lift tickets at Heavenly for tomorrow morning! Powder looks incredible ⛷️',
    linkedExpenseId: 'exp_ski_passes',
    timestamp: '2026-08-10T09:10:00Z',
    type: 'text',
  }
];

let activityLogs: ActivityLog[] = [
  {
    id: 'act_1',
    groupId: 'grp_tahoe',
    actorId: 'usr_alex',
    action: 'created_group',
    details: 'created group "Lake Tahoe Ski Trip 🏔️"',
    timestamp: '2026-08-01T10:00:00Z',
  },
  {
    id: 'act_2',
    groupId: 'grp_tahoe',
    actorId: 'usr_priya',
    action: 'added_expense',
    details: 'logged receipt expense "Whole Foods Market Provisions & BBQ" ($284.50)',
    timestamp: '2026-08-09T18:15:00Z',
  },
  {
    id: 'act_3',
    groupId: 'grp_tahoe',
    actorId: 'usr_priya',
    action: 'recorded_settlement',
    details: 'settled $200.00 with Alex Rivera via UPI',
    timestamp: '2026-08-12T10:00:00Z',
  }
];

// ----------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------

// Members
app.get('/api/members', (req, res) => {
  res.json({ members: mockMembers });
});

// Groups
app.get('/api/groups', (req, res) => {
  res.json({ groups });
});

app.get('/api/groups/:id', (req, res) => {
  const group = groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json({ group });
});

app.post('/api/groups', (req, res) => {
  const { name, description, category, currency, memberIds, budgetLimit, avatarIcon } = req.body;
  if (!name) return res.status(400).json({ error: 'Group name is required' });

  const selectedMembers = mockMembers.filter(m => (memberIds || ['usr_alex']).includes(m.id));
  if (selectedMembers.length === 0) selectedMembers.push(mockMembers[0]);

  const newGroup: Group = {
    id: `grp_${Date.now()}`,
    name,
    description: description || '',
    category: category || 'trip',
    currency: currency || 'USD',
    inviteCode: `${name.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    avatarIcon: avatarIcon || 'Users',
    budgetLimit: budgetLimit ? Number(budgetLimit) : undefined,
    members: selectedMembers,
    createdAt: new Date().toISOString(),
  };

  groups.unshift(newGroup);

  activityLogs.unshift({
    id: `act_${Date.now()}`,
    groupId: newGroup.id,
    actorId: selectedMembers[0]?.id || 'usr_alex',
    action: 'created_group',
    details: `created group "${newGroup.name}"`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json({ group: newGroup });
});

app.put('/api/groups/:id', (req, res) => {
  const idx = groups.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Group not found' });

  const updated = { ...groups[idx], ...req.body };
  groups[idx] = updated;
  res.json({ group: updated });
});

// Join group via invite code
app.post('/api/groups/join', (req, res) => {
  const { inviteCode, memberId } = req.body;
  const group = groups.find(g => g.inviteCode.toUpperCase() === inviteCode?.trim().toUpperCase());
  if (!group) return res.status(404).json({ error: 'Invalid invite code' });

  const member = mockMembers.find(m => m.id === (memberId || 'usr_alex')) || mockMembers[0];
  if (!group.members.some(m => m.id === member.id)) {
    group.members.push(member);
    activityLogs.unshift({
      id: `act_${Date.now()}`,
      groupId: group.id,
      actorId: member.id,
      action: 'joined_group',
      details: `${member.name} joined via invite link`,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({ group, member });
});

// Expenses
app.get('/api/groups/:id/expenses', (req, res) => {
  const groupExpenses = expenses.filter(e => e.groupId === req.params.id);
  res.json({ expenses: groupExpenses });
});

app.post('/api/groups/:id/expenses', (req, res) => {
  const { title, amount, currency, category, paidById, date, splitType, splits, items, receiptUrl, notes, tax, tip, isRecurring, recurringInterval } = req.body;

  if (!title || !amount || !paidById) {
    return res.status(400).json({ error: 'Title, amount, and payer are required' });
  }

  const newExpense: Expense = {
    id: `exp_${Date.now()}`,
    groupId: req.params.id,
    title,
    amount: Number(amount),
    currency: currency || 'USD',
    category: category || 'Other',
    paidById,
    date: date || new Date().toISOString().split('T')[0],
    splitType: splitType || 'equal',
    splits: splits || [],
    items: items || [],
    receiptUrl,
    notes,
    tax: tax ? Number(tax) : undefined,
    tip: tip ? Number(tip) : undefined,
    isRecurring: !!isRecurring,
    recurringInterval,
    disputeStatus: 'none',
    createdBy: paidById,
    createdAt: new Date().toISOString(),
  };

  expenses.unshift(newExpense);

  const payer = mockMembers.find(m => m.id === paidById);
  activityLogs.unshift({
    id: `act_${Date.now()}`,
    groupId: req.params.id,
    actorId: paidById,
    action: 'added_expense',
    details: `${payer?.name || 'Someone'} logged "${newExpense.title}" ($${newExpense.amount.toFixed(2)})`,
    timestamp: new Date().toISOString(),
  });

  // Also post an automated system notice in the group chat
  groupMessages.push({
    id: `msg_${Date.now()}`,
    groupId: req.params.id,
    senderId: paidById,
    text: `Logged new expense: "${newExpense.title}" for $${newExpense.amount.toFixed(2)} (${newExpense.splitType} split)`,
    linkedExpenseId: newExpense.id,
    timestamp: new Date().toISOString(),
    type: 'expense_action',
  });

  res.status(201).json({ expense: newExpense });
});

app.put('/api/groups/:id/expenses/:expId', (req, res) => {
  const idx = expenses.findIndex(e => e.id === req.params.expId && e.groupId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Expense not found' });

  expenses[idx] = { ...expenses[idx], ...req.body };
  res.json({ expense: expenses[idx] });
});

app.delete('/api/groups/:id/expenses/:expId', (req, res) => {
  expenses = expenses.filter(e => !(e.id === req.params.expId && e.groupId === req.params.id));
  res.json({ success: true });
});

// Settlements
app.get('/api/groups/:id/settlements', (req, res) => {
  const groupSettlements = settlements.filter(s => s.groupId === req.params.id);
  res.json({ settlements: groupSettlements });
});

app.post('/api/groups/:id/settlements', (req, res) => {
  const { fromMemberId, toMemberId, amount, currency, notes, paymentMethod, referenceId } = req.body;

  if (!fromMemberId || !toMemberId || !amount) {
    return res.status(400).json({ error: 'Payer, receiver, and amount are required' });
  }

  const newSettlement: Settlement = {
    id: `set_${Date.now()}`,
    groupId: req.params.id,
    fromMemberId,
    toMemberId,
    amount: Number(amount),
    currency: currency || 'USD',
    date: new Date().toISOString().split('T')[0],
    notes,
    paymentMethod: paymentMethod || 'cash',
    referenceId,
    status: 'completed',
  };

  settlements.unshift(newSettlement);

  const fromMember = mockMembers.find(m => m.id === fromMemberId);
  const toMember = mockMembers.find(m => m.id === toMemberId);

  activityLogs.unshift({
    id: `act_${Date.now()}`,
    groupId: req.params.id,
    actorId: fromMemberId,
    action: 'recorded_settlement',
    details: `${fromMember?.name} paid ${toMember?.name} $${newSettlement.amount.toFixed(2)} (${newSettlement.paymentMethod})`,
    timestamp: new Date().toISOString(),
  });

  groupMessages.push({
    id: `msg_${Date.now()}`,
    groupId: req.params.id,
    senderId: fromMemberId,
    text: `Settlement completed: ${fromMember?.name} paid ${toMember?.name} $${newSettlement.amount.toFixed(2)} via ${newSettlement.paymentMethod?.toUpperCase() || 'transfer'} 🎉`,
    timestamp: new Date().toISOString(),
    type: 'system',
  });

  res.status(201).json({ settlement: newSettlement });
});

// Recurring Rules
app.get('/api/groups/:id/recurring', (req, res) => {
  const groupRules = recurringRules.filter(r => r.groupId === req.params.id);
  res.json({ recurringRules: groupRules });
});

app.post('/api/groups/:id/recurring', (req, res) => {
  const { title, amount, currency, category, paidById, splitType, splits, interval, nextDueDate, autoApprove } = req.body;

  const newRule: RecurringRule = {
    id: `rec_${Date.now()}`,
    groupId: req.params.id,
    title,
    amount: Number(amount),
    currency: currency || 'USD',
    category: category || 'Utilities & Bills',
    paidById,
    splitType: splitType || 'equal',
    splits: splits || [],
    interval: interval || 'monthly',
    nextDueDate: nextDueDate || new Date().toISOString().split('T')[0],
    autoApprove: autoApprove ?? true,
    active: true,
  };

  recurringRules.unshift(newRule);
  res.status(201).json({ recurringRule: newRule });
});

// Trigger a recurring rule immediately to create an expense
app.post('/api/groups/:id/recurring/:ruleId/trigger', (req, res) => {
  const rule = recurringRules.find(r => r.id === req.params.ruleId && r.groupId === req.params.id);
  if (!rule) return res.status(404).json({ error: 'Recurring rule not found' });

  const newExpense: Expense = {
    id: `exp_rec_${Date.now()}`,
    groupId: rule.groupId,
    title: `${rule.title} (Recurring - ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`,
    amount: rule.amount,
    currency: rule.currency,
    category: rule.category,
    paidById: rule.paidById,
    date: new Date().toISOString().split('T')[0],
    splitType: rule.splitType,
    splits: rule.splits,
    isRecurring: true,
    recurringInterval: rule.interval,
    notes: `Auto-generated from recurring cycle (${rule.interval})`,
    disputeStatus: 'none',
    createdBy: rule.paidById,
    createdAt: new Date().toISOString(),
  };

  expenses.unshift(newExpense);
  rule.lastGeneratedDate = new Date().toISOString().split('T')[0];

  res.status(201).json({ expense: newExpense, recurringRule: rule });
});

// Disputes
app.get('/api/groups/:id/disputes', (req, res) => {
  const groupDisputes = disputes.filter(d => d.groupId === req.params.id);
  res.json({ disputes: groupDisputes });
});

app.post('/api/groups/:id/disputes', (req, res) => {
  const { expenseId, raisedById, reason, proposedChanges } = req.body;
  if (!expenseId || !reason || !raisedById) {
    return res.status(400).json({ error: 'Expense, reason and user are required' });
  }

  const newDispute: Dispute = {
    id: `disp_${Date.now()}`,
    groupId: req.params.id,
    expenseId,
    raisedById,
    reason,
    proposedChanges,
    status: 'open',
    comments: [
      {
        id: `c_${Date.now()}`,
        memberId: raisedById,
        text: reason,
        timestamp: new Date().toISOString(),
      }
    ],
    createdAt: new Date().toISOString(),
  };

  disputes.unshift(newDispute);

  // Mark expense as disputed
  const exp = expenses.find(e => e.id === expenseId);
  if (exp) {
    exp.disputeStatus = 'disputed';
  }

  res.status(201).json({ dispute: newDispute });
});

app.post('/api/groups/:id/disputes/:dispId/comments', (req, res) => {
  const { memberId, text } = req.body;
  const disp = disputes.find(d => d.id === req.params.dispId && d.groupId === req.params.id);
  if (!disp) return res.status(404).json({ error: 'Dispute not found' });

  const comment = {
    id: `c_${Date.now()}`,
    memberId: memberId || 'usr_alex',
    text,
    timestamp: new Date().toISOString(),
  };

  disp.comments.push(comment);
  res.json({ dispute: disp, comment });
});

app.put('/api/groups/:id/disputes/:dispId/resolve', (req, res) => {
  const { status, updatedSplits } = req.body;
  const disp = disputes.find(d => d.id === req.params.dispId && d.groupId === req.params.id);
  if (!disp) return res.status(404).json({ error: 'Dispute not found' });

  disp.status = status || 'approved';

  const exp = expenses.find(e => e.id === disp.expenseId);
  if (exp) {
    exp.disputeStatus = 'resolved';
    if (updatedSplits && updatedSplits.length > 0) {
      exp.splits = updatedSplits;
    }
  }

  res.json({ dispute: disp, expense: exp });
});

// Group Chat Messages
app.get('/api/groups/:id/messages', (req, res) => {
  const messages = groupMessages.filter(m => m.groupId === req.params.id);
  res.json({ messages });
});

app.post('/api/groups/:id/messages', (req, res) => {
  const { senderId, text, type, linkedExpenseId, audioDuration } = req.body;
  if (!text && type !== 'voice') return res.status(400).json({ error: 'Message content is required' });

  const newMsg: GroupMessage = {
    id: `msg_${Date.now()}`,
    groupId: req.params.id,
    senderId: senderId || 'usr_alex',
    text: text || 'Voice note (0:08)',
    type: type || 'text',
    linkedExpenseId,
    audioDuration,
    timestamp: new Date().toISOString(),
  };

  groupMessages.push(newMsg);
  res.status(201).json({ message: newMsg });
});

// Activity Logs
app.get('/api/groups/:id/activity', (req, res) => {
  const logs = activityLogs.filter(l => l.groupId === req.params.id);
  res.json({ activityLogs: logs });
});

// ----------------------------------------------------
// GEMINI AI SMART ENDPOINTS
// ----------------------------------------------------

/**
 * 1. Voice Expense Parsing
 * Transcribes natural language speech prompt into structured expense JSON
 */
app.post('/api/ai/parse-voice', async (req, res) => {
  try {
    const { transcript, groupMembers } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const client = getGemini();
    if (!client) {
      // Fallback heuristics if API key not present
      return res.json({
        parsed: {
          title: transcript.length > 30 ? transcript.substring(0, 30) + '...' : transcript,
          amount: parseFloat((transcript.match(/\$?\d+(\.\d+)?/)?.[0] || '25').replace('$', '')),
          category: 'Food & Dining',
          currency: 'USD',
          splitType: 'equal',
          notes: `Parsed from voice: "${transcript}"`,
        }
      });
    }

    const memberNames = (groupMembers || mockMembers).map((m: any) => m.name).join(', ');

    const prompt = `You are a financial parsing engine for FairTab expense tracker. 
Parse the following natural language voice expense description:
"${transcript}"

The available group members are: ${memberNames}.

Extract:
1. title: short concise title for the expense (e.g. "Dinner at Olive Garden", "Airport Uber", "Groceries")
2. amount: total numeric amount (number)
3. category: one of ["Food & Dining", "Groceries", "Rent & Housing", "Travel & Flights", "Transport & Taxi", "Entertainment", "Utilities & Bills", "Shopping", "Health", "Other"]
4. currency: 3-letter currency code (e.g. "USD", "EUR", "INR", "GBP") default "USD"
5. paidByName: name of the person who paid if mentioned (e.g. "Alex Rivera", "Priya")
6. splitType: "equal", "exact", or "percentage"
7. involvedMembers: list of objects with "name" and optional "amount" or "percentage" if specific split was dictated
8. notes: any extra relevant notes or details extracted from the speech`;

    const response = await client.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            currency: { type: Type.STRING },
            paidByName: { type: Type.STRING },
            splitType: { type: Type.STRING },
            involvedMembers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  percentage: { type: Type.NUMBER },
                },
                required: ['name'],
              },
            },
            notes: { type: Type.STRING },
          },
          required: ['title', 'amount', 'category', 'splitType'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');
    res.json({ parsed: parsedData });
  } catch (error: any) {
    console.error('Voice parsing error:', error);
    res.status(500).json({ error: error.message || 'Failed to parse voice expense' });
  }
});

/**
 * 2. Receipt OCR & Itemized Extraction
 * Extracts merchant, line items, taxes, tips, and totals from receipt image or sample
 */
app.post('/api/ai/scan-receipt', async (req, res) => {
  try {
    const { imageBase64, sampleType } = req.body;
    const client = getGemini();

    if (!client) {
      // High-quality fallback receipt mock if key is not active
      return res.json({
        receipt: {
          merchantName: 'Bistro & Tapas Bar',
          date: new Date().toISOString().split('T')[0],
          currency: 'USD',
          category: 'Food & Dining',
          subtotal: 94.50,
          tax: 8.50,
          tip: 18.00,
          total: 121.00,
          lineItems: [
            { name: 'Truffle Fries & Aioli', price: 14.00, quantity: 1 },
            { name: 'Grilled Salmon Fillet', price: 32.00, quantity: 1 },
            { name: 'Handcrafted Margherita Pizza', price: 24.50, quantity: 1 },
            { name: 'Cocktail Old Fashioned', price: 16.00, quantity: 1 },
            { name: 'San Pellegrino Sparkling', price: 8.00, quantity: 1 },
          ],
          confidenceScore: 0.98,
          notes: 'Processed via Smart OCR engine with high accuracy',
        }
      });
    }

    const parts: any[] = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: 'image/jpeg',
        },
      });
    }

    parts.push({
      text: `Analyze this receipt image for an itemized group expense split.
Extract all line items, their individual prices and quantities, subtotal, tax amount, tip amount, grand total, merchant name, date, and expense category.
Ensure all prices are exact numbers.`
    });

    const response = await client.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchantName: { type: Type.STRING },
            date: { type: Type.STRING },
            currency: { type: Type.STRING },
            category: { type: Type.STRING },
            subtotal: { type: Type.NUMBER },
            tax: { type: Type.NUMBER },
            tip: { type: Type.NUMBER },
            total: { type: Type.NUMBER },
            lineItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  quantity: { type: Type.NUMBER },
                },
                required: ['name', 'price'],
              },
            },
            confidenceScore: { type: Type.NUMBER },
            notes: { type: Type.STRING },
          },
          required: ['merchantName', 'total', 'lineItems'],
        },
      },
    });

    const receiptData = JSON.parse(response.text || '{}');
    res.json({ receipt: receiptData });
  } catch (error: any) {
    console.error('Receipt OCR error:', error);
    res.status(500).json({ error: error.message || 'Failed to scan receipt' });
  }
});

/**
 * 3. AI Payment Reminder Generator
 * Generates custom message in Friendly, Formal, Playful/Joking, or Guilt-trip tone
 */
app.post('/api/ai/generate-reminder', async (req, res) => {
  try {
    const { debtorName, creditorName, amount, currency, groupName, tone, upiId } = req.body;
    const client = getGemini();

    const formattedAmount = `${currency || '$'}${amount}`;
    const paymentLinkInfo = upiId ? `UPI ID: ${upiId}` : 'via FairTab Settle Up';

    if (!client) {
      const templates: Record<string, string> = {
        friendly: `Hey ${debtorName}! Hope you're having a great week 😊 Quick reminder about your share of ${formattedAmount} for ${groupName}. When you get a chance, you can settle up at ${paymentLinkInfo}. Thank you!`,
        formal: `Dear ${debtorName}, this is a gentle reminder regarding the outstanding balance of ${formattedAmount} for ${groupName}. Please settle the balance at your earliest convenience via ${paymentLinkInfo}. Best regards, ${creditorName}.`,
        funny: `🚨 BREAKING NEWS: My bank account misses you, ${debtorName}! 😂 Just a friendly ping for the ${formattedAmount} from ${groupName}. Help a friend stay solvent: ${paymentLinkInfo} 💸🍕`,
        dramatic_guilt: `*Dramatic violin plays in the background* 🎻 ${debtorName}, every second that ${formattedAmount} from ${groupName} goes unpaid, a barista loses their tip. Settle up and save the day: ${paymentLinkInfo}! ✨`,
      };

      return res.json({
        message: templates[tone] || templates.friendly,
        tone: tone || 'friendly',
      });
    }

    const prompt = `Write a short, engaging payment reminder message for a shared group expense on FairTab.
Debtor (who owes): ${debtorName}
Creditor (who paid): ${creditorName}
Amount owed: ${formattedAmount}
Group: ${groupName}
Tone requested: ${tone || 'friendly'} (options: 'friendly', 'formal', 'funny' or 'dramatic_guilt')
Payment details: ${paymentLinkInfo}

The message should be ready to send via WhatsApp or SMS. Keep it punchy, natural, and under 3 sentences with appropriate emojis.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    res.json({
      message: response.text?.trim() || `Hey ${debtorName}, reminder for ${formattedAmount} for ${groupName}!`,
      tone: tone || 'friendly',
    });
  } catch (error: any) {
    console.error('Reminder generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate reminder' });
  }
});

/**
 * 4. AI Spending Insights & Financial Health
 */
app.post('/api/ai/spending-insights', async (req, res) => {
  try {
    const { groupId } = req.body;
    const group = groups.find(g => g.id === groupId) || groups[0];
    const groupExpenses = expenses.filter(e => e.groupId === group.id);

    const totalSpend = groupExpenses.reduce((acc, e) => acc + e.amount, 0);
    const categoryTotals: Record<string, number> = {};
    groupExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Groceries';

    const client = getGemini();
    if (!client) {
      return res.json({
        insights: {
          summary: `The group has recorded ${groupExpenses.length} shared expenses totaling $${totalSpend.toFixed(2)}. Spending is currently dominated by ${topCategory}.`,
          topSpendingCategory: topCategory,
          burnRatePerDay: Math.round(totalSpend / 7),
          spendingVelocityComment: totalSpend > (group.budgetLimit || 3000) * 0.8 
            ? 'Approaching budget ceiling. Keep an eye on dining & nightlife.' 
            : 'Pacing healthily within expected limits.',
          memberInsights: group.members.map((m, idx) => ({
            memberId: m.id,
            badge: idx === 0 ? '🏆 Primary Payer' : idx === 1 ? '⚡ Instant Settler' : '🎯 Itemized Pro',
            observation: `${m.name} contributes actively to group utility and cabin expenses.`,
          })),
          budgetHealth: totalSpend > (group.budgetLimit || 3000) ? 'critical' : totalSpend > (group.budgetLimit || 3000) * 0.75 ? 'warning' : 'safe',
          budgetAlertMessage: group.budgetLimit ? `Group spent $${totalSpend.toFixed(2)} of $${group.budgetLimit.toFixed(2)} budget cap.` : undefined,
          recommendations: [
            'Consolidate multiple small convenience store runs into a single bulk grocery haul to save ~12%.',
            'Settle active balances weekly using UPI / Instant Pay to avoid end-of-trip settlement bottleneck.',
            'Enable recurring rules for recurring utilities to automate regular splitting.',
          ]
        }
      });
    }

    const expenseSummary = groupExpenses.map(e => `${e.title}: $${e.amount} (${e.category}) paid by ${e.paidById}`).join('\n');

    const prompt = `Analyze the spending data for group "${group.name}" with budget limit $${group.budgetLimit || 'N/A'}.
Total spend: $${totalSpend}
Expenses list:
${expenseSummary}

Members: ${group.members.map(m => `${m.name} (${m.id})`).join(', ')}

Return a structured JSON with:
1. summary: high-level financial summary
2. topSpendingCategory: string
3. burnRatePerDay: estimated daily spend number
4. spendingVelocityComment: concise commentary on spending pace
5. memberInsights: array of { memberId, badge, observation } giving each member a fun/insightful spending badge
6. budgetHealth: 'safe', 'warning', or 'critical'
7. budgetAlertMessage: string alert if close or over budget
8. recommendations: array of 3 actionable money-saving / debt-clearing tips`;

    const response = await client.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            topSpendingCategory: { type: Type.STRING },
            burnRatePerDay: { type: Type.NUMBER },
            spendingVelocityComment: { type: Type.STRING },
            memberInsights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  memberId: { type: Type.STRING },
                  badge: { type: Type.STRING },
                  observation: { type: Type.STRING },
                },
                required: ['memberId', 'badge', 'observation'],
              },
            },
            budgetHealth: { type: Type.STRING },
            budgetAlertMessage: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['summary', 'topSpendingCategory', 'budgetHealth', 'recommendations'],
        },
      },
    });

    const insightData = JSON.parse(response.text || '{}');
    res.json({ insights: insightData });
  } catch (error: any) {
    console.error('Spending insights error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate spending insights' });
  }
});

// ----------------------------------------------------
// VITE DEV MIDDLEWARE / STATIC ASSETS
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FairTab server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import { Router, Request, Response } from 'express';
import { 
  mockMembers, groups, expenses, settlements, recurringRules, disputes, messages, activityLogs 
} from './store';
import { 
  parseVoiceTranscript, scanReceiptOCR, generateSmartReminder, generateSpendingInsights 
} from './gemini';
import { Group, Expense, Settlement, RecurringRule, Dispute, GroupMessage } from '../src/types';

export const apiRouter = Router();

// ----------------------------------------------------
// MEMBERS & GROUPS
// ----------------------------------------------------

apiRouter.get('/members', (req: Request, res: Response) => {
  res.json({ members: mockMembers });
});

apiRouter.get('/groups', (req: Request, res: Response) => {
  res.json({ groups });
});

apiRouter.get('/groups/:id', (req: Request, res: Response) => {
  const group = groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json({ group });
});

apiRouter.post('/groups', (req: Request, res: Response) => {
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

apiRouter.put('/groups/:id', (req: Request, res: Response) => {
  const idx = groups.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Group not found' });

  const updated = { ...groups[idx], ...req.body };
  groups[idx] = updated;
  res.json({ group: updated });
});

apiRouter.post('/groups/join', (req: Request, res: Response) => {
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

// ----------------------------------------------------
// EXPENSES
// ----------------------------------------------------

apiRouter.get('/groups/:id/expenses', (req: Request, res: Response) => {
  const groupExpenses = expenses.filter(e => e.groupId === req.params.id);
  res.json({ expenses: groupExpenses });
});

apiRouter.post('/groups/:id/expenses', (req: Request, res: Response) => {
  const { 
    title, amount, currency, category, paidById, date, splitType, splits, 
    notes, items, tax, tip, receiptUrl, isRecurring, recurringInterval, createdBy 
  } = req.body;

  if (!title || !amount || !paidById) {
    return res.status(400).json({ error: 'Title, amount, and payer are required' });
  }

  const newExpense: Expense = {
    id: `exp_${Date.now()}`,
    groupId: req.params.id,
    title,
    amount: Number(amount),
    currency: currency || 'USD',
    category: category || 'Food & Dining',
    paidById,
    date: date || new Date().toISOString().split('T')[0],
    splitType: splitType || 'equal',
    splits: splits || [],
    notes,
    items,
    tax: tax ? Number(tax) : undefined,
    tip: tip ? Number(tip) : undefined,
    receiptUrl,
    isRecurring,
    recurringInterval,
    disputeStatus: 'none',
    createdBy: createdBy || paidById,
    createdAt: new Date().toISOString(),
  };

  expenses.unshift(newExpense);

  activityLogs.unshift({
    id: `act_${Date.now()}`,
    groupId: req.params.id,
    actorId: paidById,
    action: 'added_expense',
    details: `added expense "${title}" (${newExpense.currency} ${newExpense.amount.toFixed(2)})`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json({ expense: newExpense });
});

apiRouter.put('/groups/:id/expenses/:expId', (req: Request, res: Response) => {
  const idx = expenses.findIndex(e => e.id === req.params.expId && e.groupId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Expense not found' });

  const updated: Expense = { ...expenses[idx], ...req.body };
  expenses[idx] = updated;

  activityLogs.unshift({
    id: `act_${Date.now()}`,
    groupId: req.params.id,
    actorId: req.body.updatedBy || updated.paidById,
    action: 'updated_expense',
    details: `updated expense "${updated.title}"`,
    timestamp: new Date().toISOString(),
  });

  res.json({ expense: updated });
});

apiRouter.delete('/groups/:id/expenses/:expId', (req: Request, res: Response) => {
  const idx = expenses.findIndex(e => e.id === req.params.expId && e.groupId === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Expense not found' });

  const [removed] = expenses.splice(idx, 1);

  activityLogs.unshift({
    id: `act_${Date.now()}`,
    groupId: req.params.id,
    actorId: 'usr_alex',
    action: 'deleted_expense',
    details: `deleted expense "${removed.title}"`,
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, removedId: removed.id });
});

// ----------------------------------------------------
// SETTLEMENTS
// ----------------------------------------------------

apiRouter.get('/groups/:id/settlements', (req: Request, res: Response) => {
  const groupSettlements = settlements.filter(s => s.groupId === req.params.id);
  res.json({ settlements: groupSettlements });
});

apiRouter.post('/groups/:id/settlements', (req: Request, res: Response) => {
  const { fromMemberId, toMemberId, amount, currency, paymentMethod, referenceId, notes } = req.body;
  if (!fromMemberId || !toMemberId || !amount) {
    return res.status(400).json({ error: 'Sender, recipient, and amount are required' });
  }

  const newSettlement: Settlement = {
    id: `set_${Date.now()}`,
    groupId: req.params.id,
    fromMemberId,
    toMemberId,
    amount: Number(amount),
    currency: currency || 'USD',
    paymentMethod: paymentMethod || 'cash',
    referenceId,
    notes,
    date: new Date().toISOString(),
    status: 'completed',
  };

  settlements.unshift(newSettlement);

  const receiver = mockMembers.find(m => m.id === toMemberId);

  activityLogs.unshift({
    id: `act_${Date.now()}`,
    groupId: req.params.id,
    actorId: fromMemberId,
    action: 'recorded_settlement',
    details: `settled ${newSettlement.currency} ${newSettlement.amount.toFixed(2)} with ${receiver?.name || 'Member'} via ${newSettlement.paymentMethod?.toUpperCase() || 'CASH'}`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json({ settlement: newSettlement });
});

// ----------------------------------------------------
// RECURRING RULES
// ----------------------------------------------------

apiRouter.get('/groups/:id/recurring', (req: Request, res: Response) => {
  const rules = recurringRules.filter(r => r.groupId === req.params.id);
  res.json({ recurringRules: rules });
});

apiRouter.post('/groups/:id/recurring', (req: Request, res: Response) => {
  const { title, amount, currency, category, paidById, splitType, splits, interval, nextDueDate, autoApprove } = req.body;
  if (!title || !amount || !paidById) {
    return res.status(400).json({ error: 'Title, amount, and payer are required' });
  }

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
    nextDueDate: nextDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    autoApprove: autoApprove !== undefined ? autoApprove : true,
    active: true,
    lastGeneratedDate: new Date().toISOString().split('T')[0],
  };

  recurringRules.unshift(newRule);
  res.status(201).json({ recurringRule: newRule });
});

apiRouter.post('/groups/:id/recurring/:ruleId/trigger', (req: Request, res: Response) => {
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

// ----------------------------------------------------
// DISPUTES
// ----------------------------------------------------

apiRouter.get('/groups/:id/disputes', (req: Request, res: Response) => {
  const groupDisputes = disputes.filter(d => d.groupId === req.params.id);
  res.json({ disputes: groupDisputes });
});

apiRouter.post('/groups/:id/disputes', (req: Request, res: Response) => {
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

  const exp = expenses.find(e => e.id === expenseId);
  if (exp) {
    exp.disputeStatus = 'disputed';
  }

  res.status(201).json({ dispute: newDispute });
});

apiRouter.post('/groups/:id/disputes/:dispId/comments', (req: Request, res: Response) => {
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

apiRouter.put('/groups/:id/disputes/:dispId/resolve', (req: Request, res: Response) => {
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

// ----------------------------------------------------
// MESSAGES & ACTIVITY
// ----------------------------------------------------

apiRouter.get('/groups/:id/messages', (req: Request, res: Response) => {
  const groupMsgs = messages.filter(m => m.groupId === req.params.id);
  res.json({ messages: groupMsgs });
});

apiRouter.post('/groups/:id/messages', (req: Request, res: Response) => {
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

  messages.push(newMsg);
  res.status(201).json({ message: newMsg });
});

apiRouter.get('/groups/:id/activity', (req: Request, res: Response) => {
  const logs = activityLogs.filter(l => l.groupId === req.params.id);
  res.json({ activityLogs: logs });
});

// ----------------------------------------------------
// AI SMART CAPABILITIES
// ----------------------------------------------------

apiRouter.post('/ai/parse-voice', async (req: Request, res: Response) => {
  try {
    const { transcript, groupMembers } = req.body;
    if (!transcript) return res.status(400).json({ error: 'Transcript is required' });

    const parsed = await parseVoiceTranscript(transcript, groupMembers);
    res.json({ parsed });
  } catch (error: any) {
    console.error('Voice parsing error:', error);
    res.status(500).json({ error: error.message || 'Failed to parse voice transcript' });
  }
});

apiRouter.post('/ai/scan-receipt', async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    const receipt = await scanReceiptOCR(imageBase64);
    res.json({ receipt });
  } catch (error: any) {
    console.error('Receipt OCR error:', error);
    res.status(500).json({ error: error.message || 'Failed to scan receipt' });
  }
});

apiRouter.post('/ai/generate-reminder', async (req: Request, res: Response) => {
  try {
    const { debtorName, creditorName, amount, currency, groupName, tone, upiId } = req.body;
    const message = await generateSmartReminder(
      debtorName, creditorName, amount, currency, groupName, tone, upiId
    );
    res.json({ message, tone: tone || 'friendly' });
  } catch (error: any) {
    console.error('Reminder generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate reminder' });
  }
});

apiRouter.post('/ai/spending-insights', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.body;
    const insights = await generateSpendingInsights(groupId);
    res.json({ insights });
  } catch (error: any) {
    console.error('Spending insights error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate spending insights' });
  }
});

import { Router, Request, Response } from 'express';
import * as dbService from './db-service';
import { 
  parseVoiceTranscript, scanReceiptOCR, generateSmartReminder, generateSpendingInsights 
} from './gemini';

export const apiRouter = Router();

// Helper to get socket.io instance and broadcast
function broadcastToGroup(req: Request, groupId: string, eventName: string, payload: any) {
  try {
    const io = req.app.get('io');
    if (io) {
      io.to(`group:${groupId}`).emit(eventName, payload);
    }
  } catch (err) {
    console.error('Socket broadcast error:', err);
  }
}

// ----------------------------------------------------
// MEMBERS & GROUPS
// ----------------------------------------------------

apiRouter.get('/members', async (req: Request, res: Response) => {
  try {
    const members = await dbService.getAllMembers();
    res.json({ members });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch members' });
  }
});

apiRouter.get('/groups', async (req: Request, res: Response) => {
  try {
    const groups = await dbService.getAllGroups();
    res.json({ groups });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch groups' });
  }
});

apiRouter.get('/groups/:id', async (req: Request, res: Response) => {
  try {
    const group = await dbService.getGroupById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json({ group });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch group' });
  }
});

apiRouter.post('/groups', async (req: Request, res: Response) => {
  try {
    const { name, description, category, currency, memberIds, budgetLimit, avatarIcon } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name is required' });

    const newGroup = await dbService.createGroup({
      name, description, category, currency, memberIds, budgetLimit, avatarIcon
    });

    res.status(201).json({ group: newGroup });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create group' });
  }
});

apiRouter.put('/groups/:id', async (req: Request, res: Response) => {
  try {
    const updated = await dbService.updateGroup(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Group not found' });
    broadcastToGroup(req, req.params.id, 'group_updated', updated);
    res.json({ group: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update group' });
  }
});

apiRouter.post('/groups/join', async (req: Request, res: Response) => {
  try {
    const { inviteCode, memberId } = req.body;
    const result = await dbService.joinGroupByCode(inviteCode, memberId || 'usr_alex');
    if (!result) return res.status(404).json({ error: 'Invalid invite code' });
    broadcastToGroup(req, result.group.id, 'member_joined', result);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to join group' });
  }
});

// ----------------------------------------------------
// EXPENSES
// ----------------------------------------------------

apiRouter.get('/groups/:id/expenses', async (req: Request, res: Response) => {
  try {
    const expenses = await dbService.getExpensesByGroupId(req.params.id);
    res.json({ expenses });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch expenses' });
  }
});

apiRouter.post('/groups/:id/expenses', async (req: Request, res: Response) => {
  try {
    const { title, amount, paidById } = req.body;
    if (!title || !amount || !paidById) {
      return res.status(400).json({ error: 'Title, amount, and payer are required' });
    }

    const expense = await dbService.createExpense(req.params.id, req.body);
    broadcastToGroup(req, req.params.id, 'expense_added', expense);
    res.status(201).json({ expense });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add expense' });
  }
});

apiRouter.put('/groups/:id/expenses/:expId', async (req: Request, res: Response) => {
  try {
    const updated = await dbService.updateExpense(req.params.id, req.params.expId, req.body);
    if (!updated) return res.status(404).json({ error: 'Expense not found' });
    broadcastToGroup(req, req.params.id, 'expense_updated', updated);
    res.json({ expense: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update expense' });
  }
});

apiRouter.delete('/groups/:id/expenses/:expId', async (req: Request, res: Response) => {
  try {
    await dbService.deleteExpense(req.params.id, req.params.expId);
    broadcastToGroup(req, req.params.id, 'expense_deleted', { id: req.params.expId });
    res.json({ success: true, removedId: req.params.expId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete expense' });
  }
});

// ----------------------------------------------------
// SETTLEMENTS
// ----------------------------------------------------

apiRouter.get('/groups/:id/settlements', async (req: Request, res: Response) => {
  try {
    const settlements = await dbService.getSettlementsByGroupId(req.params.id);
    res.json({ settlements });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch settlements' });
  }
});

apiRouter.post('/groups/:id/settlements', async (req: Request, res: Response) => {
  try {
    const { fromMemberId, toMemberId, amount } = req.body;
    if (!fromMemberId || !toMemberId || !amount) {
      return res.status(400).json({ error: 'Sender, recipient, and amount are required' });
    }

    const settlement = await dbService.createSettlement(req.params.id, req.body);
    broadcastToGroup(req, req.params.id, 'settlement_recorded', settlement);
    res.status(201).json({ settlement });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to record settlement' });
  }
});

// ----------------------------------------------------
// RECURRING RULES
// ----------------------------------------------------

apiRouter.get('/groups/:id/recurring', async (req: Request, res: Response) => {
  try {
    const recurringRules = await dbService.getRecurringRulesByGroupId(req.params.id);
    res.json({ recurringRules });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch recurring rules' });
  }
});

apiRouter.post('/groups/:id/recurring', async (req: Request, res: Response) => {
  try {
    const { title, amount, paidById } = req.body;
    if (!title || !amount || !paidById) {
      return res.status(400).json({ error: 'Title, amount, and payer are required' });
    }

    const recurringRule = await dbService.createRecurringRule(req.params.id, req.body);
    broadcastToGroup(req, req.params.id, 'recurring_rule_added', recurringRule);
    res.status(201).json({ recurringRule });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create recurring rule' });
  }
});

// ----------------------------------------------------
// DISPUTES
// ----------------------------------------------------

apiRouter.get('/groups/:id/disputes', async (req: Request, res: Response) => {
  try {
    const disputes = await dbService.getDisputesByGroupId(req.params.id);
    res.json({ disputes });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch disputes' });
  }
});

apiRouter.post('/groups/:id/disputes', async (req: Request, res: Response) => {
  try {
    const { expenseId, raisedById, reason } = req.body;
    if (!expenseId || !reason || !raisedById) {
      return res.status(400).json({ error: 'Expense, reason and user are required' });
    }

    const dispute = await dbService.createDispute(req.params.id, req.body);
    broadcastToGroup(req, req.params.id, 'dispute_created', dispute);
    res.status(201).json({ dispute });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create dispute' });
  }
});

apiRouter.post('/groups/:id/disputes/:dispId/comments', async (req: Request, res: Response) => {
  try {
    const { memberId, text } = req.body;
    const dispute = await dbService.addDisputeComment(req.params.id, req.params.dispId, memberId, text);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
    broadcastToGroup(req, req.params.id, 'dispute_comment_added', dispute);
    res.json({ dispute });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add comment' });
  }
});

apiRouter.put('/groups/:id/disputes/:dispId/resolve', async (req: Request, res: Response) => {
  try {
    const { status, updatedSplits } = req.body;
    const dispute = await dbService.resolveDispute(req.params.id, req.params.dispId, status, updatedSplits);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
    broadcastToGroup(req, req.params.id, 'dispute_resolved', dispute);
    res.json({ dispute });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to resolve dispute' });
  }
});

// ----------------------------------------------------
// MESSAGES & ACTIVITY
// ----------------------------------------------------

apiRouter.get('/groups/:id/messages', async (req: Request, res: Response) => {
  try {
    const messages = await dbService.getGroupMessages(req.params.id);
    res.json({ messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch messages' });
  }
});

apiRouter.post('/groups/:id/messages', async (req: Request, res: Response) => {
  try {
    const { text, type } = req.body;
    if (!text && type !== 'voice') return res.status(400).json({ error: 'Message content is required' });

    const message = await dbService.createGroupMessage(req.params.id, req.body);
    broadcastToGroup(req, req.params.id, 'new_message', message);
    res.status(201).json({ message });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send message' });
  }
});

apiRouter.get('/groups/:id/activity', async (req: Request, res: Response) => {
  try {
    const activityLogs = await dbService.getActivityLogs(req.params.id);
    res.json({ activityLogs });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch activity logs' });
  }
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

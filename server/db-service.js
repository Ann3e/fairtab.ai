import { db } from '../src/db/index.js';
import { 
  members, groups, groupMembers, expenses, expenseSplits, expenseItems, 
  settlements, recurringRules, disputes, disputeComments, groupMessages, activityLogs 
} from '../src/db/schema.js';
import { eq, desc } from 'drizzle-orm';

// ----------------------------------------------------
// MEMBERS & GROUPS
// ----------------------------------------------------

export async function getAllMembers() {
  try {
    const list = await db.select().from(members);
    return list.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      avatar: m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      upiId: m.upiId || undefined,
      paypalHandle: m.paypalHandle || undefined,
      phone: m.phone || undefined,
      color: m.color || '#3B82F6',
    }));
  } catch (err) {
    console.error('Error fetching members from DB:', err);
    return [];
  }
}

export async function getAllGroups() {
  try {
    const allGroups = await db.select().from(groups);
    const allGroupMembers = await db.select().from(groupMembers);
    const allMembersList = await getAllMembers();

    return allGroups.map(g => {
      const memberIds = allGroupMembers.filter(gm => gm.groupId === g.id).map(gm => gm.memberId);
      const groupMemberList = allMembersList.filter(m => memberIds.includes(m.id));

      const fallbackMember = allMembersList[0] || {
        id: 'usr_alex',
        name: 'Alex Rivera',
        email: 'alex@example.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        color: '#3B82F6',
      };

      return {
        id: g.id,
        name: g.name,
        description: g.description || '',
        category: g.category || 'trip',
        currency: g.currency || 'USD',
        inviteCode: g.inviteCode,
        avatarIcon: g.avatarIcon || 'Users',
        budgetLimit: g.budgetLimit ? Number(g.budgetLimit) : undefined,
        createdAt: g.createdAt ? g.createdAt.toISOString() : new Date().toISOString(),
        members: groupMemberList.length > 0 ? groupMemberList : [fallbackMember],
      };
    });
  } catch (err) {
    console.error('Error fetching groups from DB:', err);
    return [];
  }
}

export async function getGroupById(groupId) {
  const all = await getAllGroups();
  return all.find(g => g.id === groupId) || null;
}

export async function createGroup(groupData) {
  const groupId = `grp_${Date.now()}`;
  const inviteCode = `${groupData.name.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  await db.insert(groups).values({
    id: groupId,
    name: groupData.name,
    description: groupData.description || '',
    category: groupData.category || 'trip',
    currency: groupData.currency || 'USD',
    inviteCode,
    avatarIcon: groupData.avatarIcon || 'Users',
    budgetLimit: groupData.budgetLimit ? Number(groupData.budgetLimit) : null,
  });

  const selectedMemberIds = groupData.memberIds && groupData.memberIds.length > 0 
    ? groupData.memberIds 
    : ['usr_alex'];

  for (const mId of selectedMemberIds) {
    await db.insert(groupMembers).values({
      id: `gm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      groupId,
      memberId: mId,
    }).onConflictDoNothing();
  }

  await db.insert(activityLogs).values({
    id: `act_${Date.now()}`,
    groupId,
    actorId: selectedMemberIds[0] || 'usr_alex',
    action: 'created_group',
    details: `created group "${groupData.name}"`,
  });

  const fullGroup = await getGroupById(groupId);
  if (!fullGroup) throw new Error('Failed to retrieve newly created group');
  return fullGroup;
}

export async function updateGroup(groupId, updateData) {
  await db.update(groups).set({
    name: updateData.name,
    description: updateData.description,
    category: updateData.category,
    currency: updateData.currency,
    budgetLimit: updateData.budgetLimit ? Number(updateData.budgetLimit) : undefined,
  }).where(eq(groups.id, groupId));

  return getGroupById(groupId);
}

export async function joinGroupByCode(inviteCode, memberId) {
  const [foundGroup] = await db.select().from(groups).where(eq(groups.inviteCode, inviteCode.trim().toUpperCase()));
  if (!foundGroup) return null;

  const allMembersList = await getAllMembers();
  const joiningMember = allMembersList.find(m => m.id === memberId) || allMembersList[0];

  await db.insert(groupMembers).values({
    id: `gm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    groupId: foundGroup.id,
    memberId: joiningMember.id,
  }).onConflictDoNothing();

  await db.insert(activityLogs).values({
    id: `act_${Date.now()}`,
    groupId: foundGroup.id,
    actorId: joiningMember.id,
    action: 'joined_group',
    details: `${joiningMember.name} joined via invite link`,
  });

  const updatedGroup = await getGroupById(foundGroup.id);
  return { group: updatedGroup, member: joiningMember };
}

// ----------------------------------------------------
// EXPENSES
// ----------------------------------------------------

export async function getExpensesByGroupId(groupId) {
  try {
    const rawExpenses = await db.select().from(expenses).where(eq(expenses.groupId, groupId)).orderBy(desc(expenses.createdAt));
    const rawSplits = await db.select().from(expenseSplits);
    const rawItems = await db.select().from(expenseItems);

    return rawExpenses.map(e => {
      const splitsForExp = rawSplits.filter(s => s.expenseId === e.id).map(s => ({
        memberId: s.memberId,
        amount: Number(s.amount),
        percentage: s.percentage !== null ? Number(s.percentage) : undefined,
        shares: s.shares !== null ? Number(s.shares) : undefined,
      }));

      const itemsForExp = rawItems.filter(i => i.expenseId === e.id).map(i => ({
        id: i.id,
        name: i.name,
        price: Number(i.price),
        assignedMemberIds: i.assignedMemberIds || [],
      }));

      return {
        id: e.id,
        groupId: e.groupId,
        title: e.title,
        amount: Number(e.amount),
        currency: e.currency,
        category: e.category || 'Food & Dining',
        paidById: e.paidById,
        date: e.date,
        splitType: e.splitType || 'equal',
        splits: splitsForExp,
        items: itemsForExp.length > 0 ? itemsForExp : undefined,
        notes: e.notes || undefined,
        tax: e.tax !== null ? Number(e.tax) : undefined,
        tip: e.tip !== null ? Number(e.tip) : undefined,
        receiptUrl: e.receiptUrl || undefined,
        isRecurring: Boolean(e.isRecurring),
        recurringInterval: e.recurringInterval || undefined,
        disputeStatus: e.disputeStatus || 'none',
        createdBy: e.createdBy,
        createdAt: e.createdAt ? e.createdAt.toISOString() : new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error('Error fetching expenses:', err);
    return [];
  }
}

export async function createExpense(groupId, data) {
  const expenseId = `exp_${Date.now()}`;

  await db.insert(expenses).values({
    id: expenseId,
    groupId,
    title: data.title,
    amount: Number(data.amount),
    currency: data.currency || 'USD',
    category: data.category || 'Food & Dining',
    paidById: data.paidById,
    date: data.date || new Date().toISOString().split('T')[0],
    splitType: data.splitType || 'equal',
    notes: data.notes || null,
    tax: data.tax ? Number(data.tax) : null,
    tip: data.tip ? Number(data.tip) : null,
    receiptUrl: data.receiptUrl || null,
    isRecurring: Boolean(data.isRecurring),
    recurringInterval: data.recurringInterval || null,
    disputeStatus: 'none',
    createdBy: data.createdBy || data.paidById,
  });

  if (Array.isArray(data.splits)) {
    for (const s of data.splits) {
      await db.insert(expenseSplits).values({
        id: `es_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        expenseId,
        memberId: s.memberId,
        amount: Number(s.amount),
        percentage: s.percentage ? Number(s.percentage) : null,
        shares: s.shares ? Number(s.shares) : null,
      });
    }
  }

  if (Array.isArray(data.items)) {
    for (const it of data.items) {
      await db.insert(expenseItems).values({
        id: it.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        expenseId,
        name: it.name,
        price: Number(it.price),
        assignedMemberIds: it.assignedMemberIds || [],
      });
    }
  }

  await db.insert(activityLogs).values({
    id: `act_${Date.now()}`,
    groupId,
    actorId: data.paidById,
    action: 'added_expense',
    details: `added expense "${data.title}" (${data.currency || 'USD'} ${Number(data.amount).toFixed(2)})`,
  });

  const list = await getExpensesByGroupId(groupId);
  const found = list.find(e => e.id === expenseId);
  if (!found) throw new Error('Failed to retrieve newly inserted expense');
  return found;
}

export async function updateExpense(groupId, expId, data) {
  await db.update(expenses).set({
    title: data.title,
    amount: data.amount ? Number(data.amount) : undefined,
    category: data.category,
    paidById: data.paidById,
    date: data.date,
    splitType: data.splitType,
    notes: data.notes,
  }).where(eq(expenses.id, expId));

  if (Array.isArray(data.splits)) {
    await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, expId));
    for (const s of data.splits) {
      await db.insert(expenseSplits).values({
        id: `es_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        expenseId: expId,
        memberId: s.memberId,
        amount: Number(s.amount),
        percentage: s.percentage ? Number(s.percentage) : null,
      });
    }
  }

  const list = await getExpensesByGroupId(groupId);
  return list.find(e => e.id === expId) || null;
}

export async function deleteExpense(groupId, expId) {
  await db.delete(expenses).where(eq(expenses.id, expId));
  return true;
}

// ----------------------------------------------------
// SETTLEMENTS
// ----------------------------------------------------

export async function getSettlementsByGroupId(groupId) {
  try {
    const list = await db.select().from(settlements).where(eq(settlements.groupId, groupId)).orderBy(desc(settlements.date));
    return list.map(s => ({
      id: s.id,
      groupId: s.groupId,
      fromMemberId: s.fromMemberId,
      toMemberId: s.toMemberId,
      amount: Number(s.amount),
      currency: s.currency,
      paymentMethod: s.paymentMethod || 'cash',
      referenceId: s.referenceId || undefined,
      notes: s.notes || undefined,
      status: s.status || 'completed',
      date: s.date ? s.date.toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Error fetching settlements:', err);
    return [];
  }
}

export async function createSettlement(groupId, data) {
  const setlId = `stl_${Date.now()}`;
  await db.insert(settlements).values({
    id: setlId,
    groupId,
    fromMemberId: data.fromMemberId,
    toMemberId: data.toMemberId,
    amount: Number(data.amount),
    currency: data.currency || 'USD',
    paymentMethod: data.paymentMethod || 'cash',
    referenceId: data.referenceId || null,
    notes: data.notes || null,
    status: 'completed',
  });

  const allMembersList = await getAllMembers();
  const receiver = allMembersList.find(m => m.id === data.toMemberId);

  await db.insert(activityLogs).values({
    id: `act_${Date.now()}`,
    groupId,
    actorId: data.fromMemberId,
    action: 'recorded_settlement',
    details: `settled ${data.currency || 'USD'} ${Number(data.amount).toFixed(2)} with ${receiver?.name || 'Member'} via ${(data.paymentMethod || 'CASH').toUpperCase()}`,
  });

  const list = await getSettlementsByGroupId(groupId);
  const found = list.find(s => s.id === setlId);
  if (!found) throw new Error('Failed to retrieve newly created settlement');
  return found;
}

// ----------------------------------------------------
// RECURRING RULES
// ----------------------------------------------------

export async function getRecurringRulesByGroupId(groupId) {
  try {
    const list = await db.select().from(recurringRules).where(eq(recurringRules.groupId, groupId));
    return list.map(r => ({
      id: r.id,
      groupId: r.groupId,
      title: r.title,
      amount: Number(r.amount),
      currency: r.currency,
      category: r.category || 'Utilities & Bills',
      paidById: r.paidById,
      splitType: r.splitType || 'equal',
      splits: r.splitsJson || [],
      interval: r.interval || 'monthly',
      active: Boolean(r.active),
      autoApprove: Boolean(r.autoApprove),
      lastGeneratedDate: r.lastGeneratedDate || undefined,
      nextDueDate: r.nextDueDate || undefined,
    }));
  } catch (err) {
    console.error('Error fetching recurring rules:', err);
    return [];
  }
}

export async function createRecurringRule(groupId, data) {
  const ruleId = `rec_${Date.now()}`;
  await db.insert(recurringRules).values({
    id: ruleId,
    groupId,
    title: data.title,
    amount: Number(data.amount),
    currency: data.currency || 'USD',
    category: data.category || 'Utilities & Bills',
    paidById: data.paidById,
    splitType: data.splitType || 'equal',
    splitsJson: data.splits || [],
    interval: data.interval || 'monthly',
    active: true,
    autoApprove: data.autoApprove !== undefined ? Boolean(data.autoApprove) : true,
    lastGeneratedDate: new Date().toISOString().split('T')[0],
    nextDueDate: data.nextDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const list = await getRecurringRulesByGroupId(groupId);
  return list.find(r => r.id === ruleId);
}

// ----------------------------------------------------
// DISPUTES
// ----------------------------------------------------

export async function getDisputesByGroupId(groupId) {
  try {
    const rawDisputes = await db.select().from(disputes).where(eq(disputes.groupId, groupId));
    const rawComments = await db.select().from(disputeComments);

    return rawDisputes.map(d => {
      const comments = rawComments.filter(c => c.disputeId === d.id).map(c => ({
        id: c.id,
        memberId: c.memberId,
        text: c.text,
        timestamp: c.timestamp ? c.timestamp.toISOString() : new Date().toISOString(),
      }));

      return {
        id: d.id,
        groupId: d.groupId,
        expenseId: d.expenseId,
        raisedById: d.raisedById,
        reason: d.reason,
        proposedChanges: d.proposedChanges || undefined,
        status: d.status || 'open',
        comments,
        createdAt: d.createdAt ? d.createdAt.toISOString() : new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error('Error fetching disputes:', err);
    return [];
  }
}

export async function createDispute(groupId, data) {
  const dispId = `disp_${Date.now()}`;
  await db.insert(disputes).values({
    id: dispId,
    groupId,
    expenseId: data.expenseId,
    raisedById: data.raisedById,
    reason: data.reason,
    proposedChanges: data.proposedChanges || null,
    status: 'open',
  });

  await db.insert(disputeComments).values({
    id: `c_${Date.now()}`,
    disputeId: dispId,
    memberId: data.raisedById,
    text: data.reason,
  });

  await db.update(expenses).set({ disputeStatus: 'disputed' }).where(eq(expenses.id, data.expenseId));

  const list = await getDisputesByGroupId(groupId);
  return list.find(d => d.id === dispId);
}

export async function addDisputeComment(groupId, dispId, memberId, text) {
  const commentId = `c_${Date.now()}`;
  await db.insert(disputeComments).values({
    id: commentId,
    disputeId: dispId,
    memberId: memberId || 'usr_alex',
    text,
  });

  const list = await getDisputesByGroupId(groupId);
  return list.find(d => d.id === dispId);
}

export async function resolveDispute(groupId, dispId, status, updatedSplits) {
  await db.update(disputes).set({ status }).where(eq(disputes.id, dispId));

  const [disp] = await db.select().from(disputes).where(eq(disputes.id, dispId));
  if (disp) {
    await db.update(expenses).set({ disputeStatus: 'resolved' }).where(eq(expenses.id, disp.expenseId));
    if (updatedSplits && updatedSplits.length > 0) {
      await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, disp.expenseId));
      for (const s of updatedSplits) {
        await db.insert(expenseSplits).values({
          id: `es_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          expenseId: disp.expenseId,
          memberId: s.memberId,
          amount: Number(s.amount),
        });
      }
    }
  }

  const list = await getDisputesByGroupId(groupId);
  return list.find(d => d.id === dispId);
}

// ----------------------------------------------------
// MESSAGES & ACTIVITY
// ----------------------------------------------------

export async function getGroupMessages(groupId) {
  try {
    const list = await db.select().from(groupMessages).where(eq(groupMessages.groupId, groupId)).orderBy(desc(groupMessages.timestamp));
    return list.reverse().map(m => ({
      id: m.id,
      groupId: m.groupId,
      senderId: m.senderId,
      text: m.text,
      type: m.type || 'text',
      linkedExpenseId: m.linkedExpenseId || undefined,
      audioDuration: m.audioDuration || undefined,
      timestamp: m.timestamp ? m.timestamp.toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Error fetching messages:', err);
    return [];
  }
}

export async function createGroupMessage(groupId, data) {
  const msgId = `msg_${Date.now()}`;
  await db.insert(groupMessages).values({
    id: msgId,
    groupId,
    senderId: data.senderId || 'usr_alex',
    text: data.text || 'Voice note (0:08)',
    type: data.type || 'text',
    linkedExpenseId: data.linkedExpenseId || null,
    audioDuration: data.audioDuration || null,
  });

  const list = await getGroupMessages(groupId);
  return list.find(m => m.id === msgId);
}

export async function getActivityLogs(groupId) {
  try {
    const list = await db.select().from(activityLogs).where(eq(activityLogs.groupId, groupId)).orderBy(desc(activityLogs.timestamp));
    return list.map(l => ({
      id: l.id,
      groupId: l.groupId,
      actorId: l.actorId,
      action: l.action,
      details: l.details,
      timestamp: l.timestamp ? l.timestamp.toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Error fetching activity logs:', err);
    return [];
  }
}

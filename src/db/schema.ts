import { pgTable, text, doublePrecision, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ----------------------------------------------------
// MEMBERS / USERS
// ----------------------------------------------------
export const members = pgTable('members', {
  id: text('id').primaryKey(), // e.g. usr_alex or firebase uid
  name: text('name').notNull(),
  email: text('email').notNull(),
  avatar: text('avatar'),
  upiId: text('upi_id'),
  paypalHandle: text('paypal_handle'),
  phone: text('phone'),
  color: text('color'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ----------------------------------------------------
// GROUPS
// ----------------------------------------------------
export const groups = pgTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').default(''),
  category: text('category').notNull().default('trip'),
  currency: text('currency').notNull().default('USD'),
  inviteCode: text('invite_code').notNull().unique(),
  avatarIcon: text('avatar_icon').default('Users'),
  budgetLimit: doublePrecision('budget_limit'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const groupMembers = pgTable('group_members', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').defaultNow(),
});

// ----------------------------------------------------
// EXPENSES
// ----------------------------------------------------
export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  amount: doublePrecision('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  category: text('category').notNull().default('Food & Dining'),
  paidById: text('paid_by_id').notNull().references(() => members.id),
  date: text('date').notNull(),
  splitType: text('split_type').notNull().default('equal'),
  notes: text('notes'),
  tax: doublePrecision('tax'),
  tip: doublePrecision('tip'),
  receiptUrl: text('receipt_url'),
  isRecurring: boolean('is_recurring').default(false),
  recurringInterval: text('recurring_interval'),
  disputeStatus: text('dispute_status').notNull().default('none'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const expenseSplits = pgTable('expense_splits', {
  id: text('id').primaryKey(),
  expenseId: text('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  memberId: text('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  amount: doublePrecision('amount').notNull(),
  percentage: doublePrecision('percentage'),
  shares: doublePrecision('shares'),
});

export const expenseItems = pgTable('expense_items', {
  id: text('id').primaryKey(),
  expenseId: text('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  price: doublePrecision('price').notNull(),
  assignedMemberIds: jsonb('assigned_member_ids').$type<string[]>(),
});

// ----------------------------------------------------
// SETTLEMENTS
// ----------------------------------------------------
export const settlements = pgTable('settlements', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  fromMemberId: text('from_member_id').notNull().references(() => members.id),
  toMemberId: text('to_member_id').notNull().references(() => members.id),
  amount: doublePrecision('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  paymentMethod: text('payment_method').default('cash'),
  referenceId: text('reference_id'),
  notes: text('notes'),
  status: text('status').notNull().default('completed'),
  date: timestamp('date').defaultNow(),
});

// ----------------------------------------------------
// RECURRING RULES
// ----------------------------------------------------
export const recurringRules = pgTable('recurring_rules', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  amount: doublePrecision('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  category: text('category').notNull().default('Utilities & Bills'),
  paidById: text('paid_by_id').notNull().references(() => members.id),
  splitType: text('split_type').notNull().default('equal'),
  splitsJson: jsonb('splits_json'),
  interval: text('interval').notNull().default('monthly'),
  active: boolean('active').default(true),
  autoApprove: boolean('auto_approve').default(true),
  lastGeneratedDate: text('last_generated_date'),
  nextDueDate: text('next_due_date'),
});

// ----------------------------------------------------
// DISPUTES
// ----------------------------------------------------
export const disputes = pgTable('disputes', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  expenseId: text('expense_id').notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  raisedById: text('raised_by_id').notNull().references(() => members.id),
  reason: text('reason').notNull(),
  proposedChanges: text('proposed_changes'),
  status: text('status').notNull().default('open'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const disputeComments = pgTable('dispute_comments', {
  id: text('id').primaryKey(),
  disputeId: text('dispute_id').notNull().references(() => disputes.id, { onDelete: 'cascade' }),
  memberId: text('member_id').notNull().references(() => members.id),
  text: text('text').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
});

// ----------------------------------------------------
// MESSAGES & ACTIVITY
// ----------------------------------------------------
export const groupMessages = pgTable('group_messages', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => members.id),
  text: text('text').notNull(),
  type: text('type').notNull().default('text'),
  linkedExpenseId: text('linked_expense_id'),
  audioDuration: integer('audio_duration'),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  actorId: text('actor_id').notNull().references(() => members.id),
  action: text('action').notNull(),
  details: text('details').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
});

// ----------------------------------------------------
// RELATIONS
// ----------------------------------------------------
export const membersRelations = relations(members, ({ many }) => ({
  groupMemberships: many(groupMembers),
  paidExpenses: many(expenses),
  splits: many(expenseSplits),
  sentSettlements: many(settlements, { relationName: 'sentSettlements' }),
  receivedSettlements: many(settlements, { relationName: 'receivedSettlements' }),
  messages: many(groupMessages),
}));

export const groupsRelations = relations(groups, ({ many }) => ({
  members: many(groupMembers),
  expenses: many(expenses),
  settlements: many(settlements),
  recurringRules: many(recurringRules),
  disputes: many(disputes),
  messages: many(groupMessages),
  activityLogs: many(activityLogs),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  group: one(groups, { fields: [expenses.groupId], references: [groups.id] }),
  payer: one(members, { fields: [expenses.paidById], references: [members.id] }),
  splits: many(expenseSplits),
  items: many(expenseItems),
  disputes: many(disputes),
}));

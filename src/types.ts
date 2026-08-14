export type SplitType = 'equal' | 'exact' | 'percentage' | 'itemized';

export type GroupCategory = 'trip' | 'home' | 'couple' | 'office' | 'other' | 'Trip' | 'Home' | 'Event' | 'Couple' | 'Project' | 'Other';

export type ExpenseCategory = 
  | 'Food & Dining' 
  | 'Groceries' 
  | 'Rent & Housing' 
  | 'Travel & Flights' 
  | 'Transport & Taxi' 
  | 'Entertainment' 
  | 'Utilities & Bills' 
  | 'Shopping' 
  | 'Health' 
  | 'Other';

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string;
  upiId?: string;
  paypalHandle?: string;
  phone?: string;
  color: string;
}

export interface ExpenseItem {
  id: string;
  name: string;
  price: number;
  assignedMemberIds: string[];
}

export interface ExpenseSplit {
  memberId: string;
  amount: number;
  percentage?: number;
  itemIds?: string[];
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  paidById: string;
  date: string;
  splitType: SplitType;
  splits: ExpenseSplit[];
  items?: ExpenseItem[];
  receiptUrl?: string;
  notes?: string;
  tax?: number;
  tip?: number;
  isRecurring?: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  disputeStatus?: 'none' | 'disputed' | 'resolved';
  createdBy: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  currency: string;
  date: string;
  notes?: string;
  paymentMethod?: 'upi' | 'paypal' | 'cash' | 'bank_transfer' | 'other';
  referenceId?: string;
  status: 'completed' | 'pending';
}

export interface RecurringRule {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  paidById: string;
  splitType: SplitType;
  splits: ExpenseSplit[];
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string;
  autoApprove: boolean;
  active: boolean;
  lastGeneratedDate?: string;
}

export interface DisputeComment {
  id: string;
  memberId: string;
  text: string;
  timestamp: string;
}

export interface Dispute {
  id: string;
  groupId: string;
  expenseId: string;
  raisedById: string;
  reason: string;
  proposedChanges?: string;
  status: 'open' | 'approved' | 'rejected';
  comments: DisputeComment[];
  createdAt: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  text: string;
  audioDuration?: number;
  linkedExpenseId?: string;
  timestamp: string;
  type: 'text' | 'voice' | 'system' | 'expense_action';
}

export interface ActivityLog {
  id: string;
  groupId: string;
  actorId: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  category: 'trip' | 'home' | 'couple' | 'office' | 'other';
  currency: string;
  inviteCode: string;
  members: Member[];
  budgetLimit?: number;
  avatarIcon: string;
  createdAt: string;
}

export interface DebtTransaction {
  from: string;
  to: string;
  amount: number;
}

export interface MemberBalance {
  memberId: string;
  paidTotal: number;
  owedTotal: number;
  netBalance: number; // positive = gets back, negative = owes
}

export interface SimplifiedDebtResult {
  rawDebts: DebtTransaction[];
  simplifiedDebts: DebtTransaction[];
  memberBalances: Record<string, MemberBalance>;
  totalGroupSpend: number;
}

export interface ReceiptParsedItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface ReceiptScanResult {
  merchantName: string;
  date: string;
  currency: string;
  category: ExpenseCategory;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  lineItems: ReceiptParsedItem[];
  confidenceScore?: number;
  notes?: string;
}

export interface VoiceExpenseParseResult {
  title: string;
  amount: number;
  category: ExpenseCategory;
  currency: string;
  paidByName?: string;
  splitType: SplitType;
  involvedMembers?: {
    name: string;
    amount?: number;
    percentage?: number;
  }[];
  notes?: string;
}

export interface SpendingInsight {
  summary: string;
  topSpendingCategory: string;
  burnRatePerDay: number;
  spendingVelocityComment: string;
  memberInsights: {
    memberId: string;
    badge: string;
    observation: string;
  }[];
  budgetHealth: 'safe' | 'warning' | 'critical';
  budgetAlertMessage?: string;
  recommendations: string[];
}

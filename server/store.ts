import { 
  Group, Expense, Settlement, RecurringRule, Dispute, GroupMessage, ActivityLog, Member 
} from '../src/types';

export const mockMembers: Member[] = [
  { id: 'usr_alex', name: 'Alex Rivera', email: 'alex@example.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', upiId: 'alex.rivera@okaxis', paypalHandle: 'alexrivera99', phone: '+1-555-0192', color: '#3B82F6' },
  { id: 'usr_priya', name: 'Priya Sharma', email: 'priya@example.com', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', upiId: 'priyasharma@okhdfcbank', paypalHandle: 'priya_sharma', phone: '+1-555-0144', color: '#EC4899' },
  { id: 'usr_raj', name: 'Raj Patel', email: 'raj@example.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', upiId: 'raj.patel@icici', paypalHandle: 'rajpatel_dev', phone: '+1-555-0188', color: '#10B981' },
  { id: 'usr_elena', name: 'Elena Rostova', email: 'elena@example.com', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80', upiId: 'elena.rostova@sbi', paypalHandle: 'elena_r', phone: '+1-555-0177', color: '#8B5CF6' },
  { id: 'usr_marcus', name: 'Marcus Vance', email: 'marcus@example.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', upiId: 'marcus.vance@ybl', paypalHandle: 'marcusv', phone: '+1-555-0165', color: '#F59E0B' },
];

export let groups: Group[] = [
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

export let expenses: Expense[] = [
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
    date: '2026-08-04',
    splitType: 'equal',
    splits: [
      { memberId: 'usr_alex', amount: 30.00 },
      { memberId: 'usr_raj', amount: 30.00 },
      { memberId: 'usr_marcus', amount: 29.99 },
    ],
    disputeStatus: 'none',
    createdBy: 'usr_alex',
    createdAt: '2026-08-04T11:20:00Z',
  }
];

export let settlements: Settlement[] = [
  {
    id: 'stl_1',
    groupId: 'grp_tahoe',
    fromMemberId: 'usr_priya',
    toMemberId: 'usr_alex',
    amount: 150,
    currency: 'USD',
    paymentMethod: 'upi',
    referenceId: 'UPI/294019284102',
    notes: 'Partial settlement for cabin advance',
    status: 'completed',
    date: '2026-08-09T20:00:00Z',
  }
];

export let recurringRules: RecurringRule[] = [
  {
    id: 'rec_rent',
    groupId: 'grp_roommates',
    title: 'Monthly Rent Transfer',
    amount: 3300,
    currency: 'USD',
    category: 'Rent & Housing',
    interval: 'monthly',
    paidById: 'usr_marcus',
    splitType: 'percentage',
    splits: [
      { memberId: 'usr_alex', amount: 1155, percentage: 35 },
      { memberId: 'usr_raj', amount: 1155, percentage: 35 },
      { memberId: 'usr_marcus', amount: 990, percentage: 30 },
    ],
    active: true,
    autoApprove: true,
    lastGeneratedDate: '2026-08-01',
    nextDueDate: '2026-09-01',
  },
  {
    id: 'rec_wifi',
    groupId: 'grp_roommates',
    title: 'Verizon Fios Gigabit WiFi',
    amount: 89.99,
    currency: 'USD',
    category: 'Utilities & Bills',
    interval: 'monthly',
    paidById: 'usr_alex',
    splitType: 'equal',
    splits: [
      { memberId: 'usr_alex', amount: 30.00 },
      { memberId: 'usr_raj', amount: 30.00 },
      { memberId: 'usr_marcus', amount: 29.99 },
    ],
    active: true,
    autoApprove: false,
    lastGeneratedDate: '2026-08-04',
    nextDueDate: '2026-09-04',
  }
];

export let disputes: Dispute[] = [
  {
    id: 'dsp_groceries',
    expenseId: 'exp_groceries',
    groupId: 'grp_tahoe',
    raisedById: 'usr_elena',
    createdAt: '2026-08-10T11:00:00Z',
    status: 'open',
    reason: 'I left early on Sunday afternoon and did not have the dinner barbecue beers/steaks.',
    proposedChanges: 'Exclude me from item_4 (Craft IPA Beers) to adjust share by -$18.',
    comments: [
      {
        id: 'c1',
        memberId: 'usr_priya',
        text: 'That makes total sense Elena! We can re-assign the beer pack to just Alex, Raj and Marcus.',
        timestamp: '2026-08-10T12:30:00Z',
      }
    ]
  }
];

export let messages: GroupMessage[] = [
  {
    id: 'msg_1',
    groupId: 'grp_tahoe',
    senderId: 'usr_alex',
    text: 'Hey everyone! I just booked the Timberline Chalet in South Lake Tahoe 🏔️',
    type: 'text',
    timestamp: '2026-08-08T14:35:00Z',
  },
  {
    id: 'msg_2',
    groupId: 'grp_tahoe',
    senderId: 'usr_priya',
    text: 'Awesome! I will handle the first grocery run at Whole Foods.',
    type: 'text',
    timestamp: '2026-08-09T09:15:00Z',
  },
  {
    id: 'msg_3',
    groupId: 'grp_tahoe',
    senderId: 'usr_raj',
    text: '🎙️ Spoken update: Got the Heavenly lift tickets printed and ready at the front desk.',
    type: 'voice',
    audioDuration: 8,
    timestamp: '2026-08-10T09:05:00Z',
  }
];

export let activityLogs: ActivityLog[] = [
  {
    id: 'act_1',
    groupId: 'grp_tahoe',
    actorId: 'usr_alex',
    action: 'created_group',
    details: 'added "Timberline Chalet Cabin Rental (3 Nights)" ($1400.00)',
    timestamp: '2026-08-08T14:30:00Z',
  },
  {
    id: 'act_2',
    groupId: 'grp_tahoe',
    actorId: 'usr_priya',
    action: 'added_expense',
    details: 'scanned & added "Whole Foods Market Provisions & BBQ" ($284.50)',
    timestamp: '2026-08-09T18:15:00Z',
  },
  {
    id: 'act_3',
    groupId: 'grp_tahoe',
    actorId: 'usr_priya',
    action: 'recorded_settlement',
    details: 'paid $150.00 to Alex Rivera via UPI',
    timestamp: '2026-08-09T20:00:00Z',
  }
];

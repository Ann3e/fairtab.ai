# FairTab 📊 — Smart Collaborative Expense Splitting & Debt Simplification

FairTab is an advanced, full-stack collaborative finance and expense-sharing platform engineered for roommates, travel groups, event organizers, and teams. It pairs real-time multi-user synchronization with Google Gemini AI intelligence, multimodal receipt itemization, voice-first expense logging, dispute resolution arbitration, and graph-based minimum-cash-flow debt simplification.

---

## ✨ Comprehensive Feature Matrix

### 1. 👥 Multi-Group & Member Collaboration
- **Dynamic Group Management**: Create customizable groups for trips, apartments, events, and projects with designated categories (Trip, Home, Event, Project, Other) and custom avatar icons.
- **Unique Invite Codes**: Instantly join or invite friends using alphanumeric group invite codes.
- **Member Profiles & Payment Rails**: Configure user profiles with avatars, color codes, phone numbers, **UPI IDs (`user@upi`)**, and **PayPal handles** for seamless peer-to-peer settlement.
- **Multi-Currency Support**: Support for USD (`$`), EUR (`€`), INR (`₹`), GBP (`£`), JPY (`¥`), CAD (`$`), AUD (`$`), and CHF (`Fr.`).

### 2. 🧾 Smart Multi-Modal Expense Ingestion
- **5 Flexible Split Modes**:
  - **Equal Split**: Automatically calculates exact per-person shares with rounding adjustment.
  - **Exact Amounts**: Allocate custom fixed currency values per person with real-time balance validation.
  - **Percentages**: Allocate percentages (must sum to 100%) with dynamic dollar share computation.
  - **Custom Shares/Ratios**: Split by ratios (e.g., 2 shares for person A, 1 share for person B).
  - **Itemized Assignments**: Assign specific line-items to designated members.
- **📸 Gemini 3.7 Flash Multimodal Receipt OCR**:
  - Upload or capture photos of itemized receipts, bills, and restaurant checks.
  - AI extracts merchant name, date, line items with individual prices, tax, tip, and total.
  - Interactive line-item assignment interface allows members to claim items they consumed with automated pro-rated tax and tip distribution.
- **🎙️ Voice-First Natural Language Expense Logger**:
  - Speak naturally (e.g., *"I paid 85 dollars for dinner at Olive Garden, split between me, Priya and Raj"*).
  - Uses Web Speech API + Gemini AI structured extraction to detect title, total amount, category, payer, involved members, and split allocations with one-click review and commit.
- **Preset Quick Prompts**: Quick voice/text templates for testing realistic expense scenarios with a single tap.

### 3. 🧮 Minimum Cash Flow Graph Simplification
- **Graph Debt Optimizer**: Implements greedy dual-queue debt settlement reduction algorithms ($\mathcal{O}(V \log V)$) that reduce complex $N$-party debts down to at most $V - 1$ optimal peer-to-peer transactions.
- **Interactive Graph Visualizer**: View net creditor/debtor balance vectors, total group spend, and step-by-step settlement directives.
- **Direct Settle-Up Rails**:
  - Direct settlement modal supporting Cash, UPI, PayPal, Venmo, and Bank Transfer.
  - **Live UPI QR Codes & Deep Links**: Generates native `upi://pay` deep links and QR codes with pre-filled payee VPA, amount, and reference notes for instant one-tap mobile payments.
  - **PayPal.me Integration**: Direct payment links with pre-filled amounts.

### 4. ⚡ Real-Time WebSocket Synchronization (Socket.io)
- **Room-Isolated Live Updates**: Real-time room isolation (`group:<groupId>`) ensures instant updates across all connected clients for:
  - New expenses and modifications
  - Settlement confirmations
  - Dispute filings and resolutions
  - Group chat messages & voice recordings
  - Real-time "user typing..." indicators

### 5. 🤖 Gemini AI Financial Intelligence & Automations
- **💡 AI Spending Velocity & Budget Forecaster**:
  - Analyzes group spending velocity, category burn rates, and budget threshold warnings.
  - Generates executive financial summaries, spending pattern observations, and actionable group savings recommendations.
- **📢 Tone-Adaptive Smart Payment Reminders**:
  - Draft contextualized reminder messages across 4 distinct AI tone profiles:
    - **Friendly**: Warm, casual peer reminders.
    - **Polite & Professional**: Crisp, formal notifications for colleagues.
    - **Humorous / Witty**: Lighthearted memes, puns, and jokes for close friends.
    - **Firm & Urgent**: Direct notices emphasizing budget deadlines.
  - Auto-embeds direct payment links and copyable payloads for WhatsApp, SMS, or Slack.

### 6. 🔄 Recurring Expenses & Subscription Manager
- **Automated Recurring Ledger**: Manage recurring group expenses (Rent, Netflix, WiFi, Utilities, Groceries) across **Weekly**, **Bi-weekly**, **Monthly**, and **Yearly** intervals.
- **Next Due Date Computation**: Tracks recurring payment cycles, days remaining, and active/paused state.
- **One-Click Manual Trigger**: Force-post an upcoming cycle immediately or edit billing schedules.

### 7. 💬 In-App Group Chat, Dispute Coordination & Activity Log
- **Real-Time Group Messenger**: Group-specific chat for discussing bills, planning trips, or coordinating settlements.
- **Integrated Split Inquiries & Disputes**: Question or dispute any expense split directly from the ledger; automatically tags the expense and notifies members in the Group Chat.
- **Voice Memos / Audio Messages**: Record and play back audio messages with integrated audio player controls.
- **Comprehensive Activity Log**: Chronological audit trail logging every expense addition, edit, deletion, settlement, and split adjustment.

---

## 🏛️ System Architecture

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CLIENT TIER (BROWSER)                                      │
│                                                                                                  │
│  ┌──────────────────────┐  ┌───────────────────────┐  ┌──────────────────────────────────────┐  │
│  │   React 19 SPA UI    │  │   AppContext Store    │  │       Socket.io Client Engine        │  │
│  │ (Tailwind + Lucide)  │◄─┼─► (Optimistic Updates)│◄─┼─► (Real-Time Bidirectional Sync)     │  │
│  └──────────┬───────────┘  └───────────┬───────────┘  └──────────────────┬───────────────────┘  │
└─────────────┼──────────────────────────┼─────────────────────────────────┼──────────────────────┘
              │                          │                                 │
              │ HTTPS (REST API)         │ JSON Payloads                   │ WebSockets (WSS)
              ▼                          ▼                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   APPLICATION & API GATEWAY TIER                                 │
│                                     (Node.js + Express.js)                                       │
│                                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Vite Development / Production Static Asset Middleware                                     │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  REST API Router (/api/*)                                                                  │  │
│  │  ├── /members, /groups (CRUD & Code-Based Group Provisioning)                              │  │
│  │  ├── /expenses, /settlements (Ledger Entries & Real-Time Sync)                             │  │
│  │  ├── /recurring, /disputes (Automation Rules & Arbitration Threads)                        │  │
│  │  └── /ai/* (OCR Vision Ingestion, Voice NLP, Tone-Aware Reminders, Velocity Insights)       │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Socket.io Real-Time Broker (Room Isolation: `group:<groupId>`)                            │  │
│  │  ├── Broadcasts: `expense_added`, `settlement_recorded`, `dispute_created`, `new_message`   │  │
│  │  └── Ephemeral Events: `user_typing`, `member_joined`                                      │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────┬───────────────────────────────────────────────────────────────┬─────────────────┘
                 │                                                               │
                 │ Drizzle ORM + Connection Pooling                              │ Google Gen AI SDK
                 ▼                                                               ▼
┌──────────────────────────────────────────────┐        ┌──────────────────────────────────────────┐
│               DATABASE TIER                  │        │          AI & INFERENCE PIPELINES        │
│          (Cloud SQL PostgreSQL)              │        │           (Gemini 3.7 Flash)             │
│                                              │        │                                          │
│  ┌────────────────────┐ ┌──────────────────┐ │        │  ┌────────────────────────────────────┐  │
│  │ groups & members   │ │ expenses & splits│ │        │  │ Multimodal Receipt OCR (Vision)    │  │
│  └────────────────────┘ └──────────────────┘ │        │  │ • Structured line-item breakdown   │  │
│  ┌────────────────────┐ ┌──────────────────┐ │        │  │ • Pro-rated tax & tip extraction   │  │
│  │ settlements        │ │ recurring_rules  │ │        │  └────────────────────────────────────┘  │
│  └────────────────────┘ └──────────────────┘ │        │  ┌────────────────────────────────────┐  │
│  ┌────────────────────┐ ┌──────────────────┐ │        │  │ Natural Language Voice Logger      │  │
│  │ disputes & comments│ │ messages & logs  │ │        │  │ • Entity extraction (payer/amount) │  │
│  └────────────────────┘ └──────────────────┘ │        │  │ • Automatic split distribution     │  │
│                                              │        │  └────────────────────────────────────┘  │
│  • Parameterized queries (SQLi Protection)   │        │  ┌────────────────────────────────────┐  │
│  • Resilient connection pool management      │        │  │ Tone-Adaptive Payment Reminders    │  │
│  • Foreign-key cascade integrity             │        │  │ Spending Velocity Forecaster       │  │
└──────────────────────────────────────────────┘        └──────────────────────────────────────────┘
```

---

## 🗄️ Relational Data Model (Cloud SQL PostgreSQL + Drizzle ORM)

```text
┌───────────────────────┐
│        members        │
├───────────────────────┤
│ id (PK)               │◄───┐
│ name                  │    │
│ email                 │    │
│ avatar                │    │
│ upi_id                │    │
│ paypal_handle         │    │
│ phone                 │    │
│ color                 │    │
│ created_at            │    │
└───────────────────────┘    │
          ▲                  │
          │ 1:N              │ 1:N
┌─────────┴─────────────┐    │
│     group_members     │    │
├───────────────────────┤    │
│ id (PK)               │    │
│ group_id (FK) ────────┼─┐  │
│ member_id (FK)        │ │  │
│ joined_at             │ │  │
└───────────────────────┘ │  │
                          │  │
┌───────────────────────┐ │  │
│        groups         │ │  │
├───────────────────────┤ │  │
│ id (PK) ◄─────────────┼─┼──┘
│ name                  │ │
│ description           │ │
│ category              │ │
│ currency              │ │
│ invite_code (UNIQUE)  │ │
│ avatar_icon           │ │
│ budget_limit          │ │
│ created_at            │ │
└───────────────────────┘ │
          ▲               │
          │ 1:N           │
┌─────────┴─────────────┐ │
│       expenses        │ │
├───────────────────────┤ │
│ id (PK) ◄──────────┐  │ │
│ group_id (FK)      │  │ │
│ paid_by_id (FK) ───┼──┼─┼────────┐
│ title              │  │ │        │
│ amount             │  │ │        │
│ currency           │  │ │        │
│ category           │  │ │        │
│ date               │  │ │        │
│ split_type         │  │ │        │
│ tax, tip, notes    │  │ │        │
│ is_recurring       │  │ │        │
│ dispute_status     │  │ │        │
│ created_at         │  │ │        │
└────────────────────┘  │ │        │
   ▲          ▲         │ │        │
   │ 1:N      │ 1:N     │ │        │
┌──┴────────┐ ┌┴──────┐ │ │        │
│expense_   │ │expense│ │ │        │
│splits     │ │items  │ │ │        │
├───────────┤ ├───────┤ │ │        │
│id (PK)    │ │id (PK)│ │ │        │
│expense_id │ │expense│ │ │        │
│member_id  │ │name   │ │ │        │
│amount     │ │price  │ │ │        │
│percentage │ │assign_│ │ │        │
│shares     │ │ids    │ │ │        │
└───────────┘ └───────┘ │ │        │
                        │ │        │
┌───────────────────────┴─┴──────┐ │
│  settlements                   │ │
├────────────────────────────────┤ │
│ id (PK)                        │ │
│ group_id (FK), from_id, to_id  │ │
│ amount, currency, method, date │ │
└────────────────────────────────┘ │
                                   │
┌──────────────────────────────────┴─────┐
│  disputes & dispute_comments           │
├────────────────────────────────────────┤
│ id (PK), group_id (FK), expense_id (FK)│
│ raised_by_id, reason, status           │
└────────────────────────────────────────┘
```

---

## 🧮 Algorithmic Engine: Minimum Cash Flow Graph Simplification

FairTab's debt simplification engine reduces an $N$-person tangled web of bilateral debts into the minimum possible number of settlement transactions:

```text
[ UN-SIMPLIFIED BILATERAL DEBTS ]              [ SIMPLIFIED TRANSACTIONS (O(V)) ]
 (High transaction count: O(V²))               (Minimum cash flow path: ≤ V-1)

        Alex  ── owes $40 ──►  Sam                      Alex
         ▲                     ▲                         │
         │                     │                         │ owes $70
      owes $30              owes $60                     ▼
         │                     │                       Maria
        Maria ── owes $20 ──► Elena                      ▲
                                                         │ owes $20
                                                       Elena
```

### Mathematical Formulation
1. **Net Balance Vector Calculation**:
   $$\text{Net}(u) = \sum_{e \in \text{Paid}} \text{Amount}(e) - \sum_{e \in \text{Owed}} \text{Split}(e) + \sum_{s \in \text{Sent}} \text{Settlement}(s) - \sum_{s \in \text{Received}} \text{Settlement}(s)$$

2. **Dual-Queue Greedy Settlement Matching**:
   - Classify all members into **Creditors** ($\text{Net} > 0$) and **Debtors** ($\text{Net} < 0$).
   - In each iteration, select the maximum debtor $D_{\max}$ and maximum creditor $C_{\max}$.
   - Settle $\min(|D_{\max}|, C_{\max})$ directly between them.
   - Update remaining balances and repeat until all balances reach 0.

---

## 📁 Repository Directory Structure

```text
├── src/                          # 🎨 CLIENT-SIDE PRESENTATION (React 19 + Tailwind CSS)
│   ├── components/               # Modular UI Components & Modals
│   │   ├── AIInsightsView.jsx    # Spending velocity & AI budget forecasting
│   │   ├── BalanceSummaryCards.jsx # Net balance indicators & budget limits
│   │   ├── DebtSimplificationView.jsx # Graph visualization & settlement routing
│   │   ├── ExpenseList.jsx       # Searchable, filterable expense ledger
│   │   ├── ExpenseModal.jsx      # Comprehensive expense modal (5 split modes)
│   │   ├── GroupChatView.jsx     # Real-time chat, voice notes & activity logs
│   │   ├── Navbar.jsx            # Header, user switch & currency selector
│   │   ├── NewGroupModal.jsx     # Group creation & invite code joining
│   │   ├── ReceiptScannerModal.jsx # Gemini OCR & interactive item assignment
│   │   ├── RecurringExpensesView.jsx # Automated scheduled bill manager
│   │   ├── SettleUpModal.jsx     # UPI deep links, QR codes & settlement logger
│   │   ├── SmartReminderModal.jsx # AI reminder generator across 4 tone profiles
│   │   ├── ToastContainer.jsx    # Non-blocking notification system
│   │   └── VoiceLoggerModal.jsx  # Natural speech transcription & parsing
│   ├── context/
│   │   └── AppContext.jsx        # Central state store & Socket.io integration
│   ├── lib/
│   │   └── socket.js             # Singleton Socket.io client connector
│   ├── db/                       # Drizzle ORM Schema & Database Connection
│   │   ├── schema.js             # PostgreSQL tables, relations & type definitions
│   │   ├── index.js              # pg.Pool connection pool & Drizzle instance
│   │   └── drizzle.config.js     # Drizzle Kit CLI migration configuration
│   ├── utils/
│   │   └── debtSimplification.js # Greedy minimum cash flow graph algorithm
│   ├── types.js                  # Shared data models & default structures
│   ├── App.jsx                   # Master responsive viewport & navigation tabs
│   ├── main.jsx                  # React DOM bootstrap entry point
│   └── index.css                 # Tailwind CSS directives
│
├── server/                       # ⚙️ SERVER-SIDE APPLICATION TIER (Express.js + Node.js)
│   ├── app.js                    # Express application factory & middleware setup
│   ├── routes.js                 # REST API endpoints & Socket.io broadcasters
│   ├── db-service.js             # Relational data access layer & database queries
│   ├── store.js                  # In-memory mock and state store
│   └── gemini.js                 # Gemini 3.7 Flash integration pipelines
│
├── server.js                     # Root HTTP + Socket.io server bootstrap
├── package.json                  # Dependencies & script declarations
├── vite.config.js                # Vite frontend bundler configuration
└── metadata.json                 # AI Studio capability configuration
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** / **yarn** / **pnpm**

### 2. Installation
```bash
git clone https://github.com/YOUR_USERNAME/FairTab.git
cd FairTab
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Configure your environment variables:
```env
# Google Gemini API Key for OCR & Voice Intelligence
GEMINI_API_KEY="AIzaSy..."

# Cloud SQL / PostgreSQL Connection (Defaults provided in sandbox)
SQL_HOST="localhost"
SQL_USER="postgres"
SQL_PASSWORD="password"
SQL_DB_NAME="fairtab_db"
```

### 4. Run the Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🛡️ Security & Reliability

- **Server-Side API Key Protection**: Gemini AI keys and database credentials reside exclusively on the server runtime.
- **Connection Pool Resilience**: PostgreSQL connections are managed via a persistent `pg.Pool` with global caching and error traps.
- **Parameterized Query Safety**: Built with Drizzle ORM to protect against SQL injection vulnerabilities.
- **Graceful Fallbacks**: Local rule-based NLP and OCR heuristic parsers provide uninterrupted functionality if AI API keys are unset.

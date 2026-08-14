# FairTab 📊 — Smart Collaborative Expense Splitting & Debt Simplification

FairTab is a high-performance, full-stack collaborative finance platform engineered for real-time group expense management, receipt itemization via multimodal vision models, natural language voice logging, dispute arbitration workflows, and algorithmic minimum-cash-flow debt simplification.

---

## 🏛️ System Architecture

The following diagram illustrates the end-to-end architecture of FairTab, showcasing the interaction between the client presentation layer, the application gateway, real-time WebSocket channels, the relational persistence engine, and external AI vision/language pipelines.

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
│          (Cloud SQL PostgreSQL)              │        │           (Gemini 2.5 Flash)             │
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

FairTab leverages a normalized relational database schema designed for ACID compliance, referential integrity, and cascading consistency across complex shared ledgers:

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

### Key Schema Design Tenets
1. **Foreign Key Cascade Strategies**: Deleting an expense cascades to its granular `expense_splits`, `expense_items`, and associated `disputes` to eliminate orphaned balance records.
2. **Flexible Splitting Models**: Supports five concurrent split paradigms: Equal, Exact Currency Amounts, Percentage Ratios, Custom Weights/Shares, and Itemized Line-Item Assignments.
3. **Audit Trail & Event Journaling**: Every mutation is logged in `activity_logs` with timestamps, actor IDs, and human-readable mutation descriptions.

---

## ⚡ Real-Time Synchronization Engine (Socket.io)

To ensure zero-latency multi-user collaboration across roommates or traveling companions, FairTab implements an event-driven WebSocket layer built with Socket.io.

### Room Isolation Topology
- Clients join isolated channel rooms scoped to the active group: `group:${groupId}`.
- Prevents cross-group data leakage and optimizes broadcast fan-out.

### Event Lifecycle Workflow
1. **Client Action**: User submits an expense, settles a balance, or posts a message.
2. **Server Mutation**: Express route handler performs an atomic PostgreSQL transaction.
3. **Real-Time Broadcast**: The server dispatches the updated entity to all room subscribers:
   ```ts
   io.to(`group:${groupId}`).emit('expense_added', newExpense);
   ```
4. **Reactive Client Ingestion**: Subscribed React clients receive the event, update their local `AppContext` state in $O(1)$, and re-render debt calculations instantly without requiring manual page refreshes.

---

## 🧮 Algorithmic Engine: Minimum Cash Flow Graph Simplification

One of the platform's core computational components is its debt simplification engine, which reduces an $N$-person tangled web of bilateral debts into the minimum possible number of settlement transactions.

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
   For every member $u \in V$:
   $$\text{Net}(u) = \sum_{e \in \text{Paid}} \text{Amount}(e) - \sum_{e \in \text{Owed}} \text{Split}(e) + \sum_{s \in \text{Sent}} \text{Settlement}(s) - \sum_{s \in \text{Received}} \text{Settlement}(s)$$

2. **Dual-Queue Greedy Settlement Matching**:
   - Classify all members into **Creditors** ($\text{Net} > 0$) and **Debtors** ($\text{Net} < 0$).
   - In each iteration, select the maximum debtor $D_{\max}$ and maximum creditor $C_{\max}$.
   - Settle $\min(|D_{\max}|, C_{\max})$ directly between them.
   - Update remaining balances and repeat until all balances reach 0.

### Complexity Characteristics
- **Time Complexity**: $\mathcal{O}(V \log V)$ using priority heaps (where $V$ is the number of group members).
- **Space Complexity**: $\mathcal{O}(V)$ for storing balance vectors and queue states.
- **Edge Reduction**: Reduces an arbitrary directed graph with up to $\mathcal{O}(V^2)$ debt edges down to at most $V - 1$ total transactions.

---

## 🧠 AI Subsystems & Gemini 2.5 Flash Pipelines

FairTab integrates server-side Gemini 2.5 Flash models to streamline data entry, itemization, and communication:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   GEMINI AI FEATURE MATRIX                                       │
├──────────────────────────┬─────────────────────────────────────┬─────────────────────────────────┤
│ Capability               │ Input Modality                      │ Output Schema / Artifact        │
├──────────────────────────┼─────────────────────────────────────┼─────────────────────────────────┤
│ Multimodal Receipt OCR   │ Raw JPEG/PNG image (Base64)         │ Structured JSON: Merchant, date,│
│                          │                                     │ line items, subtotal, tax, tip  │
├──────────────────────────┼─────────────────────────────────────┼─────────────────────────────────┤
│ NLP Voice Logger         │ Audio transcript string             │ Extracted Title, Amount, Payer, │
│                          │                                     │ Category, and Split allocation  │
├──────────────────────────┼─────────────────────────────────────┼─────────────────────────────────┤
│ Tone-Aware Reminders     │ Debtor, Creditor, Amount, Tone      │ Contextualized payment reminder │
│                          │ (Friendly, Professional, Urgency)   │ message with UPI/PayPal payload │
├──────────────────────────┼─────────────────────────────────────┼─────────────────────────────────┤
│ Spending Velocity Engine │ Historical ledger time-series       │ Velocity index, budget burn rate│
│                          │                                     │ and risk warnings               │
└──────────────────────────┴─────────────────────────────────────┴─────────────────────────────────┘
```

### 1. Multimodal OCR Line-Item Extraction
- Ingests physical receipt photographs directly through the camera or file upload.
- Employs strict JSON-schema enforcement to extract item names, individual prices, tax rates, and tips.
- Powers interactive drag-and-drop item assignments where individuals claim only their consumed items.

### 2. Natural Language Voice-to-Expense Parser
- Accepts voice transcripts from browser SpeechRecognition (e.g., *"Alex paid forty-five dollars for dinner yesterday split between Sam and Maria"*).
- Disambiguates group member names using phonetic and substring heuristics against active group rosters.

### 3. Tone-Adaptive Payment Reminders with Payment Deep-Links
- Generates customizable payment reminders across selectable emotional tones:
  - **Friendly**: Casual, non-confrontational peer reminders.
  - **Polite / Professional**: Crisp, formal notifications for colleagues.
  - **Humorous**: Lighthearted memes and puns for close friends.
  - **Firm / Urgent**: Direct notices emphasizing impending budget deadlines.
- Automatically injects **UPI payment deep-links** (`upi://pay?pa=...&am=...`) and **PayPal links** for one-tap settlement.

---

## 📁 Repository Directory Structure

```text
├── src/                          # 🎨 CLIENT-SIDE PRESENTATION (React 19 + TypeScript + Tailwind)
│   ├── components/               # Modular UI Components & Modals
│   │   ├── AIInsightsView.tsx    # Spending velocity & AI budget forecasting
│   │   ├── BalanceSummaryCards.tsx # Net balance indicators & budget limits
│   │   ├── DebtSimplificationView.tsx # Graph visualization & settlement routing
│   │   ├── DisputesView.tsx      # Multi-party arbitration threads & resolution
│   │   ├── ExpenseList.tsx       # Searchable, filterable expense ledger
│   │   ├── ExpenseModal.tsx      # Comprehensive expense modal (5 split modes)
│   │   ├── GroupChatView.tsx     # Real-time chat, voice notes & activity logs
│   │   ├── Navbar.tsx            # Header, user switch & currency selector
│   │   ├── NewGroupModal.tsx     # Group creation & invite code joining
│   │   ├── ReceiptScannerModal.tsx # Gemini OCR & interactive item assignment
│   │   ├── RecurringExpensesView.tsx # Automated scheduled bill manager
│   │   ├── SettleUpModal.tsx     # UPI deep links, QR codes & settlement logger
│   │   ├── SmartReminderModal.tsx # AI reminder generator across 4 tone profiles
│   │   ├── ToastContainer.tsx    # Non-blocking notification system
│   │   └── VoiceLoggerModal.tsx  # Natural speech transcription & parsing
│   ├── context/
│   │   └── AppContext.tsx        # Central state store & Socket.io integration
│   ├── lib/
│   │   └── socket.ts             # Singleton Socket.io client connector
│   ├── db/                       # Drizzle ORM Schema & Database Connection
│   │   ├── schema.ts             # PostgreSQL tables, relations & type definitions
│   │   ├── index.ts              # pg.Pool connection pool & Drizzle instance
│   │   └── drizzle.config.ts     # Drizzle Kit CLI migration configuration
│   ├── utils/
│   │   └── debtSimplification.ts # Greedy minimum cash flow graph algorithm
│   ├── types.ts                  # Shared TypeScript interfaces & models
│   ├── App.tsx                   # Master responsive viewport & navigation tabs
│   ├── main.tsx                  # React DOM bootstrap entry point
│   └── index.css                 # Tailwind CSS directives
│
├── server/                       # ⚙️ SERVER-SIDE APPLICATION TIER (Express.js + Node.js)
│   ├── app.ts                    # Express application factory & middleware setup
│   ├── routes.ts                 # REST API endpoints & Socket.io broadcasters
│   ├── db-service.ts             # Relational data access layer & database queries
│   └── gemini.ts                 # Gemini 2.5 Flash integration pipelines
│
├── server.ts                     # Root HTTP + Socket.io server bootstrap
├── package.json                  # Dependencies & script declarations
├── vite.config.ts                # Vite frontend bundler configuration
└── metadata.json                 # AI Studio capability configuration
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm** / **yarn** / **pnpm**
- **Git**

### 2. Clone & Install
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
Open your browser at `http://localhost:3000`.

---

## 🛡️ Security & Reliability Architecture

- **Server-Side API Key Isolation**: All Gemini AI keys and Cloud SQL credentials reside exclusively on the server runtime, protected against client-side inspection.
- **Connection Pool Resilience**: PostgreSQL connections are managed via a persistent `pg.Pool` with global caching and error traps to prevent container cold-start bottlenecks.
- **Parameterized Query Safety**: Built with Drizzle ORM to ensure complete protection against SQL injection attacks.
- **Graceful Offline Fallbacks**: In environments where external AI APIs are not provisioned, local rule-based NLP and OCR heuristic parsers ensure unbroken application functionality.

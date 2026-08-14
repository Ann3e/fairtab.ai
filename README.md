# FairTab 📊 — Smart Collaborative Expense Splitting & Debt Simplification

FairTab is a modern full-stack web application designed for group expense tracking, receipt OCR itemization, voice-driven expense logging, dispute arbitration, and minimum-cash-flow debt simplification.

---

## 📁 Project Structure (Frontend & Backend Separation)

The project is cleanly divided into dedicated directories for the client UI and the backend API server:

```text
├── src/                          # 🎨 FRONTEND (React 19 + TypeScript + Tailwind CSS)
│   ├── components/               # UI Modals, Lists, Cards & Visualizers
│   │   ├── AIInsightsView.tsx    # Spending velocity & AI analytics
│   │   ├── BalanceSummaryCards.tsx # Net balance & budget indicators
│   │   ├── DebtSimplificationView.tsx # Graph & cash-flow simplifier
│   │   ├── DisputesView.tsx      # Dispute resolution threads
│   │   ├── ExpenseList.tsx       # Searchable & filterable expense list
│   │   ├── ExpenseModal.tsx      # Add/edit split expenses
│   │   ├── GroupChatView.tsx     # Voice notes, messaging & audit logs
│   │   ├── Navbar.tsx            # Header, user switch & currency selector
│   │   ├── NewGroupModal.tsx     # Create/Join groups with invite codes
│   │   ├── ReceiptScannerModal.tsx # Gemini OCR & item assignment
│   │   ├── RecurringExpensesView.tsx # Scheduled bill manager
│   │   ├── SettleUpModal.tsx     # UPI deep links, PayPal & cash settle
│   │   ├── SmartReminderModal.tsx # AI reminder tone generator
│   │   ├── ToastContainer.tsx    # Toast notifications
│   │   └── VoiceLoggerModal.tsx  # Web Speech + NLP expense logger
│   ├── context/
│   │   └── AppContext.tsx        # Centralized state store & API sync
│   ├── utils/
│   │   └── debtSimplification.ts # Greedy minimum cash-flow algorithm
│   ├── types.ts                  # Shared TypeScript interfaces & types
│   ├── App.tsx                   # Main layout & navigation tabs
│   └── main.tsx                  # React DOM entry point
│
├── server/                       # ⚙️ BACKEND (Express + Node.js + Gemini AI)
│   ├── app.ts                    # Express server initialization & Vite middleware
│   ├── routes.ts                 # REST API endpoints (/api/groups, /api/expenses, etc.)
│   ├── gemini.ts                 # Gemini API (Voice parsing, Receipt OCR, Reminders)
│   └── store.ts                  # In-memory relational ledger & initial seed data
│
├── server.ts                     # Backend root startup bootstrap
├── package.json                  # Dependencies & execution scripts
└── vite.config.ts                # Vite frontend bundler configuration
```

---

## 🚀 How to Run FairTab on Your Local Machine

Follow these simple steps to clone and run FairTab locally:

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm** (comes with Node) or **yarn** / **pnpm** / **bun**
- **Git** installed on your system

---

### 2. Clone the Repository
Open your terminal (macOS/Linux) or Command Prompt/PowerShell (Windows) and clone your repo:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

---

### 3. Set Up Environment Variables
Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Open `.env` in your code editor and add your **Gemini API Key** (get a free key at [Google AI Studio](https://aistudio.google.com/)):

```env
GEMINI_API_KEY="AIzaSyYourSecretGeminiApiKeyHere..."
```

*(Note: If you don't provide a Gemini API key, the app includes graceful fallback heuristics for demoing all voice, OCR, and AI features offline!)*

---

### 4. Install Dependencies
Install all required frontend and backend packages:

```bash
npm install
```

---

### 5. Start the Application
Run the unified full-stack development server:

```bash
npm run dev
```

---

### 6. Open the App in Your Browser
Visit:
```
http://localhost:3000
```

---

## 🛠️ Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Express backend + Vite frontend on `http://localhost:3000` with hot reloading |
| `npm run build` | Compiles the frontend to `/dist` and bundles the backend with `esbuild` |
| `npm start` | Runs the compiled production server (`node dist/server.cjs`) |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |

---

## 💡 Running Frontend & Backend as Independent Standalone Processes (Optional)

If you ever wish to run the frontend and backend on completely separate ports (e.g. Backend on `:5000` and Frontend Vite dev server on `:5173`):

1. In `server/app.ts`, change `PORT = 5000` and remove the Vite middleware block.
2. In `vite.config.ts`, add a proxy:
   ```ts
   server: {
     proxy: {
       '/api': 'http://localhost:5000'
     }
   }
   ```
3. Run `npx tsx server/app.ts` in one terminal window, and `npx vite` in another!

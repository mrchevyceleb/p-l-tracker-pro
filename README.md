# P&L Tracker Pro

Simple, powerful profit and loss tracking for freelancers and small businesses. Track income, expenses, taxes, and subscriptions in one place.

![License](https://img.shields.io/badge/License-MIT-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e)

---

## Features

- **Dashboard** - Real-time P&L overview with charts and metrics
- **Transaction Tracking** - Log income and expenses with categories
- **Category Management** - Custom categories for your business
- **Tax Calculations** - Configurable tax rates and estimates
- **Recurring Transactions** - Set up repeating income/expenses
- **Subscription Tracking** - Monitor all your recurring subscriptions
- **Reports** - Generate P&L reports by date range
- **Cloud Sync** - Data synced across devices via Supabase

---

## Views

| View | Description |
|------|-------------|
| **Dashboard** | Overview with P&L summary, charts, recent transactions |
| **Transactions** | Full transaction list with filters and search |
| **Reports** | Generate and export P&L reports |
| **Taxes** | Tax estimates and settings |
| **Subscriptions** | Track recurring subscriptions |

---

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Charts**: Recharts for data visualization
- **State**: React hooks + localStorage for preferences

---

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account

### 1. Clone and Install

```bash
git clone https://github.com/mrchevyceleb/p-l-tracker-pro.git
cd p-l-tracker-pro
npm install
```

### 2. Configure Supabase

Create a Supabase project and apply the schema:

```bash
# Copy supabase_schema.sql to your Supabase SQL editor and run it
```

Or use the Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 3. Set Environment Variables

Create `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Locally

```bash
npm run dev
```

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `transactions` | Income and expense records |
| `categories` | Custom transaction categories |
| `recurring_series` | Recurring transaction definitions |

### Key Fields

**Transactions:**
- `type`: 'income' or 'expense'
- `amount`: Transaction amount
- `category_id`: Link to category
- `date`: Transaction date
- `description`: Notes
- `is_recurring`: Part of a recurring series
- `recurring_series_id`: Link to series

---

## Features Explained

### Tax Configuration

Set your tax rates in settings:
- Federal tax rate
- State tax rate
- Self-employment tax
- Quarterly estimate calculations

### Recurring Transactions

Create transactions that repeat:
- Daily, weekly, monthly, yearly
- Auto-generates future transactions
- Manage entire series or individual instances

### Reports

Generate P&L reports with:
- Custom date ranges
- Category breakdowns
- Income vs expense comparison
- Export capabilities

---

## Architecture

```
p-l-tracker-pro/
├── components/
│   ├── Dashboard.tsx         # Main dashboard view
│   ├── TransactionsPage.tsx  # Transaction list
│   ├── ReportsPage.tsx       # P&L reports
│   ├── TaxesPage.tsx         # Tax calculations
│   ├── SubscriptionsPage.tsx # Subscription tracking
│   └── ui/                   # Reusable UI components
├── hooks/
│   └── useLocalStorage.ts    # Persist preferences
├── utils/
│   ├── supabase.ts          # Supabase client
│   └── tax.ts               # Tax calculations
├── types.ts                  # TypeScript definitions
└── constants.ts              # Default values
```

---

## License

MIT License - feel free to use, modify, and distribute.

---

**Built by [Matt Johnston](https://mattjohnston.io)**

*Part of the Vibe Marketing open source toolkit.*

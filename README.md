# P&L Tracker Pro

Simple, powerful profit and loss tracking for freelancers and small businesses. Track income, expenses, taxes, and subscriptions in one place.

![License](https://img.shields.io/badge/License-MIT-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e)

---

## ⚠️ Security Notice

**IMPORTANT:** This application handles sensitive financial data. Please review [SECURITY.md](./SECURITY.md) before deployment and follow all security best practices.

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

### 2. Configure Environment Variables

**CRITICAL:** Create a `.env.local` file (DO NOT commit to git):

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> ⚠️ **Never commit `.env.local` to version control!** It contains sensitive credentials.

### 3. Configure Supabase

Create a Supabase project and apply the schema:

```bash
# Copy supabase_schema.sql to your Supabase SQL editor and run it
```

Or use the Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

**Important:** The schema includes Row Level Security (RLS) policies that must be enabled for security.

### 4. Run Locally

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
npm run preview
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

### Security

- **Row Level Security (RLS)** is enabled on all tables
- Users can only access their own data
- All operations are scoped to authenticated users
- See [SECURITY.md](./SECURITY.md) for details

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
│   ├── tax.ts               # Tax calculations
│   ├── validation.ts        # Input validation
│   └── index.ts             # Utility exports
├── types.ts                  # TypeScript definitions
└── constants.ts              # Default values
```

---

## Security

This application handles sensitive financial data. Security is a top priority.

### Implemented Security Measures

- ✅ Environment variables for credentials
- ✅ Row Level Security (RLS) on all database tables
- ✅ Input validation and sanitization
- ✅ Error boundaries for graceful error handling
- ✅ TypeScript strict mode enabled
- ✅ Rate limiting on import operations
- ✅ XSS prevention on user inputs

### Security Checklist

Before deploying to production:

- [ ] Remove all hardcoded credentials
- [ ] Set up environment variables
- [ ] Enable and test RLS policies
- [ ] Review database permissions
- [ ] Enable HTTPS only
- [ ] Set up monitoring and logging

See [SECURITY.md](./SECURITY.md) for complete security guidelines.

---

## Development

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

### Code Formatting

```bash
npm run format
```

---

## Troubleshooting

### Common Issues

**"Supabase environment variables not configured"**
- Ensure `.env.local` exists with valid credentials
- Restart your dev server after changing environment variables

**"Row Level Security policy violation"**
- Verify RLS policies are correctly set up in Supabase
- Check that the user is authenticated

**"Failed to fetch transactions"**
- Check your Supabase project is active
- Verify network connectivity
- Check browser console for detailed errors

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed

---

## License

MIT License - feel free to use, modify, and distribute.

---

**Built by [Matt Johnston](https://mattjohnston.io)**

*Part of the Vibe Marketing open source toolkit.*


import { Category, Transaction, TaxConfig } from './types';
import { v4 as uuidv4 } from 'uuid';

// Vendor keyword mappings for auto-categorization of bank statement imports
export const VENDOR_CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Software/SaaS': [
    'GOOGLE', 'GSUITE', 'OPENAI', 'CHATGPT', 'GITHUB', 'AZURE', 'AWS', 'AMAZON WEB SERVICES',
    'MICROSOFT', 'ADOBE', 'DROPBOX', 'SLACK', 'ZOOM', 'NOTION', 'FIGMA', 'CANVA',
    'STRIPE', 'TWILIO', 'VERCEL', 'NETLIFY', 'HEROKU', 'DIGITAL OCEAN', 'DIGITALOCEAN',
    'ANTHROPIC', 'CLAUDE', 'REPLIT', 'STATIC.APP', 'APIFY', 'ZAPIER', 'N8N', 'PADDLE',
    'NEOCITIES', 'TAVILY', 'FAL.AI', 'SKOOL', 'P.SKOOL', 'WE-CONNECT', 'CLAY LABS',
    'ZOHO', 'HUBSPOT', 'SALESFORCE', 'AIRTABLE', 'MONGODB', 'SUPABASE', 'FIREBASE',
    'JETBRAINS', 'ATLASSIAN', 'JIRA', 'CONFLUENCE', 'BITBUCKET', 'GITLAB'
  ],
  'Business Meals': [
    'RESTAURANT', 'CAFE', 'COFFEE', 'STARBUCKS', 'DUNKIN', 'MCDONALD', 'CHIPOTLE',
    'SUBWAY', 'PANERA', 'GRUBHUB', 'DOORDASH', 'UBER EATS', 'SEAMLESS', 'POSTMATES',
    'WEIS MARKETS', 'GROCERY', 'FOOD', 'PIZZA', 'BURGER', 'DELI', 'BAKERY'
  ],
  'Travel': [
    'AIRLINE', 'UNITED', 'DELTA', 'AMERICAN AIR', 'SOUTHWEST', 'JETBLUE', 'SPIRIT',
    'UBER', 'LYFT', 'TAXI', 'HOTEL', 'MARRIOTT', 'HILTON', 'AIRBNB', 'EXPEDIA',
    'BOOKING.COM', 'KAYAK', 'PRICELINE', 'AMTRAK', 'RENTAL CAR', 'HERTZ', 'ENTERPRISE',
    'FI @FI.DOGS'
  ],
  'Office Supplies': [
    'STAPLES', 'OFFICE DEPOT', 'BEST BUY', 'APPLE STORE', 'B&H PHOTO'
  ],
  'Marketing': [
    'FACEBOOK ADS', 'META', 'GOOGLE ADS', 'LINKEDIN', 'TWITTER ADS', 'MAILCHIMP',
    'CONSTANT CONTACT', 'SENDGRID', 'CONVERTKIT'
  ],
  'Utilities': [
    'ELECTRIC', 'GAS', 'WATER', 'INTERNET', 'COMCAST', 'ATT', 'VERIZON', 'SPECTRUM',
    'T-MOBILE', 'XFINITY'
  ],
  'Insurance': [
    'INSURANCE', 'GEICO', 'STATE FARM', 'PROGRESSIVE', 'ALLSTATE', 'LIBERTY MUTUAL'
  ]
};

export const SEED_CATEGORIES: Category[] = [
  { id: 'cat_sales', name: 'Sales', type: 'income', deductibility_percentage: 0 },
  { id: 'cat_consulting', name: 'Consulting', type: 'income', deductibility_percentage: 0 },
  { id: 'cat_freelance', name: 'Freelance Work', type: 'income', deductibility_percentage: 0 },
  { id: 'cat_rent', name: 'Rent', type: 'expense', deductibility_percentage: 100 }, // Home office % or full office rent
  { id: 'cat_utilities', name: 'Utilities', type: 'expense', deductibility_percentage: 100 },
  { id: 'cat_marketing', name: 'Marketing', type: 'expense', deductibility_percentage: 100 },
  { id: 'cat_software', name: 'Software/SaaS', type: 'expense', deductibility_percentage: 100 },
  { id: 'cat_travel', name: 'Travel', type: 'expense', deductibility_percentage: 100 },
  { id: 'cat_supplies', name: 'Office Supplies', type: 'expense', deductibility_percentage: 100 },
  { id: 'cat_insurance', name: 'Insurance', type: 'expense', deductibility_percentage: 100 },
  { id: 'cat_meals', name: 'Business Meals', type: 'expense', deductibility_percentage: 50 }, // Example partial
];

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  mode: 'smart',
  simpleRate: 25,
  filingStatus: 'single',
  dependents: 2,
  spouseGrossIncome: 0,
  spouseFederalWithholding: 0,
  spousePretaxDeductionPercent: 10,
};

// --- GENERATE MOCK DATA FOR THE LAST 12 MONTHS ---

const generateMonthlyTransactions = (date: Date, recurring_id: string, name: string, category_id: string, type: 'income' | 'expense', amount: number, notes: string): Transaction => {
  return {
    id: uuidv4(),
    date: date.toISOString().slice(0, 10),
    name,
    type,
    amount,
    category_id,
    notes,
    recurring_id,
  };
};

const transactions: Transaction[] = [];
const today = new Date('2025-05-15T12:00:00Z'); // Pin to a specific date for consistent data
const recurringRentId = uuidv4();
const recurringSoftwareId = uuidv4();
const recurringInsuranceId = uuidv4();

// Generate recurring transactions for the past 12 months
for (let i = 0; i < 12; i++) {
  const date = new Date(today);
  date.setUTCMonth(today.getUTCMonth() - i);

  // Rent (1st of month)
  date.setUTCDate(1);
  transactions.push(generateMonthlyTransactions(date, recurringRentId, 'Office Rent', 'cat_rent', 'expense', 1200.00, 'Office rent'));

  // Insurance (15th of month)
  date.setUTCDate(15);
  transactions.push(generateMonthlyTransactions(date, recurringInsuranceId, 'Business Insurance', 'cat_insurance', 'expense', 250.00, 'Business insurance premium'));
  
  // Software (22nd of month)
  date.setUTCDate(22);
  transactions.push(generateMonthlyTransactions(date, recurringSoftwareId, 'SaaS Subscription', 'cat_software', 'expense', 75.00, 'Design tool subscription'));
}

// Add some varied, non-recurring transactions for the last year
const oneOffTransactions: Omit<Transaction, 'id'>[] = [
  // Current Month - April 2025
  { date: '2025-04-05', name: 'Project A Payment', type: 'income', amount: 2500.00, category_id: 'cat_sales', notes: 'Project A final payment' },
  { date: '2025-04-12', name: 'Electricity Bill', type: 'expense', amount: 150.50, category_id: 'cat_utilities', notes: 'Electricity bill' },
  { date: '2025-04-15', name: 'Social Media Ads', type: 'expense', amount: 300.00, category_id: 'cat_marketing', notes: 'Social media ads' },
  { date: '2025-04-20', name: 'Strategy Session', type: 'income', amount: 1800.00, category_id: 'cat_consulting', notes: 'Strategy session' },
  { date: '2025-04-25', name: 'Office Chairs', type: 'expense', amount: 125.00, category_id: 'cat_supplies', notes: 'New office chairs' },

  // Previous Months
  { date: '2025-03-10', name: 'Project B Kickoff', type: 'income', amount: 3200.00, category_id: 'cat_sales', notes: 'Project B kickoff' },
  { date: '2025-03-25', name: 'Client Visit Flight', type: 'expense', amount: 450.00, category_id: 'cat_travel', notes: 'Client visit flight' },
  { date: '2025-02-18', name: 'Web Design Project', type: 'income', amount: 2100.00, category_id: 'cat_freelance', notes: 'Web design project' },
  { date: '2025-02-20', name: 'Google Ads', type: 'expense', amount: 200.00, category_id: 'cat_marketing', notes: 'Google Ads campaign' },
  { date: '2025-01-15', name: 'Annual Contract', type: 'income', amount: 4500.00, category_id: 'cat_sales', notes: 'Annual contract renewal' },
  { date: '2025-01-28', name: 'Printer Supplies', type: 'expense', amount: 95.00, category_id: 'cat_supplies', notes: 'Printer ink and paper' },
  { date: '2024-12-20', name: 'End-of-Year Review', type: 'income', amount: 1500.00, category_id: 'cat_consulting', notes: 'End-of-year review' },
  { date: '2024-12-22', name: 'Holiday Marketing', type: 'expense', amount: 600.00, category_id: 'cat_marketing', notes: 'Holiday marketing campaign' },
  { date: '2024-11-11', name: 'New Client Retainer', type: 'income', amount: 2800.00, category_id: 'cat_sales', notes: 'New client retainer' },
  { date: '2024-11-20', name: 'Conference Trip', type: 'expense', amount: 800.00, category_id: 'cat_travel', notes: 'Conference trip' },
  { date: '2024-10-05', name: 'Content Writing', type: 'income', amount: 1900.00, category_id: 'cat_freelance', notes: 'Content writing gig' },
  { date: '2024-09-10', name: 'Internet Bill', type: 'expense', amount: 180.25, category_id: 'cat_utilities', notes: 'Internet bill' },
  { date: '2024-08-15', name: 'Product Launch', type: 'income', amount: 3500.00, category_id: 'cat_sales', notes: 'Product launch sales' },
  { date: '2024-07-25', name: 'Stationery', type: 'expense', amount: 75.00, category_id: 'cat_supplies', notes: 'Stationery' },
  { date: '2024-06-30', name: 'Q2 Planning', type: 'income', amount: 2200.00, category_id: 'cat_consulting', notes: 'Q2 strategic planning' },
];

oneOffTransactions.forEach(tx => transactions.push({ ...tx, id: uuidv4() }));

export const SEED_TRANSACTIONS: Transaction[] = transactions;

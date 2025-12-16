import { Category, TransactionType } from '../types';
import { VENDOR_CATEGORY_KEYWORDS } from '../constants';

export interface ParsedBankTransaction {
  date: string;
  description: string;
  amount: number;
  suggestedCategoryId: string | null;
  suggestedType: TransactionType;
  confidence: 'high' | 'medium' | 'low';
}

const MONTHS: Record<string, number> = {
  'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
  'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
};

// Parse date formats like "4-Oct", "Oct 4", "10/4", "2024-10-04"
export function parseBankDate(dateStr: string, year: number): string | null {
  const cleaned = dateStr.trim().toLowerCase();

  // Pattern: "4-Oct" or "4 Oct"
  const dayMonthMatch = cleaned.match(/^(\d{1,2})[-\s]([a-z]{3})/);
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1], 10);
    const month = MONTHS[dayMonthMatch[2]];
    if (month !== undefined && day >= 1 && day <= 31) {
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Pattern: "Oct 4" or "Oct-4"
  const monthDayMatch = cleaned.match(/^([a-z]{3})[-\s](\d{1,2})/);
  if (monthDayMatch) {
    const month = MONTHS[monthDayMatch[1]];
    const day = parseInt(monthDayMatch[2], 10);
    if (month !== undefined && day >= 1 && day <= 31) {
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Pattern: "10/4" or "10-4" (MM/DD)
  const numericMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (numericMatch) {
    const month = parseInt(numericMatch[1], 10);
    const day = parseInt(numericMatch[2], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Pattern: Full date "2024-10-04"
  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return cleaned;
  }

  // Pattern: "10/4/2024" or "10-4-2024" (MM/DD/YYYY)
  const fullNumericMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (fullNumericMatch) {
    const month = parseInt(fullNumericMatch[1], 10);
    const day = parseInt(fullNumericMatch[2], 10);
    const parsedYear = parseInt(fullNumericMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${parsedYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return null;
}

// Match vendor description to category
export function matchVendorToCategory(
  description: string,
  categories: Category[]
): { categoryId: string | null; confidence: 'high' | 'medium' | 'low' } {
  const upperDesc = description.toUpperCase();

  // Create category name to ID map
  const categoryNameToId = new Map(categories.map(c => [c.name, c.id]));

  // Check each category's keywords
  for (const [categoryName, keywords] of Object.entries(VENDOR_CATEGORY_KEYWORDS)) {
    const categoryId = categoryNameToId.get(categoryName);
    if (!categoryId) continue;

    for (const keyword of keywords) {
      if (upperDesc.includes(keyword)) {
        return { categoryId, confidence: 'high' };
      }
    }
  }

  return { categoryId: null, confidence: 'low' };
}

// Helper to parse CSV line (handles quoted strings with commas)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Parse bank statement CSV
export function parseBankStatementCSV(
  csvText: string,
  year: number,
  categories: Category[]
): ParsedBankTransaction[] {
  const lines = csvText.split(/\r?\n/);
  const results: ParsedBankTransaction[] = [];

  // Skip header if present (check first line for common header keywords)
  const firstLine = lines[0]?.toLowerCase() || '';
  const hasHeader = firstLine.includes('date') ||
                   firstLine.includes('description') ||
                   firstLine.includes('amount') ||
                   firstLine.includes('transaction');
  const startIdx = hasHeader ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV columns
    const cols = parseCSVLine(line);
    if (cols.length < 3) continue;

    const [dateStr, description, amountStr] = cols;

    // Parse date
    const parsedDate = parseBankDate(dateStr, year);
    if (!parsedDate) continue;

    // Parse amount (handle negative values, remove currency symbols)
    const cleanAmount = amountStr.replace(/[$,]/g, '').trim();
    const amount = parseFloat(cleanAmount);
    if (isNaN(amount)) continue;

    // Categorize - filter to expense categories since bank statements are typically expenses
    const expenseCategories = categories.filter(c => c.type === 'expense');
    const { categoryId, confidence } = matchVendorToCategory(description, expenseCategories);

    // All bank statement imports are expenses by default
    const type: TransactionType = 'expense';

    results.push({
      date: parsedDate,
      description: description.trim(),
      amount: Math.abs(amount),
      suggestedCategoryId: categoryId,
      suggestedType: type,
      confidence
    });
  }

  return results;
}

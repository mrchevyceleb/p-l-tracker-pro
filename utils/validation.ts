// Common validation utilities for P&L Tracker Pro

/**
 * Validates and sanitizes a transaction name
 * @param name - The name to validate
 * @returns Sanitized name or null if invalid
 */
export function validateTransactionName(name: string): string | null {
  if (!name || typeof name !== 'string') {
    return null;
  }

  // Remove HTML tags (basic XSS prevention)
  const sanitized = name.replace(/<[^>]*>/g, '').trim();

  // Limit length
  const limited = sanitized.slice(0, 200);

  return limited || null;
}

/**
 * Validates and sanitizes transaction notes
 * @param notes - The notes to validate
 * @returns Sanitized notes or empty string
 */
export function validateNotes(notes: string): string {
  if (!notes || typeof notes !== 'string') {
    return '';
  }

  // Remove HTML tags
  const sanitized = notes.replace(/<[^>]*>/g, '').trim();

  // Limit length
  return sanitized.slice(0, 500);
}

/**
 * Validates a transaction amount
 * @param amount - The amount to validate
 * @param options - Validation options
 * @returns Validated amount or null if invalid
 */
export function validateAmount(
  amount: number | string,
  options: { min?: number; max?: number } = {}
): number | null {
  const min = options.min ?? 0;
  const max = options.max ?? 999999999.99;

  const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(parsed)) {
    return null;
  }

  if (parsed <= min || parsed > max) {
    return null;
  }

  // Round to 2 decimal places
  return Math.round(parsed * 100) / 100;
}

/**
 * Validates a date string in YYYY-MM-DD format
 * @param dateStr - The date string to validate
 * @returns Validated date string or null if invalid
 */
export function validateDate(dateStr: string): string | null {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }

  // Check format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return null;
  }

  // Check if it's a valid date
  const date = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(date.getTime())) {
    return null;
  }

  return dateStr;
}

/**
 * Validates an email address
 * @param email - The email to validate
 * @returns True if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates a password strength
 * @param password - The password to validate
 * @returns Object with validity and message
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  return { valid: true, message: 'Password is strong' };
}

/**
 * Sanitizes a string for safe display
 * @param str - The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeForDisplay(str: string): string {
  if (!str || typeof str !== 'string') {
    return '';
  }

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates a UUID format
 * @param uuid - The UUID to validate
 * @returns True if valid UUID format
 */
export function validateUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates a percentage value (0-100)
 * @param percentage - The percentage to validate
 * @returns Validated percentage or null
 */
export function validatePercentage(percentage: number | string): number | null {
  const parsed = typeof percentage === 'string' ? parseFloat(percentage) : percentage;

  if (isNaN(parsed)) {
    return null;
  }

  if (parsed < 0 || parsed > 100) {
    return null;
  }

  return Math.round(parsed * 100) / 100;
}

/**
 * Limits the number of items in an array
 * @param items - The array to limit
 * @param max - Maximum number of items
 * @returns Limited array
 */
export function limitArray<T>(items: T[], max: number): T[] {
  if (max <= 0) {
    return [];
  }
  return items.slice(0, max);
}

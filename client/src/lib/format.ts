/**
 * Formats a numeric amount as Indian Rupees (INR) currency.
 * Example: 120000 -> "₹1,20,000"
 */
export function formatCurrencyINR(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Formats an ISO date string 'YYYY-MM-DD' into a human-readable format like "15 Dec 2026".
 * Uses deterministic 3-letter month formatting to avoid OS/locale discrepancies (e.g. "Sept" vs "Sep")
 * and prevents any off-by-one UTC timezone shifts.
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString || typeof dateString !== 'string') {
    return 'No deadline';
  }

  const parts = dateString.split('-');
  if (parts.length !== 3) {
    return dateString;
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12) {
    return dateString;
  }

  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

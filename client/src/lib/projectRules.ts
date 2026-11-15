import { Project } from '../types';

/**
 * Returns today's date formatted as 'YYYY-MM-DD' in the user's local timezone.
 * Avoids any UTC midnight conversion skew.
 */
export function getTodayLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Determines whether a project is overdue according to business rules:
 * 1. Returns false if deadline is null, undefined, empty, or an invalid date string.
 * 2. Completed projects are NEVER shown as overdue, regardless of deadline date.
 * 3. Compares DATE-ONLY strings ('YYYY-MM-DD') in the user's local timezone.
 * 4. An optional injectable `today` string ('YYYY-MM-DD') is supported for deterministic unit testing.
 * 5. A project is overdue ONLY if deadline < today (a project due today is NOT overdue).
 * 
 * NOTE: Never uses `new Date("YYYY-MM-DD")` for this comparison because ECMAScript
 * specifies that date-only strings are parsed as UTC midnight, producing timezone bugs.
 */
export function isOverdue(
  project: Pick<Project, 'deadline' | 'status'>,
  today: string = getTodayLocalDateString()
): boolean {
  // Completed projects are never overdue
  if (project.status === 'completed') {
    return false;
  }

  // Missing or non-string deadlines cannot be overdue
  if (!project.deadline || typeof project.deadline !== 'string') {
    return false;
  }

  // Check valid YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(project.deadline)) {
    return false;
  }

  // Overdue strictly when deadline is strictly before today
  return project.deadline < today;
}

/**
 * Determines whether a project has exceeded its budget limit.
 * Rule: spentAmount > budget (strictly greater).
 * 
 * Exact limit decision: spentAmount === budget is WITHIN budget (not over budget).
 */
export function isOverBudget(project: Pick<Project, 'budget' | 'spentAmount'>): boolean {
  return project.spentAmount > project.budget;
}

/**
 * Checks if a project has reached 100% of its budget without exceeding it.
 * Used to display the neutral "Budget fully used" badge.
 */
export function isBudgetFullyUsed(project: Pick<Project, 'budget' | 'spentAmount'>): boolean {
  return project.budget > 0 && project.spentAmount === project.budget;
}

/**
 * Returns the budget usage percentage capped at 100% for progress bar widths.
 */
export function getBudgetUsagePercentage(budget: number, spentAmount: number): number {
  if (budget <= 0) {
    return spentAmount > 0 ? 100 : 0;
  }
  const percentage = (spentAmount / budget) * 100;
  return Math.min(100, Math.max(0, Math.round(percentage)));
}

/**
 * Returns excess amount spent over budget (0 if within budget).
 */
export function getOverBudgetAmount(budget: number, spentAmount: number): number {
  return Math.max(0, spentAmount - budget);
}

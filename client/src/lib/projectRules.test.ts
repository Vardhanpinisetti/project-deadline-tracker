import { describe, it, expect } from 'vitest';
import { isOverdue, isOverBudget, isBudgetFullyUsed } from './projectRules';

describe('Frontend Business Rules', () => {
  describe('isOverdue', () => {
    const injectedToday = '2026-11-15';

    it('returns true for past deadline on active/on_hold project', () => {
      expect(isOverdue({ status: 'active', deadline: '2026-11-14' }, injectedToday)).toBe(true);
      expect(isOverdue({ status: 'on_hold', deadline: '2026-09-30' }, injectedToday)).toBe(true);
    });

    it('returns false when deadline is today (project due today is NOT overdue)', () => {
      expect(isOverdue({ status: 'active', deadline: '2026-11-15' }, injectedToday)).toBe(false);
    });

    it('returns false for future deadline', () => {
      expect(isOverdue({ status: 'active', deadline: '2026-11-16' }, injectedToday)).toBe(false);
      expect(isOverdue({ status: 'active', deadline: '2026-12-15' }, injectedToday)).toBe(false);
    });

    it('returns false when deadline is null', () => {
      expect(isOverdue({ status: 'active', deadline: null }, injectedToday)).toBe(false);
    });

    it('returns false for invalid date strings', () => {
      expect(isOverdue({ status: 'active', deadline: 'invalid-date' }, injectedToday)).toBe(false);
      expect(isOverdue({ status: 'active', deadline: '' }, injectedToday)).toBe(false);
    });

    it('returns false for completed project even if deadline is in the past', () => {
      expect(isOverdue({ status: 'completed', deadline: '2026-10-20' }, injectedToday)).toBe(false);
    });

    it('proves zero timezone dependence by evaluating explicit local date comparison', () => {
      // Regardless of machine timezone, string comparison against 'YYYY-MM-DD' is deterministic
      const fixedToday = '2026-05-10';
      expect(isOverdue({ status: 'active', deadline: '2026-05-09' }, fixedToday)).toBe(true);
      expect(isOverdue({ status: 'active', deadline: '2026-05-10' }, fixedToday)).toBe(false);
      expect(isOverdue({ status: 'active', deadline: '2026-05-11' }, fixedToday)).toBe(false);
    });
  });

  describe('isOverBudget', () => {
    it('returns true when spentAmount is strictly greater than budget', () => {
      expect(isOverBudget({ budget: 180000, spentAmount: 200000 })).toBe(true);
      expect(isOverBudget({ budget: 25000, spentAmount: 30000 })).toBe(true);
    });

    it('returns false when spentAmount is exactly equal to budget', () => {
      expect(isOverBudget({ budget: 50000, spentAmount: 50000 })).toBe(false);
      expect(isBudgetFullyUsed({ budget: 50000, spentAmount: 50000 })).toBe(true);
    });

    it('returns false when spentAmount is less than budget', () => {
      expect(isOverBudget({ budget: 120000, spentAmount: 45000 })).toBe(false);
      expect(isOverBudget({ budget: 90000, spentAmount: 12000 })).toBe(false);
    });
  });
});

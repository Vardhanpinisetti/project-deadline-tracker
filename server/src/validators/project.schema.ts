import { z } from 'zod';

export const VALID_STATUSES = ['active', 'completed', 'on_hold'] as const;
export type ProjectStatus = (typeof VALID_STATUSES)[number];

function isValidCalendarDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  // Use UTC to avoid any local timezone shifts
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return (
    dateObj.getUTCFullYear() === year &&
    dateObj.getUTCMonth() === month - 1 &&
    dateObj.getUTCDate() === day
  );
}

function hasAtMostTwoDecimals(n: number): boolean {
  const parts = n.toString().split('.');
  return !parts[1] || parts[1].length <= 2;
}

export const createProjectSchema = z.object({
  title: z
    .string({
      required_error: 'Title is required',
      invalid_type_error: 'Title must be a string'
    })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, {
      message: 'Title cannot be empty'
    })
    .refine((val) => val.length <= 150, {
      message: 'Title cannot exceed 150 characters'
    }),

  status: z.enum(VALID_STATUSES, {
    errorMap: () => ({
      message: 'Status must be one of: active, completed, on_hold'
    })
  }),

  deadline: z
    .preprocess((val) => {
      if (val === undefined || val === null || val === '') {
        return null;
      }
      return val;
    }, z.union([
      z.null(),
      z
        .string({
          invalid_type_error: 'Deadline must be a valid date in YYYY-MM-DD format or null'
        })
        .refine(isValidCalendarDate, {
          message: 'Deadline must be a valid calendar date in YYYY-MM-DD format'
        })
    ])),

  budget: z
    .number({
      required_error: 'Budget is required',
      invalid_type_error: 'Budget must be a valid number'
    })
    .refine((n) => Number.isFinite(n) && !Number.isNaN(n), {
      message: 'Budget must be a finite number'
    })
    .refine((n) => n >= 0, {
      message: 'Budget must be 0 or greater'
    })
    .refine((n) => n <= 10_000_000_000, {
      message: 'Budget cannot exceed 10,000,000,000'
    })
    .refine(hasAtMostTwoDecimals, {
      message: 'Budget may have at most 2 decimal places'
    }),

  spentAmount: z
    .number({
      required_error: 'Spent amount is required',
      invalid_type_error: 'Spent amount must be a valid number'
    })
    .refine((n) => Number.isFinite(n) && !Number.isNaN(n), {
      message: 'Spent amount must be a finite number'
    })
    .refine((n) => n >= 0, {
      message: 'Spent amount must be 0 or greater'
    })
    .refine((n) => n <= 10_000_000_000, {
      message: 'Spent amount cannot exceed 10,000,000,000'
    })
    .refine(hasAtMostTwoDecimals, {
      message: 'Spent amount may have at most 2 decimal places'
    })
});

export const updateStatusSchema = z.object({
  status: z.enum(VALID_STATUSES, {
    errorMap: () => ({
      message: 'Status must be one of: active, completed, on_hold'
    })
  })
}, {
  required_error: 'Request body is required'
});

export const statusQuerySchema = z.object({
  status: z.enum(VALID_STATUSES, {
    errorMap: () => ({
      message: 'Invalid status filter. Allowed values: active, completed, on_hold'
    })
  }).optional()
});

export const projectIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Project ID must be a valid integer')
    .transform((val) => parseInt(val, 10))
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

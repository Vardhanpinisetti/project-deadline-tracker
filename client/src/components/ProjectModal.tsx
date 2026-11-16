import React, { useState, useEffect, useRef } from 'react';
import { CreateProjectDTO, UpdateProjectDTO, Project, ProjectStatus, ValidationErrorDetail } from '../types';
import { ApiError } from '../lib/api';
import { Button } from './Button';
import { X, AlertTriangle, Calendar } from 'lucide-react';

export function buildPatchPayload(
  initial: {
    title: string;
    status: ProjectStatus;
    deadline: string | null;
    budget: number;
    spentAmount: number;
  },
  current: {
    title: string;
    status: ProjectStatus;
    deadline: string;
    budget: string;
    spentAmount: string;
  }
): Partial<CreateProjectDTO> {
  const patch: Partial<CreateProjectDTO> = {};

  if (current.title.trim() !== initial.title.trim()) {
    patch.title = current.title.trim();
  }
  if (current.status !== initial.status) {
    patch.status = current.status;
  }

  const currentDeadline = current.deadline.trim() ? current.deadline.trim() : null;
  const initialDeadline = initial.deadline ? initial.deadline.trim() : null;
  if (currentDeadline !== initialDeadline) {
    patch.deadline = currentDeadline;
  }

  const currentBudget = current.budget.trim() === '' ? NaN : Number(current.budget);
  if (currentBudget !== initial.budget) {
    patch.budget = currentBudget;
  }

  const currentSpent = current.spentAmount.trim() === '' ? NaN : Number(current.spentAmount);
  if (currentSpent !== initial.spentAmount) {
    patch.spentAmount = currentSpent;
  }

  return patch;
}

export interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
  initialProject?: Project | null;
  onSubmitCreate?: (data: CreateProjectDTO) => Promise<void>;
  onSubmitEdit?: (id: number, data: UpdateProjectDTO) => Promise<void>;
  // For backwards compatibility:
  onSubmit?: (data: CreateProjectDTO) => Promise<void>;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  mode = 'create',
  initialProject = null,
  onSubmitCreate,
  onSubmitEdit,
  onSubmit,
}) => {
  const isEditMode = mode === 'edit' && initialProject !== null;

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [deadline, setDeadline] = useState('');
  const [budget, setBudget] = useState('');
  const [spentAmount, setSpentAmount] = useState('0');

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Reset or pre-fill form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialProject) {
        setTitle(initialProject.title);
        setStatus(initialProject.status);
        setDeadline(initialProject.deadline || '');
        setBudget(String(initialProject.budget));
        setSpentAmount(String(initialProject.spentAmount));
      } else {
        setTitle('');
        setStatus('active');
        setDeadline('');
        setBudget('');
        setSpentAmount('0');
      }
      setFieldErrors({});
      setSummaryError(null);
      setLoading(false);

      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, isEditMode, initialProject]);

  // Focus trap and Esc key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSummaryError(null);
    setLoading(true);

    try {
      if (isEditMode && initialProject) {
        // Build PATCH payload containing ONLY the fields that changed
        const patch = buildPatchPayload(initialProject, {
          title,
          status,
          deadline,
          budget,
          spentAmount,
        });

        // If no fields changed, simply close modal
        if (Object.keys(patch).length === 0) {
          onClose();
          return;
        }

        if (onSubmitEdit) {
          await onSubmitEdit(initialProject.id, patch);
        }
      } else {
        const budgetNum = budget.trim() === '' ? NaN : Number(budget);
        const spentNum = spentAmount.trim() === '' ? NaN : Number(spentAmount);

        const payload: CreateProjectDTO = {
          title: title.trim(),
          status,
          deadline: deadline.trim() ? deadline.trim() : null,
          budget: budgetNum,
          spentAmount: spentNum,
        };

        const createFn = onSubmitCreate || onSubmit;
        if (createFn) {
          await createFn(payload);
        }
      }

      onClose();
    } catch (err: unknown) {
      // Keep modal open on error, display summary and field errors
      if (err instanceof ApiError) {
        const errors: Record<string, string> = {};
        if (err.details && Array.isArray(err.details)) {
          err.details.forEach((item: ValidationErrorDetail) => {
            errors[item.field] = item.message;
          });
        }
        setFieldErrors(errors);
        setSummaryError(
          err.message || 'Validation failed. Please correct the highlighted errors.'
        );
      } else if (err instanceof Error) {
        setSummaryError(err.message);
      } else {
        setSummaryError('Failed to save project. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-lg solar-glass bg-[#0B1020]/95 p-6 rounded-[18px] border-[rgba(255,180,84,0.3)] shadow-solar-card animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,180,84,0.14)]">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-[#FFF6EA] tracking-tight">
              {isEditMode ? 'Edit project' : 'Create New Project'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isEditMode
                ? 'Update the project details, timeline, or allocated budget.'
                : 'Enter the project details, timeline, and allocated budget.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 text-muted hover:text-[#FFF6EA] rounded-xl hover:bg-white/[0.05] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server Error Summary Banner */}
        {summaryError && (
          <div
            role="alert"
            aria-live="polite"
            className="mt-4 p-3.5 rounded-xl bg-[#FF4D5E]/15 border border-[#FF4D5E]/40 text-[#FF4D5E] text-xs flex items-start gap-2.5 animate-fade-in"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-alert-red mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">{summaryError}</span>
              {Object.keys(fieldErrors).length > 0 && (
                <ul className="list-disc list-inside space-y-0.5 text-[#FF4D5E]/90">
                  {Object.entries(fieldErrors).map(([field, msg]) => (
                    <li key={field}>
                      <strong className="capitalize">{field}</strong>: {msg}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="modal-title-input"
              className="block text-xs uppercase tracking-wider font-semibold text-muted"
            >
              Project Title
            </label>
            <input
              ref={titleInputRef}
              id="modal-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Website Redesign"
              className={`w-full min-h-[44px] px-3.5 text-sm text-[#FFF6EA] bg-[#05060B] hover:border-[rgba(255,180,84,0.4)] rounded-xl border transition-all duration-150 ease-out placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/60 ${
                fieldErrors.title
                  ? 'border-alert-red focus:ring-alert-red/40'
                  : 'border-[rgba(255,180,84,0.22)]'
              }`}
              required
              autoComplete="off"
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? 'modal-title-error' : undefined}
            />
            {fieldErrors.title && (
              <p
                id="modal-title-error"
                role="alert"
                aria-live="polite"
                className="text-xs text-alert-red font-medium flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.title}</span>
              </p>
            )}
          </div>

          {/* Status & Deadline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="modal-status-select"
                className="block text-xs uppercase tracking-wider font-semibold text-muted"
              >
                Status
              </label>
              <select
                id="modal-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className={`w-full min-h-[44px] px-3.5 text-sm text-[#FFF6EA] bg-[#05060B] hover:border-[rgba(255,180,84,0.4)] rounded-xl border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/60 ${
                  fieldErrors.status
                    ? 'border-alert-red'
                    : 'border-[rgba(255,180,84,0.22)]'
                }`}
              >
                <option value="active" className="bg-[#0B1020] text-[#FFF6EA]">Active</option>
                <option value="completed" className="bg-[#0B1020] text-[#FFF6EA]">Completed</option>
                <option value="on_hold" className="bg-[#0B1020] text-[#FFF6EA]">On hold</option>
              </select>
              {fieldErrors.status && (
                <p
                  role="alert"
                  aria-live="polite"
                  className="text-xs text-alert-red font-medium flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.status}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="modal-deadline-input"
                  className="block text-xs uppercase tracking-wider font-semibold text-muted"
                >
                  Deadline
                </label>
                {deadline && (
                  <button
                    type="button"
                    onClick={() => setDeadline('')}
                    className="text-xs text-accent hover:underline"
                  >
                    Clear (No deadline)
                  </button>
                )}
              </div>
              <input
                id="modal-deadline-input"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={`w-full min-h-[44px] px-3.5 text-sm text-[#FFF6EA] bg-[#05060B] hover:border-[rgba(255,180,84,0.4)] rounded-xl border transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-accent/60 ${
                  fieldErrors.deadline
                    ? 'border-alert-red'
                    : 'border-[rgba(255,180,84,0.22)]'
                }`}
                aria-invalid={Boolean(fieldErrors.deadline)}
              />
              {fieldErrors.deadline ? (
                <p
                  role="alert"
                  aria-live="polite"
                  className="text-xs text-alert-red font-medium flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.deadline}</span>
                </p>
              ) : (
                <p className="text-xs text-muted flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted shrink-0" />
                  <span>Leave empty for no deadline</span>
                </p>
              )}
            </div>
          </div>

          {/* Budget & Spent Amount Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="modal-budget-input"
                className="block text-xs uppercase tracking-wider font-semibold text-muted"
              >
                Budget (₹ INR)
              </label>
              <input
                id="modal-budget-input"
                type="number"
                min="0"
                step="any"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 100000"
                className={`w-full min-h-[44px] px-3.5 text-sm text-[#FFF6EA] bg-[#05060B] hover:border-[rgba(255,180,84,0.4)] rounded-xl border transition-all duration-150 ease-out placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/60 ${
                  fieldErrors.budget
                    ? 'border-alert-red'
                    : 'border-[rgba(255,180,84,0.22)]'
                }`}
                required
                aria-invalid={Boolean(fieldErrors.budget)}
              />
              {fieldErrors.budget && (
                <p
                  role="alert"
                  aria-live="polite"
                  className="text-xs text-alert-red font-medium flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.budget}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <label
                htmlFor="modal-spent-input"
                className="block text-xs uppercase tracking-wider font-semibold text-muted"
              >
                Spent Amount (₹ INR)
              </label>
              <input
                id="modal-spent-input"
                type="number"
                min="0"
                step="any"
                value={spentAmount}
                onChange={(e) => setSpentAmount(e.target.value)}
                placeholder="0"
                className={`w-full min-h-[44px] px-3.5 text-sm text-[#FFF6EA] bg-[#05060B] hover:border-[rgba(255,180,84,0.4)] rounded-xl border transition-all duration-150 ease-out placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/60 ${
                  fieldErrors.spentAmount
                    ? 'border-alert-red'
                    : 'border-[rgba(255,180,84,0.22)]'
                }`}
                required
                aria-invalid={Boolean(fieldErrors.spentAmount)}
              />
              {fieldErrors.spentAmount && (
                <p
                  role="alert"
                  aria-live="polite"
                  className="text-xs text-alert-red font-medium flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.spentAmount}</span>
                </p>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[rgba(255,180,84,0.14)] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              {isEditMode ? 'Save changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

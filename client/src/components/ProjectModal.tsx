import React, { useState, useEffect, useRef } from 'react';
import { CreateProjectDTO, ProjectStatus, ValidationErrorDetail } from '../types';
import { ApiError } from '../lib/api';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { X, AlertTriangle, Calendar } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectDTO) => Promise<void>;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setStatus('active');
      setDeadline('');
      setBudget('');
      setSpentAmount('0');
      setFieldErrors({});
      setSummaryError(null);
      setLoading(false);

      // Focus first input
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle Escape key and focus trap
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

    const budgetNum = budget.trim() === '' ? NaN : Number(budget);
    const spentNum = spentAmount.trim() === '' ? NaN : Number(spentAmount);

    const payload: CreateProjectDTO = {
      title,
      status,
      deadline: deadline.trim() ? deadline.trim() : null,
      budget: budgetNum,
      spentAmount: spentNum,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const errors: Record<string, string> = {};
        if (err.details && Array.isArray(err.details)) {
          err.details.forEach((item: ValidationErrorDetail) => {
            errors[item.field] = item.message;
          });
        }
        setFieldErrors(errors);
        setSummaryError(err.message || 'Validation failed. Please correct the errors below.');
      } else if (err instanceof Error) {
        setSummaryError(err.message);
      } else {
        setSummaryError('Failed to create project. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-lg rounded-2xl bg-bg-elevated/95 border border-border p-6 shadow-glass backdrop-blur-2xl animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-text-primary tracking-tight">
              Create New Project
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Enter the project details, timeline, and allocated budget.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-surface transition-colors"
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
            className="mt-4 p-3.5 rounded-xl bg-danger/[0.12] border border-danger/30 text-danger text-xs flex items-start gap-2.5 animate-fade-in"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-danger mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">{summaryError}</span>
              {Object.keys(fieldErrors).length > 0 && (
                <ul className="list-disc list-inside space-y-0.5 text-danger/90">
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
          <Input
            ref={titleInputRef}
            label="Project Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Website Redesign"
            error={fieldErrors.title}
            required
            autoComplete="off"
          />

          {/* Status & Deadline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Initial Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              error={fieldErrors.status}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'on_hold', label: 'On Hold' },
              ]}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="input-deadline"
                  className="block text-xs uppercase tracking-wider font-semibold text-text-muted"
                >
                  Deadline
                </label>
                {deadline && (
                  <button
                    type="button"
                    onClick={() => setDeadline('')}
                    className="text-xs text-brand-violet hover:text-brand-blue underline"
                  >
                    Clear (No deadline)
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="input-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`w-full h-11 px-3.5 text-sm text-text-primary bg-bg-elevated hover:border-border-strong rounded-xl border transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:border-brand-violet/50 ${
                    fieldErrors.deadline
                      ? 'border-danger focus:ring-danger/40 focus:border-danger'
                      : 'border-border'
                  }`}
                  aria-invalid={Boolean(fieldErrors.deadline)}
                />
              </div>
              {fieldErrors.deadline ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-danger font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.deadline}</span>
                </p>
              ) : (
                <p className="mt-1 text-xs text-text-muted flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-text-muted" />
                  <span>Leave empty for project without deadline</span>
                </p>
              )}
            </div>
          </div>

          {/* Budget & Spent Amount Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Budget (₹ INR)"
              type="number"
              min="0"
              step="any"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 100000"
              error={fieldErrors.budget}
              required
            />

            <Input
              label="Spent Amount (₹ INR)"
              type="number"
              min="0"
              step="any"
              value={spentAmount}
              onChange={(e) => setSpentAmount(e.target.value)}
              placeholder="0"
              error={fieldErrors.spentAmount}
              required
            />
          </div>

          {/* Sticky Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
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
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { Project } from '../types';
import { Button } from './Button';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onConfirm: (project: Project) => Promise<void>;
  isDeleting?: boolean;
}

export class DeleteConfirmationHandler {
  private isBusy = false;

  constructor(private onDelete: (project: Project) => Promise<unknown>) {}

  async handleAction(confirmed: boolean, project: Project): Promise<boolean> {
    if (!confirmed) {
      return false;
    }
    if (this.isBusy) {
      return false;
    }
    this.isBusy = true;
    try {
      await this.onDelete(project);
      return true;
    } finally {
      this.isBusy = false;
    }
  }

  get busy(): boolean {
    return this.isBusy;
  }
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  project,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Focus trap and Esc key handler, with initial focus on Cancel button
  useEffect(() => {
    if (!isOpen) return;

    setLocalSubmitting(false);

    // Initial focus on Cancel button
    const focusTimer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isDeleting && !localSubmitting) {
          onClose();
        }
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
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isDeleting, localSubmitting]);

  if (!isOpen || !project) return null;

  const busy = isDeleting || localSubmitting;

  const handleConfirm = async () => {
    if (busy) return; // Guard against two quick double-clicks
    setLocalSubmitting(true);
    try {
      await onConfirm(project);
    } finally {
      setLocalSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
        className="w-full max-w-md solar-glass bg-[#0B1020]/95 p-6 rounded-[18px] border-[rgba(255,180,84,0.3)] shadow-solar-card animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,180,84,0.14)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FF4D5E]/15 text-alert-red flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 id="delete-dialog-title" className="text-base font-semibold text-[#FFF6EA] tracking-tight">
              Delete Project
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-1.5 text-muted hover:text-[#FFF6EA] rounded-xl hover:bg-white/[0.05] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <div className="py-4">
          <p id="delete-dialog-desc" className="text-sm text-ink-2 leading-relaxed">
            Delete <strong className="text-[#FFF6EA] font-semibold font-mono">'{project.title}'</strong>? This can't be undone.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[rgba(255,180,84,0.14)] flex items-center justify-end gap-3">
          <Button
            ref={cancelBtnRef}
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#FF4D5E] hover:bg-[#e03d4e] active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

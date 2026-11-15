import React, { forwardRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  optional?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, optional = false, id, className = '', ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="w-full space-y-1.5 text-left">
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="block text-xs uppercase tracking-wider font-semibold text-text-muted">
            {label}
          </label>
          {optional && (
            <span className="text-xs text-text-muted font-normal lowercase tracking-normal">optional</span>
          )}
        </div>

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`w-full h-11 px-3.5 text-sm text-text-primary bg-bg-elevated hover:border-border-strong rounded-xl border transition-all duration-150 ease-out placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:border-brand-violet/50 ${
              error
                ? 'border-danger focus:ring-danger/40 focus:border-danger'
                : 'border-border'
            } ${className}`}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
        </div>

        {error ? (
          <p id={`${inputId}-error`} role="alert" aria-live="polite" className="flex items-center gap-1.5 text-xs text-danger font-medium animate-fade-in">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-danger" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="text-xs text-text-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

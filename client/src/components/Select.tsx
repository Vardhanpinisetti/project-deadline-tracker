import React, { forwardRef } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, id, className = '', ...props }, ref) => {
    const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="w-full space-y-1.5 text-left">
        <label htmlFor={selectId} className="block text-xs uppercase tracking-wider font-semibold text-text-muted">
          {label}
        </label>

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`w-full h-11 px-3.5 pr-9 text-sm text-text-primary bg-bg-elevated hover:border-border-strong rounded-xl border appearance-none cursor-pointer transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:border-brand-violet/50 ${
              error
                ? 'border-danger focus:ring-danger/40 focus:border-danger'
                : 'border-border'
            } ${className}`}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-bg-elevated text-text-primary py-1.5">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>

        {error ? (
          <p id={`${selectId}-error`} role="alert" aria-live="polite" className="flex items-center gap-1.5 text-xs text-danger font-medium animate-fade-in">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-danger" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={`${selectId}-helper`} className="text-xs text-text-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-[14px] transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none';

    const sizeStyles = {
      sm: 'h-9 px-3.5 text-xs gap-1.5',
      md: 'min-h-[44px] px-5 py-2.5 text-sm gap-2',
      lg: 'min-h-[48px] px-6 py-3 text-base gap-2.5',
    }[size];

    const variantStyles = {
      primary: 'solar-btn-primary',
      secondary:
        'bg-[rgba(24,18,12,0.6)] text-[#FFF6EA] border border-[rgba(255,180,84,0.22)] hover:border-[rgba(255,180,84,0.45)] hover:bg-[rgba(24,18,12,0.8)] active:brightness-95',
      ghost:
        'bg-transparent text-muted hover:text-[#FFF6EA] hover:bg-white/[0.04] active:brightness-95',
      danger:
        'bg-[#FF4D5E]/15 text-[#FF4D5E] border border-[#FF4D5E]/40 hover:bg-[#FF4D5E]/25 active:brightness-95',
    }[variant];

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';

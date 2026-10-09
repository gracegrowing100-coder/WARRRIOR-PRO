import React, { forwardRef } from 'react';
import { cn } from './utils';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-action text-foreground-inverse hover:bg-action-hover',
  accent: 'bg-action-accent text-white hover:bg-action-accent-hover',
  secondary: 'border border-line-strong bg-surface text-foreground hover:bg-surface-subtle',
  ghost: 'bg-transparent text-foreground hover:bg-surface-subtle',
  danger: 'bg-status-danger text-white hover:bg-medical-700',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3 text-small',
  md: 'min-h-11 px-4 text-body font-semibold',
  lg: 'min-h-12 px-5 text-body font-semibold',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      type = 'button',
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      loadingLabel = 'Working…',
      leadingIcon,
      trailingIcon,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        data-ui
        data-ui-control
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 rounded-control font-medium',
          'disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-100',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        <span
          aria-hidden={loading || undefined}
          className={cn('inline-flex items-center justify-center gap-2', loading && 'invisible')}
        >
          {leadingIcon && <span aria-hidden="true">{leadingIcon}</span>}
          <span>{children}</span>
          {trailingIcon && <span aria-hidden="true">{trailingIcon}</span>}
        </span>
        {loading && (
          <span className="absolute inset-0 inline-flex items-center justify-center px-3" role="status">
            {loadingLabel}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

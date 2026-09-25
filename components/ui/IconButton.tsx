import React, { forwardRef } from 'react';
import { cn } from './utils';

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  label: string;
  icon: React.ReactNode;
  variant?: 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
}

const variantClasses = {
  secondary: 'border border-line-strong bg-surface text-foreground hover:bg-surface-subtle',
  ghost: 'bg-transparent text-foreground hover:bg-surface-subtle',
  danger: 'bg-status-danger text-white hover:bg-medical-700',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ type = 'button', label, icon, variant = 'ghost', size = 'md', className, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      data-ui
      data-ui-control
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-control',
        'disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground',
        size === 'lg' ? 'min-h-12 min-w-12' : 'min-h-11 min-w-11',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  ),
);

IconButton.displayName = 'IconButton';

import React, { forwardRef } from 'react';
import { cn } from './utils';

export type ButtonVariant =
  | 'primary'
  | 'dark'
  | 'water'
  | 'outline'
  | 'ghost'
  | 'onPlum'
  | 'icon'
  | 'accent'
  | 'secondary'
  | 'danger';

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
  primary: 'bg-wa-crimson text-white hover:bg-wa-crimson-press active:bg-wa-crimson-press shadow-sm',
  dark: 'bg-wa-hero text-white hover:bg-wa-hero/90 active:bg-wa-hero/95',
  water: 'bg-wa-water text-white hover:bg-wa-water-ink active:bg-wa-water-ink',
  outline: 'border-[1.5px] border-wa-plum bg-transparent text-wa-plum hover:bg-wa-rose/30 active:bg-wa-rose/50',
  ghost: 'bg-transparent text-wa-crimson hover:bg-wa-rose/40 active:bg-wa-rose/60',
  onPlum: 'bg-white text-wa-hero hover:bg-wa-on-plum-soft active:bg-wa-on-plum-muted',
  icon: 'border border-wa-line bg-wa-surface text-wa-plum hover:bg-wa-ground p-0 flex items-center justify-center',
  accent: 'bg-wa-crimson text-white hover:bg-wa-crimson-press shadow-sm',
  secondary: 'border-[1.5px] border-wa-line bg-wa-surface text-wa-plum hover:bg-wa-ground',
  danger: 'bg-wa-crimson text-white hover:bg-wa-crimson-press',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-[13px] font-semibold',
  md: 'h-12 px-5 text-sm sm:text-[15px] font-bold',
  lg: 'h-14 px-6 text-base font-bold',
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
    const isIconVariant = variant === 'icon';

    return (
      <button
        ref={ref}
        type={type}
        data-ui
        data-ui-control
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 rounded-full font-body transition-colors duration-150',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-inherit',
          variantClasses[variant],
          isIconVariant ? 'h-11 w-11 rounded-full p-0 shrink-0' : sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        <span
          aria-hidden={loading || undefined}
          className={cn('inline-flex items-center justify-center gap-2', loading && 'invisible')}
        >
          {leadingIcon && <span aria-hidden="true" className="shrink-0">{leadingIcon}</span>}
          {children && <span>{children}</span>}
          {trailingIcon && <span aria-hidden="true" className="shrink-0">{trailingIcon}</span>}
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

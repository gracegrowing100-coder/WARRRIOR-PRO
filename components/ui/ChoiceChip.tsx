import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from './utils';

export interface ChoiceChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  selected: boolean;
  onSelectedChange?: (selected: boolean) => void;
  icon?: React.ReactNode;
}

export const ChoiceChip = forwardRef<HTMLButtonElement, ChoiceChipProps>(
  ({ type = 'button', selected, onSelectedChange, icon, className, children, onClick, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      data-ui
      data-ui-control
      aria-pressed={selected}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border px-4 text-small font-semibold',
        'disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground',
        selected
          ? 'border-action bg-action text-foreground-inverse'
          : 'border-line-strong bg-surface text-foreground hover:bg-surface-subtle',
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onSelectedChange?.(!selected);
      }}
      {...props}
    >
      <span aria-hidden="true">{icon ?? (selected ? <Check size={16} /> : null)}</span>
      <span>{children}</span>
    </button>
  ),
);

ChoiceChip.displayName = 'ChoiceChip';

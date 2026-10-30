import React, { forwardRef } from 'react';
import { Check, X, Plus } from 'lucide-react';
import { cn } from './utils';

export type ChoiceChipVariant = 'crimson' | 'rose' | 'custom' | 'add-own';

export interface ChoiceChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  variant?: ChoiceChipVariant;
  icon?: React.ReactNode;
  onRemove?: () => void;
}

export const ChoiceChip = forwardRef<HTMLButtonElement, ChoiceChipProps>(
  (
    {
      type = 'button',
      selected = false,
      onSelectedChange,
      variant = 'crimson',
      icon,
      onRemove,
      className,
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    if (variant === 'add-own') {
      return (
        <button
          ref={ref}
          type={type}
          data-ui
          data-ui-control
          className={cn(
            'inline-flex h-[44px] min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-dashed border-[#A8909F] bg-transparent px-4 text-[14px] font-semibold text-wa-muted hover:border-wa-plum hover:text-wa-plum transition-colors',
            className,
          )}
          onClick={onClick}
          {...props}
        >
          <Plus size={16} aria-hidden="true" />
          <span>{children}</span>
        </button>
      );
    }

    if (variant === 'custom') {
      return (
        <div
          className={cn(
            'inline-flex h-[44px] min-h-[44px] items-center gap-2 rounded-full bg-wa-plum pl-4 pr-1.5 text-[14px] font-semibold text-white',
            className,
          )}
        >
          <span>{children}</span>
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              aria-label="Remove item"
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
      );
    }

    const selectedClass =
      variant === 'rose'
        ? 'border-2 border-wa-crimson bg-wa-rose text-wa-crimson font-bold'
        : 'border-transparent bg-wa-crimson text-white font-bold shadow-sm';

    const unselectedClass = 'border border-wa-line bg-wa-surface text-wa-plum hover:border-wa-muted/40';

    return (
      <button
        ref={ref}
        type={type}
        data-ui
        data-ui-control
        aria-pressed={selected}
        className={cn(
          'inline-flex h-[44px] min-h-[44px] items-center justify-center gap-2 rounded-full px-4 text-[14px] transition-all font-body',
          'disabled:cursor-not-allowed disabled:opacity-50',
          selected ? selectedClass : unselectedClass,
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) onSelectedChange?.(!selected);
        }}
        {...props}
      >
        <span aria-hidden="true">{icon ?? (selected ? <Check size={16} strokeWidth={2.5} /> : null)}</span>
        <span>{children}</span>
      </button>
    );
  },
);

ChoiceChip.displayName = 'ChoiceChip';

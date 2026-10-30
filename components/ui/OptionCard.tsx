import React from 'react';
import { Check } from 'lucide-react';
import { cn } from './utils';

export interface OptionCardProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  selected?: boolean;
  badge?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  indicator?: 'radio' | 'check' | 'none';
}

export const OptionCard: React.FC<OptionCardProps> = ({
  selected = false,
  badge,
  title,
  subtitle,
  indicator = 'radio',
  className,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      data-ui
      data-ui-control
      aria-pressed={selected}
      className={cn(
        'w-full min-h-[68px] rounded-[20px] p-[10px_14px] flex items-center gap-3.5 bg-wa-surface text-wa-plum font-body transition-all text-left',
        selected
          ? 'border-2 border-wa-crimson shadow-sm'
          : 'border border-wa-line hover:border-wa-muted/40',
        className,
      )}
      {...props}
    >
      {badge && (
        <span
          className={cn(
            'w-12 h-12 rounded-[14px] flex items-center justify-center font-display font-extrabold text-[16px] shrink-0 transition-colors',
            selected ? 'bg-wa-crimson text-white' : 'bg-wa-ground text-wa-plum',
          )}
        >
          {badge}
        </span>
      )}

      <span className="flex-1 flex flex-col gap-0.5 min-w-0">
        <span className="font-bold text-[15px] text-wa-plum leading-snug">{title}</span>
        {subtitle && <span className="text-[13px] text-wa-muted leading-tight">{subtitle}</span>}
      </span>

      {indicator === 'radio' && (
        <span
          aria-hidden="true"
          className={cn(
            'w-[22px] h-[22px] rounded-full shrink-0 box-border transition-all',
            selected ? 'border-[7px] border-wa-crimson bg-white' : 'border-2 border-[#CDBAC6] bg-transparent',
          )}
        />
      )}

      {indicator === 'check' && (
        <span
          aria-hidden="true"
          className={cn(
            'w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center transition-all',
            selected ? 'bg-wa-crimson text-white' : 'border-2 border-[#CDBAC6] text-transparent',
          )}
        >
          <Check size={14} strokeWidth={3} />
        </span>
      )}
    </button>
  );
};

OptionCard.displayName = 'OptionCard';

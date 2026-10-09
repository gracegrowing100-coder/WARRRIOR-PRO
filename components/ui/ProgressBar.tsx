import React from 'react';
import { cn } from './utils';

export interface ProgressBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  value: number;
  max?: number;
  label: string;
  valueText?: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
}

const toneClasses = {
  primary: 'bg-action',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  valueText,
  tone = 'primary',
  className,
  ...props
}) => {
  const safeMax = max > 0 ? max : 100;
  const safeValue = Math.min(Math.max(value, 0), safeMax);
  const percentage = (safeValue / safeMax) * 100;

  return (
    <div data-ui className={cn('space-y-2', className)} {...props}>
      <div className="flex items-baseline justify-between gap-4 text-small">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-foreground-secondary">{valueText ?? `${Math.round(percentage)}%`}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
        aria-valuetext={valueText}
        className="h-2.5 overflow-hidden rounded-pill bg-disabled"
      >
        <div aria-hidden="true" className={cn('h-full rounded-pill', toneClasses[tone])} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

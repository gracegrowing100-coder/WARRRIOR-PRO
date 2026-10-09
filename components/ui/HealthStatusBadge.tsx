import React from 'react';
import { CircleAlert, CircleCheck, CircleHelp, Info } from 'lucide-react';
import { cn } from './utils';

export type HealthStatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface HealthStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: HealthStatusTone;
  icon?: React.ReactNode;
}

const toneClasses: Record<HealthStatusTone, string> = {
  neutral: 'border-line-strong bg-surface-subtle text-foreground',
  success: 'border-status-success/30 bg-status-success-soft text-foreground',
  warning: 'border-status-warning/35 bg-status-warning-soft text-foreground',
  danger: 'border-status-danger/30 bg-status-danger-soft text-foreground',
  info: 'border-status-info/30 bg-status-info-soft text-foreground',
};

const iconClasses: Record<HealthStatusTone, string> = {
  neutral: 'text-foreground-secondary',
  success: 'text-status-success-text',
  warning: 'text-status-warning-text',
  danger: 'text-status-danger-text',
  info: 'text-status-info-text',
};

const defaultIcons: Record<HealthStatusTone, React.ReactNode> = {
  neutral: <CircleHelp size={16} />,
  success: <CircleCheck size={16} />,
  warning: <CircleAlert size={16} />,
  danger: <CircleAlert size={16} />,
  info: <Info size={16} />,
};

export const HealthStatusBadge: React.FC<HealthStatusBadgeProps> = ({
  tone = 'neutral',
  icon,
  className,
  children,
  ...props
}) => (
  <span
    data-ui
    className={cn(
      'inline-flex min-h-7 items-center gap-1.5 rounded-pill border px-2.5 py-1 text-small font-semibold',
      toneClasses[tone],
      className,
    )}
    {...props}
  >
    <span aria-hidden="true" className={cn('shrink-0', iconClasses[tone])}>{icon ?? defaultIcons[tone]}</span>
    <span>{children}</span>
  </span>
);

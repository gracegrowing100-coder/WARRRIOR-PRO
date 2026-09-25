import React from 'react';
import { CircleAlert, CircleCheck, CircleHelp, Info } from 'lucide-react';
import { cn } from './utils';

export type AlertTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: AlertTone;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  live?: 'off' | 'polite' | 'assertive';
}

const toneClasses: Record<AlertTone, string> = {
  neutral: 'border-line bg-surface-subtle text-foreground',
  info: 'border-status-info/30 bg-status-info-soft text-foreground',
  success: 'border-status-success/30 bg-status-success-soft text-foreground',
  warning: 'border-status-warning/35 bg-status-warning-soft text-foreground',
  danger: 'border-status-danger/30 bg-status-danger-soft text-foreground',
};

const iconClasses: Record<AlertTone, string> = {
  neutral: 'text-foreground-secondary',
  info: 'text-status-info',
  success: 'text-status-success',
  warning: 'text-status-warning',
  danger: 'text-status-danger',
};

const defaultIcons: Record<AlertTone, React.ReactNode> = {
  neutral: <CircleHelp size={20} />,
  info: <Info size={20} />,
  success: <CircleCheck size={20} />,
  warning: <CircleAlert size={20} />,
  danger: <CircleAlert size={20} />,
};

export const Alert: React.FC<AlertProps> = ({
  tone = 'neutral',
  title,
  icon,
  action,
  live = 'off',
  className,
  children,
  ...props
}) => (
  <div
    data-ui
    role={live === 'assertive' ? 'alert' : live === 'polite' ? 'status' : undefined}
    aria-live={live === 'off' ? undefined : live}
    className={cn('flex items-start gap-3 rounded-card border p-4', toneClasses[tone], className)}
    {...props}
  >
    <span aria-hidden="true" className={cn('mt-0.5 shrink-0', iconClasses[tone])}>
      {icon ?? defaultIcons[tone]}
    </span>
    <div className="min-w-0 flex-1">
      {title && <div className="text-body font-semibold">{title}</div>}
      {children && <div className={cn('text-small text-foreground-secondary', title && 'mt-1')}>{children}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  </div>
);

import React from 'react';
import { CircleAlert, CircleCheck, Inbox } from 'lucide-react';
import { cn } from './utils';

export type StateMessageState = 'empty' | 'error' | 'success';

export interface StateMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  state: StateMessageState;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  live?: 'off' | 'polite' | 'assertive';
}

const stateStyles = {
  empty: { icon: 'bg-surface-subtle text-foreground-secondary', defaultIcon: <Inbox size={24} /> },
  error: { icon: 'bg-status-danger-soft text-status-danger', defaultIcon: <CircleAlert size={24} /> },
  success: { icon: 'bg-status-success-soft text-status-success', defaultIcon: <CircleCheck size={24} /> },
};

export const StateMessage: React.FC<StateMessageProps> = ({
  state,
  title,
  description,
  icon,
  action,
  live = 'off',
  className,
  ...props
}) => {
  const styles = stateStyles[state];
  return (
    <div
      data-ui
      role={live === 'assertive' ? 'alert' : live === 'polite' ? 'status' : undefined}
      aria-live={live === 'off' ? undefined : live}
      className={cn('flex flex-col items-center rounded-card border border-line bg-surface p-6 text-center', className)}
      {...props}
    >
      <span aria-hidden="true" className={cn('mb-3 inline-flex h-11 w-11 items-center justify-center rounded-control', styles.icon)}>
        {icon ?? styles.defaultIcon}
      </span>
      <h3 className="text-heading-3 text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-prose text-small text-foreground-secondary">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

type StateVariantProps = Omit<StateMessageProps, 'state'>;

export const EmptyState: React.FC<StateVariantProps> = (props) => <StateMessage state="empty" {...props} />;
export const ErrorState: React.FC<StateVariantProps> = (props) => <StateMessage state="error" {...props} />;
export const SuccessState: React.FC<StateVariantProps> = (props) => <StateMessage state="success" {...props} />;

import React from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';
import { WarriorMark } from '../brand/WarriorMark';
import { Button } from './Button';
import { cn } from './utils';

export type StateMessageState = 'empty' | 'error' | 'success' | 'loading';

export interface StateMessageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  state: StateMessageState;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  live?: 'off' | 'polite' | 'assertive';
}

export const StateMessage: React.FC<StateMessageProps> = ({
  state,
  title,
  description,
  icon,
  action,
  onRetry,
  retryLabel = 'Try again',
  live = 'off',
  className,
  ...props
}) => {
  return (
    <div
      data-ui
      role={live === 'assertive' ? 'alert' : live === 'polite' ? 'status' : undefined}
      aria-live={live === 'off' ? undefined : live}
      className={cn(
        'flex flex-col items-center justify-center rounded-[28px] bg-wa-surface p-8 text-center font-body',
        className,
      )}
      {...props}
    >
      <div aria-hidden="true" className="mb-4">
        {icon ? (
          icon
        ) : state === 'empty' ? (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-wa-rose/40 text-wa-crimson/50">
            <WarriorMark className="h-10 w-10 opacity-40" />
          </div>
        ) : state === 'error' ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-wa-rose text-wa-crimson">
            <CircleAlert size={28} />
          </div>
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-wa-water-soft text-wa-success">
            <CircleCheck size={28} />
          </div>
        )}
      </div>

      <h3 className="font-display text-lg font-bold text-wa-plum">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-wa-muted font-normal">{description}</p>
      )}

      {action ? (
        <div className="mt-5">{action}</div>
      ) : onRetry ? (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

type StateVariantProps = Omit<StateMessageProps, 'state'>;

export const EmptyState: React.FC<StateVariantProps> = (props) => <StateMessage state="empty" {...props} />;
export const ErrorState: React.FC<StateVariantProps> = (props) => <StateMessage state="error" {...props} />;
export const SuccessState: React.FC<StateVariantProps> = (props) => <StateMessage state="success" {...props} />;

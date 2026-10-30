import React from 'react';
import { cn } from './utils';

export interface ProgressSegmentsProps extends React.HTMLAttributes<HTMLDivElement> {
  current: number;
  total: number;
  showCounter?: boolean;
}

export const ProgressSegments: React.FC<ProgressSegmentsProps> = ({
  current,
  total,
  showCounter = true,
  className,
  ...props
}) => {
  return (
    <div className={cn('flex items-center gap-3.5 w-full', className)} {...props}>
      <div
        className="flex-1 grid gap-[5px]"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`Step ${current} of ${total}`}
      >
        {Array.from({ length: total }, (_, i) => {
          const isDone = i < current;
          return (
            <div
              key={i}
              className={cn(
                'h-[6px] rounded-[3px] transition-colors duration-200',
                isDone ? 'bg-wa-crimson' : 'bg-wa-line',
              )}
            />
          );
        })}
      </div>
      {showCounter && (
        <span className="font-display font-bold text-[13px] text-wa-plum tracking-tight shrink-0">
          {current}/{total}
        </span>
      )}
    </div>
  );
};

ProgressSegments.displayName = 'ProgressSegments';

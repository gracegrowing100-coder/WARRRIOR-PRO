import React from 'react';
import { cn } from './utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: 'text' | 'rectangle' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({ shape = 'rectangle', className, ...props }) => (
  <div
    data-ui
    aria-hidden="true"
    className={cn(
      'bg-disabled',
      shape === 'text' && 'h-4 rounded-sm',
      shape === 'rectangle' && 'min-h-16 rounded-card',
      shape === 'circle' && 'aspect-square rounded-full',
      className,
    )}
    {...props}
  />
);

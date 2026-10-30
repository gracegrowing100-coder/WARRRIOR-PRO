import React from 'react';
import { cn } from './utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: 'text' | 'rectangle' | 'circle' | 'card';
}

export const Skeleton: React.FC<SkeletonProps> = ({ shape = 'rectangle', className, ...props }) => (
  <div
    data-ui
    aria-hidden="true"
    className={cn(
      'animate-pulse bg-wa-line/60',
      shape === 'text' && 'h-4 rounded-full',
      shape === 'rectangle' && 'min-h-16 rounded-[16px]',
      shape === 'card' && 'min-h-24 rounded-[28px]',
      shape === 'circle' && 'aspect-square rounded-full shrink-0',
      className,
    )}
    {...props}
  />
);

import React, { forwardRef } from 'react';
import { cn } from './utils';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article';
  surface?: 'default' | 'elevated' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const surfaceClasses = {
  default: 'border border-line bg-surface shadow-surface',
  elevated: 'bg-surface-elevated shadow-elevated',
  subtle: 'border border-line bg-surface-subtle',
};

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

export const Card = forwardRef<HTMLElement, CardProps>(
  ({ as: Component = 'div', surface = 'default', padding = 'md', className, ...props }, ref) => (
    <Component
      ref={ref as React.Ref<never>}
      data-ui
      className={cn('rounded-card text-foreground', surfaceClasses[surface], paddingClasses[padding], className)}
      {...props}
    />
  ),
);

Card.displayName = 'Card';

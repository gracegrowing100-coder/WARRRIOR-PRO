import React, { forwardRef } from 'react';
import { cn } from './utils';

export type CardSurface =
  | 'surface'
  | 'hero'
  | 'tint'
  | 'tint-rose'
  | 'tint-water'
  | 'tint-sun'
  | 'glass'
  | 'default'
  | 'elevated'
  | 'subtle';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article';
  surface?: CardSurface;
  tint?: 'rose' | 'water' | 'sun';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const surfaceClasses: Record<CardSurface, string> = {
  surface: 'bg-wa-surface text-wa-plum rounded-[28px]',
  default: 'bg-wa-surface text-wa-plum rounded-[28px]',
  elevated: 'bg-wa-surface text-wa-plum rounded-[28px] shadow-sm',
  subtle: 'bg-wa-surface text-wa-plum rounded-[28px]',
  hero: 'bg-wa-hero text-white rounded-[36px]',
  tint: 'bg-wa-rose text-wa-plum rounded-[28px]',
  'tint-rose': 'bg-wa-rose text-wa-plum rounded-[28px]',
  'tint-water': 'bg-wa-water-soft text-wa-water-ink rounded-[28px]',
  'tint-sun': 'bg-wa-sun-soft text-wa-sun-ink rounded-[28px]',
  glass: 'bg-white/[0.08] border border-white/[0.12] text-white rounded-[22px] backdrop-blur-sm',
};

const paddingClasses = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

export const Card = forwardRef<HTMLElement, CardProps>(
  (
    {
      as: Component = 'div',
      surface = 'surface',
      tint,
      padding = 'md',
      className,
      ...props
    },
    ref,
  ) => {
    let effectiveSurface = surface;
    if (tint) {
      if (tint === 'rose') effectiveSurface = 'tint-rose';
      else if (tint === 'water') effectiveSurface = 'tint-water';
      else if (tint === 'sun') effectiveSurface = 'tint-sun';
    }

    return (
      <Component
        ref={ref as React.Ref<never>}
        data-ui
        className={cn(
          'transition-colors font-body',
          surfaceClasses[effectiveSurface],
          paddingClasses[padding],
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = 'Card';

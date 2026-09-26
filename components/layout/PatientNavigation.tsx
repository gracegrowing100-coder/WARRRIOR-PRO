import React from 'react';
import {
  HeartPulse,
  Home,
  MessageSquare,
  MoreHorizontal,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../ui';

export type PatientNavigationDestination = 'home' | 'chat' | 'care' | 'community' | 'more';

export interface PatientNavigationLabels {
  home: string;
  chat: string;
  care: string;
  community: string;
  more: string;
}

export interface PatientNavigationProps {
  currentDestination: PatientNavigationDestination;
  onNavigate: (destination: PatientNavigationDestination) => void;
  labels?: PatientNavigationLabels;
  className?: string;
}

const defaultLabels: PatientNavigationLabels = {
  home: 'Home',
  chat: 'Chat',
  care: 'Care',
  community: 'Community',
  more: 'More',
};

const destinations: Array<{
  id: PatientNavigationDestination;
  icon: LucideIcon;
}> = [
  { id: 'home', icon: Home },
  { id: 'chat', icon: MessageSquare },
  { id: 'care', icon: HeartPulse },
  { id: 'community', icon: Users },
  { id: 'more', icon: MoreHorizontal },
];

export const PatientNavigation: React.FC<PatientNavigationProps> = ({
  currentDestination,
  onNavigate,
  labels = defaultLabels,
  className,
}) => (
  <nav
    aria-label="Patient navigation"
    className={cn(
      'fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface pb-[var(--safe-area-bottom)]',
      'md:inset-y-0 md:right-auto md:w-20 md:border-r md:border-t-0 md:pb-0',
      className,
    )}
  >
    <div className="grid min-h-16 grid-cols-5 items-stretch px-1 md:flex md:h-full md:flex-col md:gap-1 md:px-2 md:py-6">
      {destinations.map(({ id, icon: Icon }) => {
        const isCurrent = currentDestination === id;
        return (
          <button
            key={id}
            type="button"
            aria-current={isCurrent ? 'page' : undefined}
            onClick={() => onNavigate(id)}
            className={cn(
              'flex min-h-14 min-w-0 touch-manipulation select-none flex-col items-center justify-center gap-0.5 rounded-control px-0',
              'text-[11px] leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2',
              'md:min-h-16 md:w-full',
              isCurrent
                ? 'font-bold text-action-accent'
                : 'font-medium text-foreground-secondary hover:bg-surface-subtle hover:text-foreground',
            )}
          >
            <Icon aria-hidden="true" size={22} strokeWidth={isCurrent ? 2.5 : 2} />
            <span className="block whitespace-nowrap">{labels[id]}</span>
            <span
              aria-hidden="true"
              className={cn(
                'h-0.5 w-5 rounded-full',
                isCurrent ? 'bg-action-accent' : 'bg-transparent',
              )}
            />
          </button>
        );
      })}
    </div>
  </nav>
);

import React from 'react';
import {
  HeartPulse,
  Home,
  MessageSquare,
  MoreHorizontal,
  ShieldCheck,
  User,
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
  appName?: string;
  connectivityLabel?: string;
  isOffline?: boolean;
  profileLabel?: string;
  profilePhotoUrl?: string | null;
  onOpenProfile?: () => void;
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
  appName = 'WARRIOR AI',
  connectivityLabel = 'Live & Offline Protected',
  isOffline = false,
  profileLabel = 'Profile',
  profilePhotoUrl,
  onOpenProfile,
  className,
}) => (
  <aside
    className={cn(
      'fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface',
      'md:inset-y-0 md:right-auto md:flex md:w-64 md:flex-col md:border-r md:border-t-0 md:pb-0',
      className,
    )}
  >
    <div className="hidden px-5 pb-7 pt-6 md:block">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-action-accent text-lg font-bold text-white shadow-subtle">W</span>
        <span className="min-w-0">
          <span className="block truncate text-lg font-bold tracking-tight text-foreground">{appName}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-caption text-foreground-secondary">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', isOffline ? 'bg-status-warning' : 'bg-status-success')} />
            <span className="truncate">{connectivityLabel}</span>
          </span>
        </span>
      </div>
    </div>

    <nav aria-label="Patient navigation" className="pb-[var(--safe-area-bottom)] md:flex md:min-h-0 md:flex-1 md:flex-col md:pb-0">
      <p className="hidden px-6 pb-2 text-caption font-bold uppercase tracking-[0.12em] text-foreground-secondary md:block">Patient hub</p>
      <div className="grid min-h-[4.5rem] grid-cols-5 items-stretch px-1 md:flex md:min-h-0 md:flex-col md:gap-2 md:px-3">
      {destinations.map(({ id, icon: Icon }) => {
        const isCurrent = currentDestination === id;
        return (
          <button
            key={id}
            type="button"
            aria-current={isCurrent ? 'page' : undefined}
            onClick={() => onNavigate(id)}
            className={cn(
              'flex min-h-16 min-w-0 touch-manipulation select-none flex-col items-center justify-center gap-1 rounded-control px-0 transition-colors duration-150',
              'text-[11px] leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2',
              'md:min-h-14 md:w-full md:flex-row md:justify-start md:gap-3 md:px-4 md:text-small',
              isCurrent
                ? 'bg-medical-50 font-bold text-action-accent dark:bg-medical-950/45 dark:text-medical-200'
                : 'font-medium text-foreground-secondary hover:bg-surface-subtle hover:text-foreground',
            )}
          >
            <span className={cn('hidden h-8 w-1 rounded-full md:block', isCurrent ? 'bg-action-accent' : 'bg-transparent')} aria-hidden="true" />
            <Icon aria-hidden="true" size={22} strokeWidth={isCurrent ? 2.5 : 2} />
            <span className="block whitespace-nowrap">{labels[id]}</span>
            <span
              aria-hidden="true"
              className={cn(
                'h-0.5 w-5 rounded-full md:hidden',
                isCurrent ? 'bg-action-accent' : 'bg-transparent',
              )}
            />
          </button>
        );
      })}
      </div>
    </nav>

    {onOpenProfile ? (
      <div className="mt-auto hidden border-t border-line p-4 md:block">
        <button
          type="button"
          aria-label="Open desktop profile"
          className="flex min-h-14 w-full items-center gap-3 rounded-control bg-surface-subtle px-3 text-left transition-colors hover:bg-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          onClick={onOpenProfile}
        >
          {profilePhotoUrl ? (
            <img src={profilePhotoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : (
            <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-medical-50 text-action-accent dark:bg-medical-950/50 dark:text-medical-200">
              <User size={19} />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-small font-semibold text-foreground">{profileLabel}</span>
            <span className="mt-0.5 flex items-center gap-1 text-caption text-foreground-secondary"><ShieldCheck size={13} aria-hidden="true" /> Secure account</span>
          </span>
        </button>
      </div>
    ) : null}
  </aside>
);

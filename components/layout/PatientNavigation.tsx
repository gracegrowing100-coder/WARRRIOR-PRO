import React from 'react';
import {
  HeartPulse,
  Home,
  MessageSquare,
  MoreHorizontal,
  Shield,
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
  labels?: Partial<PatientNavigationLabels>;
  appName?: string;
  connectivityLabel?: string;
  isOffline?: boolean;
  profileLabel?: string;
  profilePhotoUrl?: string | null;
  onOpenProfile?: () => void;
  onOpenEmergency?: () => void;
  hidden?: boolean;
  className?: string;
}

const defaultLabels: PatientNavigationLabels = {
  home: 'Home',
  chat: 'Mira',
  care: 'Care',
  community: 'Community',
  more: 'More',
};

const destinations: Array<{
  id: PatientNavigationDestination;
  icon: LucideIcon;
  labelKey: keyof PatientNavigationLabels;
}> = [
  { id: 'home', icon: Home, labelKey: 'home' },
  { id: 'chat', icon: MessageSquare, labelKey: 'chat' },
  { id: 'care', icon: HeartPulse, labelKey: 'care' },
  { id: 'community', icon: Users, labelKey: 'community' },
  { id: 'more', icon: MoreHorizontal, labelKey: 'more' },
];

export const PatientNavigation: React.FC<PatientNavigationProps> = ({
  currentDestination,
  onNavigate,
  labels = defaultLabels,
  profileLabel = 'Profile',
  profilePhotoUrl,
  onOpenProfile,
  onOpenEmergency,
  hidden = false,
  className,
}) => {
  if (hidden) return null;

  const handleEmergencyClick = () => {
    if (onOpenEmergency) {
      onOpenEmergency();
    } else {
      const fab = document.getElementById('emergency-fab');
      if (fab) fab.click();
    }
  };

  return (
    <>
      {/* Mobile Floating Pill Nav (< 768px) */}
      <nav
        aria-label="Patient navigation"
        className={cn(
          'fixed inset-x-4 bottom-4 z-40 md:hidden select-none',
          className,
        )}
      >
        <div className="h-[68px] w-full rounded-full bg-[var(--wa-hero)] shadow-wa-nav grid grid-cols-5 items-center px-1.5 box-border">
          {destinations.map(({ id, icon: Icon, labelKey }) => {
            const isCurrent = currentDestination === id;
            const label = labels[labelKey] || defaultLabels[labelKey];

            return (
              <button
                key={id}
                type="button"
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={label}
                onClick={() => onNavigate(id)}
                className={cn(
                  'h-[56px] rounded-[28px] flex flex-col items-center justify-center gap-0.5 transition-colors font-body',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--wa-hero)]',
                  isCurrent
                    ? 'bg-wa-crimson text-white font-semibold'
                    : 'text-wa-on-plum-muted hover:text-white',
                )}
              >
                <Icon size={22} aria-hidden="true" strokeWidth={isCurrent ? 2.5 : 2} />
                <span className="text-[11px] font-semibold leading-none">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Plum Sidebar (≥ 768px) */}
      <aside
        aria-label="Desktop sidebar navigation"
        className={cn(
          'hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-[var(--wa-hero)] text-white z-40 p-4 border-r border-white/10 select-none font-body',
          className,
        )}
      >
        {/* Top Logo Lockup (Reverse) */}
        <div className="px-2 pt-2 pb-6">
          <img
            src="/brand/svg/lockup/warrior-ai-horizontal-reverse.svg"
            alt="Warrior AI"
            className="h-8 w-auto"
          />
        </div>

        {/* 5 Nav Items */}
        <nav aria-label="Main menu" className="flex flex-col gap-2 flex-1">
          {destinations.map(({ id, icon: Icon, labelKey }) => {
            const isCurrent = currentDestination === id;
            const label = labels[labelKey] || defaultLabels[labelKey];

            return (
              <button
                key={id}
                type="button"
                aria-current={isCurrent ? 'page' : undefined}
                onClick={() => onNavigate(id)}
                className={cn(
                  'flex items-center gap-3.5 h-12 px-4 rounded-full text-sm font-semibold transition-all text-left font-body',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--wa-hero)]',
                  isCurrent
                    ? 'bg-wa-crimson text-white font-bold shadow-sm'
                    : 'text-wa-on-plum-muted hover:text-white hover:bg-white/10',
                )}
              >
                <Icon size={20} aria-hidden="true" strokeWidth={isCurrent ? 2.5 : 2} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Sidebar: SOS button + Profile trigger */}
        <div className="mt-auto pt-4 border-t border-white/10 space-y-3">
          <button
            type="button"
            onClick={handleEmergencyClick}
            aria-label="Emergency SOS"
            className="w-full h-12 rounded-full bg-wa-crimson hover:bg-wa-crimson-press active:bg-wa-crimson-press text-white font-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-wa-sos transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Shield size={18} strokeWidth={2.5} aria-hidden="true" />
            <span>EMERGENCY SOS</span>
          </button>

          {onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              aria-label="Open profile"
              className="flex w-full items-center gap-3 rounded-full bg-white/5 p-2 hover:bg-white/10 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white shrink-0 font-display font-bold text-xs">
                  {profileLabel.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white font-body">{profileLabel}</p>
                <p className="truncate text-[10px] text-wa-on-plum-muted font-body">View profile</p>
              </div>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

PatientNavigation.displayName = 'PatientNavigation';

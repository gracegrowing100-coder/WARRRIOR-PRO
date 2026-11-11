import React, { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '../ui';

export interface AppHeaderProps {
  appName: string;
  connectivityLabel: string;
  isOffline: boolean;
  onHome: () => void;
  actions: React.ReactNode;
  accountAction?: React.ReactNode;
  emergencyAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  appName,
  connectivityLabel,
  isOffline,
  onHome,
  actions,
  accountAction,
  emergencyAction,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settingsOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setSettingsOpen(false);
      settingsTriggerRef.current?.focus();
    };
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (settingsPanelRef.current?.contains(target) || settingsTriggerRef.current?.contains(target)) return;
      setSettingsOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, [settingsOpen]);

  return (
    <header data-semantic className="sticky top-0 z-40 flex min-h-[4.5rem] items-center justify-between gap-2.5 sm:gap-3 border-b border-[#EADDE2] bg-[#FAF6F8]/95 px-4 py-2.5 sm:py-3 text-wa-plum backdrop-blur-md sm:px-5 lg:min-h-20 lg:px-8">
      {/* Mobile Brand Identity Control (< 768px) */}
      <button 
        type="button" 
        data-ui-control 
        className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-2xl text-left md:hidden p-1 -ml-1 transition-opacity active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson" 
        onClick={onHome} 
        aria-label={`${appName} Home`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-xs border border-[#EADDE2] overflow-hidden p-1.5 ring-1 ring-black/5">
          <img
            src="/brand/svg/mark/warrior-ai-mark-crimson.svg"
            alt=""
            className="h-full w-full object-contain"
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className="block truncate text-base sm:text-lg font-bold tracking-tight text-wa-plum font-display">
              {appName}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className={cn(
                'h-2 w-2 shrink-0 rounded-full',
                isOffline ? 'bg-status-warning' : 'bg-status-success animate-pulse',
              )}
              aria-hidden="true"
            />
            <span className="truncate text-caption text-foreground-secondary font-medium">
              {connectivityLabel}
            </span>
          </div>
        </div>
      </button>

      {/* Desktop Connectivity Pill (>= 768px) */}
      <div className="hidden items-center gap-2 md:flex">
        <span className={cn('h-2 w-2 rounded-full', isOffline ? 'bg-status-warning' : 'bg-status-success')} aria-hidden="true" />
        <span className="text-small font-medium text-foreground-secondary">{connectivityLabel}</span>
      </div>

      {/* Right-aligned Header Controls */}
      <div className="relative ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Emergency SOS Button (Mobile & Desktop) */}
        {emergencyAction}

        {/* Display & Language Settings Toggle Button (Mobile) */}
        <button
          ref={settingsTriggerRef}
          type="button"
          data-ui-control
          aria-label="Display and language settings"
          aria-controls="app-header-settings"
          aria-expanded={settingsOpen}
          className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white border border-[#EADDE2] text-wa-plum hover:bg-[#FBE4E8] transition-colors shadow-xs sm:hidden"
          onClick={() => setSettingsOpen((open) => !open)}
        >
          <SlidersHorizontal size={17} aria-hidden="true" />
        </button>

        {/* Settings Panel Popover (Mobile dropdown / Desktop inline flex) */}
        <div
          ref={settingsPanelRef}
          id="app-header-settings"
          role="group"
          aria-label="Display and language settings"
          className={cn(
            'items-center rounded-2xl border border-[#EADDE2] bg-white p-2 shadow-elevated sm:static sm:flex sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none',
            settingsOpen 
              ? 'absolute right-0 top-13 z-50 flex flex-col sm:flex-row gap-2.5 p-3.5 rounded-2xl shadow-xl bg-white border border-[#EADDE2] min-w-[200px]' 
              : 'hidden',
          )}
        >
          {actions}
        </div>

        {/* Account Profile Action (Mobile only; desktop has profile at bottom of sidebar) */}
        {accountAction ? <div className="md:hidden">{accountAction}</div> : null}
      </div>
    </header>
  );
};

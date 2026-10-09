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
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  appName,
  connectivityLabel,
  isOffline,
  onHome,
  actions,
  accountAction,
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
    <header data-semantic className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-line bg-surface px-4 py-2.5 text-foreground sm:py-3">
      <button type="button" data-ui-control className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-control text-left" onClick={onHome} aria-label={`${appName} Home`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-action-accent font-bold text-white">
          W
        </span>
        <span className="min-w-0">
          <span className="block truncate text-lg font-bold tracking-tight md:text-xl">
            {appName}
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${isOffline ? 'bg-status-warning' : 'bg-status-success'}`}
            />
            <span className="truncate text-caption text-foreground-secondary">
              {connectivityLabel}
            </span>
          </span>
        </span>
      </button>

      <div className="relative flex shrink-0 items-center gap-2">
        <button
          ref={settingsTriggerRef}
          type="button"
          data-ui-control
          aria-label="Display and language settings"
          aria-controls="app-header-settings"
          aria-expanded={settingsOpen}
          className="flex h-11 w-11 items-center justify-center rounded-control bg-surface-subtle text-foreground sm:hidden"
          onClick={() => setSettingsOpen((open) => !open)}
        >
          <SlidersHorizontal size={19} aria-hidden="true" />
        </button>

        <div
          ref={settingsPanelRef}
          id="app-header-settings"
          role="group"
          aria-label="Display and language settings"
          className={cn(
            'items-center rounded-card border border-line bg-surface p-2 shadow-elevated sm:static sm:flex sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none',
            settingsOpen ? 'absolute right-12 top-12 z-50 flex' : 'hidden',
          )}
        >
          {actions}
        </div>

        {accountAction}
      </div>
    </header>
  );
};

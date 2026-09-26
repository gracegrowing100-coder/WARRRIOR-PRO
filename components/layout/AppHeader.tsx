import React from 'react';

export interface AppHeaderProps {
  appName: string;
  connectivityLabel: string;
  isOffline: boolean;
  onHome: () => void;
  actions: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  appName,
  connectivityLabel,
  isOffline,
  onHome,
  actions,
}) => (
  <header data-semantic className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-4 py-3 text-foreground sm:flex-nowrap">
    <button type="button" data-ui-control className="flex min-h-11 items-center gap-2.5 rounded-control text-left" onClick={onHome} aria-label={`${appName} Home`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-action-accent font-bold text-white">
        W
      </span>
      <span>
        <span className="block text-lg font-bold tracking-tight md:text-xl">
          {appName}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${isOffline ? 'bg-status-warning' : 'bg-status-success'}`}
          />
          <span className="text-caption text-foreground-secondary">
            {connectivityLabel}
          </span>
        </span>
      </span>
    </button>
    <div className="w-full sm:w-auto">{actions}</div>
  </header>
);

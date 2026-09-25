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
  <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex cursor-pointer items-center gap-2.5" onClick={onHome}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 font-bold text-white shadow-lg shadow-red-200 dark:shadow-red-950/40">
        W
      </div>
      <div>
        <h1 className="text-lg font-black tracking-tight text-gray-800 dark:text-white md:text-xl">
          {appName}
        </h1>
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${isOffline ? 'bg-amber-400' : 'animate-pulse bg-emerald-500'}`}
          />
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            {connectivityLabel}
          </span>
        </div>
      </div>
    </div>
    {actions}
  </header>
);

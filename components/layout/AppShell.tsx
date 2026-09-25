import React from 'react';
import { cn } from '../ui';

export interface AppShellProps {
  navigation: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  navigation,
  header,
  children,
  className,
}) => (
  <div
    className={cn(
      'min-h-screen bg-gray-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-300',
      className,
    )}
  >
    {navigation}
    <main className="flex-1 overflow-y-auto pb-[calc(5rem+var(--safe-area-bottom))] md:ml-20 md:pb-0">
      {header}
      {children}
    </main>
  </div>
);

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
      'h-[100dvh] overflow-hidden bg-wa-ground text-wa-plum flex flex-col md:flex-row font-body',
      className,
    )}
  >
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pb-[120px] md:pb-8 md:ml-64">
      {header}
      {children}
    </main>
    {navigation}
  </div>
);

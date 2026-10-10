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
      'h-[100dvh] overflow-hidden bg-canvas text-foreground flex flex-col md:flex-row',
      className,
    )}
  >
    <main className="mb-[calc(8.75rem+var(--safe-area-bottom))] min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain md:mb-[calc(4rem+var(--safe-area-bottom))] md:ml-64">
      {header}
      {children}
    </main>
    {navigation}
  </div>
);

import React from 'react';
import { cn } from '../ui';

export interface PageContainerProps {
  children: React.ReactNode;
  width?: 'patient' | 'wide' | 'home';
  className?: string;
}

const widthClasses = {
  patient: 'max-w-5xl',
  wide: 'max-w-7xl',
  home: 'max-w-[1440px]',
};

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  width = 'patient',
  className,
}) => (
  <div className={cn('mx-auto p-4 sm:p-6 lg:p-8 xl:px-10', widthClasses[width], className)}>
    {children}
  </div>
);

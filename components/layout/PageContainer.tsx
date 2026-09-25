import React from 'react';
import { cn } from '../ui';

export interface PageContainerProps {
  children: React.ReactNode;
  width?: 'patient' | 'wide';
  className?: string;
}

const widthClasses = {
  patient: 'max-w-5xl',
  wide: 'max-w-7xl',
};

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  width = 'patient',
  className,
}) => (
  <div className={cn('mx-auto p-4', widthClasses[width], className)}>
    {children}
  </div>
);

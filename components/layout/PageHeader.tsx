import React from 'react';

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => (
  <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <h1 className="text-heading-1 text-foreground">{title}</h1>
      {description && (
        <p className="mt-1 max-w-prose text-body text-foreground-secondary">
          {description}
        </p>
      )}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </header>
);

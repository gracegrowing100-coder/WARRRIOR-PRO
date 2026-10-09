import React from 'react';
import { BookOpen, ChevronRight, Megaphone } from 'lucide-react';
import { cn } from '../ui';
import { PageHeader } from './PageHeader';

export type MoreDestination = 'games' | 'advocacy';

export interface MoreMenuProps {
  onNavigate: (destination: MoreDestination) => void;
  className?: string;
}

const destinations: Array<{
  id: MoreDestination;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'games',
    title: 'Games & Education',
    description: 'Open learning activities and the SCD Academy.',
    icon: <BookOpen size={22} />,
  },
  {
    id: 'advocacy',
    title: 'Advocacy & Research',
    description: 'Open advocacy tools, research, and updates.',
    icon: <Megaphone size={22} />,
  },
];

export const MoreMenu: React.FC<MoreMenuProps> = ({ onNavigate, className }) => (
  <section className={cn('space-y-5', className)} aria-label="More">
    <PageHeader
      title="More"
      description="Explore Warrior AI’s learning and advocacy tools."
    />

    <nav aria-label="More destinations" className="overflow-hidden rounded-card border border-line bg-surface">
      {destinations.map(({ id, title, description, icon }, index) => (
        <button
          key={id}
          type="button"
          onClick={() => onNavigate(id)}
          className={cn(
            'flex min-h-16 w-full touch-manipulation select-none items-center gap-3 px-4 py-3 text-left',
            'hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action',
            index > 0 && 'border-t border-line',
          )}
        >
          <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface-subtle text-action">
            {icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-body font-semibold text-foreground">{title}</span>
            <span className="block text-small text-foreground-secondary">{description}</span>
          </span>
          <ChevronRight aria-hidden="true" className="shrink-0 text-foreground-secondary" size={20} />
        </button>
      ))}
    </nav>
  </section>
);

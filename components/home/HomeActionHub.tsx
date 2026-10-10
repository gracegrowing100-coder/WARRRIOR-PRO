import React from 'react';
import { ChevronRight, Droplets, HeartPulse, MessageCircle, Pill, Stethoscope } from 'lucide-react';

interface HomeActionHubProps {
  onLogHealth: () => void;
  onAddWater: () => void;
  onReviewMedication: () => void;
  onOpenMira: () => void;
  onOpenCare: () => void;
}

const shortcuts = [
  {
    id: 'health',
    label: 'Log pain',
    description: 'Record symptoms and pain',
    icon: HeartPulse,
    iconClassName: 'bg-medical-50 text-action-accent dark:bg-medical-950/55 dark:text-medical-200',
  },
  {
    id: 'water',
    label: 'Add water',
    description: 'Update today’s hydration',
    icon: Droplets,
    iconClassName: 'bg-status-info-soft text-status-info-text dark:bg-sky-950/45 dark:text-sky-300',
  },
  {
    id: 'medication',
    label: 'Review medication',
    description: 'See today’s schedule',
    icon: Pill,
    iconClassName: 'bg-status-success-soft text-status-success-text dark:bg-emerald-950/45 dark:text-emerald-300',
  },
  {
    id: 'mira',
    label: 'Ask Mira',
    description: 'Get everyday support',
    icon: MessageCircle,
    iconClassName: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300',
  },
] as const;

export const HomeActionHub: React.FC<HomeActionHubProps> = ({
  onLogHealth,
  onAddWater,
  onReviewMedication,
  onOpenMira,
  onOpenCare,
}) => {
  const actions = {
    health: onLogHealth,
    water: onAddWater,
    medication: onReviewMedication,
    mira: onOpenMira,
  };

  return (
    <section
      aria-labelledby="home-actions-title"
      className="rounded-card border border-line bg-surface p-5 shadow-subtle sm:p-6"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="home-actions-title" className="text-heading-2 text-foreground">Quick actions</h2>
          <p className="mt-1 text-small text-foreground-secondary">Shortcuts for today.</p>
        </div>
        <span className="hidden text-caption font-medium text-foreground-secondary sm:block xl:hidden">Fast access</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-1 xl:gap-3">
        {shortcuts.map(({ id, label, description, icon: Icon, iconClassName }) => (
          <button
            key={id}
            type="button"
            data-ui-control
            aria-label={id === 'health' ? 'Log symptoms and pain' : undefined}
            className="group flex min-h-32 w-full touch-manipulation select-none flex-col items-start justify-between gap-4 rounded-card border border-line/60 bg-surface-subtle p-4 text-left shadow-[0_10px_24px_-22px_rgb(15_23_42_/_0.65)] transition-colors duration-150 active:bg-disabled hover:bg-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 md:min-h-28 xl:min-h-20 xl:flex-row xl:items-center xl:justify-start xl:gap-3 xl:p-4"
            onClick={actions[id]}
          >
            <span aria-hidden="true" className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-control ${iconClassName}`}>
              <Icon size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-body font-semibold leading-tight text-foreground xl:text-small">{label}</span>
              <span className="mt-0.5 hidden text-caption text-foreground-secondary xl:block">{description}</span>
            </span>
            <ChevronRight size={18} aria-hidden="true" className="hidden shrink-0 text-foreground-secondary transition-transform duration-150 group-hover:translate-x-0.5 xl:block" />
          </button>
        ))}
      </div>

      <button
        type="button"
        data-ui-control
        className="group mt-4 flex min-h-14 w-full touch-manipulation select-none items-center gap-3 rounded-control border border-line/70 px-3 text-left text-body font-semibold text-foreground transition-colors duration-150 active:bg-surface-subtle hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        onClick={onOpenCare}
      >
        <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface-subtle text-foreground-secondary">
          <Stethoscope size={19} />
        </span>
        <span className="min-w-0 flex-1">Open Care</span>
        <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-foreground-secondary transition-transform duration-150 group-hover:translate-x-0.5" />
      </button>
    </section>
  );
};

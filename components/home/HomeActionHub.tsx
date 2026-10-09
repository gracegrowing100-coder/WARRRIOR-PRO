import React from 'react';
import { ChevronRight, Droplets, HeartPulse, MessageCircle, Pill, Stethoscope } from 'lucide-react';
import { Button } from '../ui';

interface HomeActionHubProps {
  onLogHealth: () => void;
  onAddWater: () => void;
  onReviewMedication: () => void;
  onOpenMira: () => void;
  onOpenCare: () => void;
}

const shortcuts = [
  {
    id: 'water',
    label: 'Add water',
    description: 'Update today’s hydration',
    icon: Droplets,
    iconClassName: 'bg-status-info-soft text-status-info-text',
  },
  {
    id: 'medication',
    label: 'Review medication',
    description: 'See today’s schedule',
    icon: Pill,
    iconClassName: 'bg-status-success-soft text-status-success-text',
  },
  {
    id: 'mira',
    label: 'Ask Mira',
    description: 'Get everyday support',
    icon: MessageCircle,
    iconClassName: 'bg-medical-50 text-action-accent',
  },
  {
    id: 'care',
    label: 'Open Care',
    description: 'History, appointments, records',
    icon: Stethoscope,
    iconClassName: 'bg-surface-subtle text-foreground-secondary',
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
    water: onAddWater,
    medication: onReviewMedication,
    mira: onOpenMira,
    care: onOpenCare,
  };

  return (
    <section
      aria-labelledby="home-actions-title"
      className="overflow-hidden rounded-card border border-line bg-surface shadow-subtle lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]"
    >
      <div className="flex flex-col justify-between bg-medical-50/70 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-surface text-action-accent shadow-subtle">
            <HeartPulse size={24} />
          </span>
          <div className="min-w-0">
            <h2 id="home-actions-title" className="text-heading-2 text-foreground">Record how you feel</h2>
            <p className="mt-1 max-w-md text-small text-foreground-secondary">
              Add pain, symptoms, triggers, and related water intake in one quick entry.
            </p>
          </div>
        </div>
        <Button
          variant="accent"
          size="lg"
          leadingIcon={<HeartPulse size={19} />}
          className="mt-5 w-full sm:w-fit"
          aria-label="Log symptoms and pain"
          onClick={onLogHealth}
        >
          Log health entry
        </Button>
      </div>

      <div className="p-2 sm:p-3">
        <div className="px-3 pb-2 pt-2">
          <h3 className="text-body font-semibold text-foreground">Quick actions</h3>
          <p className="mt-0.5 text-small text-foreground-secondary">Go straight to what you need.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {shortcuts.map(({ id, label, description, icon: Icon, iconClassName }) => (
            <button
              key={id}
              type="button"
              data-ui-control
              className="group flex min-h-16 w-full items-center gap-3 border-t border-line/70 px-3 py-2.5 text-left transition-colors duration-150 first:border-t-0 hover:bg-surface-subtle focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus sm:[&:nth-child(-n+2)]:border-t-0 sm:[&:nth-child(even)]:border-l"
              onClick={actions[id]}
            >
              <span aria-hidden="true" className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${iconClassName}`}>
                <Icon size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-small font-semibold text-foreground">{label}</span>
                <span className="block text-caption text-foreground-secondary">{description}</span>
              </span>
              <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-foreground-secondary transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { ArrowLeft, CalendarDays, ChevronRight, ClipboardList, HeartPulse, Pill } from 'lucide-react';
import { CareVault } from '../CareVault';
import { HealthHistory } from '../health';
import { PageHeader } from '../layout';
import { Button, Card, HealthStatusBadge } from '../ui';

type CareView = 'overview' | 'history' | 'records';

export interface CareHubProps {
  userId: string;
  onOpenAppointments: () => void;
}

const CareDestination: React.FC<{
  title: string;
  description: string;
  actionLabel: string;
  statusLabel: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ title, description, actionLabel, statusLabel, icon, onClick }) => (
  <li className="border-t border-line first:border-t-0">
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-20 w-full items-center gap-4 px-4 py-4 text-left transition-all duration-150 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus sm:px-5"
      aria-label={`${actionLabel}: ${title}`}
    >
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-medical-50 text-action-accent shadow-subtle" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="block text-heading-3 text-foreground">{title}</span>
          <HealthStatusBadge tone="neutral" className="min-h-6 px-2 py-0 text-caption">{statusLabel}</HealthStatusBadge>
        </span>
        <span className="mt-1 block max-w-xl text-small text-foreground-secondary">{description}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-small font-semibold text-action group-hover:text-action-accent transition-colors duration-150">
        <span className="hidden sm:inline">{actionLabel}</span>
        <ChevronRight size={19} aria-hidden="true" />
      </span>
    </button>
  </li>
);

export const CareHub: React.FC<CareHubProps> = ({ userId, onOpenAppointments }) => {
  const [view, setView] = useState<CareView>('overview');

  if (view === 'history') {
    return (
      <div className="space-y-6">
        <Button variant="ghost" leadingIcon={<ArrowLeft size={18} />} onClick={() => setView('overview')}>
          Back to Care
        </Button>
        <HealthHistory userId={userId} />
      </div>
    );
  }

  if (view === 'records') {
    return (
      <div className="space-y-6">
        <Button variant="ghost" leadingIcon={<ArrowLeft size={18} />} onClick={() => setView('overview')}>
          Back to Care
        </Button>
        <CareVault userId={userId} />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-semantic>
      <PageHeader title="Care" description="Your health history, care requests, and medical information in one place." />

      <section aria-label="Care destinations" className="space-y-6">
        <Card padding="none" className="overflow-hidden border-line/80 shadow-none">
          <ul>
            <CareDestination
              title="Health history"
              description="Pain, symptoms, hydration, and check-ins you recorded."
              actionLabel="Review history"
              statusLabel="Patient recorded"
              icon={<HeartPulse size={22} />}
              onClick={() => setView('history')}
            />
            <CareDestination
              title="Appointments"
              description="Create and review care requests. Clinic confirmation is shown separately."
              actionLabel="Manage appointments"
              statusLabel="Requests"
              icon={<CalendarDays size={22} />}
              onClick={onOpenAppointments}
            />
            <CareDestination
              title="Medical records"
              description="Your background, treatment history, and existing care information."
              actionLabel="Open records"
              statusLabel="Patient maintained"
              icon={<ClipboardList size={22} />}
              onClick={() => setView('records')}
            />
          </ul>
        </Card>

        <section aria-labelledby="care-compatibility-title" className="max-w-3xl rounded-card border border-line bg-surface px-4 py-4 sm:px-5">
          <h2 id="care-compatibility-title" className="text-body font-semibold text-foreground">About your records</h2>
          <div className="mt-3 flex items-start gap-3 rounded-control bg-surface-subtle p-3">
            <Pill size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-action" />
            <p className="text-small text-foreground-secondary">
              Medication scheduling stays on Home. Care does not estimate missing doses or add generated predictions to your recorded history.
            </p>
          </div>
        </section>
      </section>
    </div>
  );
};

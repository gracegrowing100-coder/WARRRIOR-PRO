import React, { useState } from 'react';
import { ArrowLeft, CalendarDays, ChevronRight, ClipboardList, HeartPulse, Pill } from 'lucide-react';
import { CareVault } from '../CareVault';
import { HealthHistory } from '../health';
import { PageHeader } from '../layout';
import { Alert, Button, Card } from '../ui';

type CareView = 'overview' | 'history' | 'records';

export interface CareHubProps {
  userId: string;
  onOpenAppointments: () => void;
}

const CareDestination: React.FC<{
  title: string;
  description: string;
  actionLabel: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ title, description, actionLabel, icon, onClick }) => (
  <li className="border-t border-line first:border-t-0">
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-20 w-full items-center gap-4 px-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus sm:px-5"
      aria-label={`${actionLabel}: ${title}`}
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface-subtle text-action" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-heading-3 text-foreground">{title}</span>
        <span className="mt-1 block max-w-prose text-small text-foreground-secondary">{description}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-small font-semibold text-action">
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
        <PageHeader title="Medical records" description="Open the existing Care Vault to review and manage its stored information." />
        <Alert tone="warning" title="Review existing records carefully">
          Some existing Care Vault fields may contain setup or sample information. They are kept separate from recorded Health history.
        </Alert>
        <CareVault userId={userId} />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-semantic>
      <PageHeader
        title="Care"
        description="Review your recorded health information, manage appointments, and access existing medical records."
      />

      <section aria-label="Care destinations" className="space-y-6">
        <Card padding="none" className="overflow-hidden shadow-none">
          <ul>
            <CareDestination
              title="Health history"
              description="Review the health information you have recorded. Missing days are never estimated."
              actionLabel="Review history"
              icon={<HeartPulse size={22} />}
              onClick={() => setView('history')}
            />
            <CareDestination
              title="Appointments"
              description="Book, review, or cancel appointments through the existing care experience."
              actionLabel="Manage appointments"
              icon={<CalendarDays size={22} />}
              onClick={onOpenAppointments}
            />
            <CareDestination
              title="Medical records"
              description="Access the existing Care Vault separately from patient-recorded Health history."
              actionLabel="Open records"
              icon={<ClipboardList size={22} />}
              onClick={() => setView('records')}
            />
          </ul>
        </Card>

        <section aria-labelledby="care-compatibility-title" className="max-w-3xl">
          <h2 id="care-compatibility-title" className="text-heading-2 text-foreground">Current care tools</h2>
          <p className="mt-1 text-small text-foreground-secondary">
            Medication management remains available from Home. Generated reports and predictive tools are not included in recorded Health history.
          </p>
          <div className="mt-4 flex items-start gap-3 rounded-card border border-line bg-surface-subtle p-4">
            <Pill size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-action" />
            <p className="text-small text-foreground-secondary">
              Detailed medication adherence history is not yet available, so Care does not calculate a dose timeline or adherence percentage.
            </p>
          </div>
        </section>
      </section>
    </div>
  );
};

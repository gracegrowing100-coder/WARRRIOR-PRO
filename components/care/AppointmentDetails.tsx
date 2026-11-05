import React, { useState } from 'react';
import { ArrowLeft, Building2, CalendarDays, Clock3, FileText, Home, MapPin, Video } from 'lucide-react';
import type { AppointmentRecord } from '../../services/firebaseService';
import { Alert, Button, Card, HealthStatusBadge, Modal } from '../ui';

export interface AppointmentDetailsProps {
  appointment: AppointmentRecord;
  cancelling: boolean;
  cancellationError?: string;
  cancellationNotice?: string;
  onBack: () => void;
  onCancel: (appointment: AppointmentRecord) => Promise<boolean>;
}

function displayDate(value?: string) {
  if (!value) return 'Not recorded';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function displayModeLabel(mode?: string) {
  if (mode === 'home') return 'Home visit (doctor to your house)';
  if (mode === 'virtual') return 'Virtual consultation (telemedicine)';
  return 'Clinic visit (in-person)';
}

export const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({
  appointment,
  cancelling,
  cancellationError,
  cancellationNotice,
  onBack,
  onCancel,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isCancelled = appointment.status?.toLowerCase() === 'cancelled';

  return (
    <div className="space-y-6" data-semantic>
      <Button variant="ghost" leadingIcon={<ArrowLeft size={18} />} onClick={onBack}>
        Back to appointments
      </Button>
      <header className="space-y-3">
        <h1 className="text-heading-1 text-foreground">Appointment request</h1>
        <div className="flex flex-wrap items-center gap-2">
          <HealthStatusBadge tone={isCancelled ? 'neutral' : 'info'}>
            {isCancelled ? 'Cancelled' : 'Request recorded'}
          </HealthStatusBadge>
          {appointment.appointmentType && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              appointment.appointmentType === 'home'
                ? 'bg-wa-rose text-wa-crimson'
                : appointment.appointmentType === 'virtual'
                ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                : 'bg-wa-ground text-wa-plum-muted'
            }`}>
              {appointment.appointmentType === 'home' ? <Home size={12} /> : appointment.appointmentType === 'virtual' ? <Video size={12} /> : <Building2 size={12} />}
              {appointment.appointmentType === 'home' ? 'Home visit' : appointment.appointmentType === 'virtual' ? 'Virtual' : 'Clinic visit'}
            </span>
          )}
        </div>
      </header>

      <Card as="section" aria-labelledby="appointment-details-title" className="max-w-2xl shadow-none">
        <h2 id="appointment-details-title" className="text-heading-2 text-foreground">Request details</h2>
        <dl className="mt-5 divide-y divide-line">
          {/* Consultation Type */}
          <div className="flex gap-4 py-4 first:pt-0">
            {appointment.appointmentType === 'home' ? (
              <Home size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-action" />
            ) : appointment.appointmentType === 'virtual' ? (
              <Video size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-action" />
            ) : (
              <Building2 size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-action" />
            )}
            <div>
              <dt className="text-small font-semibold text-foreground-secondary">Consultation type</dt>
              <dd className="mt-1 text-body font-semibold text-foreground">{displayModeLabel(appointment.appointmentType as any)}</dd>
            </div>
          </div>

          {/* Home visit location if applicable */}
          {appointment.homeAddress && (
            <div className="flex gap-4 py-4">
              <MapPin size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-action" />
              <div>
                <dt className="text-small font-semibold text-foreground-secondary">Home visit location</dt>
                <dd className="mt-1 whitespace-pre-wrap text-body text-foreground">{appointment.homeAddress}</dd>
              </div>
            </div>
          )}

          <div className="flex gap-4 py-4">
            <CalendarDays size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-action" />
            <div>
              <dt className="text-small font-semibold text-foreground-secondary">Preferred date</dt>
              <dd className="mt-1 text-body text-foreground">{displayDate(appointment.bookedDate)}</dd>
            </div>
          </div>
          <div className="flex gap-4 py-4">
            <Clock3 size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-action" />
            <div>
              <dt className="text-small font-semibold text-foreground-secondary">Preferred time</dt>
              <dd className="mt-1 text-body text-foreground">{appointment.bookedTime || 'Not recorded'}</dd>
            </div>
          </div>
          {appointment.patientNote && (
            <div className="flex gap-4 py-4">
              <FileText size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-action" />
              <div>
                <dt className="text-small font-semibold text-foreground-secondary">Reason</dt>
                <dd className="mt-1 whitespace-pre-wrap text-body text-foreground">{appointment.patientNote}</dd>
              </div>
            </div>
          )}
          {appointment.formattedCreatedAt && (
            <div className="py-4 last:pb-0">
              <dt className="text-small font-semibold text-foreground-secondary">Recorded</dt>
              <dd className="mt-1 text-body text-foreground">{appointment.formattedCreatedAt}</dd>
            </div>
          )}
          {appointment.doctorName && (
            <div className="py-4 last:pb-0">
              <dt className="text-small font-semibold text-foreground-secondary">Provider on legacy record</dt>
              <dd className="mt-1 text-body text-foreground">{appointment.doctorName}</dd>
            </div>
          )}
        </dl>
      </Card>

      <p className="max-w-2xl text-small text-foreground-secondary">
        A recorded request does not mean a clinician accepted it or reserved the preferred time. For urgent help, use the separate Emergency action.
      </p>

      {cancellationError && <p role="alert" className="text-small font-semibold text-status-danger">{cancellationError}</p>}
      {cancellationNotice && <Alert tone="warning" title="Device-only cancellation">{cancellationNotice}</Alert>}
      {!isCancelled && (
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>Cancel request</Button>
      )}

      <Modal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Cancel appointment request?"
        description="This will mark the request as cancelled. It does not confirm that a clinic was notified."
        size="sm"
        footer={(
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Keep request</Button>
            <Button
              variant="danger"
              loading={cancelling}
              loadingLabel="Cancelling…"
              onClick={async () => {
                const cancelled = await onCancel(appointment);
                if (cancelled) setConfirmOpen(false);
              }}
            >
              Cancel request
            </Button>
          </div>
        )}
      >
        <p className="text-body text-foreground-secondary">The request will remain in your history with a cancelled status.</p>
      </Modal>
    </div>
  );
};

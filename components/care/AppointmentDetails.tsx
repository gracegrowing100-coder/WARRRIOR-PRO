import React, { useState } from 'react';
import { ArrowLeft, Building2, CalendarDays, Clock3, FileText, Home, MapPin, Stethoscope, Video } from 'lucide-react';
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
          {appointment.doctorSpecialty && (
            <div className="flex gap-4 py-4 first:pt-0">
              <Stethoscope size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-action" />
              <div>
                <dt className="text-small font-semibold text-foreground-secondary">Specialist requested</dt>
                <dd className="mt-1 text-body font-semibold text-foreground">{appointment.doctorSpecialty}</dd>
              </div>
            </div>
          )}
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

      {appointment.appointmentType === 'virtual' && !isCancelled && (
        <Card as="section" aria-labelledby="virtual-room-title" className="max-w-2xl border-sky-200/80 bg-sky-50/50 shadow-none dark:border-sky-900/50 dark:bg-sky-950/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                <Video size={20} />
              </span>
              <div>
                <h2 id="virtual-room-title" className="text-heading-2 text-foreground">Virtual consultation room</h2>
                <p className="mt-1 text-small text-foreground-secondary">
                  Once your clinic confirms this request, your secure Google Meet / Zoom video and low-data audio link will appear here.
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-800 dark:bg-sky-900/60 dark:text-sky-200">
              Video &amp; Audio
            </span>
          </div>
          <ul className="mt-4 space-y-1.5 border-t border-sky-200/60 pt-3 text-xs text-foreground-secondary dark:border-sky-900/40">
            <li>• Keep your steady-state PCV, recent E/U/Cr labs, and medication list ready.</li>
            <li>• Audio-only mode is supported for low-bandwidth mobile connections.</li>
          </ul>
        </Card>
      )}

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

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, ChevronRight, Plus } from 'lucide-react';
import {
  firebaseService,
  type AppointmentReadState,
  type AppointmentRecord,
} from '../../services/firebaseService';
import { PageHeader } from '../layout';
import { Alert, Button, Card, HealthStatusBadge, Skeleton, StateMessage } from '../ui';
import { AppointmentDetails } from './AppointmentDetails';
import { AppointmentRequest } from './AppointmentRequest';

export interface AppointmentsProps {
  userId: string;
  onBackToCare: () => void;
  initialReason?: string;
}

type AppointmentView = 'landing' | 'request' | 'details';

function displayDate(value?: string) {
  if (!value) return 'Date not recorded';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

const RequestList: React.FC<{
  title: string;
  appointments: AppointmentRecord[];
  onOpen: (appointment: AppointmentRecord) => void;
}> = ({ title, appointments, onOpen }) => {
  if (appointments.length === 0) return null;

  return (
    <section aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-title`}>
      <h2 id={`${title.toLowerCase().replace(/\s+/g, '-')}-title`} className="text-heading-2 text-foreground">{title}</h2>
      <Card padding="none" className="mt-3 overflow-hidden shadow-none">
        <ul>
          {appointments.map((appointment) => {
            const isCancelled = appointment.status?.toLowerCase() === 'cancelled';
            return (
              <li key={appointment.id} className="border-t border-line first:border-t-0">
                <button
                  type="button"
                  onClick={() => onOpen(appointment)}
                  className="flex min-h-20 w-full items-center gap-3 px-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus sm:px-5"
                  aria-label={`Open appointment request for ${appointment.bookedDate || 'recorded date'}`}
                >
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface-subtle text-action" aria-hidden="true">
                    <CalendarDays size={21} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-body font-semibold text-foreground">
                      Requested for {displayDate(appointment.bookedDate)}{appointment.bookedTime ? ` at ${appointment.bookedTime}` : ''}
                    </span>
                    {appointment.patientNote && (
                      <span className="mt-1 block truncate text-small text-foreground-secondary">{appointment.patientNote}</span>
                    )}
                  </span>
                  <HealthStatusBadge tone={isCancelled ? 'neutral' : 'info'} className="hidden sm:inline-flex">
                    {isCancelled ? 'Cancelled' : 'Request recorded'}
                  </HealthStatusBadge>
                  <ChevronRight size={19} aria-hidden="true" className="shrink-0 text-foreground-secondary" />
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
};

export const Appointments: React.FC<AppointmentsProps> = ({
  userId,
  onBackToCare,
  initialReason,
}) => {
  const [view, setView] = useState<AppointmentView>('landing');
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [readState, setReadState] = useState<AppointmentReadState>('empty');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AppointmentRecord | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState('');
  const [cancellationNotice, setCancellationNotice] = useState('');

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await firebaseService.getAppointmentRequests(userId);
      setAppointments(result.data);
      setReadState(result.state);
    } catch {
      setAppointments([]);
      setReadState('unavailable');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const openDetails = (appointment: AppointmentRecord) => {
    setSelected(appointment);
    setCancellationError('');
    setView('details');
  };

  const cancelRequest = async (appointment: AppointmentRecord) => {
    if (cancelling) return false;
    setCancelling(true);
    setCancellationError('');
    try {
      const result = await firebaseService.cancelAppointment(userId, appointment.id);
      setCancellationNotice(result?.state === 'device-only'
        ? 'Cancellation saved only on this device. The cloud record has not been updated. No clinic notification is confirmed.'
        : '');
      const cancelled = { ...appointment, status: 'Cancelled' };
      setSelected(cancelled);
      setAppointments((current) => current.map((item) => item.id === appointment.id ? cancelled : item));
      return true;
    } catch {
      setCancellationError('The request could not be cancelled. Please try again.');
      return false;
    } finally {
      setCancelling(false);
    }
  };

  if (view === 'request') {
    return (
      <AppointmentRequest
        userId={userId}
        initialReason={initialReason}
        onBack={() => setView('landing')}
        onDone={() => {
          setView('landing');
          void loadAppointments();
        }}
      />
    );
  }

  if (view === 'details' && selected) {
    return (
      <AppointmentDetails
        appointment={selected}
        cancelling={cancelling}
        cancellationError={cancellationError}
        cancellationNotice={cancellationNotice}
        onBack={() => setView('landing')}
        onCancel={cancelRequest}
      />
    );
  }

  const activeRequests = appointments.filter((appointment) => appointment.status?.toLowerCase() !== 'cancelled');
  const cancelledRequests = appointments.filter((appointment) => appointment.status?.toLowerCase() === 'cancelled');

  return (
    <div className="space-y-8" data-semantic>
      <Button variant="ghost" leadingIcon={<ArrowLeft size={18} />} onClick={onBackToCare}>
        Back to Care
      </Button>
      <PageHeader
        title="Appointments"
        description="Request hematology care and review requests you have already recorded. Appointment times are not confirmed here."
        actions={(
          <Button leadingIcon={<Plus size={18} />} onClick={() => setView('request')}>
            Request an appointment
          </Button>
        )}
      />
      <Alert tone="neutral" title="For non-emergency care">
        Appointment requests are separate from urgent help. Use the global Emergency action if you may need immediate assistance.
      </Alert>
      {cancellationNotice && <Alert tone="warning" title="Device-only cancellation">{cancellationNotice}</Alert>}

      <section aria-labelledby="appointment-requests-title" className="space-y-6">
        <h2 id="appointment-requests-title" className="sr-only">Your appointment requests</h2>
        {loading && (
          <div role="status" aria-label="Loading appointment requests" className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        )}
        {!loading && readState === 'unavailable' && (
          <StateMessage
            state="error"
            title="Appointment requests unavailable"
            description="Your recorded requests could not be loaded from the service or this device."
            action={<Button variant="secondary" onClick={() => void loadAppointments()}>Try again</Button>}
            live="polite"
          />
        )}
        {!loading && readState === 'cached' && (
          <Alert tone="warning" title="Showing requests saved on this device">
            The service is currently unavailable, so this list may not include recent changes from another device.
          </Alert>
        )}
        {!loading && readState !== 'unavailable' && appointments.length === 0 && (
          <StateMessage
            state="empty"
            title="No appointment requests recorded"
            description="When you are ready, submit a preferred date and time for hematology care."
            action={<Button onClick={() => setView('request')}>Request an appointment</Button>}
          />
        )}
        {!loading && appointments.length > 0 && (
          <div className="space-y-8">
            <RequestList title="Recorded requests" appointments={activeRequests} onOpen={openDetails} />
            <RequestList title="Cancelled requests" appointments={cancelledRequests} onOpen={openDetails} />
          </div>
        )}
      </section>
    </div>
  );
};

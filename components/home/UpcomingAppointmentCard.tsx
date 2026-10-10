import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { Alert, Button, Card, Skeleton } from '../ui';

interface UpcomingAppointmentCardProps {
  userId: string;
  onOpenCare: () => void;
}

interface Appointment {
  id?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  bookedDate?: string;
  bookedTime?: string;
  status?: string;
}

function preferredDateTimestamp(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function selectRelevantAppointment(appointments: Appointment[], now = new Date()) {
  const active = appointments.filter((item) => item.status?.toLowerCase() !== 'cancelled');
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dated = active
    .map((appointment) => ({ appointment, timestamp: preferredDateTimestamp(appointment.bookedDate) }))
    .filter((entry): entry is { appointment: Appointment; timestamp: number } => entry.timestamp !== null);
  const future = dated.filter((entry) => entry.timestamp >= today).sort((a, b) => a.timestamp - b.timestamp);
  if (future[0]) return future[0].appointment;
  const past = dated.filter((entry) => entry.timestamp < today).sort((a, b) => b.timestamp - a.timestamp);
  if (past[0]) return past[0].appointment;
  return active.sort((a, b) =>
    `${a.bookedDate || ''}|${a.bookedTime || ''}|${a.id || ''}`.localeCompare(`${b.bookedDate || ''}|${b.bookedTime || ''}|${b.id || ''}`)
  )[0] ?? null;
}

export const UpcomingAppointmentCard: React.FC<UpcomingAppointmentCardProps> = ({ userId, onOpenCare }) => {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadAppointment = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const appointments = await firebaseService.getAppointments(userId) as Appointment[];
      setAppointment(selectRelevantAppointment(appointments));
    } catch (loadError) {
      console.warn('Appointment preview could not be loaded:', loadError);
      setError(true);
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadAppointment();
  }, [loadAppointment]);

  if (loading) {
    return (
      <Card as="section" aria-labelledby="appointment-title" padding="lg">
        <h2 id="appointment-title" className="text-heading-2">Appointment request</h2>
        <Skeleton className="mt-5 min-h-32" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card as="section" aria-labelledby="appointment-title" padding="lg">
        <h2 id="appointment-title" className="text-heading-2">Appointment request</h2>
        <Alert
          tone="warning"
          title="Appointments are unavailable"
          className="mt-4"
          action={(
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" leadingIcon={<RefreshCw size={16} />} onClick={() => void loadAppointment()}>
                Try again
              </Button>
              <Button size="sm" onClick={onOpenCare}>Open Care</Button>
            </div>
          )}
        >
          Open Care to manage appointments or try loading this preview again.
        </Alert>
      </Card>
    );
  }

  return (
    <Card as="section" aria-labelledby="appointment-title" className="border-line/70 shadow-none" padding="lg">
      <h2 id="appointment-title" className="text-heading-2">Appointment request</h2>
      <p className="mt-1 text-small text-foreground-secondary">A recorded request. Clinic acceptance and availability are not confirmed here.</p>

      {appointment ? (
        <div className="mt-6 sm:flex sm:items-end sm:justify-between sm:gap-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-status-info-soft text-status-info" aria-hidden="true">
              <CalendarDays size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-body font-semibold text-foreground">Hematology care request</p>
              <p className="mt-1 inline-flex flex-wrap items-center gap-1.5 text-small text-foreground-secondary">
                <CalendarDays size={16} aria-hidden="true" />
                Requested for {appointment.bookedDate || 'date not recorded'}{appointment.bookedTime ? ` at ${appointment.bookedTime}` : ''}
              </p>
            </div>
          </div>
          <Button className="mt-5 w-full sm:mt-0 sm:w-auto sm:shrink-0" onClick={onOpenCare}>View requests</Button>
        </div>
      ) : (
        <div className="mt-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <p className="flex-1 rounded-card bg-surface-subtle p-4 text-body text-foreground-secondary">No current appointment request is recorded.</p>
          <Button className="mt-4 w-full sm:mt-0 sm:w-auto sm:shrink-0" onClick={onOpenCare}>Open Care</Button>
        </div>
      )}
    </Card>
  );
};

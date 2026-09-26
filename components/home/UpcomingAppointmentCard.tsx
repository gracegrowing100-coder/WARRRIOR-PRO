import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Clock3, RefreshCw, Stethoscope } from 'lucide-react';
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

export const UpcomingAppointmentCard: React.FC<UpcomingAppointmentCardProps> = ({ userId, onOpenCare }) => {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadAppointment = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const appointments = await firebaseService.getAppointments(userId) as Appointment[];
      setAppointment(appointments.find((item) => item.status?.toLowerCase() !== 'cancelled') ?? null);
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
        <h2 id="appointment-title" className="text-heading-2">Appointment</h2>
        <Skeleton className="mt-5 min-h-32" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card as="section" aria-labelledby="appointment-title" padding="lg">
        <h2 id="appointment-title" className="text-heading-2">Appointment</h2>
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
    <Card as="section" aria-labelledby="appointment-title" padding="lg">
      <h2 id="appointment-title" className="text-heading-2">Appointment</h2>
      <p className="mt-1 text-small text-foreground-secondary">A current active booking from your appointment records.</p>

      {appointment ? (
        <div className="mt-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-status-info-soft text-status-info" aria-hidden="true">
              <Stethoscope size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-body font-semibold text-foreground">{appointment.doctorName || 'Care appointment'}</p>
              {appointment.doctorSpecialty && <p className="mt-0.5 text-small text-foreground-secondary">{appointment.doctorSpecialty}</p>}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-small text-foreground-secondary">
                {appointment.bookedDate && <span className="inline-flex items-center gap-1.5"><CalendarDays size={16} aria-hidden="true" />{appointment.bookedDate}</span>}
                {appointment.bookedTime && <span className="inline-flex items-center gap-1.5"><Clock3 size={16} aria-hidden="true" />{appointment.bookedTime}</span>}
              </div>
            </div>
          </div>
          <Button className="mt-5" onClick={onOpenCare}>View appointments</Button>
        </div>
      ) : (
        <div className="mt-5">
          <p className="rounded-card bg-surface-subtle p-4 text-body text-foreground-secondary">No active appointment is currently listed.</p>
          <Button className="mt-4" onClick={onOpenCare}>Open Care</Button>
        </div>
      )}
    </Card>
  );
};

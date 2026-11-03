import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, ChevronRight, RefreshCw } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { Alert, Button, Skeleton } from '../ui';

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
      const appointments = await firebaseService.getAppointments(userId);
      setAppointment(selectRelevantAppointment(appointments));
    } catch (loadError) {
      console.warn('Upcoming appointment could not be loaded:', loadError);
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
      <div data-semantic="appointment-card" aria-label="Appointment loading" className="rounded-[28px] bg-wa-surface p-[18px]">
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div data-semantic="appointment-card" aria-label="Appointment error" className="rounded-[28px] bg-wa-surface p-[18px]">
        <h2 id="appointment-title" className="text-sm font-bold text-wa-plum">Appointment request</h2>
        <Alert
          tone="warning"
          title="Appointments are unavailable"
          className="mt-3"
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
      </div>
    );
  }

  // Parse appointment date for display
  let dayOfWeek = 'APT';
  let dayOfMonth = '·';
  if (appointment?.bookedDate) {
    const parsed = new Date(`${appointment.bookedDate}T12:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      dayOfWeek = parsed.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      dayOfMonth = String(parsed.getDate());
    } else {
      dayOfWeek = appointment.bookedDate.slice(0, 3).toUpperCase();
      dayOfMonth = '✦';
    }
  }

  return (
    <div
      data-semantic="appointment-card"
      onClick={onOpenCare}
      role="region"
      aria-labelledby="appointment-title"
      className="group flex cursor-pointer items-center gap-3.5 rounded-[28px] bg-wa-surface p-4 text-wa-plum transition-all duration-150 hover:bg-wa-ground border border-wa-line-soft shadow-none"
    >
      <h2 id="appointment-title" className="sr-only">Appointment request</h2>
      <div className="flex h-16 w-[60px] shrink-0 flex-col items-center justify-center rounded-[18px] bg-wa-hero text-white">
        <span className="text-[11px] font-bold text-wa-rose-text">{dayOfWeek}</span>
        <span className="font-display text-[22px] font-extrabold leading-tight">{dayOfMonth}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-wa-muted">Next appointment</div>
        {appointment ? (
          <>
            <p className="truncate font-bold text-wa-plum">
              Hematology care request
            </p>
            <p className="truncate text-[13px] text-wa-muted">
              Requested for {appointment.bookedDate || 'date not recorded'}{appointment.bookedTime ? ` at ${appointment.bookedTime}` : ''}
            </p>
          </>
        ) : (
          <>
            <p className="font-bold text-wa-plum">No current appointment request is recorded.</p>
            <p className="text-[13px] text-wa-muted">Tap to request a visit</p>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {appointment ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCare();
            }}
            className="text-wa-crimson font-bold text-xs"
          >
            View requests
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCare();
            }}
            className="text-wa-crimson font-bold text-xs"
          >
            Open Care
          </Button>
        )}
        <ChevronRight size={18} strokeWidth={2.5} className="text-wa-crimson transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </div>
    </div>
  );
};

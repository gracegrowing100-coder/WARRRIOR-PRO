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
      <div data-semantic="appointment-card" aria-label="Appointment loading" className="rounded-[28px] bg-wa-surface p-4 border border-wa-line-soft dark:border-white/10">
        <Skeleton className="h-16 w-full rounded-[20px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div data-semantic="appointment-card" aria-label="Appointment error" className="rounded-[28px] bg-wa-surface p-4 sm:p-5 border border-wa-line-soft dark:border-white/10">
        <h2 id="appointment-title" className="text-sm font-bold text-wa-plum dark:text-white">Appointment request</h2>
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
      className="group relative flex cursor-pointer items-center gap-3 sm:gap-4 rounded-[28px] bg-wa-surface p-4 sm:p-5 text-wa-plum dark:text-white transition-all duration-150 hover:bg-wa-ground border border-wa-line-soft dark:border-white/10 shadow-none hover:shadow-subtle"
    >
      <h2 id="appointment-title" className="sr-only">Appointment request</h2>

      {/* Date badge */}
      <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 flex-col items-center justify-center rounded-[18px] bg-[var(--wa-hero)] text-white shadow-sm">
        <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-wa-rose-text uppercase leading-tight">
          {dayOfWeek}
        </span>
        <span className="font-display text-[20px] sm:text-[22px] font-extrabold leading-tight mt-0.5">
          {dayOfMonth}
        </span>
      </div>

      {/* Center content */}
      <div className="min-w-0 flex-1">
        <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-wa-plum-muted dark:text-wa-on-plum-muted">
          Next appointment
        </div>
        {appointment ? (
          <>
            <p className="font-display font-bold text-[15px] sm:text-[16px] text-wa-plum dark:text-white leading-snug truncate mt-0.5">
              Hematology care request
            </p>
            <p className="text-[12px] sm:text-[13px] text-wa-plum-muted dark:text-wa-on-plum-muted truncate mt-0.5">
              Requested for {appointment.bookedDate || 'date not recorded'}{appointment.bookedTime ? ` at ${appointment.bookedTime}` : ''}
            </p>
          </>
        ) : (
          <>
            <p className="font-display font-bold text-[14px] sm:text-[15px] text-wa-plum dark:text-white leading-snug mt-0.5">
              No current appointment request is recorded.
            </p>
            <p className="text-[12px] sm:text-[13px] text-wa-plum-muted dark:text-wa-on-plum-muted mt-0.5">
              Tap to request a visit with your clinic
            </p>
          </>
        )}
      </div>

      {/* Right action button */}
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          aria-label={appointment ? "View requests" : "Open Care"}
          onClick={(e) => {
            e.stopPropagation();
            onOpenCare();
          }}
          className="inline-flex items-center gap-1 text-wa-crimson font-body font-bold text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-full bg-wa-crimson/10 hover:bg-wa-crimson/20 active:scale-95 transition-all"
        >
          <span className="hidden sm:inline">
            {appointment ? 'View requests' : 'Open Care'}
          </span>
          <span className="sm:hidden">
            {appointment ? 'View' : 'Care'}
          </span>
          <ChevronRight size={15} strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

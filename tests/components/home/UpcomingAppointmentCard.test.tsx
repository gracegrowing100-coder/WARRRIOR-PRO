import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({ getAppointments: vi.fn() }));

vi.mock('../../../services/firebaseService', () => ({ firebaseService: service }));

import { selectRelevantAppointment, UpcomingAppointmentCard } from '../../../components/home/UpcomingAppointmentCard';

describe('UpcomingAppointmentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.getAppointments.mockResolvedValue([]);
  });

  it('excludes cancelled records and presents a legacy confirmed value only as a request', async () => {
    const onOpenCare = vi.fn();
    service.getAppointments.mockResolvedValue([
      { id: 'cancelled', doctorName: 'Cancelled clinician', status: 'Cancelled' },
      { id: 'active', doctorName: 'Dr. Amina', doctorSpecialty: 'Haematology', bookedDate: 'Tomorrow', bookedTime: '10:30 AM', status: 'Confirmed' },
    ]);

    render(<UpcomingAppointmentCard userId="patient-1" onOpenCare={onOpenCare} />);

    expect(await screen.findByText('Hematology care request')).toBeInTheDocument();
    expect(screen.getByText('Requested for Tomorrow at 10:30 AM')).toBeInTheDocument();
    expect(screen.queryByText('Cancelled clinician')).not.toBeInTheDocument();
    expect(screen.queryByText('Confirmed')).not.toBeInTheDocument();
    expect(screen.queryByText(/active booking/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'View requests' }));
    expect(onOpenCare).toHaveBeenCalledTimes(1);
  });

  it('provides a Care action when no active appointment exists', async () => {
    const onOpenCare = vi.fn();
    render(<UpcomingAppointmentCard userId="patient-1" onOpenCare={onOpenCare} />);

    expect(await screen.findByText(/No current appointment request is recorded/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open Care' }));
    expect(onOpenCare).toHaveBeenCalledTimes(1);
  });

  it('selects the earliest future preferred date regardless of creation order', () => {
    const selected = selectRelevantAppointment([
      { id: 'later', bookedDate: '2026-10-20', status: 'Requested' },
      { id: 'past', bookedDate: '2026-09-20', status: 'Requested' },
      { id: 'cancelled', bookedDate: '2026-10-01', status: 'Cancelled' },
      { id: 'next', bookedDate: '2026-10-05', status: 'Requested' },
    ], new Date('2026-09-30T12:00:00'));

    expect(selected?.id).toBe('next');
  });

  it('shows a recoverable unavailable state when appointment loading fails', async () => {
    service.getAppointments.mockRejectedValue(new Error('appointments unavailable'));

    render(<UpcomingAppointmentCard userId="patient-1" onOpenCare={vi.fn()} />);

    expect(await screen.findByText('Appointments are unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Care' })).toBeInTheDocument();
  });
});

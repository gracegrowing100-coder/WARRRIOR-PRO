import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({ getAppointments: vi.fn() }));

vi.mock('../../../services/firebaseService', () => ({ firebaseService: service }));

import { UpcomingAppointmentCard } from '../../../components/home/UpcomingAppointmentCard';

describe('UpcomingAppointmentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.getAppointments.mockResolvedValue([]);
  });

  it('excludes cancelled records and opens Care from an active preview', async () => {
    const onOpenCare = vi.fn();
    service.getAppointments.mockResolvedValue([
      { id: 'cancelled', doctorName: 'Cancelled clinician', status: 'Cancelled' },
      { id: 'active', doctorName: 'Dr. Amina', doctorSpecialty: 'Haematology', bookedDate: 'Tomorrow', bookedTime: '10:30 AM', status: 'Confirmed' },
    ]);

    render(<UpcomingAppointmentCard userId="patient-1" onOpenCare={onOpenCare} />);

    expect(await screen.findByText('Dr. Amina')).toBeInTheDocument();
    expect(screen.queryByText('Cancelled clinician')).not.toBeInTheDocument();
    expect(screen.queryByText(/next appointment/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'View appointments' }));
    expect(onOpenCare).toHaveBeenCalledTimes(1);
  });

  it('provides a Care action when no active appointment exists', async () => {
    const onOpenCare = vi.fn();
    render(<UpcomingAppointmentCard userId="patient-1" onOpenCare={onOpenCare} />);

    expect(await screen.findByText(/No active appointment is currently listed/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open Care' }));
    expect(onOpenCare).toHaveBeenCalledTimes(1);
  });

  it('shows a recoverable unavailable state when appointment loading fails', async () => {
    service.getAppointments.mockRejectedValue(new Error('appointments unavailable'));

    render(<UpcomingAppointmentCard userId="patient-1" onOpenCare={vi.fn()} />);

    expect(await screen.findByText('Appointments are unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Care' })).toBeInTheDocument();
  });
});

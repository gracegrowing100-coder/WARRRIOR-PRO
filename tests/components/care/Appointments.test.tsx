import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 15_000 });

const appointmentService = vi.hoisted(() => ({
  addAppointment: vi.fn(),
  cancelAppointment: vi.fn(),
  getAppointmentRequests: vi.fn(),
}));

vi.mock('../../../services/firebaseService', () => ({
  firebaseService: appointmentService,
}));

import { Appointments } from '../../../components/care/Appointments';

const recordedRequest = {
  id: 'request-1',
  bookedDate: '2026-10-12',
  bookedTime: '14:30',
  patientNote: 'Review recurring fatigue',
  status: 'Requested',
  formattedCreatedAt: '9/28/2026',
};

const renderAppointments = (props?: Partial<React.ComponentProps<typeof Appointments>>) => {
  const onBackToCare = vi.fn();
  render(<Appointments userId="patient-1" onBackToCare={onBackToCare} {...props} />);
  return { onBackToCare };
};

const openRequest = async (user: ReturnType<typeof userEvent.setup>) => {
  await screen.findByRole('heading', { name: 'Appointments' });
  await user.click(screen.getByRole('button', { name: 'Request an appointment' }));
};

const completePreferences = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/Preferred date/), '2026-10-12');
  await user.type(screen.getByLabelText(/Preferred time/), '14:30');
  await user.type(screen.getByLabelText('Reason for appointment'), 'Review recurring fatigue');
  await user.click(screen.getByRole('button', { name: 'Review request' }));
};

describe('Appointments patient experience', () => {
  beforeEach(() => {
    appointmentService.addAppointment.mockReset().mockResolvedValue({ id: 'request-new' });
    appointmentService.cancelAppointment.mockReset().mockResolvedValue(undefined);
    appointmentService.getAppointmentRequests.mockReset().mockResolvedValue({
      state: 'recorded',
      data: [recordedRequest],
    });
  });

  it('renders the factual landing experience and returns to Care', async () => {
    const user = userEvent.setup();
    const { onBackToCare } = renderAppointments();

    expect(await screen.findByRole('heading', { name: 'Appointments' })).toBeInTheDocument();
    expect(screen.getByText(/Appointment times are not confirmed here/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to Care' }));
    expect(onBackToCare).toHaveBeenCalledOnce();
  });

  it('opens the request workflow and validates required preferences while leaving reason optional', async () => {
    const user = userEvent.setup();
    renderAppointments();
    await openRequest(user);

    await user.click(screen.getByRole('button', { name: 'Review request' }));
    expect(screen.getByText('Choose a preferred date.')).toBeInTheDocument();
    expect(screen.getByText('Choose a preferred time.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Preferred date/)).toHaveAttribute('aria-invalid', 'true');

    await user.type(screen.getByLabelText(/Preferred date/), '2026-10-12');
    await user.type(screen.getByLabelText(/Preferred time/), '14:30');
    await user.click(screen.getByRole('button', { name: 'Review request' }));
    expect(screen.getByText('Not provided')).toBeInTheDocument();
  });

  it('reviews actual selections, submits the existing contract once, and keeps success visible until Done', async () => {
    const user = userEvent.setup();
    renderAppointments();
    await openRequest(user);
    await completePreferences(user);

    expect(screen.getByText('12 October 2026')).toBeInTheDocument();
    expect(screen.getByText('14:30')).toBeInTheDocument();
    expect(screen.getByText('Review recurring fatigue')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Submit request' }));
    expect(appointmentService.addAppointment).toHaveBeenCalledWith('patient-1', {
      bookedDate: '2026-10-12',
      bookedTime: '14:30',
      patientNote: 'Review recurring fatigue',
      status: 'Requested',
    });
    expect(await screen.findByText('Appointment request recorded')).toBeInTheDocument();
    expect(screen.getByText(/not a confirmed appointment or reserved clinic time/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });

  it('prevents duplicate submission while a request is being recorded', async () => {
    const user = userEvent.setup();
    let resolveRequest: ((value: { id: string }) => void) | undefined;
    appointmentService.addAppointment.mockImplementation(() => new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    renderAppointments();
    await openRequest(user);
    await completePreferences(user);

    const submit = screen.getByRole('button', { name: 'Submit request' });
    await user.click(submit);
    expect(screen.getByRole('button', { name: 'Submitting request…' })).toBeDisabled();
    expect(appointmentService.addAppointment).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Submitting request…' }));
    expect(appointmentService.addAppointment).toHaveBeenCalledTimes(1);

    await act(async () => resolveRequest?.({ id: 'request-new' }));
    expect(await screen.findByText('Appointment request recorded')).toBeInTheDocument();
  });

  it('retains selections after failure and allows retry', async () => {
    const user = userEvent.setup();
    appointmentService.addAppointment.mockRejectedValueOnce(new Error('permission denied'));
    renderAppointments();
    await openRequest(user);
    await completePreferences(user);

    await user.click(screen.getByRole('button', { name: 'Submit request' }));
    expect(await screen.findByText('Request not recorded')).toBeInTheDocument();
    expect(screen.getByText('Review recurring fatigue')).toBeInTheDocument();

    appointmentService.addAppointment.mockResolvedValueOnce({ id: 'request-new' });
    await user.click(screen.getByRole('button', { name: 'Submit request' }));
    expect(await screen.findByText('Appointment request recorded')).toBeInTheDocument();
    expect(appointmentService.addAppointment).toHaveBeenCalledTimes(2);
  });

  it('renders factual stored and legacy values without fake provider availability', async () => {
    appointmentService.getAppointmentRequests.mockResolvedValueOnce({
      state: 'recorded',
      data: [{
        id: 'legacy-1',
        bookedDate: 'Tomorrow',
        bookedTime: '09:00 AM',
        doctorName: 'Dr. Legacy',
        status: 'Confirmed',
      }],
    });
    const user = userEvent.setup();
    renderAppointments();

    expect(await screen.findByText('Tomorrow')).toBeInTheDocument();
    expect(screen.getByText('Preferred time: 09:00 AM')).toBeInTheDocument();
    expect(screen.queryByText(/available slot|doctor is live|waiting room|video consultation/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Open appointment request/i }));
    expect(screen.getByText('Dr. Legacy')).toBeInTheDocument();
    expect(screen.getByText('Provider on legacy record')).toBeInTheDocument();
  });

  it('shows truthful empty, unavailable, and cached states', async () => {
    appointmentService.getAppointmentRequests.mockResolvedValueOnce({ state: 'empty', data: [] });
    const { unmount } = render(<Appointments userId="patient-1" onBackToCare={vi.fn()} />);
    expect(await screen.findByText('No appointment requests recorded')).toBeInTheDocument();
    unmount();

    appointmentService.getAppointmentRequests.mockResolvedValueOnce({ state: 'unavailable', data: [] });
    const second = render(<Appointments userId="patient-1" onBackToCare={vi.fn()} />);
    expect(await screen.findByText('Appointment requests unavailable')).toBeInTheDocument();
    second.unmount();

    appointmentService.getAppointmentRequests.mockResolvedValueOnce({ state: 'cached', data: [recordedRequest] });
    render(<Appointments userId="patient-1" onBackToCare={vi.fn()} />);
    expect(await screen.findByText('Showing requests saved on this device')).toBeInTheDocument();
    expect(screen.getByText('Review recurring fatigue')).toBeInTheDocument();
  });

  it('requires confirmation before cancellation and keeps a truthful cancelled history', async () => {
    const user = userEvent.setup();
    renderAppointments();
    await screen.findByText('Review recurring fatigue');
    await user.click(screen.getByRole('button', { name: /Open appointment request/i }));

    expect(appointmentService.cancelAppointment).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Cancel request' }));
    const dialog = screen.getByRole('dialog', { name: 'Cancel appointment request?' });
    expect(within(dialog).getByText(/does not confirm that a clinic was notified/i)).toBeInTheDocument();
    expect(appointmentService.cancelAppointment).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel request' }));
    expect(appointmentService.cancelAppointment).toHaveBeenCalledWith('patient-1', 'request-1');
    expect(await screen.findByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel request' })).not.toBeInTheDocument();
  });

  it('uses an optional initial reason without persisting before review and submit', async () => {
    const user = userEvent.setup();
    renderAppointments({ initialReason: 'Patient-approved handoff note' });
    await openRequest(user);

    expect(screen.getByLabelText('Reason for appointment')).toHaveValue('Patient-approved handoff note');
    expect(appointmentService.addAppointment).not.toHaveBeenCalled();
  });
});

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

describe('Appointment completion and handoff contract', () => {
  beforeEach(() => {
    appointmentService.addAppointment.mockReset().mockResolvedValue({ id: 'new' });
    appointmentService.cancelAppointment.mockReset().mockResolvedValue({ state: 'device-only' });
    appointmentService.getAppointmentRequests.mockReset().mockResolvedValue({ state: 'recorded', data: [recordedRequest] });
  });
  it('keeps an editable handoff reason unsaved through review and returns to the list after Done', async () => {
    const user = userEvent.setup();
    renderAppointments({ initialReason: 'Synthetic handoff note' });
    await openRequest(user);
    await user.clear(screen.getByLabelText('Reason for appointment'));
    await completePreferences(user);
    expect(appointmentService.addAppointment).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Submit request' }));
    expect(await screen.findByText('Appointment request recorded')).toBeInTheDocument();
    expect(appointmentService.addAppointment).toHaveBeenCalledWith('patient-1', expect.objectContaining({ patientNote: 'Review recurring fatigue' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(await screen.findByRole('heading', { name: 'Appointments' })).toBeInTheDocument();
    expect(appointmentService.getAppointmentRequests).toHaveBeenCalledTimes(2);
  });
  it('labels local-only creation and retains the result until Done', async () => {
    appointmentService.addAppointment.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderAppointments();
    await openRequest(user);
    await completePreferences(user);
    await user.click(screen.getByRole('button', { name: 'Submit request' }));
    expect(await screen.findByText('Appointment request saved on this device')).toBeInTheDocument();
    expect(screen.getByText(/no clinician response is implied/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });
  it('returns from request and details and retains cancelled history with local-only notice', async () => {
    const user = userEvent.setup();
    renderAppointments();
    await openRequest(user);
    await user.click(screen.getByRole('button', { name: 'Back to appointments' }));
    await user.click(await screen.findByRole('button', { name: /Open appointment request/i }));
    await user.click(screen.getByRole('button', { name: 'Cancel request' }));
    let dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Keep request' }));
    expect(appointmentService.cancelAppointment).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Cancel request' }));
    dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel request' }));
    expect(await screen.findByText('Device-only cancellation')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to appointments' }));
    expect(screen.getByRole('heading', { name: 'Cancelled requests' })).toBeInTheDocument();
    expect(screen.getByText(/cloud record has not been updated/i)).toBeInTheDocument();
  });
});

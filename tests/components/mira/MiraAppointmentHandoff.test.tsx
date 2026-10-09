import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authHarness = vi.hoisted(() => ({
  auth: { currentUser: null as null | { uid: string; displayName?: string } },
  callback: null as null | ((user: unknown) => void),
  subscribeToAuth: vi.fn(),
}));

vi.mock('../../../firebase-init', () => ({
  auth: authHarness.auth,
  subscribeToAuth: authHarness.subscribeToAuth,
}));

const appointmentService = vi.hoisted(() => ({
  addAppointment: vi.fn(),
  getAppointmentRequests: vi.fn(),
}));

vi.mock('../../../services/firebaseService', () => ({
  firebaseService: {
    addAppointment: appointmentService.addAppointment,
    getAppointmentRequests: appointmentService.getAppointmentRequests,
  },
}));

vi.mock('../../../components/Dashboard', () => ({ default: () => <div>Patient Home</div> }));
vi.mock('../../../components/GamesHub', () => ({ default: () => <div>Games screen</div> }));
vi.mock('../../../components/Community', () => ({ default: () => <div>Community screen</div> }));
vi.mock('../../../components/Advocacy', () => ({ default: () => <div>Advocacy screen</div> }));
vi.mock('../../../components/UserProfile', () => ({ default: () => <div>User profile</div> }));
vi.mock('../../../components/EmergencyButton', () => ({ EmergencyButton: () => null }));
vi.mock('../../../components/OfflineWarriorAI', () => ({ OfflineWarriorAI: () => null }));
vi.mock('../../../components/SyntheticDemo', () => ({ SyntheticDemo: () => null }));
vi.mock('../../../components/AuthFlow', () => ({ AuthFlow: () => <div>Authentication screen</div> }));
vi.mock('../../../components/ChatSystem', () => ({ default: () => <div>Community chat screen</div> }));

// Mira is replaced at the workspace boundary so this test can drive the approved handoff.
vi.mock('../../../components/mira', () => ({
  MiraAssistant: ({ onContinueToAppointment }: { onContinueToAppointment: (summary: string) => void }) => (
    <button type="button" onClick={() => onContinueToAppointment('PATIENT-APPROVED SUMMARY')}>
      Approve and continue
    </button>
  ),
}));

vi.mock('../../../components/Telemedicine', () => ({
  default: ({ initialReason, onInitialReasonConsumed }: { initialReason?: string; onInitialReasonConsumed?: () => void }) => {
    const [consumedReason] = React.useState(initialReason || '');
    React.useEffect(() => {
      if (initialReason) onInitialReasonConsumed?.();
    }, [initialReason, onInitialReasonConsumed]);
    return (
      <div>
        <p>Appointment request screen</p>
        <p>Prefilled reason: {consumedReason || 'none'}</p>
      </div>
    );
  },
}));

import App from '../../../App';

describe('Mira appointment handoff', () => {
  beforeEach(() => {
    authHarness.auth.currentUser = null;
    authHarness.callback = null;
    authHarness.subscribeToAuth.mockReset().mockImplementation((callback: (user: unknown) => void) => {
      authHarness.callback = callback;
      return vi.fn();
    });
    appointmentService.addAppointment.mockReset();
    appointmentService.getAppointmentRequests.mockReset().mockResolvedValue({ state: 'empty', data: [] });
  });

  it('opens the existing appointment request with the approved summary prefilled and submits nothing', async () => {
    const user = userEvent.setup();
    render(<App />);
    act(() => authHarness.callback?.({ uid: 'patient-1' }));
    await screen.findByText('Patient Home');

    act(() => {
      window.location.hash = '#/chat';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    await user.click(await screen.findByRole('button', { name: 'Approve and continue' }));

    expect(await screen.findByText('Appointment request screen')).toBeInTheDocument();
    expect(screen.getByText('Prefilled reason: PATIENT-APPROVED SUMMARY')).toBeInTheDocument();
    expect(appointmentService.addAppointment).not.toHaveBeenCalled();
    expect(screen.queryByText('Community chat screen')).not.toBeInTheDocument();
  });

  it('consumes the approved summary so a later appointment visit is empty', async () => {
    const user = userEvent.setup();
    render(<App />);
    act(() => authHarness.callback?.({ uid: 'patient-1' }));
    await screen.findByText('Patient Home');
    act(() => {
      window.location.hash = '#/chat';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    await user.click(await screen.findByRole('button', { name: 'Approve and continue' }));
    expect(await screen.findByText('Prefilled reason: PATIENT-APPROVED SUMMARY')).toBeInTheDocument();

    act(() => {
      window.location.hash = '#/home';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    await screen.findByText('Patient Home');
    act(() => {
      window.location.hash = '#/telemedicine';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(await screen.findByText('Prefilled reason: none')).toBeInTheDocument();
    expect(appointmentService.addAppointment).not.toHaveBeenCalled();
  });
});

import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authHarness = vi.hoisted(() => ({
  auth: { currentUser: null as null | { uid: string; displayName?: string } },
  callback: null as null | ((user: any) => void),
  subscribeToAuth: vi.fn(),
}));

vi.mock('../../firebase-init', () => ({
  auth: authHarness.auth,
  subscribeToAuth: authHarness.subscribeToAuth,
}));

vi.mock('../../components/Dashboard', () => ({
  default: ({ userId }: { userId: string }) => <div>Patient Home for {userId}</div>,
}));
vi.mock('../../components/GamesHub', () => ({ default: () => <div>Games screen</div> }));
vi.mock('../../components/ChatSystem', () => ({ default: () => <div>Chat screen</div> }));
vi.mock('../../components/Telemedicine', () => ({
  default: ({ userId, onBackToCare }: { userId: string; onBackToCare: () => void }) => (
    <div>
      <span>Appointments screen for {userId}</span>
      <button type="button" onClick={onBackToCare}>Back to Care</button>
    </div>
  ),
}));
vi.mock('../../components/care', () => ({
  CareHub: ({ userId, onOpenAppointments }: { userId: string; onOpenAppointments: () => void }) => (
    <div>
      <span>Care hub for {userId}</span>
      <button type="button" onClick={onOpenAppointments}>Open appointments</button>
    </div>
  ),
}));
vi.mock('../../components/Community', () => ({ default: () => <div>Community screen</div> }));
vi.mock('../../components/Advocacy', () => ({ default: () => <div>Advocacy screen</div> }));
vi.mock('../../components/UserProfile', () => ({ default: () => <div>User profile</div> }));
vi.mock('../../components/EmergencyButton', () => ({
  EmergencyButton: () => <button type="button">Emergency HUD</button>,
}));
vi.mock('../../components/OfflineWarriorAI', () => ({
  OfflineWarriorAI: () => <div>Offline assistant</div>,
}));
vi.mock('../../components/SyntheticDemo', () => ({
  SyntheticDemo: () => <div>Synthetic demo</div>,
}));
vi.mock('../../components/AuthFlow', () => ({
  AuthFlow: () => <div>Authentication screen</div>,
}));

import App from '../../App';

const renderAuthenticatedApp = async () => {
  render(<App />);
  act(() => authHarness.callback?.({ uid: 'patient-1', displayName: 'Tayo' }));
  await screen.findByText('Patient Home for patient-1');
};

const changeHash = async (hash: string) => {
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
};

describe('Care hash entry and browser history', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    authHarness.auth.currentUser = null;
    authHarness.subscribeToAuth.mockReset().mockImplementation((callback: (user: any) => void) => {
      authHarness.callback = callback;
      return vi.fn();
    });
  });

  it.each([
    ['#/care', 'Care hub for patient-1'],
    ['#/telemedicine', 'Appointments screen for patient-1'],
  ])('opens %s directly without displaying Home', async (hash, title) => {
    window.history.replaceState(null, '', hash);
    render(<App />);
    act(() => authHarness.callback?.({ uid: 'patient-1' }));
    expect(await screen.findByText(title)).toBeInTheDocument();
    expect(screen.queryByText('Patient Home for patient-1')).not.toBeInTheDocument();
    expect(window.location.hash).toBe(hash);
  });

  it('handles back/forward hash events without adding history entries', async () => {
    await renderAuthenticatedApp();
    const initialLength = window.history.length;
    for (const [hash, title] of [
      ['#/care', 'Care hub for patient-1'],
      ['#/telemedicine', 'Appointments screen for patient-1'],
      ['#/care', 'Care hub for patient-1'],
      ['#/telemedicine', 'Appointments screen for patient-1'],
    ]) {
      act(() => {
        window.history.replaceState(null, '', hash);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });
      expect(await screen.findByText(title)).toBeInTheDocument();
      expect(window.history.length).toBe(initialLength);
    }
  });
});

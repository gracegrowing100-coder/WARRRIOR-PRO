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

const profileHarness = vi.hoisted(() => ({
  getUserProfileState: vi.fn(),
}));

vi.mock('../../services/firebaseService', () => ({ firebaseService: profileHarness }));

vi.mock('../../components/Dashboard', () => ({
  default: ({ userId }: { userId: string }) => <div>Patient Home for {userId}</div>,
}));
vi.mock('../../components/GamesHub', () => ({ default: () => <div>Games screen</div> }));
vi.mock('../../components/ChatWorkspace', () => ({ default: () => <div>Chat screen</div> }));
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

describe('App patient navigation integration', () => {
  beforeEach(() => {
    authHarness.auth.currentUser = null;
    authHarness.callback = null;
    authHarness.subscribeToAuth.mockReset().mockImplementation((callback: (user: any) => void) => {
      authHarness.callback = callback;
      return vi.fn();
    });
    profileHarness.getUserProfileState.mockReset().mockResolvedValue({
      state: 'recorded',
      data: { displayName: 'Tayo' },
    });
  });

  it('keeps five activities in patient navigation and Profile and Emergency outside it', async () => {
    const user = userEvent.setup();
    await renderAuthenticatedApp();

    const navigation = screen.getByRole('navigation', { name: 'Patient navigation' });
    expect(within(navigation).getAllByRole('button')).toHaveLength(5);
    expect(within(navigation).queryByRole('button', { name: /profile/i })).not.toBeInTheDocument();

    const profile = screen.getByRole('button', { name: 'Open profile' });
    expect(profile).toHaveClass('h-11', 'w-11');
    expect(navigation).not.toContainElement(profile);
    expect(navigation).not.toContainElement(screen.getByRole('button', { name: 'Emergency HUD' }));

    await user.click(profile);
    expect(screen.getByText('User profile')).toBeInTheDocument();
    expect(profile).toHaveAttribute('aria-expanded', 'true');
  });

  it('routes Care to the patient Care hub and keeps appointments reachable', async () => {
    const user = userEvent.setup();
    await renderAuthenticatedApp();

    await user.click(screen.getByRole('button', { name: 'Care' }));

    expect(await screen.findByText('Care hub for patient-1')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/care');
    expect(screen.getByRole('button', { name: 'Care' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Open appointments' }));
    expect(await screen.findByText('Appointments screen for patient-1')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/telemedicine');

    await user.click(screen.getByRole('button', { name: 'Back to Care' }));
    expect(await screen.findByText('Care hub for patient-1')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/care');
  });

  it('uses More as a launcher for existing Games/Education and Advocacy screens', async () => {
    const user = userEvent.setup();
    await renderAuthenticatedApp();

    await user.click(screen.getByRole('button', { name: 'More' }));
    expect(await screen.findByRole('navigation', { name: 'More destinations' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Games & Education/i }));
    expect(await screen.findByText('Games screen')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/games');

    await user.click(screen.getByRole('button', { name: 'More' }));
    await user.click(screen.getByRole('button', { name: /Advocacy & Research/i }));
    expect(await screen.findByText('Advocacy screen')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/advocacy');
  });

  it.each([
    ['#/games', 'Games screen', 'More'],
    ['#/chat', 'Chat screen', 'Chat'],
    ['#/telemedicine', 'Appointments screen for patient-1', 'Care'],
    ['#/community', 'Community screen', 'Community'],
    ['#/advocacy', 'Advocacy screen', 'More'],
  ])('preserves legacy route %s', async (hash, expectedScreen, activeDestination) => {
    await renderAuthenticatedApp();

    await changeHash(hash);

    expect(await screen.findByText(expectedScreen)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: activeDestination })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

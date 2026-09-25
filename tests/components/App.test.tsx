import React from 'react';
import { act, render, screen } from '@testing-library/react';
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
vi.mock('../../components/Telemedicine', () => ({ default: () => <div>Telemedicine screen</div> }));
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
  AuthFlow: ({ onAuthSuccess, onOpenDemo }: any) => (
    <div>
      <span>Authentication screen</span>
      <button type="button" onClick={() => onAuthSuccess({ uid: 'inline-user' })}>Complete sign in</button>
      <button type="button" onClick={onOpenDemo}>Open synthetic demo</button>
    </div>
  ),
}));

import App from '../../App';

describe('App startup, auth state, navigation, and settings', () => {
  beforeEach(() => {
    authHarness.auth.currentUser = null;
    authHarness.callback = null;
    authHarness.subscribeToAuth.mockReset().mockImplementation((callback: (user: any) => void) => {
      authHarness.callback = callback;
      return vi.fn();
    });
  });

  it('shows session loading, then the signed-out authentication screen', async () => {
    render(<App />);
    expect(screen.getByRole('status')).toHaveTextContent('Checking your secure session');

    act(() => authHarness.callback?.(null));

    expect(await screen.findByText('Authentication screen')).toBeInTheDocument();
  });

  it('renders Patient Home and keeps emergency access for an authenticated user', async () => {
    render(<App />);
    act(() => authHarness.callback?.({ uid: 'patient-1', displayName: 'Tayo' }));

    expect(await screen.findByText('Patient Home for patient-1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Emergency HUD' })).toBeInTheDocument();
  });

  it('characterizes hash changes after mount without asserting the known initial-hash defect as desired', async () => {
    render(<App />);
    act(() => authHarness.callback?.({ uid: 'patient-1' }));
    await screen.findByText('Patient Home for patient-1');

    act(() => {
      window.location.hash = '#/chat';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(await screen.findByText('Chat screen')).toBeInTheDocument();
  });

  it('persists language, dark mode, and high contrast selections', async () => {
    const user = userEvent.setup();
    render(<App />);
    act(() => authHarness.callback?.({ uid: 'patient-1' }));
    await screen.findByText('Patient Home for patient-1');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Select Language' }), 'yo');
    await user.click(screen.getByRole('button', { name: 'Toggle layout theme' }));
    await user.click(screen.getByRole('button', { name: 'Toggle High Contrast Mode' }));

    expect(localStorage.getItem('warrior_language')).toBe('yo');
    expect(localStorage.getItem('warrior_theme')).toBe('dark');
    expect(localStorage.getItem('warrior_high_contrast')).toBe('true');
    expect(document.documentElement).toHaveClass('dark', 'high-contrast');
  });

  it('opens the synthetic demo without creating an authenticated session', async () => {
    const user = userEvent.setup();
    render(<App />);
    act(() => authHarness.callback?.(null));

    await user.click(await screen.findByRole('button', { name: 'Open synthetic demo' }));

    expect(screen.getByText('Synthetic demo')).toBeInTheDocument();
    expect(authHarness.auth.currentUser).toBeNull();
  });

  it.todo('known limitation: an existing valid hash is not applied during initial App mount');
});

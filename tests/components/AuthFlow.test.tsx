import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ALEX_UID = 'k7pJmQuzspTlu2uU880hFw8miou1';
const alexUser = {
  uid: ALEX_UID,
  email: 'alexdata2022@gmail.com',
  displayName: 'Alex',
  photoURL: null,
};

const authApi = vi.hoisted(() => ({
  auth: { currentUser: null as any },
  configureAuthPersistence: vi.fn(),
  linkPendingGoogleCredential: vi.fn(),
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  registerWithEmail: vi.fn(),
  sendPasswordReset: vi.fn(),
  triggerEmailVerification: vi.fn(),
  updateUserDisplayNameAndPhoto: vi.fn(),
}));

const service = vi.hoisted(() => ({
  getUserProfileState: vi.fn(),
  createUserProfile: vi.fn(),
  saveWaterLog: vi.fn(),
  saveEmergencyInfo: vi.fn(),
  addMedication: vi.fn(),
}));

vi.mock('../../firebase-init', () => authApi);
vi.mock('../../services/firebaseService', () => ({ firebaseService: service }));

import { AuthFlow } from '../../components/AuthFlow';

async function openPasswordLogin(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Sign in to your account/i }));
  await screen.findByText('Account Sign In');
}

describe('AuthFlow identity continuity', () => {
  beforeEach(() => {
    localStorage.clear();
    authApi.auth.currentUser = null;
    authApi.configureAuthPersistence.mockReset().mockResolvedValue(undefined);
    authApi.linkPendingGoogleCredential.mockReset().mockResolvedValue(false);
    authApi.loginWithEmail.mockReset().mockResolvedValue(alexUser);
    authApi.loginWithGoogle.mockReset().mockResolvedValue(alexUser);
    service.getUserProfileState.mockReset().mockResolvedValue({
      state: 'recorded',
      data: { displayName: 'Alex', scdType: 'SS' },
    });
    service.createUserProfile.mockReset();
    service.saveWaterLog.mockReset();
    service.saveEmergencyInfo.mockReset();
    service.addMedication.mockReset();
  });

  it('loads Alex existing profile after Google returns the same Firebase UID', async () => {
    const user = userEvent.setup();
    const onAuthSuccess = vi.fn();
    render(<AuthFlow onAuthSuccess={onAuthSuccess} onOpenDemo={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Continue with Google/i }));

    expect(authApi.loginWithGoogle).toHaveBeenCalledWith(false);
    expect(service.getUserProfileState).toHaveBeenCalledWith(ALEX_UID);
    expect(onAuthSuccess).toHaveBeenCalledWith(alexUser);
    expect(screen.queryByText('Onboarding Step 1 of 3')).not.toBeInTheDocument();
  });

  it('does not overwrite or reinitialize an existing profile', async () => {
    const user = userEvent.setup();
    render(<AuthFlow onAuthSuccess={vi.fn()} onOpenDemo={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Continue with Google/i }));

    expect(service.createUserProfile).not.toHaveBeenCalled();
    expect(service.saveWaterLog).not.toHaveBeenCalled();
    expect(service.saveEmergencyInfo).not.toHaveBeenCalled();
    expect(service.addMedication).not.toHaveBeenCalled();
  });

  it('allows onboarding only when users/{uid} is confirmed missing', async () => {
    service.getUserProfileState.mockResolvedValue({ state: 'missing', data: null });
    const user = userEvent.setup();
    const onAuthSuccess = vi.fn();
    render(<AuthFlow onAuthSuccess={onAuthSuccess} onOpenDemo={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Continue with Google/i }));

    expect(await screen.findByText('Onboarding Step 1 of 3')).toBeInTheDocument();
    expect(service.createUserProfile).not.toHaveBeenCalled();
    expect(onAuthSuccess).not.toHaveBeenCalled();
  });

  it('does not route to onboarding when profile verification is unavailable', async () => {
    service.getUserProfileState.mockResolvedValue({ state: 'unavailable', data: null });
    const user = userEvent.setup();
    render(<AuthFlow onAuthSuccess={vi.fn()} onOpenDemo={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Continue with Google/i }));

    expect(await screen.findByText(/could not confirm your existing profile/i)).toBeInTheDocument();
    expect(screen.queryByText('Onboarding Step 1 of 3')).not.toBeInTheDocument();
    expect(service.createUserProfile).not.toHaveBeenCalled();
  });

  it('treats a closed Google popup as cancellation', async () => {
    authApi.loginWithGoogle.mockRejectedValue({ code: 'auth/popup-closed-by-user' });
    const user = userEvent.setup();
    render(<AuthFlow onAuthSuccess={vi.fn()} onOpenDemo={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Continue with Google/i }));

    expect(await screen.findByText(/Google sign-in was cancelled/i)).toBeInTheDocument();
    expect(service.getUserProfileState).not.toHaveBeenCalled();
    expect(service.createUserProfile).not.toHaveBeenCalled();
  });

  it('explains when the current host is not authorized for Google sign-in', async () => {
    authApi.loginWithGoogle.mockRejectedValue({ code: 'auth/unauthorized-domain' });
    const user = userEvent.setup();
    render(<AuthFlow onAuthSuccess={vi.fn()} onOpenDemo={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Continue with Google/i }));

    expect(await screen.findByText(/Open http:\/\/localhost:3000/i)).toBeInTheDocument();
    expect(service.getUserProfileState).not.toHaveBeenCalled();
  });

  it('requires the existing password before linking a pending Google credential', async () => {
    authApi.loginWithGoogle.mockRejectedValue({
      code: 'auth/account-exists-with-different-credential',
      customData: { email: alexUser.email },
    });
    authApi.linkPendingGoogleCredential.mockResolvedValue(true);
    const user = userEvent.setup();
    const onAuthSuccess = vi.fn();
    render(<AuthFlow onAuthSuccess={onAuthSuccess} onOpenDemo={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Continue with Google/i }));

    expect(await screen.findByText(/already has a Warrior AI account/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue(alexUser.email);
    expect(service.createUserProfile).not.toHaveBeenCalled();

    await user.type(document.querySelector('input[type="password"]') as HTMLInputElement, 'Password1!');
    await user.click(screen.getByRole('button', { name: /Authorize Clinical Access/i }));

    expect(authApi.linkPendingGoogleCredential).toHaveBeenCalledWith(alexUser);
    expect(service.getUserProfileState).toHaveBeenCalledWith(ALEX_UID);
    expect(onAuthSuccess).toHaveBeenCalledWith(alexUser);
    expect(service.createUserProfile).not.toHaveBeenCalled();
  });

  it('routes a password account with a confirmed missing profile to onboarding without seeding clinical records', async () => {
    service.getUserProfileState.mockResolvedValue({ state: 'missing', data: null });
    const user = userEvent.setup();
    const onAuthSuccess = vi.fn();
    render(<AuthFlow onAuthSuccess={onAuthSuccess} onOpenDemo={vi.fn()} />);

    await openPasswordLogin(user);
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), alexUser.email);
    await user.type(document.querySelector('input[type="password"]') as HTMLInputElement, 'Password1!');
    await user.click(screen.getByRole('button', { name: /Authorize Clinical Access/i }));

    expect(await screen.findByText('Onboarding Step 1 of 3')).toBeInTheDocument();
    expect(service.createUserProfile).not.toHaveBeenCalled();
    expect(service.saveWaterLog).not.toHaveBeenCalled();
    expect(service.saveEmergencyInfo).not.toHaveBeenCalled();
    expect(service.addMedication).not.toHaveBeenCalled();
    expect(onAuthSuccess).not.toHaveBeenCalled();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authApi = vi.hoisted(() => ({
  auth: { currentUser: null as any },
  configureAuthPersistence: vi.fn(),
  loginWithEmail: vi.fn(),
  loginWithGoogle: vi.fn(),
  registerWithEmail: vi.fn(),
  sendPasswordReset: vi.fn(),
  triggerEmailVerification: vi.fn(),
  updateUserDisplayNameAndPhoto: vi.fn(),
}));

const service = vi.hoisted(() => ({
  getUserProfile: vi.fn(),
  createUserProfile: vi.fn(),
  saveWaterLog: vi.fn(),
  saveEmergencyInfo: vi.fn(),
  addMedication: vi.fn(),
}));

vi.mock('../../firebase-init', () => authApi);
vi.mock('../../services/firebaseService', () => ({ firebaseService: service }));

import { AuthFlow } from '../../components/AuthFlow';

describe('AuthFlow patient data setup', () => {
  beforeEach(() => {
    localStorage.clear();
    authApi.configureAuthPersistence.mockReset().mockResolvedValue(undefined);
    authApi.loginWithEmail.mockReset().mockResolvedValue({
      uid: 'patient-1',
      email: 'patient@example.com',
      displayName: 'Patient One',
      photoURL: null,
    });
    service.getUserProfile.mockReset().mockResolvedValue(null);
    service.createUserProfile.mockReset();
    service.saveWaterLog.mockReset();
    service.saveEmergencyInfo.mockReset();
    service.addMedication.mockReset();
  });

  it('routes a signed-in account with no profile to onboarding without seeding clinical records', async () => {
    const user = userEvent.setup();
    const onAuthSuccess = vi.fn();
    render(<AuthFlow onAuthSuccess={onAuthSuccess} onOpenDemo={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Sign in to your account/i }));
    await screen.findByText('Account Sign In');
    await user.type(screen.getByRole('textbox'), 'patient@example.com');
    await user.type(document.querySelector('input[type="password"]') as HTMLInputElement, 'Password1!');
    await user.click(screen.getByRole('button', { name: /Authorize Clinical Access/i }));

    expect(await screen.findByText('Onboarding Step 1 of 3')).toBeInTheDocument();
    expect(service.createUserProfile).not.toHaveBeenCalled();
    expect(service.saveWaterLog).not.toHaveBeenCalled();
    expect(service.saveEmergencyInfo).not.toHaveBeenCalled();
    expect(service.addMedication).not.toHaveBeenCalled();
    expect(onAuthSuccess).not.toHaveBeenCalled();
  }, 15_000);
});

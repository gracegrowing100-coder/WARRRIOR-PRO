import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authApi = vi.hoisted(() => ({
  auth: { currentUser: { uid: 'patient-1', displayName: 'Patient One' } as any },
  logout: vi.fn(),
}));

const service = vi.hoisted(() => ({
  getUserProfile: vi.fn(),
  createUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
}));

vi.mock('../../firebase-init', () => authApi);
vi.mock('../../services/firebaseService', () => ({ firebaseService: service }));

import UserProfile from '../../components/UserProfile';

describe('UserProfile missing data', () => {
  beforeEach(() => {
    service.getUserProfile.mockReset().mockResolvedValue(null);
    service.createUserProfile.mockReset();
  });

  it('does not create a fabricated age or role when the profile is missing', async () => {
    render(<UserProfile onClose={vi.fn()} />);

    expect(await screen.findAllByText('Patient One')).not.toHaveLength(0);
    expect(service.createUserProfile).not.toHaveBeenCalled();
    expect(screen.queryByText(/Age 25|Warrior$/i)).not.toBeInTheDocument();
  });
});

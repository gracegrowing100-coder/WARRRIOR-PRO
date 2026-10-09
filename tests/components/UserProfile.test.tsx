import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  getUserProfile: vi.fn(),
  createUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
}));

vi.mock('../../firebase-init', () => ({
  auth: { currentUser: { uid: 'patient-1', displayName: 'Alex' } },
  logout: vi.fn(),
}));
vi.mock('../../services/firebaseService', () => ({ firebaseService: service }));

import UserProfile from '../../components/UserProfile';

const ProfileHarness = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open profile</button>
      {open && <UserProfile onClose={() => setOpen(false)} />}
    </>
  );
};

describe('UserProfile accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.getUserProfile.mockResolvedValue({
      displayName: 'Alex Akinwande',
      role: 'Warrior',
      age: 25,
    });
  });

  it('uses dialog semantics, labels icon controls, and restores focus after Escape', async () => {
    const user = userEvent.setup();
    render(<ProfileHarness />);

    const trigger = screen.getByRole('button', { name: 'Open profile' });
    await user.click(trigger);

    expect(screen.getByRole('dialog', { name: 'Warrior Profile' })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Close profile' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Close profile' })).toHaveClass('min-h-11', 'min-w-11');
    expect(screen.getByRole('button', { name: 'Change profile photo' })).toHaveClass('min-h-11', 'min-w-11');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Warrior Profile' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

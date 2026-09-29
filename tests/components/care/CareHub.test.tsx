import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../components/health', () => ({
  HealthHistory: ({ userId }: { userId: string }) => <div>Health history for {userId}</div>,
}));

vi.mock('../../../components/CareVault', () => ({
  CareVault: ({ userId }: { userId: string }) => <div>Care Vault for {userId}</div>,
}));

import { CareHub } from '../../../components/care';

describe('CareHub', () => {
  it('presents Health history, appointments, and medical records without changing primary navigation', async () => {
    const user = userEvent.setup();
    const onOpenAppointments = vi.fn();
    render(<CareHub userId="patient-1" onOpenAppointments={onOpenAppointments} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Care' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Review history: Health history/i })).toHaveClass('min-h-20');
    expect(screen.getByRole('button', { name: /Manage appointments: Appointments/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open records: Medical records/i })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Review history/i }));
    expect(screen.getByText('Health history for patient-1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to Care' }));
    await user.click(screen.getByRole('button', { name: /Manage appointments/i }));
    expect(onOpenAppointments).toHaveBeenCalledTimes(1);
  });

  it('keeps Care Vault separate from recorded Health history', async () => {
    const user = userEvent.setup();
    render(<CareHub userId="patient-1" onOpenAppointments={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Open records/i }));
    expect(screen.getByText('Care Vault for patient-1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to Care' }));
    expect(screen.getByRole('heading', { name: 'Care', level: 1 })).toBeInTheDocument();
  });
});


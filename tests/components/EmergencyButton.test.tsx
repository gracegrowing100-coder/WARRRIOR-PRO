import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  getEmergencyInfo: vi.fn(),
  saveEmergencyInfo: vi.fn(),
}));

vi.mock('../../services/firebaseService', () => ({ firebaseService: service }));

import { EmergencyButton } from '../../components/EmergencyButton';

describe('Emergency entry point', () => {
  beforeEach(() => {
    service.getEmergencyInfo.mockResolvedValue({
      bloodType: 'A+',
      genotype: 'SS',
      emergencyContactName: 'Dr. Test',
      emergencyContactPhone: '+2348000000001',
      primaryCaregiverName: 'Caregiver Test',
      primaryCaregiverPhone: '+2348000000002',
      allergies: 'None recorded',
      currentMeds: 'Hydroxyurea',
      customNotes: 'Use the verified care plan.',
    });
  });

  it('opens the responder information and exposes phone handoff links without claiming dispatch', async () => {
    const user = userEvent.setup();
    render(<EmergencyButton userId="patient-1" />);

    await user.click(screen.getByRole('button', { name: /Emergency HUD/i }));

    expect(await screen.findByText('Dr. Test')).toBeInTheDocument();
    expect(screen.getByText('Caregiver Test')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dr. Test/i })).toHaveAttribute('href', 'tel:+2348000000001');
    expect(screen.getByRole('link', { name: /Caregiver Test/i })).toHaveAttribute('href', 'tel:+2348000000002');
    expect(screen.queryByText(/dispatched|message sent/i)).not.toBeInTheDocument();
  });
});

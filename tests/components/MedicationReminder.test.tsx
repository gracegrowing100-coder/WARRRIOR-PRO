import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  getMedications: vi.fn(),
  addMedication: vi.fn(),
  updateMedication: vi.fn(),
  deleteMedication: vi.fn(),
}));

vi.mock('../../services/firebaseService', () => ({ firebaseService: service }));

import { MedicationReminder } from '../../components/MedicationReminder';

describe('MedicationReminder patient data', () => {
  beforeEach(() => {
    service.getMedications.mockReset().mockResolvedValue([]);
    service.addMedication.mockReset();
  });

  it('keeps a new account medication list empty without creating sample prescriptions', async () => {
    render(<MedicationReminder userId="patient-1" />);

    expect(await screen.findByText('No meds listed')).toBeInTheDocument();
    expect(service.getMedications).toHaveBeenCalledWith('patient-1');
    expect(service.addMedication).not.toHaveBeenCalled();
    expect(screen.queryByText(/Folic Acid \(Daily\)|500mg daily/i)).not.toBeInTheDocument();
  });
});

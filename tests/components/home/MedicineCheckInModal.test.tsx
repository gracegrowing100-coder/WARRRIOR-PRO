import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  addMedication: vi.fn(),
  updateMedication: vi.fn(),
  deleteMedication: vi.fn(),
  updateStreak: vi.fn(),
}));

vi.mock('../../../services/firebaseService', () => ({ firebaseService: service }));

import { MedicineCheckInModal, type MedicationSummary } from '../../../components/home/MedicineCheckInModal';

const today = new Date().toLocaleDateString('sv');

const Harness = ({ initial }: { initial: MedicationSummary[] }) => {
  const [meds, setMeds] = useState(initial);
  return <MedicineCheckInModal open onOpenChange={vi.fn()} userId="user-1" medications={meds} onMedicationsChange={setMeds} />;
};

describe('MedicineCheckInModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.updateMedication.mockResolvedValue({ state: 'recorded' });
    service.updateStreak.mockResolvedValue(1);
    service.deleteMedication.mockResolvedValue({ state: 'recorded' });
    service.addMedication.mockImplementation(async (_uid: string, data: MedicationSummary) => ({ state: 'recorded', data: { id: 'new-id', ...data } }));
  });

  it('shows progress and moves a medicine to Taken today when ticked', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[
      { id: 'a', name: 'Folic Acid', dosage: '5mg', time: '08:00', lastTakenDate: '' },
      { id: 'b', name: 'Hydroxyurea', dosage: '500mg', time: '20:00', lastTakenDate: today },
    ]} />);

    expect(screen.getByText('1 of 2 taken today')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Folic Acid 5mg at 08:00: tap to mark taken/ }));

    expect(service.updateMedication).toHaveBeenCalledWith('user-1', 'a', { lastTakenDate: today });
    expect(await screen.findByText('All done for today')).toBeInTheDocument();
  });

  it('fills the form from a preset without saving, and needs the prescribed dose', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[]} />);

    await user.click(screen.getByRole('button', { name: /Proguanil/ }));
    expect(service.addMedication).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Medicine')).toHaveValue('Proguanil');
    expect(screen.getByLabelText('Dose')).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Add medicine' })).toBeDisabled();

    await user.type(screen.getByLabelText('Dose'), '100mg');
    await user.click(screen.getByRole('button', { name: 'Add medicine' }));

    expect(service.addMedication).toHaveBeenCalledWith('user-1', expect.objectContaining({ name: 'Proguanil', dosage: '100mg', time: '08:00' }));
    expect(await screen.findByText('Proguanil added for 08:00 each day.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Proguanil.*already on your list/ })).toBeDisabled();
  });

  it('refuses an identical medicine instead of saving a duplicate', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[{ id: 'a', name: 'Tetracycline', dosage: '2 capsules', time: '08:00', lastTakenDate: '' }]} />);

    await user.type(screen.getByLabelText('Medicine'), 'tetracycline');
    await user.type(screen.getByLabelText('Dose'), '2 capsules');
    await user.click(screen.getByRole('button', { name: 'Add medicine' }));

    expect(service.addMedication).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('already on your list');
  });

  it('shows a clear error and keeps the entry when saving fails', async () => {
    const user = userEvent.setup();
    service.addMedication.mockRejectedValueOnce(new Error('permission-denied'));
    render(<Harness initial={[]} />);

    await user.type(screen.getByLabelText('Medicine'), 'Tetracycline');
    await user.type(screen.getByLabelText('Dose'), '2 capsules');
    await user.click(screen.getByRole('button', { name: 'Add medicine' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Tetracycline wasn't saved");
    expect(screen.getByLabelText('Medicine')).toHaveValue('Tetracycline');
  });

  it('removes extra identical copies only after an in-app confirmation, keeping the taken one', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[
      { id: 'a', name: 'Hydroxyurea', dosage: '500mg', time: '08:00', lastTakenDate: '' },
      { id: 'b', name: 'Hydroxyurea', dosage: '500mg', time: '08:00', lastTakenDate: today },
      { id: 'c', name: 'Hydroxyurea', dosage: '500mg', time: '08:00', lastTakenDate: '' },
    ]} />);

    await user.click(screen.getByRole('button', { name: 'Remove extra copies' }));
    expect(service.deleteMedication).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Remove 2' }));

    await waitFor(() => expect(service.deleteMedication).toHaveBeenCalledTimes(2));
    expect(service.deleteMedication).not.toHaveBeenCalledWith('user-1', 'b');
    expect(await screen.findByText('Removed 2 extra copies.')).toBeInTheDocument();
    expect(screen.getByText('All done for today')).toBeInTheDocument();
  });
});

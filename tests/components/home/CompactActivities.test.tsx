import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  getDailyMoodCheckIn: vi.fn(), saveDailyMoodCheckIn: vi.fn(),
  getWaterLog: vi.fn(), getWaterLogs7Days: vi.fn(), saveWaterLog: vi.fn(),
  getMedications: vi.fn(), updateMedication: vi.fn(), updateStreak: vi.fn(),
  addMedication: vi.fn(), deleteMedication: vi.fn(),
}));
vi.mock('../../../services/firebaseService', () => ({ firebaseService: service }));
import { DailyMoodCheckIn } from '../../../components/DailyMoodCheckIn';
import { WaterIntakeTracker } from '../../../components/WaterIntakeTracker';
import { MedicationReminder } from '../../../components/MedicationReminder';

describe('Compact Home activities preserve their workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.getDailyMoodCheckIn.mockResolvedValue(null);
    service.saveDailyMoodCheckIn.mockImplementation(async (_uid, _day, entry) => entry);
    service.getWaterLog.mockResolvedValue({ amount: 1, goal: 3 });
    service.getWaterLogs7Days.mockResolvedValue([]);
    service.saveWaterLog.mockResolvedValue(undefined);
    service.updateMedication.mockResolvedValue(undefined);
    service.updateStreak.mockResolvedValue(1);
    service.getMedications.mockResolvedValue(Array.from({length: 4}, (_, i) => ({id: `med-${i}`, name: `Medication ${i}`, dosage: '5mg', time: i === 3 ? '12:00' : '08:00', frequency: 'Once Daily', lastTakenDate: ''})));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('retains one-tap save and edit with the existing mood payload', async () => {
    const onSaved = vi.fn();
    render(<DailyMoodCheckIn compact userId="test-patient" onCheckInSaved={onSaved} />);
    await userEvent.click(screen.getByRole('button', {name: 'Good & Steady'}));
    await waitFor(() => expect(service.saveDailyMoodCheckIn).toHaveBeenCalledWith('test-patient', new Date().toLocaleDateString('sv'), expect.objectContaining({emoji: '😊', emotion: 'Good & Steady', score: 8, note: ''})));
    expect(onSaved).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', {name: 'Edit Check-In'}));
    await userEvent.click(screen.getByRole('button', {name: 'Calm & Restful'}));
    expect(service.saveDailyMoodCheckIn).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', {name: 'Save Check-In (Calm & Restful)'}));
    expect(service.saveDailyMoodCheckIn).toHaveBeenLastCalledWith('test-patient', expect.any(String), expect.objectContaining({emotion: 'Calm & Restful', score: 7.5}));
  });

  it('uses the same hydration date, amount, goal, and reset contract', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<WaterIntakeTracker compact userId="test-patient" />);
    await screen.findByText('1.00 L of 3.00 L');
    await userEvent.click(screen.getByRole('button', {name: '+250ml'}));
    expect(service.saveWaterLog).toHaveBeenCalledWith('test-patient', new Date().toLocaleDateString('sv'), 1.25, 3);
    await userEvent.click(screen.getByRole('button', {name: 'Reset hydration logs'}));
    expect(service.saveWaterLog).toHaveBeenLastCalledWith('test-patient', expect.any(String), 0, 3);
    confirm.mockRestore();
  });

  it('keeps full-list actions accessible and uses the existing taken update', async () => {
    render(<MedicationReminder compact userId="test-patient" />);
    await screen.findByRole('button', {name: 'View full schedule (4)'});
    expect(screen.queryByRole('button', {name: /Mark Medication 3/})).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', {name: 'View full schedule (4)'}));
    await userEvent.click(screen.getByRole('button', {name: 'Mark Medication 3 5mg at 12:00 as taken'}));
    expect(service.updateMedication).toHaveBeenCalledWith('test-patient', 'med-3', {lastTakenDate: new Date().toLocaleDateString('sv')});
    expect(screen.getByRole('button', {name: 'Delete Medication 3 5mg at 12:00'})).toBeInTheDocument();
  });

  it('still schedules notifications for medication outside the compact preview', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 26, 12, 0, 0));
    const notification = vi.fn();
    class TestNotification { static permission = 'granted'; constructor(title: string) { notification(title); } }
    vi.stubGlobal('Notification', TestNotification);
    await act(async () => { render(<MedicationReminder compact userId="test-patient" />); });
    expect(screen.queryByRole('button', {name: /Mark Medication 3/})).not.toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(15000); });
    expect(notification).toHaveBeenCalledWith('🚨 MEDICATION DUE: Medication 3');
    fireEvent.click(screen.getByRole('button', {name: 'View full schedule (4)'}));
    fireEvent.click(screen.getByRole('button', {name: 'Show daily summary'}));
    expect(service.getMedications).toHaveBeenCalledTimes(1);
  });

  it('retains medication create and confirmed delete through the full schedule', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    service.addMedication.mockResolvedValue({ id: 'new-med' });
    service.deleteMedication.mockResolvedValue(undefined);
    render(<MedicationReminder compact userId="test-patient" />);
    await userEvent.click(await screen.findByRole('button', {name: 'View full schedule (4)'}));
    await userEvent.click(screen.getByRole('button', {name: 'Add medication'}));
    await userEvent.type(screen.getByLabelText('Medication Name'), 'Test medication');
    await userEvent.type(screen.getByLabelText('Dosage'), '10mg');
    await userEvent.click(screen.getByRole('button', {name: 'Save Schedule'}));
    expect(service.addMedication).toHaveBeenCalledWith('test-patient', { name: 'Test medication', dosage: '10mg', time: '08:00', frequency: 'Once Daily', lastTakenDate: '' });
    await userEvent.click(await screen.findByRole('button', {name: 'Delete Medication 0 5mg at 08:00'}));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(service.deleteMedication).toHaveBeenCalledWith('test-patient', 'med-0');
    confirm.mockRestore();
  });
});

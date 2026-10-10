import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  getDailyMoodCheckIn: vi.fn(),
  getPainLogs: vi.fn(),
  getWaterLog: vi.fn(),
  getMedications: vi.fn(),
}));

vi.mock('../../../services/firebaseService', () => ({ firebaseService: service }));

import { TodaysHealthCard } from '../../../components/home/TodaysHealthCard';

describe('TodaysHealthCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.getDailyMoodCheckIn.mockResolvedValue({ emotion: 'Okay' });
    service.getPainLogs.mockResolvedValue([]);
    service.getWaterLog.mockResolvedValue({ state: 'missing', data: null });
    service.getMedications.mockResolvedValue([]);
  });

  it('shows only factual values from today’s persisted records', async () => {
    const today = new Date().toLocaleDateString('sv');
    service.getPainLogs.mockResolvedValue([{ dateStr: today, painLevel: 4 }]);
    service.getWaterLog.mockResolvedValue({ state: 'recorded', data: { amount: 1.5, goal: 3 } });
    service.getMedications.mockResolvedValue([{ id: 'med-1', name: 'Patient medication', time: '14:00', lastTakenDate: '' }]);

    render(<TodaysHealthCard userId="patient-1" />);

    expect(await screen.findByText('Check-in recorded')).toBeInTheDocument();
    expect(screen.getByText('4 / 10')).toBeInTheDocument();
    expect(screen.getByText('1.50 L of 3.00 L')).toBeInTheDocument();
    expect(screen.getByText('Patient medication · 14:00')).toBeInTheDocument();
    expect(screen.queryByText(/stable|healthy|good condition/i)).not.toBeInTheDocument();
  });

  it('supports loading and an honest empty state', async () => {
    let resolveCheckIn: (value: null) => void = () => undefined;
    service.getDailyMoodCheckIn.mockReturnValue(new Promise<null>((resolve) => { resolveCheckIn = resolve; }));

    const { container } = render(<TodaysHealthCard userId="patient-1" />);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);

    resolveCheckIn(null);
    expect(await screen.findAllByText('Not recorded')).toHaveLength(2);
    expect(screen.getByText('No medication scheduled')).toBeInTheDocument();
    expect(screen.queryByText(/0\.00 L/i)).not.toBeInTheDocument();
  });

  it('guides a patient with no records into the existing daily check-in', async () => {
    const onStartCheckIn = vi.fn();
    service.getDailyMoodCheckIn.mockResolvedValue(null);

    render(<TodaysHealthCard userId="patient-1" onStartCheckIn={onStartCheckIn} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Start daily check-in' }));
    expect(onStartCheckIn).toHaveBeenCalledTimes(1);
  });

  it('never renders Stitch sample records or unsupported clinical claims', async () => {
    service.getDailyMoodCheckIn.mockResolvedValue(null);

    render(<TodaysHealthCard userId="patient-1" />);

    await screen.findByText('No medication scheduled');
    expect(document.body).not.toHaveTextContent(/Hydroxocobalamin|Dr\. Adebayo|7\.8 g\/dL|Cohort 4B/i);
    expect(document.body).not.toHaveTextContent(/Vaso-occlusion Risk Guard|No Crisis Escalation Detected|AI triage|42%/i);
  });

  it('shows a recoverable unavailable state when a getter rejects', async () => {
    service.getDailyMoodCheckIn.mockRejectedValue(new Error('offline read failed'));

    render(<TodaysHealthCard userId="patient-1" />);

    expect(await screen.findByText('Today’s summary is unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    await waitFor(() => expect(service.getDailyMoodCheckIn).toHaveBeenCalledTimes(1));
  });
});

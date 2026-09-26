import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  getDailyMoodCheckIn: vi.fn(),
  getPainLogs: vi.fn(),
  getWaterLog: vi.fn(),
}));

vi.mock('../../../services/firebaseService', () => ({ firebaseService: service }));

import { TodaysHealthCard } from '../../../components/home/TodaysHealthCard';

describe('TodaysHealthCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.getDailyMoodCheckIn.mockResolvedValue({ emotion: 'Okay' });
    service.getPainLogs.mockResolvedValue([]);
    service.getWaterLog.mockResolvedValue({ amount: 0, goal: 3 });
  });

  it('shows only factual values from today’s persisted records', async () => {
    const today = new Date().toLocaleDateString('sv');
    service.getPainLogs.mockResolvedValue([{ dateStr: today, painLevel: 4 }]);
    service.getWaterLog.mockResolvedValue({ amount: 1.5, goal: 3 });

    render(<TodaysHealthCard userId="patient-1" />);

    expect(await screen.findByText('Check-in recorded')).toBeInTheDocument();
    expect(screen.getByText('4 / 10')).toBeInTheDocument();
    expect(screen.getByText('1.50 L of 3.00 L')).toBeInTheDocument();
    expect(screen.queryByText(/stable|healthy|good condition/i)).not.toBeInTheDocument();
  });

  it('supports loading and an honest empty state', async () => {
    let resolveCheckIn: (value: null) => void = () => undefined;
    service.getDailyMoodCheckIn.mockReturnValue(new Promise<null>((resolve) => { resolveCheckIn = resolve; }));

    const { container } = render(<TodaysHealthCard userId="patient-1" />);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);

    resolveCheckIn(null);
    expect(await screen.findByText(/Nothing has been recorded for today yet/i)).toBeInTheDocument();
  });

  it('shows a recoverable unavailable state when a getter rejects', async () => {
    service.getDailyMoodCheckIn.mockRejectedValue(new Error('offline read failed'));

    render(<TodaysHealthCard userId="patient-1" />);

    expect(await screen.findByText('Today’s summary is unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    await waitFor(() => expect(service.getDailyMoodCheckIn).toHaveBeenCalledTimes(1));
  });
});

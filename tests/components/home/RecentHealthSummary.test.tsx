import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  getDailyMoodCheckIn: vi.fn(),
  getPainLogs: vi.fn(),
  getWaterLog: vi.fn(),
}));

vi.mock('../../../services/firebaseService', () => ({ firebaseService: service }));

import { RecentHealthSummary } from '../../../components/home/RecentHealthSummary';

describe('RecentHealthSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.getDailyMoodCheckIn.mockResolvedValue(null);
    service.getWaterLog.mockResolvedValue({ state: 'missing', data: null });
    service.getPainLogs.mockResolvedValue([]);
  });

  it('counts only actual persisted entries and ignores pain outside seven days', async () => {
    const today = new Date().toLocaleDateString('sv');
    service.getDailyMoodCheckIn.mockImplementation(async (_userId: string, date: string) => date === today ? { emotion: 'Okay' } : null);
    service.getWaterLog.mockImplementation(async (_userId: string, date: string) => date === today
      ? { state: 'recorded', data: { amount: 1.25, goal: 3 } }
      : { state: 'missing', data: null });
    service.getPainLogs.mockResolvedValue([
      { dateStr: today, painLevel: 3 },
      { dateStr: '2020-01-01', painLevel: 9 },
    ]);

    render(<RecentHealthSummary userId="patient-1" />);

    expect(await screen.findAllByText('Recorded on 1 day', { selector: 'dd' })).toHaveLength(2);
    expect(screen.getByText('1 recorded · latest 3 / 10', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.queryByText('9 / 10')).not.toBeInTheDocument();
  });

  it('does not invent a trend when no records exist', async () => {
    render(<RecentHealthSummary userId="patient-1" />);

    expect(await screen.findByText('No recent health activity')).toBeInTheDocument();
    expect(screen.getByText(/Check-ins, hydration, and pain entries from the last seven days/i)).toBeInTheDocument();
    expect(screen.queryByText(/improved|declined|stable/i)).not.toBeInTheDocument();
  });
});

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
    service.getWaterLog.mockResolvedValue({ amount: 0, goal: 3 });
    service.getPainLogs.mockResolvedValue([]);
  });

  it('counts only actual persisted entries and ignores pain outside seven days', async () => {
    const today = new Date().toLocaleDateString('sv');
    service.getDailyMoodCheckIn.mockImplementation(async (_userId: string, date: string) => date === today ? { emotion: 'Okay' } : null);
    service.getWaterLog.mockImplementation(async (_userId: string, date: string) => ({ amount: date === today ? 1.25 : 0, goal: 3 }));
    service.getPainLogs.mockResolvedValue([
      { dateStr: today, painLevel: 3 },
      { dateStr: '2020-01-01', painLevel: 9 },
    ]);

    render(<RecentHealthSummary userId="patient-1" />);

    expect(await screen.findAllByText('1 days', { selector: 'dd' })).toHaveLength(2);
    expect(screen.getByText('1', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByText('Latest recorded: 3 / 10')).toBeInTheDocument();
    expect(screen.queryByText('9 / 10')).not.toBeInTheDocument();
  });

  it('does not invent a trend when no records exist', async () => {
    render(<RecentHealthSummary userId="patient-1" />);

    expect(await screen.findByText(/No check-ins, hydration amounts, or pain entries/i)).toBeInTheDocument();
    expect(screen.queryByText(/improved|declined|stable/i)).not.toBeInTheDocument();
  });
});

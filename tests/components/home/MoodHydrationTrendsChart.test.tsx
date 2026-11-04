import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../../services/firebaseService', () => ({
  firebaseService: {
    getMoodAndHydrationTrends7Days: vi.fn().mockResolvedValue([
      { dateStr: '2026-11-04', dayLabel: 'Wed', displayDate: '11/4', waterAmount: 2.5, waterGoal: 3.0, moodScore: 8.0, hasMoodLogged: true, moodEmoji: '😊', moodLabel: 'Good' },
      { dateStr: '2026-11-03', dayLabel: 'Tue', displayDate: '11/3', waterAmount: 3.0, waterGoal: 3.0, moodScore: 9.0, hasMoodLogged: true, moodEmoji: '🌟', moodLabel: 'Thriving' },
    ]),
  },
}));

import { MoodHydrationTrendsChart } from '../../../components/MoodHydrationTrendsChart';

describe('MoodHydrationTrendsChart', () => {
  it('renders header, stats, and trend observation', async () => {
    render(<MoodHydrationTrendsChart userId="test-user" />);
    expect(await screen.findByText('7-Day Mood & Hydration Trends')).toBeInTheDocument();
    expect(screen.getByText('Daily fluid intake and wellness check-in patterns')).toBeInTheDocument();
    expect(screen.getByText('Hydration Days')).toBeInTheDocument();
    expect(screen.getByText('Avg Fluid')).toBeInTheDocument();
    expect(screen.getByText('Check-ins')).toBeInTheDocument();
  });
});


import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  addSymptomLog: vi.fn(),
  getUserProfile: vi.fn(),
  updateStreak: vi.fn(),
}));

vi.mock('../../firebase-init', () => ({
  auth: { currentUser: { uid: 'patient-1', displayName: 'Fallback Name' } },
}));
vi.mock('../../services/firebaseService', () => ({ firebaseService: service }));

vi.mock('../../components/WaterIntakeTracker', () => ({ WaterIntakeTracker: ({ userId }: { userId: string }) => `Hydration for ${userId}` }));
vi.mock('../../components/MedicationReminder', () => ({ MedicationReminder: ({ userId }: { userId: string }) => `Medication for ${userId}` }));
vi.mock('../../components/PainTrendsChart', () => ({ PainTrendsChart: ({ userId }: { userId: string }) => `Pain trends for ${userId}` }));
vi.mock('../../components/CareVault', () => ({ CareVault: ({ userId }: { userId: string }) => `Care Vault for ${userId}` }));
vi.mock('../../components/DesignatedCaregiverWidget', () => ({ DesignatedCaregiverWidget: () => <div>Caregiver widget</div> }));
vi.mock('../../components/HealthTipsWisdom', () => ({ HealthTipsWisdom: () => <div>Health guidance</div> }));
vi.mock('../../components/DailyMoodCheckIn', () => ({ DailyMoodCheckIn: ({ userId }: { userId: string }) => `Daily mood for ${userId}` }));
vi.mock('../../components/MoodHydrationTrendsChart', () => ({ MoodHydrationTrendsChart: ({ userId }: { userId: string }) => `Mood hydration trends for ${userId}` }));
vi.mock('../../components/ScheduledRemindersManager', () => ({ ScheduledRemindersManager: ({ userId }: { userId: string }) => `Reminders for ${userId}` }));
vi.mock('../../components/PatternInsightsDoctorReport', () => ({ PatternInsightsDoctorReport: ({ userId }: { userId: string }) => `Pattern report for ${userId}` }));

import Dashboard from '../../components/Dashboard';

describe('Patient Home critical rendering', () => {
  beforeEach(() => {
    service.updateStreak.mockResolvedValue(4);
    service.getUserProfile.mockResolvedValue({
      displayName: 'Tayo',
      role: 'Warrior',
      xp: 75,
    });
  });

  it('renders the current profile summary and critical health modules', async () => {
    render(<Dashboard userId="patient-1" onNavigate={vi.fn()} />);

    expect(await screen.findByText('Tayo')).toBeInTheDocument();
    expect(document.body).toHaveTextContent('Hydration for patient-1');
    expect(document.body).toHaveTextContent('Medication for patient-1');
    expect(document.body).toHaveTextContent('Daily mood for patient-1');
    expect(document.body).toHaveTextContent('Care Vault for patient-1');
    expect(screen.getByRole('button', { name: /Log Symptoms/i })).toBeInTheDocument();
  });
});

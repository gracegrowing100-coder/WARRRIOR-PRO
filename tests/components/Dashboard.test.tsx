import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  addSymptomLog: vi.fn(),
  getWaterLog: vi.fn(),
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
vi.mock('../../components/DesignatedCaregiverWidget', () => ({ DesignatedCaregiverWidget: () => <div>Caregiver widget</div> }));
vi.mock('../../components/HealthTipsWisdom', () => ({ HealthTipsWisdom: () => <div>Health guidance</div> }));
vi.mock('../../components/DailyMoodCheckIn', () => ({ DailyMoodCheckIn: ({ userId }: { userId: string }) => `Daily mood for ${userId}` }));
vi.mock('../../components/MoodHydrationTrendsChart', () => ({ MoodHydrationTrendsChart: ({ userId }: { userId: string }) => `Mood hydration trends for ${userId}` }));
vi.mock('../../components/ScheduledRemindersManager', () => ({ ScheduledRemindersManager: ({ userId }: { userId: string }) => `Reminders for ${userId}` }));
vi.mock('../../components/PatternInsightsDoctorReport', () => ({ PatternInsightsDoctorReport: ({ userId }: { userId: string }) => `Pattern report for ${userId}` }));
vi.mock('../../components/home', () => ({
  TodaysHealthCard: ({ onLogPain, onOpenHydration }: { onLogPain?: () => void; onOpenHydration?: () => void }) => (
    <section data-testid="todays-health">
      Today&apos;s Health
      <button onClick={onLogPain}>Log symptoms and pain</button>
      <button onClick={onOpenHydration}>Add water</button>
    </section>
  ),
  RecentHealthSummary: () => <section data-testid="recent-health">Recent health summary</section>,
  UpcomingAppointmentCard: ({ onOpenCare }: { onOpenCare: () => void }) => <button data-testid="appointment" onClick={onOpenCare}>Appointment</button>,
}));

import Dashboard from '../../components/Dashboard';

describe('Patient Home critical rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks(); vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network disabled in tests')));
    service.addSymptomLog.mockResolvedValue(undefined);
    service.getWaterLog.mockResolvedValue({ state: 'recorded', data: { amount: 1, goal: 3 } });
    service.updateStreak.mockResolvedValue(4);
    service.getUserProfile.mockResolvedValue({
      displayName: 'Tayo',
      role: 'Warrior',
      xp: 75,
    });
  });

  it('renders the compact Home Hub and opens full-page tools with Back to Home navigation', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const { container } = render(<Dashboard userId="patient-1" onNavigate={onNavigate} />);

    expect(await screen.findByRole('heading', { name: /Good (morning|afternoon|evening), Tayo/ })).toBeInTheDocument();
    expect(screen.getByTestId('todays-health')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Health tools & records' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Need urgent help?' })).toBeInTheDocument();

    // Heavy tools stay unmounted on Home until tapped
    expect(document.body).not.toHaveTextContent('Pattern report for patient-1');
    expect(document.body).not.toHaveTextContent('Pain trends for patient-1');

    // Open the full hydration page from Today's Health and return Home
    await user.click(screen.getByRole('button', { name: 'Add water' }));
    expect(container.querySelector('#water-intake-tracker-module')).toBeInTheDocument();
    expect(document.body).toHaveTextContent('Hydration for patient-1');
    await user.click(screen.getByRole('button', { name: /Back to Home/i }));
    expect(screen.getByRole('heading', { name: 'Health tools & records' })).toBeInTheDocument();

    // Open Pain & Trends full page and return Home
    await user.click(screen.getByRole('button', { name: /Pain & Trends/i }));
    expect(container.querySelector('#pain-trends-chart-card')).toBeInTheDocument();
    expect(document.body).toHaveTextContent('Pain trends for patient-1');
    await user.click(screen.getByRole('button', { name: /Back to Home/i }));

    // Medical records live in one place: the tile opens Care > Medical records
    await user.click(screen.getByRole('button', { name: /Medical records/i }));
    expect(onNavigate).toHaveBeenCalledWith('care', 'records');

    // Open Doctor Report full page
    await user.click(screen.getByRole('button', { name: /Doctor Report/i }));
    expect(document.body).toHaveTextContent('Pattern report for patient-1');
  });

  it('preserves the symptom save contract', async () => {
    const user = userEvent.setup();
    render(<Dashboard userId="patient-1" onNavigate={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Log symptoms and pain/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save health entry' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Save health entry' }));

    await waitFor(() => {
      expect(service.addSymptomLog).toHaveBeenCalledWith(
        'patient-1',
        3,
        [],
        [],
        1,
        new Date().toLocaleDateString('sv'),
      );
    });
  });

  it('opens an accessible top-layer symptom dialog and restores focus on Escape', async () => {
    const user = userEvent.setup();
    render(<Dashboard userId="patient-1" onNavigate={vi.fn()} />);

    const trigger = screen.getByRole('button', { name: /Log symptoms and pain/i });
    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Log symptoms and pain' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription(/Record how you feel today/i);
    expect(screen.getByRole('slider', { name: 'Pain score' })).toHaveFocus();
    expect(dialog.parentElement).toHaveClass('z-[200]');
    expect(screen.getByRole('button', { name: 'Close symptom and pain log' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save health entry' })).toBeVisible();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Log symptoms and pain' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('uses existing Care and emergency entry points', async () => {
    const onNavigate = vi.fn();
    const emergency = document.createElement('button');
    emergency.id = 'emergency-fab';
    const emergencyClick = vi.fn();
    emergency.addEventListener('click', emergencyClick);
    document.body.appendChild(emergency);

    render(<Dashboard userId="patient-1" onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole('button', { name: /Appointments/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Get help' }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith('care');
    expect(emergencyClick).toHaveBeenCalledTimes(1);
    emergency.remove();
  });
});

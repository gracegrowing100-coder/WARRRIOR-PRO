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
vi.mock('../../components/CareVault', () => ({ CareVault: ({ userId }: { userId: string }) => `Care Vault for ${userId}` }));
vi.mock('../../components/DesignatedCaregiverWidget', () => ({ DesignatedCaregiverWidget: () => <div>Caregiver widget</div> }));
vi.mock('../../components/HealthTipsWisdom', () => ({ HealthTipsWisdom: () => <div>Health guidance</div> }));
vi.mock('../../components/DailyMoodCheckIn', () => ({ DailyMoodCheckIn: ({ userId }: { userId: string }) => `Daily mood for ${userId}` }));
vi.mock('../../components/MoodHydrationTrendsChart', () => ({ MoodHydrationTrendsChart: ({ userId }: { userId: string }) => `Mood hydration trends for ${userId}` }));
vi.mock('../../components/ScheduledRemindersManager', () => ({ ScheduledRemindersManager: ({ userId }: { userId: string }) => `Reminders for ${userId}` }));
vi.mock('../../components/PatternInsightsDoctorReport', () => ({ PatternInsightsDoctorReport: ({ userId }: { userId: string }) => `Pattern report for ${userId}` }));
vi.mock('../../components/home', () => ({
  HomeActionHub: ({ onLogHealth, onOpenMira, onOpenCare }: { onLogHealth: () => void; onOpenMira: () => void; onOpenCare: () => void }) => (
    <section>
      <h2>Record how you feel</h2>
      <button onClick={onLogHealth}>Log symptoms and pain</button>
      <button onClick={onOpenMira}>Ask Mira</button>
      <button onClick={onOpenCare}>Open Care</button>
    </section>
  ),
  TodaysHealthCard: () => <section data-testid="todays-health">Today&apos;s Health</section>,
  RecentHealthSummary: () => <section data-testid="recent-health">Recent health summary</section>,
  UpcomingAppointmentCard: ({ onOpenCare }: { onOpenCare: () => void }) => <button data-testid="appointment" onClick={onOpenCare}>Appointment</button>,
}));

import Dashboard from '../../components/Dashboard';

describe('Patient Home critical rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.addSymptomLog.mockResolvedValue(undefined);
    service.getWaterLog.mockResolvedValue({ state: 'recorded', data: { amount: 1, goal: 3 } });
    service.updateStreak.mockResolvedValue(4);
    service.getUserProfile.mockResolvedValue({
      displayName: 'Tayo',
      role: 'Warrior',
      xp: 75,
    });
  });

  it('renders the target Home hierarchy and retains compatibility tools', async () => {
    const { container } = render(<Dashboard userId="patient-1" onNavigate={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: /Good (morning|afternoon|evening), Tayo/ })).toBeInTheDocument();
    expect(document.body).toHaveTextContent('Hydration for patient-1');
    expect(document.body).toHaveTextContent('Medication for patient-1');
    expect(document.body).toHaveTextContent('Daily mood for patient-1');
    expect(document.body).not.toHaveTextContent('Care Vault for patient-1');
    expect(document.body).not.toHaveTextContent('Pattern report for patient-1');
    expect(screen.getByRole('button', { name: /Log symptoms and pain/i })).toBeInTheDocument();
    expect(screen.getByText('More health tools')).toBeInTheDocument();
    expect(container.querySelectorAll('details')).toHaveLength(8);
    container.querySelectorAll('details').forEach(details => expect(details.open).toBe(false));
    expect(container.querySelector('#water-intake-tracker-module')).toBeInTheDocument();
    expect(container.querySelector('#medication-reminder-card')).toBeInTheDocument();
    await userEvent.click(screen.getByText('More health tools'));
    await userEvent.click(screen.getByText('Pain trends'));
    expect(container.querySelector('#pain-trends-chart-card')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Care Vault'));
    expect(container.querySelector('#care-vault-section')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Generated reports'));
    expect(document.body).toHaveTextContent('Pattern report for patient-1');

    const ordered = [
      screen.getByRole('heading', { name: /Good (morning|afternoon|evening)/i }),
      screen.getByTestId('todays-health'),
      screen.getByText('Daily mood for patient-1'),
      screen.getByRole('heading', { name: 'Record how you feel' }),
      container.querySelector('#water-intake-tracker-module') as HTMLElement,
      container.querySelector('#medication-reminder-card') as HTMLElement,
      screen.getByTestId('recent-health'),
      screen.getByTestId('appointment'),
      screen.getByRole('heading', { name: 'Need urgent help?' }),
    ];
    ordered.slice(1).forEach((element, index) => {
      expect(ordered[index].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
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
    await userEvent.click(screen.getByTestId('appointment'));
    await userEvent.click(screen.getByRole('button', { name: 'Ask Mira' }));
    await userEvent.click(screen.getByRole('button', { name: 'Open Care' }));
    await userEvent.click(screen.getByRole('button', { name: 'Get help' }));

    expect(onNavigate).toHaveBeenNthCalledWith(1, 'care');
    expect(onNavigate).toHaveBeenNthCalledWith(2, 'chat');
    expect(onNavigate).toHaveBeenNthCalledWith(3, 'care');
    expect(emergencyClick).toHaveBeenCalledTimes(1);
    emergency.remove();
  });
});

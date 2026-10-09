import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  getSymptomHistory: vi.fn(),
  getHydrationHistory: vi.fn(),
  getDailyCheckInHistory: vi.fn(),
}));

vi.mock('../../../services/firebaseService', () => ({ firebaseService: service }));

import { HealthHistory } from '../../../components/health/HealthHistory';

const symptomMissing = { state: 'missing', data: [] };

const overviewValue = (label: string) => {
  return screen.getByRole('tab', { name: new RegExp(label, 'i') });
};

describe('HealthHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.getSymptomHistory.mockResolvedValue(symptomMissing);
    service.getHydrationHistory.mockResolvedValue([]);
    service.getDailyCheckInHistory.mockResolvedValue([]);
  });

  it('renders a recorded pain score of zero as a genuine entry and deduplicates the same day', async () => {
    service.getSymptomHistory.mockResolvedValue({
      state: 'recorded',
      data: [
        { id: 'old', userId: 'patient-1', dateStr: '2026-09-25', painLevel: 4, symptoms: ['Fatigue'], triggers: [], waterIntake: 1 },
        { id: 'new', userId: 'patient-1', dateStr: '2026-09-25', painLevel: 0, symptoms: [], triggers: [], waterIntake: 0 },
      ],
    });

    render(<HealthHistory userId="patient-1" />);

    expect(await screen.findByText('Pain: 0 / 10')).toBeInTheDocument();
    expect(screen.getByText('1 recorded entry')).toBeInTheDocument();
    expect(screen.queryByText('Pain: 4 / 10')).not.toBeInTheDocument();
    expect(screen.getByText('0.00 L')).toBeInTheDocument();
  });

  it('keeps missing hydration separate from a recorded zero amount', async () => {
    service.getHydrationHistory.mockResolvedValue([
      { dateStr: '2026-09-25', state: 'recorded', data: { amount: 0, goal: 3 } },
      { dateStr: '2026-09-24', state: 'missing', data: null },
    ]);

    render(<HealthHistory userId="patient-1" />);

    expect(await screen.findByText('0.00 L recorded')).toBeInTheDocument();
    expect(screen.getByText('1 recorded entry')).toBeInTheDocument();
    expect(screen.queryByText('Sep 24, 2026')).not.toBeInTheDocument();
  });

  it('labels cached hydration conservatively and does not disguise unavailable reads as empty', async () => {
    service.getHydrationHistory.mockResolvedValue([
      { dateStr: '2026-09-25', state: 'cached', data: { amount: 1.5, goal: 3 } },
      { dateStr: '2026-09-24', state: 'unavailable', data: null },
    ]);

    render(<HealthHistory userId="patient-1" />);

    expect(await screen.findByText('1.50 L recorded')).toBeInTheDocument();
    expect(screen.getAllByText(/Showing information saved on this device/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Some hydration history is unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/Unavailable dates are not shown as zero/i)).toBeInTheDocument();
  });

  it('shows the recorded check-in label and note without exposing the mapped score', async () => {
    service.getDailyCheckInHistory.mockResolvedValue([
      { dateStr: '2026-09-25', state: 'recorded', data: { emotion: 'Managing / OK', note: 'Resting today', score: 6 } },
    ]);

    render(<HealthHistory userId="patient-1" />);

    expect(await screen.findByText('Managing / OK')).toBeInTheDocument();
    expect(screen.getByText('Resting today')).toBeInTheDocument();
    expect(screen.queryByText(/6\s*\/\s*10/)).not.toBeInTheDocument();
  });

  it('switches history categories with pointer and keyboard controls', async () => {
    const user = userEvent.setup();
    render(<HealthHistory userId="patient-1" />);

    const painTab = await screen.findByRole('tab', { name: /Pain & symptoms/i });
    const hydrationTab = screen.getByRole('tab', { name: /Hydration/i });
    expect(painTab).toHaveAttribute('aria-selected', 'true');

    await user.click(hydrationTab);
    expect(hydrationTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: /Hydration/i })).toBeVisible();

    await user.keyboard('{ArrowRight}');
    const checkInTab = screen.getByRole('tab', { name: /Check-ins/i });
    expect(checkInTab).toHaveAttribute('aria-selected', 'true');
    expect(checkInTab).toHaveFocus();
  });

  it('uses honest empty states and excludes medication adherence, AI, and Care Vault records', async () => {
    render(<HealthHistory userId="patient-1" />);

    expect(await screen.findByText('No pain or symptom entries recorded yet')).toBeInTheDocument();
    expect(screen.getByText('No hydration entries recorded for this period')).toBeInTheDocument();
    expect(screen.getByText('No daily check-ins recorded for this period')).toBeInTheDocument();
    expect(screen.getByText(/Detailed medication adherence history is not available/i)).toBeInTheDocument();
    expect(screen.queryByText(/Gemini|predictive risk|doctor report|Care Vault/i)).not.toBeInTheDocument();
  });

  it('shows zero only when successful reads confirm empty overview metrics', async () => {
    render(<HealthHistory userId="patient-1" />);

    await screen.findByText('No pain or symptom entries recorded yet');
    expect(overviewValue('Pain & symptoms')).toHaveTextContent('0 recorded entries');
    expect(overviewValue('Hydration')).toHaveTextContent('0 recorded entries');
    expect(overviewValue('Check-ins')).toHaveTextContent('0 recorded entries');
  });

  it('shows unavailable instead of zero without changing available overview metrics', async () => {
    service.getSymptomHistory.mockResolvedValue({
      state: 'recorded',
      data: [
        { id: 'one', userId: 'patient-1', dateStr: '2026-09-25', painLevel: 2 },
        { id: 'two', userId: 'patient-1', dateStr: '2026-09-24', painLevel: 4 },
      ],
    });
    service.getDailyCheckInHistory.mockResolvedValue([
      { dateStr: '2026-09-25', state: 'unavailable', data: null },
    ]);

    render(<HealthHistory userId="patient-1" />);

    await screen.findByText('Daily check-in history is unavailable right now');
    expect(overviewValue('Pain & symptoms')).toHaveTextContent('2 recorded entries');
    expect(overviewValue('Hydration')).toHaveTextContent('0 recorded entries');
    expect(overviewValue('Check-ins')).toHaveTextContent('Unavailable');
    expect(overviewValue('Check-ins')).not.toHaveTextContent('0 recorded entries');
  });

  it('shows unavailable for each overview source when no factual count can be confirmed', async () => {
    service.getSymptomHistory.mockResolvedValue({ state: 'unavailable', data: [] });
    service.getHydrationHistory.mockResolvedValue([
      { dateStr: '2026-09-25', state: 'unavailable', data: null },
    ]);
    service.getDailyCheckInHistory.mockResolvedValue([
      { dateStr: '2026-09-25', state: 'unavailable', data: null },
    ]);

    render(<HealthHistory userId="patient-1" />);

    await screen.findByText('Pain and symptom history is unavailable right now');
    expect(overviewValue('Pain & symptoms')).toHaveTextContent('Unavailable');
    expect(overviewValue('Hydration')).toHaveTextContent('Unavailable');
    expect(overviewValue('Check-ins')).toHaveTextContent('Unavailable');
  });

  it('retains factual cached counts in the overview', async () => {
    service.getSymptomHistory.mockResolvedValue({
      state: 'cached',
      data: [{ id: 'one', userId: 'patient-1', dateStr: '2026-09-25', painLevel: 0 }],
    });
    service.getHydrationHistory.mockResolvedValue([
      { dateStr: '2026-09-25', state: 'cached', data: { amount: 0, goal: 3 } },
      { dateStr: '2026-09-24', state: 'unavailable', data: null },
    ]);
    service.getDailyCheckInHistory.mockResolvedValue([
      { dateStr: '2026-09-25', state: 'cached', data: { emotion: 'Managing / OK' } },
      { dateStr: '2026-09-24', state: 'unavailable', data: null },
    ]);

    render(<HealthHistory userId="patient-1" />);

    await screen.findByText('Pain: 0 / 10');
    expect(overviewValue('Pain & symptoms')).toHaveTextContent('1 recorded entry');
    expect(overviewValue('Hydration')).toHaveTextContent('1 recorded entry');
    expect(overviewValue('Check-ins')).toHaveTextContent('1 recorded entry');
  });

  it('shows loading and supports keyboard retry after an unexpected read failure', async () => {
    const user = userEvent.setup();
    let resolveSymptoms: (value: typeof symptomMissing) => void = () => undefined;
    service.getSymptomHistory
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSymptoms = resolve; }))
      .mockResolvedValueOnce(symptomMissing);

    render(<HealthHistory userId="patient-1" />);
    expect(screen.getByRole('status', { name: 'Loading health history' })).toBeInTheDocument();

    resolveSymptoms(symptomMissing);
    await screen.findByText('No pain or symptom entries recorded yet');

    service.getSymptomHistory.mockRejectedValueOnce(new Error('unexpected'));
    service.getHydrationHistory.mockRejectedValueOnce(new Error('unexpected'));
    service.getDailyCheckInHistory.mockRejectedValueOnce(new Error('unexpected'));
    const retryRender = render(<HealthHistory userId="patient-2" />);
    const retryButton = await screen.findByRole('button', { name: 'Try again' });
    retryButton.focus();
    expect(retryButton).toHaveFocus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(service.getSymptomHistory).toHaveBeenCalledWith('patient-2'));
    retryRender.unmount();
  });
});

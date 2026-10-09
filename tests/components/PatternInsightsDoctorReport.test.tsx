import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  getPainLogs: vi.fn(),
  getWaterLogs7Days: vi.fn(),
  getMoodLogs: vi.fn(),
  getSymptomLogs: vi.fn(),
  getUserProfile: vi.fn(),
}));

const ai = vi.hoisted(() => ({
  generatePatternInsights: vi.fn(),
  generateDoctorReport: vi.fn(),
}));

vi.mock('../../services/firebaseService', () => ({ firebaseService: service }));
vi.mock('../../services/gemini', () => ai);

import { PatternInsightsDoctorReport } from '../../components/PatternInsightsDoctorReport';

describe('Generated health content truthfulness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.getPainLogs.mockResolvedValue([]);
    service.getWaterLogs7Days.mockResolvedValue([{ state: 'missing', data: null }]);
    service.getMoodLogs.mockResolvedValue([]);
    service.getSymptomLogs.mockResolvedValue([]);
    service.getUserProfile.mockResolvedValue({ displayName: 'Ada' });
    ai.generatePatternInsights.mockResolvedValue({
      headline: 'Possible relationship to review',
      keyCorrelations: [{ title: 'Generated idea', description: 'Needs review', confidence: '99%' }],
    });
    ai.generateDoctorReport.mockResolvedValue('Generated summary body');
  });

  it('does not present model confidence as a clinical fact', async () => {
    render(<PatternInsightsDoctorReport userId="patient-1" />);

    expect(await screen.findByText(/Possible relationship to review/)).toBeInTheDocument();
    expect(screen.getByText('Generated observation')).toBeInTheDocument();
    expect(screen.queryByText(/99%/)).not.toBeInTheDocument();
    expect(screen.getByText(/Experimental AI output/i)).toBeInTheDocument();
  });

  it('passes missing clinical facts through as missing and labels the result as generated', async () => {
    render(<PatternInsightsDoctorReport userId="patient-1" />);
    await screen.findByText(/Possible relationship to review/);

    await userEvent.click(screen.getByRole('button', { name: 'Generate Discussion Summary' }));

    await waitFor(() => expect(ai.generateDoctorReport).toHaveBeenCalled());
    expect(ai.generateDoctorReport).toHaveBeenCalledWith(
      { name: 'Ada', genotype: null, bloodType: null },
      {
        avgPain: null,
        severePainEntries: null,
        hydrationCompliance: null,
        reportingPeriod: 'Last 30 Days',
      },
      { recentPainLogs: [], recentSymptoms: [] },
    );
    expect(screen.getByRole('heading', { name: 'AI-Generated Patient Discussion Summary' })).toBeInTheDocument();
    expect(screen.getByText(/Not a clinical record or clinician-verified report/i)).toBeInTheDocument();
    expect(screen.getByText(/Genotype not recorded/i)).toBeInTheDocument();
  });
});

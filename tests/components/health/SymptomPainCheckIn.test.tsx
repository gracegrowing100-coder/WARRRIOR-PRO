import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  addSymptomLog: vi.fn(),
  getWaterLog: vi.fn(),
}));

vi.mock('../../../services/firebaseService', () => ({ firebaseService: service }));

import { SymptomPainCheckIn } from '../../../components/health';

const today = () => new Date().toLocaleDateString('sv');

const renderOpenWorkflow = (overrides: Partial<React.ComponentProps<typeof SymptomPainCheckIn>> = {}) => {
  const props: React.ComponentProps<typeof SymptomPainCheckIn> = {
    open: true,
    onOpenChange: vi.fn(),
    userId: 'patient-1',
    onSaved: vi.fn(),
    ...overrides,
  };
  return { ...render(<SymptomPainCheckIn {...props} />), props };
};

const WorkflowHarness: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open health entry</button>
      <SymptomPainCheckIn open={open} onOpenChange={setOpen} userId="patient-1" onSaved={vi.fn()} />
    </>
  );
};

describe('SymptomPainCheckIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.getWaterLog.mockResolvedValue({ state: 'recorded', data: { amount: 1.75, goal: 3 } });
    service.addSymptomLog.mockResolvedValue(undefined);
  });

  it('saves pain 0 with selected symptoms, triggers, and the exact protected argument order', async () => {
    const user = userEvent.setup();
    const { props } = renderOpenWorkflow();

    const slider = screen.getByRole('slider', { name: 'Pain score' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save health entry' })).toBeEnabled());
    fireEvent.change(slider, { target: { value: '0' } });
    expect(slider).toHaveValue('0');
    expect(slider).toHaveAttribute('aria-valuetext', '0 out of 10');

    await user.click(screen.getByRole('button', { name: 'Fatigue' }));
    await user.click(screen.getByText('Possible triggers'));
    await user.click(screen.getByRole('button', { name: 'Stress' }));
    await user.click(screen.getByRole('button', { name: 'Save health entry' }));

    await waitFor(() => {
      expect(service.addSymptomLog).toHaveBeenCalledWith(
        'patient-1',
        0,
        ['Fatigue'],
        ['Stress'],
        1.75,
        today(),
      );
    });
    expect(props.onSaved).toHaveBeenCalledTimes(1);
  });

  it('supports pain 10 and preserves a known hydration total instead of replacing it with a default', async () => {
    const user = userEvent.setup();
    renderOpenWorkflow();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save health entry' })).toBeEnabled());
    fireEvent.change(screen.getByRole('slider', { name: 'Pain score' }), { target: { value: '10' } });
    await user.click(screen.getByRole('button', { name: 'Save health entry' }));

    await waitFor(() => {
      expect(service.addSymptomLog).toHaveBeenCalledWith('patient-1', 10, [], [], 1.75, today());
    });
  });

  it('prevents duplicate submission while saving', async () => {
    let resolveSave: (() => void) | undefined;
    service.addSymptomLog.mockImplementation(() => new Promise<void>((resolve) => {
      resolveSave = resolve;
    }));
    const user = userEvent.setup();
    renderOpenWorkflow();

    const save = await screen.findByRole('button', { name: 'Save health entry' });
    await waitFor(() => expect(save).toBeEnabled());
    await user.dblClick(save);

    expect(service.addSymptomLog).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /Saving health entry/i })).toBeDisabled();
    resolveSave?.();
    await screen.findByRole('heading', { name: 'Health entry saved' });
  });

  it('retains patient selections after failure and retries without re-entry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    service.addSymptomLog.mockRejectedValueOnce(new Error('permission denied')).mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderOpenWorkflow();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save health entry' })).toBeEnabled());
    fireEvent.change(screen.getByRole('slider', { name: 'Pain score' }), { target: { value: '10' } });
    await user.click(screen.getByRole('button', { name: 'Fever' }));
    await user.click(screen.getByRole('button', { name: 'Save health entry' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('couldn’t confirm the complete save');
    expect(screen.getByRole('slider', { name: 'Pain score' })).toHaveValue('10');
    expect(screen.getByRole('button', { name: 'Fever' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Retry health entry' }));
    expect(await screen.findByRole('heading', { name: 'Health entry saved' })).toBeInTheDocument();
    expect(service.addSymptomLog).toHaveBeenCalledTimes(2);
    expect(service.addSymptomLog).toHaveBeenLastCalledWith('patient-1', 10, ['Fever'], [], 1.75, today());
  });

  it('uses conservative success wording, remains open, and closes explicitly with focus restoration', async () => {
    const user = userEvent.setup();
    render(<WorkflowHarness />);

    const trigger = screen.getByRole('button', { name: 'Open health entry' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Log symptoms and pain' })).toHaveAccessibleDescription(/Record how you feel today/i);
    expect(screen.getByRole('slider', { name: 'Pain score' })).toHaveFocus();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save health entry' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Save health entry' }));
    await screen.findByRole('heading', { name: 'Health entry saved' });

    expect(screen.getByText(/Cloud synchronization status could not be confirmed/i)).toBeInTheDocument();
    expect(screen.queryByText(/synchronized successfully|stored securely/i)).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Log symptoms and pain' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog', { name: 'Log symptoms and pain' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('keeps triggers secondary and introduces no free-text note field', async () => {
    renderOpenWorkflow();

    expect(screen.getByText('Possible triggers').closest('details')).not.toHaveAttribute('open');
    expect(screen.getByRole('button', { name: 'Fatigue' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('textbox', { name: /note|body location/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/body location/i)).not.toBeInTheDocument();
  });

  it('adjusts the score with the buttons, names the band, and offers help at severe pain', async () => {
    const user = userEvent.setup();
    const onPainChange = vi.fn();
    renderOpenWorkflow({ onPainChange });

    expect(screen.getByText('Mild')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Get help now' })).not.toBeInTheDocument();
    for (let i = 0; i < 4; i += 1) {
      await user.click(screen.getByRole('button', { name: 'Raise pain score by 1' }));
    }
    expect(screen.getByRole('slider', { name: 'Pain score' })).toHaveValue('7');
    expect(onPainChange).toHaveBeenLastCalledWith(7);
    expect(screen.getByText('Severe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get help now' })).toBeInTheDocument();
  });

  it('saves a body area and a custom symptom added by the patient', async () => {
    const user = userEvent.setup();
    renderOpenWorkflow();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save health entry' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await user.type(screen.getByLabelText('Something else?'), 'Headache{Enter}');
    expect(screen.getByRole('button', { name: 'Remove Headache' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save health entry' }));

    await waitFor(() => {
      expect(service.addSymptomLog).toHaveBeenCalledWith('patient-1', 3, ['Pain site: Back', 'Headache'], [], 1.75, today());
    });
  });
});

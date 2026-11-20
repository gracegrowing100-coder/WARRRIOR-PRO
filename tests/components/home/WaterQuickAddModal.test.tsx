import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({ saveWaterLog: vi.fn() }));
vi.mock('../../../services/firebaseService', () => ({ firebaseService: service }));

import { WaterQuickAddModal } from '../../../components/home/WaterQuickAddModal';

const today = new Date().toLocaleDateString('sv');

describe('WaterQuickAddModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.saveWaterLog.mockImplementation(async (_u: string, _d: string, amount: number, goal: number) => ({ state: 'recorded', data: { amount, goal } }));
  });

  it('adds the chosen container times the count to today\'s total and keeps the goal', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const onOpenChange = vi.fn();
    render(<WaterQuickAddModal open onOpenChange={onOpenChange} userId="u1" amount={1.25} goal={2.5} onSaved={onSaved} />);

    expect(screen.getByText('1.25 L to go')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Bottle, 75 cl' }));
    await user.click(screen.getByRole('button', { name: 'One more' }));
    expect(screen.getByRole('button', { name: 'Add 1.5 L' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add 1.5 L' }));

    expect(service.saveWaterLog).toHaveBeenCalledWith('u1', today, 2.75, 2.5);
    expect(onSaved).toHaveBeenCalledWith(2.75, 2.5, 'recorded');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('starts from zero with the default goal and shows an error when saving fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    service.saveWaterLog.mockRejectedValueOnce(new Error('offline'));
    const onOpenChange = vi.fn();
    render(<WaterQuickAddModal open onOpenChange={onOpenChange} userId="u1" amount={null} goal={null} onSaved={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Add 0.5 L' }));
    expect(service.saveWaterLog).toHaveBeenCalledWith('u1', today, 0.5, 3);
    expect(await screen.findByRole('alert')).toHaveTextContent("Water wasn't saved");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HomeActionHub } from '../../../components/home/HomeActionHub';

describe('HomeActionHub', () => {
  it('provides direct, labelled access to the patient quick actions', async () => {
    const user = userEvent.setup();
    const actions = {
      onLogHealth: vi.fn(),
      onAddWater: vi.fn(),
      onReviewMedication: vi.fn(),
      onOpenMira: vi.fn(),
    };

    render(<HomeActionHub {...actions} />);

    expect(screen.getByRole('button', { name: /Log pain|Log symptoms and pain/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add water/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Medicine|Review medication/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ask Mira/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Log pain|Log symptoms and pain/i }));
    await user.click(screen.getByRole('button', { name: /Add water/i }));
    await user.click(screen.getByRole('button', { name: /Medicine|Review medication/i }));
    await user.click(screen.getByRole('button', { name: /Ask Mira/i }));

    expect(actions.onLogHealth).toHaveBeenCalledTimes(1);
    expect(actions.onAddWater).toHaveBeenCalledTimes(1);
    expect(actions.onReviewMedication).toHaveBeenCalledTimes(1);
    expect(actions.onOpenMira).toHaveBeenCalledTimes(1);
  });
});

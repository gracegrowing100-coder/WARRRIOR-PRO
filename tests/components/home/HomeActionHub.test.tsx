import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HomeActionHub } from '../../../components/home/HomeActionHub';

describe('HomeActionHub', () => {
  it('provides direct, labelled access to the existing patient actions', async () => {
    const user = userEvent.setup();
    const actions = {
      onLogHealth: vi.fn(),
      onAddWater: vi.fn(),
      onReviewMedication: vi.fn(),
      onOpenMira: vi.fn(),
      onOpenCare: vi.fn(),
    };

    const { container } = render(<HomeActionHub {...actions} />);

    expect(container.querySelector('.grid-cols-2')).toHaveClass('md:grid-cols-4', 'xl:grid-cols-1');
    expect(screen.getByRole('button', { name: 'Log symptoms and pain' })).toHaveClass('min-h-32');
    expect(screen.getByRole('button', { name: /Open Care/i })).toHaveClass('w-full', 'min-h-14');

    await user.click(screen.getByRole('button', { name: 'Log symptoms and pain' }));
    await user.click(screen.getByRole('button', { name: /Add water/i }));
    await user.click(screen.getByRole('button', { name: /Medication/i }));
    await user.click(screen.getByRole('button', { name: /Ask Mira/i }));
    await user.click(screen.getByRole('button', { name: /Open Care/i }));

    Object.values(actions).forEach(action => expect(action).toHaveBeenCalledTimes(1));
  });
});

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PatientNavigation } from '../../../components/layout';

describe('PatientNavigation', () => {
  it('renders exactly five labelled activity destinations with semantic selection', () => {
    render(
      <PatientNavigation currentDestination="community" onNavigate={() => undefined} />,
    );

    const navigation = screen.getByRole('navigation', { name: 'Patient navigation' });
    const buttons = within(navigation).getAllByRole('button');

    expect(buttons).toHaveLength(5);
    for (const label of ['Home', 'Chat', 'Care', 'Community', 'More']) {
      expect(within(navigation).getByRole('button', { name: label })).toBeVisible();
    }
    expect(within(navigation).getByRole('button', { name: 'Community' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(navigation).queryByRole('button', { name: /profile/i })).not.toBeInTheDocument();
  });

  it('provides touch-sized controls, safe-area padding, and navigation callbacks', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<PatientNavigation currentDestination="home" onNavigate={onNavigate} />);

    const navigation = screen.getByRole('navigation', { name: 'Patient navigation' });
    expect(navigation).toHaveClass('pb-[var(--safe-area-bottom)]');

    const care = screen.getByRole('button', { name: 'Care' });
    expect(care).toHaveClass('min-h-14', 'touch-manipulation');
    await user.click(care);

    expect(onNavigate).toHaveBeenCalledWith('care');
  });
});

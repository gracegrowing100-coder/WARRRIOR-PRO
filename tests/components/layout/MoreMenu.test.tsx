import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MoreMenu } from '../../../components/layout';

describe('MoreMenu', () => {
  it('exposes existing Games/Education and Advocacy destinations', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(<MoreMenu onNavigate={onNavigate} />);

    expect(screen.getByRole('navigation', { name: 'More destinations' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Games & Education/i }));
    expect(onNavigate).toHaveBeenCalledWith('games');

    await user.click(screen.getByRole('button', { name: /Advocacy & Research/i }));
    expect(onNavigate).toHaveBeenCalledWith('advocacy');
  });
});

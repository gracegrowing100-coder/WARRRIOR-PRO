import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { OfflineWarriorAI } from '../../components/OfflineWarriorAI';

describe('Offline Warrior AI entry point', () => {
  it('keeps a compact accessible trigger and opens the existing companion', async () => {
    const user = userEvent.setup();
    render(<OfflineWarriorAI />);

    const trigger = screen.getByRole('button', { name: 'Open Offline AI' });
    expect(trigger).toHaveClass('min-h-11');
    expect(screen.getByText('Offline AI')).toHaveClass('hidden', 'sm:inline');

    await user.click(trigger);
    expect(screen.getByText('Warrior AI Companion')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: 'Close Offline AI' });
    expect(closeButton).toHaveClass('min-h-11', 'min-w-11');
  });
});

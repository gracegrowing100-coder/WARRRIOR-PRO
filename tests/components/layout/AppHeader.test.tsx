import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppHeader } from '../../../components/layout';

describe('AppHeader', () => {
  it('renders the connectivity label and action slot', () => {
    render(
      <AppHeader
        appName="Warrior AI"
        connectivityLabel="Offline"
        isOffline
        onHome={() => undefined}
        actions={<button type="button">Profile action</button>}
      />,
    );

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Profile action' })).toBeInTheDocument();
  });

  it('calls the Home callback from the app identity control', async () => {
    const user = userEvent.setup();
    const onHome = vi.fn();

    render(
      <AppHeader
        appName="Warrior AI"
        connectivityLabel="Online"
        isOffline={false}
        onHome={onHome}
        actions={null}
      />,
    );

    await user.click(screen.getByText('Warrior AI'));

    expect(onHome).toHaveBeenCalledTimes(1);
  });
});

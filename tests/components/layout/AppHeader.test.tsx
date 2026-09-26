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
        actions={<button type="button">Language action</button>}
        accountAction={<button type="button">Profile action</button>}
      />,
    );

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Language action' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Profile action' })).toBeInTheDocument();
  });

  it('provides a keyboard-dismissable mobile settings disclosure', async () => {
    const user = userEvent.setup();
    render(
      <AppHeader
        appName="Warrior AI"
        connectivityLabel="Online"
        isOffline={false}
        onHome={() => undefined}
        actions={<button type="button">Theme action</button>}
        accountAction={<button type="button">Profile action</button>}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Display and language settings' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
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

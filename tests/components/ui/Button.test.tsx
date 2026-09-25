import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, IconButton } from '../../../components/ui';

describe('Button', () => {
  it('uses native button semantics and does not submit by default', () => {
    render(<Button>Save changes</Button>);

    expect(screen.getByRole('button', { name: 'Save changes' })).toHaveAttribute('type', 'button');
  });

  it('announces loading and prevents repeated activation', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading loadingLabel="Saving changes" onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Saving changes');
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('IconButton', () => {
  it('uses its required label as the accessible name', () => {
    render(<IconButton label="Close panel" icon={<svg data-testid="icon" />} />);

    expect(screen.getByRole('button', { name: 'Close panel' })).toBeInTheDocument();
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Alert,
  Button,
  ChoiceChip,
  EmptyState,
  HealthStatusBadge,
  ProgressBar,
  Skeleton,
} from '../../../components/ui';

describe('feedback and status primitives', () => {
  it('keeps choice state observable and keyboard operable', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(
      <ChoiceChip selected={false} onSelectedChange={onSelectedChange}>
        Fatigue
      </ChoiceChip>,
    );

    const chip = screen.getByRole('button', { name: 'Fatigue' });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    chip.focus();
    await user.keyboard('[Space]');
    expect(onSelectedChange).toHaveBeenCalledWith(true);
  });

  it('uses restrained live-region semantics and textual status', () => {
    render(
      <>
        <Alert tone="warning" title="Check your connection" live="polite">
          This entry is saved locally.
        </Alert>
        <HealthStatusBadge tone="success">Stable</HealthStatusBadge>
      </>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('This entry is saved locally.');
    expect(screen.getByText('Stable')).toBeVisible();
  });

  it('exposes progress as text and an accessible numeric range', () => {
    render(<ProgressBar label="Hydration" value={5} max={8} valueText="5 of 8 cups" />);

    const progress = screen.getByRole('progressbar', { name: 'Hydration' });
    expect(progress).toHaveAttribute('aria-valuenow', '5');
    expect(progress).toHaveAttribute('aria-valuemax', '8');
    expect(progress).toHaveAttribute('aria-valuetext', '5 of 8 cups');
    expect(screen.getByText('5 of 8 cups')).toBeVisible();
  });

  it('hides skeleton decoration and keeps state actions operable', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const { container } = render(
      <>
        <Skeleton data-testid="skeleton" />
        <EmptyState
          title="No entries yet"
          description="Record your first entry."
          action={<Button onClick={onStart}>Start recording</Button>}
        />
      </>,
    );

    expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-hidden', 'true');
    expect(container).toHaveTextContent('No entries yet');
    await user.click(screen.getByRole('button', { name: 'Start recording' }));
    expect(onStart).toHaveBeenCalledOnce();
  });
});

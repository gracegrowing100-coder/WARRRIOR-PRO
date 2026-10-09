import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Alert,
  Button,
  Card,
  ChoiceChip,
  EmptyState,
  FormField,
  HealthStatusBadge,
  ProgressBar,
  Skeleton,
  TextInput,
} from '../../../components/ui';

const modes = [
  { name: 'Light', className: '' },
  { name: 'Dark', className: 'dark' },
  { name: 'High contrast', className: 'high-contrast' },
  { name: 'Dark high contrast', className: 'dark high-contrast' },
];

const Gallery = () => (
  <div>
    {modes.map((mode) => (
      <section key={mode.name} aria-label={mode.name} className={mode.className}>
        <div className="bg-canvas p-4 text-foreground">
          <Card>
            <Button>Primary action</Button>
            <Button loading>Save</Button>
            <ChoiceChip selected>Selected choice</ChoiceChip>
            <HealthStatusBadge tone="success">Stable</HealthStatusBadge>
            <FormField label="Health note" helpText="Optional context">
              <TextInput />
            </FormField>
            <Alert tone="info" title="Saved locally">Cloud state is not yet confirmed.</Alert>
            <ProgressBar label="Hydration" value={5} max={8} valueText="5 of 8 cups" />
            <Skeleton />
            <EmptyState title="No entries" />
          </Card>
        </div>
      </section>
    ))}
  </div>
);

describe('primitive gallery fixture', () => {
  it('renders common states in every supported theme mode without a production route', () => {
    render(<Gallery />);

    for (const mode of modes) {
      const region = screen.getByRole('region', { name: mode.name });
      expect(within(region).getByRole('button', { name: 'Primary action' })).toHaveClass('min-h-11');
      expect(within(region).getByText('Stable')).toBeVisible();
      expect(within(region).getByRole('progressbar')).toBeInTheDocument();
    }
  });
});

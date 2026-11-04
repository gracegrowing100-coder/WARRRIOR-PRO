import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RecordedPainChart } from '../../../components/health/RecordedPainChart';

describe('RecordedPainChart', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-26T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders only genuine recorded markers, supports zero, and leaves missing dates without points', () => {
    const { container } = render(<RecordedPainChart entries={[
      { dateStr: '2026-09-20', painLevel: 0, symptoms: [], triggers: [] },
      { dateStr: '2026-09-25', painLevel: 6, symptoms: [], triggers: [] },
    ]} />);

    expect(screen.getByRole('img', { name: /Pain over 30 days/i })).toBeInTheDocument();
    expect(container.querySelectorAll('circle')).toHaveLength(2);
    expect(screen.getByText(/Dates without an entry are left blank/i)).toBeInTheDocument();
    expect(screen.getByText(/20 Sept?: pain 0 out of 10/i)).toBeInTheDocument();
  });

  it('does not render a meaningless chart for empty records', () => {
    const { container } = render(<RecordedPainChart entries={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RecordedPainChart } from '../../../components/health/RecordedPainChart';

describe('RecordedPainChart', () => {
  it('renders only genuine recorded markers, supports zero, and leaves missing dates without points', () => {
    const { container } = render(<RecordedPainChart entries={[
      { dateStr: '2026-09-20', painLevel: 0, symptoms: [], triggers: [] },
      { dateStr: '2026-09-25', painLevel: 6, symptoms: [], triggers: [] },
    ]} />);

    expect(screen.getByRole('img', { name: /Recorded pain scores/i })).toBeInTheDocument();
    expect(container.querySelectorAll('circle')).toHaveLength(2);
    expect(screen.getByText(/Dates without an entry are left blank/i)).toBeInTheDocument();
    expect(screen.getByText('Sep 20: pain 0 out of 10')).toBeInTheDocument();
  });

  it('does not render a meaningless chart for fewer than two records', () => {
    const { container } = render(<RecordedPainChart entries={[
      { dateStr: '2026-09-25', painLevel: 0, symptoms: [], triggers: [] },
    ]} />);

    expect(container).toBeEmptyDOMElement();
  });
});


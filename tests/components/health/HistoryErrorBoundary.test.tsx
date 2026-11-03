import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HistoryErrorBoundary } from '../../../components/health/HistoryErrorBoundary';

const Boom: React.FC = () => { throw new Error('boom'); };

describe('HistoryErrorBoundary', () => {
  it('shows a safe message instead of a white screen when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<><HistoryErrorBoundary><Boom /></HistoryErrorBoundary><p>Sibling still visible</p></>);
    expect(screen.getByRole('alert')).toHaveTextContent("We couldn't draw your chart. Your entries are safe.");
    expect(screen.getByText('Sibling still visible')).toBeInTheDocument();
  });

  it('renders children normally when nothing throws', () => {
    render(<HistoryErrorBoundary><p>Chart</p></HistoryErrorBoundary>);
    expect(screen.getByText('Chart')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

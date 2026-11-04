import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppShell } from '../../../components/layout';

describe('AppShell', () => {
  it('renders navigation, header, and page content in the main landmark', () => {
    render(
      <AppShell navigation={<nav aria-label="Patient navigation">Navigation</nav>} header={<h1>Header</h1>}>
        <p>Content</p>
      </AppShell>,
    );

    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { name: 'Header' })).toBeInTheDocument();
    expect(within(main).getByText('Content')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Patient navigation' })).toBeInTheDocument();
    expect(within(main).queryByRole('navigation', { name: 'Patient navigation' })).not.toBeInTheDocument();
  });

  it('reserves support and navigation space outside the scrollable content', () => {
    render(
      <AppShell navigation={<nav>Navigation</nav>} header={<div>Header</div>}>
        Content
      </AppShell>,
    );

    expect(screen.getByRole('main')).toHaveClass(
      'pb-[120px]',
      'md:pb-8',
      'overflow-y-auto',
      'md:ml-64',
    );
  });
});

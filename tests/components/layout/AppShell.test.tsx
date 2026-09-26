import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppShell } from '../../../components/layout';

describe('AppShell', () => {
  it('renders navigation, header, and page content in the main landmark', () => {
    render(
      <AppShell
        navigation={<nav aria-label="Current navigation">Navigation</nav>}
        header={<div data-testid="shell-header">Header</div>}
      >
        <section>Feature content</section>
      </AppShell>,
    );

    const navigation = screen.getByRole('navigation', { name: 'Current navigation' });
    const main = screen.getByRole('main');

    expect(navigation).toBeInTheDocument();
    expect(main).toContainElement(screen.getByTestId('shell-header'));
    expect(main).toHaveTextContent('Feature content');
    expect(main.compareDocumentPosition(navigation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      screen.getByTestId('shell-header').compareDocumentPosition(screen.getByText('Feature content')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('reserves support and navigation space outside the scrollable content', () => {
    render(
      <AppShell navigation={<nav>Navigation</nav>} header={<div>Header</div>}>
        Content
      </AppShell>,
    );

    expect(screen.getByRole('main')).toHaveClass(
      'mb-[calc(8rem+var(--safe-area-bottom))]',
      'md:mb-[calc(4rem+var(--safe-area-bottom))]',
      'overflow-y-auto',
      'md:ml-20',
    );
  });
});

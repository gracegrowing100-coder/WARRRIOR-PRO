import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageContainer, PageHeader } from '../../../components/layout';

describe('page structure components', () => {
  it('preserves the patient content width', () => {
    const { container } = render(
      <PageContainer width="patient">Patient content</PageContainer>,
    );

    expect(container.firstChild).toHaveClass('mx-auto', 'max-w-5xl', 'p-4');
    expect(screen.getByText('Patient content')).toBeInTheDocument();
  });

  it('renders a page heading, description, and actions', () => {
    render(
      <PageHeader
        title="Page title"
        description="Page description"
        actions={<button type="button">Page action</button>}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Page title' })).toBeInTheDocument();
    expect(screen.getByText('Page description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page action' })).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { OfflineWarriorAI } from '../../components/OfflineWarriorAI';

describe('Offline Warrior AI entry point and companion', () => {
  it('keeps a compact accessible trigger and opens the existing companion', async () => {
    const user = userEvent.setup();
    render(<OfflineWarriorAI />);

    const trigger = screen.getByRole('button', { name: 'Open Offline AI' });
    expect(trigger).toHaveClass('min-h-11');
    expect(screen.getByText('Offline AI')).toHaveClass('hidden', 'sm:inline');

    await user.click(trigger);
    expect(screen.getByText('Warrior AI Companion')).toBeInTheDocument();
    expect(screen.getByText('100% Offline')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: 'Close Offline AI' });
    expect(closeButton).toHaveClass('min-h-11', 'min-w-11');
  });

  it('renders quick topics and allows sending an offline query', async () => {
    const user = userEvent.setup();
    render(<OfflineWarriorAI isOpenDefault />);

    expect(screen.getByText('Warrior AI Companion')).toBeInTheDocument();

    // Click a preset topic
    const topicButton = screen.getByRole('button', { name: '🚨 Crisis Protocol' });
    expect(topicButton).toBeInTheDocument();
    await user.click(topicButton);

    // Verify user query was sent
    expect(screen.getByText('What should I do right now during a sickle cell pain crisis?')).toBeInTheDocument();

    // Verify offline engine response arrives with safety protocol
    await waitFor(() => {
      expect(screen.getByText(/Critical SCD Safety Protocol/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('supports language switching and tool navigation', async () => {
    const user = userEvent.setup();
    const handleNavigate = vi.fn();
    const handleLanguageChange = vi.fn();

    render(
      <OfflineWarriorAI 
        isOpenDefault 
        onNavigateToTool={handleNavigate}
        onLanguageChange={handleLanguageChange}
      />
    );

    // Switch language to Yoruba
    const select = screen.getByLabelText('Select Offline Language');
    await user.selectOptions(select, 'yo');
    expect(handleLanguageChange).toHaveBeenCalledWith('yo');

    // Check that Yoruba topics appear
    expect(screen.getByRole('button', { name: '🚨 Ìṣòro Ìrora (Crisis)' })).toBeInTheDocument();
  });
});

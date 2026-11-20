import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../firebase-init', () => ({ auth: { currentUser: { uid: 'patient-1', displayName: 'Ada' } } }));
vi.mock('../../components/ChatSystem', () => ({ default: () => <div>Chat rooms screen</div> }));
vi.mock('../../services/firebaseService', () => ({
  firebaseService: { getPosts: vi.fn().mockResolvedValue([]), subscribeToPosts: vi.fn(() => () => undefined) },
}));

import { Community } from '../../components/Community';

describe('Community page structure', () => {
  it('has one place for each people-focused job: Find care, Chat, Forum, Groups', async () => {
    const user = userEvent.setup();
    render(<Community />);

    const tabs = screen.getAllByRole('tab').map(tab => tab.textContent?.trim());
    expect(tabs).toEqual(['Find care', 'Chat', 'Forum', 'Groups']);
    expect(screen.queryByText(/Community Channels|Peer Circles|Village Forum|Care Directory/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Chat' }));
    expect(screen.getByText('Chat rooms screen')).toBeInTheDocument();
  });
});

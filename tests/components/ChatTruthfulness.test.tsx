import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../firebase-init', () => ({ auth: { currentUser: { uid: 'patient-1', displayName: 'Ada' } } }));
vi.mock('../../components/DesignatedCaregiverWidget', () => ({ DesignatedCaregiverWidget: () => <div>Designated caregiver</div> }));

const service = vi.hoisted(() => ({
  getCustomGroups: vi.fn(() => []),
  subscribeToMessages: vi.fn(),
  subscribeToTypingStatus: vi.fn((_id: string, _userId: string, callback: (names: string[]) => void) => { callback([]); return () => undefined; }),
  setTypingStatus: vi.fn(),
  sendMessage: vi.fn().mockResolvedValue({}),
  toggleMessageReaction: vi.fn().mockResolvedValue(undefined),
  deleteChatMessage: vi.fn().mockResolvedValue(undefined),
  uploadChatMedia: vi.fn(),
}));
vi.mock('../../services/firebaseService', () => ({ firebaseService: service }));

import ChatSystem from '../../components/ChatSystem';

describe('Community channels truthfulness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.subscribeToMessages.mockImplementation((_id: string, callback: (m: unknown[]) => void) => { callback([]); return () => undefined; });
  });

  it('shows no seeded people, fake clinicians, member counts or calls', async () => {
    const user = userEvent.setup();
    render(<ChatSystem />);

    expect(screen.getByText(/Peer support from other warriors, not medical advice/)).toBeInTheDocument();
    expect(screen.queryByText(/SAMPLE|synthetic|members|online|unread/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open Lagos Warriors' }));
    expect(await screen.findByText('No messages yet')).toBeInTheDocument();
    expect(screen.queryByText(/Dr\. Sarah|Prof\. Adebayo|hematology consultant|Tunde/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /call|video/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Moderator|Admin/)).not.toBeInTheDocument();
  });

  it('Care Circle uses the real caregiver tool, not simulated linked peers', async () => {
    const user = userEvent.setup();
    render(<ChatSystem />);
    await user.click(screen.getByRole('tab', { name: /Care Circle/ }));
    expect(screen.getByText('Designated caregiver')).toBeInTheDocument();
    expect(screen.queryByText(/Grace|Tunde|audit|encrypted/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Open Caregivers Circle/ }));
    expect(await screen.findByLabelText('Message Caregivers Circle')).toBeInTheDocument();
  });

  it('sends a real message to the open channel', async () => {
    const user = userEvent.setup();
    render(<ChatSystem />);
    await user.click(screen.getByRole('button', { name: 'Open Caregivers Circle' }));
    await user.type(screen.getByLabelText('Message Caregivers Circle'), 'Hello from Ada');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(service.sendMessage).toHaveBeenCalledWith('caregivers-circle', 'Hello from Ada', null, null, null);
  });

  it('labels possible medical misinformation and hides it in Guardian mode', async () => {
    service.subscribeToMessages.mockImplementation((_id: string, callback: (m: unknown[]) => void) => {
      callback([
        { id: 'm1', senderId: 'other', senderName: 'Bola', text: 'You can stop taking hydroxyurea, herbal cure works', timestamp: new Date().toISOString() },
        { id: 'm2', senderId: 'other', senderName: 'Bola', text: 'Stay warm today', timestamp: new Date().toISOString() },
      ]);
      return () => undefined;
    });
    const user = userEvent.setup();
    render(<ChatSystem />);
    await user.click(screen.getByRole('button', { name: 'Open Lagos Warriors' }));
    expect(screen.getByText(/Check with your care team before changing any treatment/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to channels' }));
    await user.click(screen.getByRole('switch', { name: /Guardian mode/ }));
    await user.click(screen.getByRole('button', { name: 'Open Lagos Warriors' }));
    expect(screen.queryByText(/stop taking hydroxyurea/)).not.toBeInTheDocument();
    expect(screen.getByText('Stay warm today')).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../firebase-init', () => ({ auth: { currentUser: { uid: 'patient-1', displayName: 'Ada' } } }));
vi.mock('../../components/PeerSupportSection', () => ({ PeerSupportSection: () => null }));
vi.mock('../../services/firebaseService', () => ({
  firebaseService: {
    getCustomGroups: vi.fn().mockResolvedValue([]),
    subscribeToMessages: vi.fn((_id, callback) => { callback([]); return () => undefined; }),
    subscribeToTypingStatus: vi.fn((_id, _userId, callback) => { callback([]); return () => undefined; }),
    subscribeToGroupSettings: vi.fn((_id, callback) => { callback({ admins: [], mutedUsers: [] }); return () => undefined; }),
    setTypingStatus: vi.fn(),
  },
}));

import ChatSystem from '../../components/ChatSystem';

describe('Patient chat truthfulness', () => {
  it('labels seeded conversations as synthetic and exposes no fake clinician identity', async () => {
    render(<ChatSystem />);

    expect(await screen.findByText('SAMPLE COMMUNITY PREVIEW')).toBeInTheDocument();
    expect(screen.getByText(/Seeded conversations and members are synthetic/i)).toBeInTheDocument();
    expect(screen.queryByText(/Dr\. Sarah|Prof\. Adebayo|hematology consultant/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Emergency Dispatch' })).not.toBeInTheDocument();
  });
});

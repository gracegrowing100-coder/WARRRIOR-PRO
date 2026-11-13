import React, { useState } from 'react';
import { MessageSquare, Users } from 'lucide-react';
import { MiraAssistant } from './mira';
import ChatSystem from './ChatSystem';
import { Spark } from './brand';

export interface ChatWorkspaceProps {
  userId: string;
  /** Opens the existing appointment request flow with the patient-approved summary prefilled. */
  onContinueToAppointment: (approvedSummary: string) => void;
}

type ChatSectionTab = 'mira' | 'community';

/**
 * Chat workspace hosting both the 1-on-1 Mira AI companion and
 * WhatsApp-style Warrior Community Channels & Care Circle.
 */
export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({ userId, onContinueToAppointment }) => {
  const [activeTab, setActiveTab] = useState<ChatSectionTab>('mira');

  return (
    <div className="space-y-4" data-semantic>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Chat destinations"
          className="inline-flex items-center gap-1 rounded-full border border-wa-line bg-wa-surface p-1 shadow-2xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'mira'}
            onClick={() => setActiveTab('mira')}
            className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson ${
              activeTab === 'mira'
                ? 'bg-wa-hero text-white shadow-xs'
                : 'text-wa-plum-muted hover:bg-wa-ground hover:text-wa-plum'
            }`}
          >
            <Spark className={`h-3.5 w-3.5 ${activeTab === 'mira' ? 'text-wa-coral' : 'text-wa-crimson'}`} />
            <span>Ask Mira</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'community'}
            onClick={() => setActiveTab('community')}
            className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson ${
              activeTab === 'community'
                ? 'bg-wa-crimson text-white shadow-xs'
                : 'text-wa-plum-muted hover:bg-wa-ground hover:text-wa-plum'
            }`}
          >
            <Users size={15} aria-hidden="true" />
            <span>Community Channels</span>
          </button>
        </div>

        {activeTab === 'mira' && (
          <button
            type="button"
            onClick={() => setActiveTab('community')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-wa-crimson hover:underline cursor-pointer"
          >
            <MessageSquare size={14} aria-hidden="true" />
            Open Warrior Channels &amp; Care Circle →
          </button>
        )}
      </div>

      {activeTab === 'mira' ? (
        <MiraAssistant userId={userId} onContinueToAppointment={onContinueToAppointment} />
      ) : (
        <ChatSystem />
      )}
    </div>
  );
};

export default ChatWorkspace;

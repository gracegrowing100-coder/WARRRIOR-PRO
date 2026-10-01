import React, { useState } from 'react';
import ChatSystem from './ChatSystem';
import { MiraAssistant } from './mira';
import { cn } from './ui';

export interface ChatWorkspaceProps {
  userId: string;
  /** Opens the existing appointment request flow with the patient-approved summary prefilled. */
  onContinueToAppointment: (approvedSummary: string) => void;
}

type ChatWorkspaceTab = 'mira' | 'community';

/**
 * The Chat destination hosts two clearly separated areas: Mira (the AI
 * assistant) and the existing community chat. The community chat itself is
 * unchanged; it mounts only when its tab is open.
 */
export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({ userId, onContinueToAppointment }) => {
  const [tab, setTab] = useState<ChatWorkspaceTab>('mira');

  const tabs: Array<{ id: ChatWorkspaceTab; label: string; description: string }> = [
    { id: 'mira', label: 'Mira', description: 'AI assistant for sickle cell support' },
    { id: 'community', label: 'Community', description: 'Peer support and group chats' },
  ];

  return (
    <div className="space-y-6" data-semantic>
      <div role="tablist" aria-label="Chat areas" className="flex flex-wrap gap-2">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            id={`chat-tab-${entry.id}`}
            aria-selected={tab === entry.id}
            aria-controls={`chat-panel-${entry.id}`}
            data-ui-control
            onClick={() => setTab(entry.id)}
            className={cn(
              'min-h-11 rounded-pill border px-4 text-small font-semibold',
              tab === entry.id
                ? 'border-action bg-action text-foreground-inverse'
                : 'border-line-strong bg-surface text-foreground hover:bg-surface-subtle',
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tabs.map((entry) => (
        <div
          key={entry.id}
          role="tabpanel"
          id={`chat-panel-${entry.id}`}
          aria-labelledby={`chat-tab-${entry.id}`}
          hidden={tab !== entry.id}
        >
          {tab === entry.id && entry.id === 'mira' && (
            <MiraAssistant userId={userId} onContinueToAppointment={onContinueToAppointment} />
          )}
          {tab === entry.id && entry.id === 'community' && <ChatSystem />}
        </div>
      ))}
    </div>
  );
};

export default ChatWorkspace;

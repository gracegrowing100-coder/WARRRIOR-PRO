import React, { useState } from 'react';
import { Users } from 'lucide-react';
import ChatSystem from './ChatSystem';
import { MiraAssistant } from './mira';
import { Spark } from './brand';
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

  const tabs: Array<{ id: ChatWorkspaceTab; label: string; description: string; icon: React.ReactNode }> = [
    { 
      id: 'mira', 
      label: 'Mira AI', 
      description: 'AI assistant for sickle cell support',
      icon: <Spark className="w-4 h-4 text-white" />
    },
    { 
      id: 'community', 
      label: 'Community & Peer Groups', 
      description: 'Peer support and group chats',
      icon: <Users size={16} />
    },
  ];

  return (
    <div className="space-y-4" data-semantic>
      <div role="tablist" aria-label="Chat areas" className="flex items-center gap-1.5 p-1 rounded-full bg-white border border-[#E6D8E0] shadow-2xs max-w-fit">
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
              'min-h-10 rounded-full px-4 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
              tab === entry.id
                ? 'bg-[#3B0F2C] text-white shadow-sm'
                : 'text-[#6E4A63] hover:text-[#3B0F2C] hover:bg-[#F7F2F5]',
            )}
          >
            {entry.id === 'mira' && tab !== 'mira' ? (
              <Spark className="w-4 h-4 text-[#C4122F]" />
            ) : (
              entry.icon
            )}
            <span>
              {entry.id === 'community' ? (
                <>Community<span className="hidden sm:inline"> & Peer Groups</span></>
              ) : (
                entry.label
              )}
            </span>
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

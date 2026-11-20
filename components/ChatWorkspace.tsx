import React, { useState } from 'react';
import { Users } from 'lucide-react';
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
 * Chat workspace hosting the 1-on-1 Mira AI assistant and the community channels.
 */
export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({ userId, onContinueToAppointment }) => {
  const [activeTab, setActiveTab] = useState<ChatSectionTab>('mira');

  const tabClass = (selected: boolean) =>
    `flex min-h-11 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson ${
      selected ? 'bg-wa-rose text-wa-crimson' : 'text-wa-plum-muted hover:bg-wa-ground hover:text-wa-plum'
    }`;

  return (
    <div className="space-y-3" data-semantic>
      <div
        role="tablist"
        aria-label="Chat destinations"
        className="grid grid-cols-2 gap-1 rounded-full border border-wa-line bg-wa-surface p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'mira'}
          onClick={() => setActiveTab('mira')}
          className={tabClass(activeTab === 'mira')}
        >
          <Spark className="h-3.5 w-3.5" />
          <span>Ask Mira</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'community'}
          aria-label="Community Channels"
          onClick={() => setActiveTab('community')}
          className={tabClass(activeTab === 'community')}
        >
          <Users size={15} aria-hidden="true" />
          <span className="sm:hidden">Community</span>
          <span className="hidden sm:inline">Community Channels</span>
        </button>
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

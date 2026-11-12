import React from 'react';
import { MiraAssistant } from './mira';

export interface ChatWorkspaceProps {
  userId: string;
  /** Opens the existing appointment request flow with the patient-approved summary prefilled. */
  onContinueToAppointment: (approvedSummary: string) => void;
}

/**
 * The Mira destination is 100% dedicated to the 1-on-1 AI sickle cell companion.
 * Community directories, verified clinics, and peer resources live under the main Community tab.
 */
export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({ userId, onContinueToAppointment }) => {
  return (
    <div className="space-y-4" data-semantic>
      <MiraAssistant userId={userId} onContinueToAppointment={onContinueToAppointment} />
    </div>
  );
};

export default ChatWorkspace;

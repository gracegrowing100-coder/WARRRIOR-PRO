import React from 'react';
import { MiraAssistant } from './mira';

export interface ChatWorkspaceProps {
  userId: string;
  /** Opens the existing appointment request flow with the patient-approved summary prefilled. */
  onContinueToAppointment: (approvedSummary: string) => void;
}

/**
 * The Mira tab is the AI assistant only. Talking with other warriors lives on the
 * Community page (Chat, Forum, Groups) so each bottom-nav destination has one job.
 */
export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({ userId, onContinueToAppointment }) => (
  <div data-semantic>
    <MiraAssistant userId={userId} onContinueToAppointment={onContinueToAppointment} />
  </div>
);

export default ChatWorkspace;

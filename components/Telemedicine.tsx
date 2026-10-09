import React from 'react';
import { Appointments } from './care';

export interface TelemedicineProps {
  userId: string;
  onBackToCare: () => void;
  initialReason?: string;
  onInitialReasonConsumed?: () => void;
}

const Telemedicine: React.FC<TelemedicineProps> = ({ userId, onBackToCare, initialReason, onInitialReasonConsumed }) => (
  <Appointments
    userId={userId}
    onBackToCare={onBackToCare}
    initialReason={initialReason}
    onInitialReasonConsumed={onInitialReasonConsumed}
  />
);

export default Telemedicine;

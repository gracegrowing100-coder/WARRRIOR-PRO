import React from 'react';
import { Appointments } from './care';

export interface TelemedicineProps {
  userId: string;
  onBackToCare: () => void;
  initialReason?: string;
}

const Telemedicine: React.FC<TelemedicineProps> = ({ userId, onBackToCare, initialReason }) => (
  <Appointments userId={userId} onBackToCare={onBackToCare} initialReason={initialReason} />
);

export default Telemedicine;

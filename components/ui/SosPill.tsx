import React from 'react';
import { Shield } from 'lucide-react';
import { cn } from './utils';

export interface SosPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onOpenEmergency?: () => void;
}

export const SosPill: React.FC<SosPillProps> = ({
  onOpenEmergency,
  onClick,
  className,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented) {
      if (onOpenEmergency) {
        onOpenEmergency();
      } else {
        const fab = document.getElementById('emergency-fab');
        if (fab) fab.click();
      }
    }
  };

  return (
    <button
      type="button"
      data-ui-control
      onClick={handleClick}
      aria-label="Emergency SOS"
      className={cn(
        'h-10 px-3.5 rounded-full bg-wa-crimson hover:bg-wa-crimson-press active:bg-wa-crimson-press text-white font-display font-extrabold text-[13px] inline-flex items-center gap-1.5 shadow-wa-sos transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white shrink-0',
        className,
      )}
      {...props}
    >
      <Shield size={14} strokeWidth={2.5} aria-hidden="true" />
      <span>SOS</span>
    </button>
  );
};

SosPill.displayName = 'SosPill';


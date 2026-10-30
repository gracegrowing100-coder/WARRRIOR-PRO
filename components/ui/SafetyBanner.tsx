import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { cn } from './utils';

export interface SafetyBannerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onGetHelp?: () => void;
  getHelpLabel?: string;
}

export const SafetyBanner: React.FC<SafetyBannerProps> = ({
  title = 'Severe crisis warning',
  description = 'If you are having severe pain, fever or chest symptoms, please seek emergency care right away.',
  onGetHelp,
  getHelpLabel = 'Get help',
  className,
  ...props
}) => {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-[22px] bg-wa-crimson text-white p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 font-body',
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white mt-0.5">
          <AlertTriangle size={20} />
        </div>
        <div className="min-w-0">
          <h4 className="font-display font-bold text-[15px] leading-tight text-white">{title}</h4>
          {description && (
            <p className="mt-1 text-[13px] text-white/90 leading-snug">{description}</p>
          )}
        </div>
      </div>

      {onGetHelp && (
        <div className="shrink-0 self-end sm:self-center">
          <Button
            type="button"
            variant="onPlum"
            size="sm"
            onClick={onGetHelp}
            className="bg-white text-wa-crimson hover:bg-white/90 whitespace-nowrap font-bold h-10 px-4 text-[13px]"
            trailingIcon={<ArrowRight size={14} />}
          >
            {getHelpLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

SafetyBanner.displayName = 'SafetyBanner';

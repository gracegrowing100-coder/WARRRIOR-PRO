import React from 'react';
import { Droplets, HeartPulse, Pill } from 'lucide-react';
import { Spark } from '../brand';

interface HomeActionHubProps {
  onLogHealth: () => void;
  onAddWater: () => void;
  onReviewMedication: () => void;
  onOpenMira: () => void;
  onOpenCare?: () => void;
}

export const HomeActionHub: React.FC<HomeActionHubProps> = ({
  onLogHealth,
  onAddWater,
  onReviewMedication,
  onOpenMira,
}) => {
  return (
    <section aria-label="Quick actions" className="w-full">
      <h2 className="font-display text-[16px] font-bold text-wa-plum dark:text-white">Quick actions</h2>
      <p className="mb-3 mt-0.5 text-[13px] text-wa-plum-muted dark:text-wa-on-plum-muted">Tap an icon to get started.</p>
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          data-ui-control
          onClick={onLogHealth}
          aria-label="Log symptoms and pain"
          className="flex flex-col items-center gap-2 text-center text-xs font-semibold text-wa-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson rounded-2xl group"
        >
          <span
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-wa-crimson text-white shadow-sm transition-transform duration-150 group-active:scale-95"
          >
            <HeartPulse size={26} strokeWidth={2} />
          </span>
          <span>Log pain</span>
        </button>

        <button
          type="button"
          data-ui-control
          onClick={onAddWater}
          aria-label="Add water"
          className="flex flex-col items-center gap-2 text-center text-xs font-semibold text-wa-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-water rounded-2xl group"
        >
          <span
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-wa-water text-white shadow-sm transition-transform duration-150 group-active:scale-95"
          >
            <Droplets size={26} strokeWidth={2} />
          </span>
          <span>Add water</span>
        </button>

        <button
          type="button"
          data-ui-control
          onClick={onReviewMedication}
          aria-label="Review medication"
          className="flex flex-col items-center gap-2 text-center text-xs font-semibold text-wa-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-plum rounded-2xl group"
        >
          <span
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-wa-hero text-white shadow-sm transition-transform duration-150 group-active:scale-95"
          >
            <Pill size={26} strokeWidth={2} />
          </span>
          <span>Medicine</span>
        </button>

        <button
          type="button"
          data-ui-control
          onClick={onOpenMira}
          aria-label="Ask Mira"
          className="flex flex-col items-center gap-2 text-center text-xs font-semibold text-wa-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson rounded-2xl group"
        >
          <span
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-wa-line bg-wa-surface shadow-sm transition-transform duration-150 group-active:scale-95"
          >
            <Spark className="h-6 w-6 text-wa-crimson" />
          </span>
          <span>Ask Mira<span className="block text-[11px] font-medium text-wa-plum-muted">AI helper</span></span>
        </button>
      </div>
    </section>
  );
};

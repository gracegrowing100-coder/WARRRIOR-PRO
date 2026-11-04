import React, { useState } from 'react';
import { CalendarCheck2, LifeBuoy, X } from 'lucide-react';
import { Spark } from '../brand';

const STORAGE_KEY = 'warrior-home-guide-dismissed-v1';

const readDismissed = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const steps = [
  {
    icon: <CalendarCheck2 size={18} aria-hidden="true" />,
    iconClass: 'bg-emerald-500/15 text-emerald-600',
    title: 'Check in once a day',
    body: 'Tell us how you feel. It takes about 10 seconds.',
  },
  {
    icon: <Spark className="h-[18px] w-[18px]" />,
    iconClass: 'bg-wa-rose text-wa-crimson',
    title: 'Ask Mira when unsure',
    body: 'Mira is an AI helper for everyday questions. She is not a doctor.',
  },
  {
    icon: <LifeBuoy size={18} aria-hidden="true" />,
    iconClass: 'bg-wa-crimson text-white',
    title: 'Emergency? Tap the red button',
    body: 'It shows your emergency details and who to call.',
  },
];

/** First-visit orientation. Dismissal is remembered on this device only. */
export const WelcomeGuide: React.FC = () => {
  const [dismissed, setDismissed] = useState(readDismissed);
  if (dismissed) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* storage unavailable: hide for this session only */
    }
    setDismissed(true);
  };

  return (
    <section
      aria-labelledby="welcome-guide-title"
      data-testid="welcome-guide"
      className="relative rounded-[28px] border border-wa-line-soft bg-wa-surface p-5 text-wa-plum dark:border-white/10 dark:text-white"
    >
      <button
        type="button"
        data-ui-control
        onClick={dismiss}
        aria-label="Hide welcome guide"
        className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-wa-plum-muted hover:bg-wa-ground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson"
      >
        <X size={18} aria-hidden="true" />
      </button>
      <p className="text-[11px] font-bold uppercase tracking-wider text-wa-plum-muted dark:text-wa-on-plum-muted">New here?</p>
      <h2 id="welcome-guide-title" className="mt-0.5 pr-10 font-display text-[18px] font-bold">
        Welcome! Here is how to get started
      </h2>
      <ol className="mt-3 space-y-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3">
            <span aria-hidden="true" className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] ${step.iconClass}`}>
              {step.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-bold leading-tight">
                <span className="sr-only">Step {index + 1}: </span>{step.title}
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-wa-plum-muted dark:text-wa-on-plum-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        data-ui-control
        onClick={dismiss}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-wa-hero px-5 text-sm font-bold text-white hover:bg-wa-hero/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson sm:w-auto"
      >
        Got it, hide this
      </button>
    </section>
  );
};


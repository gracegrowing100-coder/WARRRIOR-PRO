import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { cn } from './utils';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeLabel?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  size?: 'sm' | 'md' | 'lg';
  presentation?: 'centered' | 'side-panel';
  dismissOnBackdrop?: boolean;
  contentClassName?: string;
  footerClassName?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => element.getAttribute('aria-hidden') !== 'true' && !element.hidden,
  );
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeLabel = 'Close dialog',
  initialFocusRef,
  size = 'md',
  presentation = 'centered',
  dismissOnBackdrop = true,
  contentClassName,
  footerClassName,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const modalRoot = dialogRef.current?.parentElement;
    const backgroundSiblings = Array.from(document.body.children).filter(
      (element): element is HTMLElement => element instanceof HTMLElement && element !== modalRoot,
    );
    const siblingState = backgroundSiblings.map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute('aria-hidden'),
    }));
    backgroundSiblings.forEach((element) => {
      element.inert = true;
      element.setAttribute('aria-hidden', 'true');
    });

    const dialog = dialogRef.current;
    const preferredFocus = initialFocusRef?.current;
    const firstFocusable = dialog ? getFocusableElements(dialog)[0] : null;
    const focusTarget = preferredFocus && dialog?.contains(preferredFocus) ? preferredFocus : firstFocusable ?? dialog;
    focusTarget?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChangeRef.current(false);
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = getFocusableElements(dialogRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialogRef.current.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      siblingState.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', ariaHidden);
      });
      previouslyFocused?.focus();
    };
  }, [initialFocusRef, open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-ui
      data-modal-root
      className={cn(
        'fixed inset-0 z-[200] flex min-h-full bg-navy-950/65',
        presentation === 'side-panel'
          ? 'items-stretch justify-end p-0'
          : 'items-center justify-center overflow-y-auto p-4',
      )}
      style={{
        paddingTop: presentation === 'side-panel' ? undefined : 'calc(1rem + var(--safe-area-top))',
        paddingBottom: presentation === 'side-panel' ? undefined : 'calc(1rem + var(--safe-area-bottom))',
      }}
      onMouseDown={(event) => {
        if (dismissOnBackdrop && event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex w-full flex-col overflow-hidden bg-surface text-foreground shadow-overlay',
          presentation === 'side-panel'
            ? 'ml-auto h-[100dvh] max-h-[100dvh] max-w-md rounded-none'
            : cn('my-auto max-h-[calc(100dvh-2rem)] rounded-dialog', sizeClasses[size]),
        )}
      >
        <div
          className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6"
          style={{ paddingTop: presentation === 'side-panel' ? 'calc(1rem + var(--safe-area-top))' : undefined }}
        >
          <div className="min-w-0">
            <h2 id={titleId} className="text-heading-2 text-foreground">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-small text-foreground-secondary">{description}</p>}
          </div>
          <IconButton label={closeLabel} icon={<X size={20} />} onClick={() => onOpenChange(false)} />
        </div>
        <div className={cn('min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6', contentClassName)}>
          {children}
        </div>
        {footer && (
          <div
            className={cn('shrink-0 border-t border-line px-5 py-4 sm:px-6', footerClassName)}
            style={{ paddingBottom: presentation === 'side-panel' ? 'calc(1rem + var(--safe-area-bottom))' : undefined }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

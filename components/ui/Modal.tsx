import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { cn } from './utils';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeLabel?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  size?: 'sm' | 'md' | 'lg';
  presentation?: 'centered' | 'side-panel' | 'bottom-sheet';
  dismissOnBackdrop?: boolean;
  contentClassName?: string;
  footerClassName?: string;
  hideCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
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
  presentation = 'bottom-sheet',
  dismissOnBackdrop = true,
  contentClassName,
  footerClassName,
  hideCloseButton = false,
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
        'fixed inset-0 z-[200] flex min-h-full bg-wa-hero/85 backdrop-blur-sm transition-opacity duration-200',
        presentation === 'side-panel'
          ? 'items-stretch justify-end p-0'
          : 'items-end justify-center overflow-y-auto p-0 md:items-center md:p-4',
      )}
      style={{
        paddingTop: presentation === 'side-panel' ? undefined : 'calc(0.5rem + var(--safe-area-top))',
        paddingBottom: presentation === 'side-panel' ? undefined : 'calc(0.5rem + var(--safe-area-bottom))',
      }}
      onMouseDown={(event) => {
        if (dismissOnBackdrop && event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex w-full flex-col overflow-hidden bg-wa-surface text-wa-plum shadow-2xl font-body',
          presentation === 'side-panel'
            ? 'ml-auto h-[100dvh] max-h-[100dvh] max-w-md rounded-none'
            : cn(
                'max-h-[92dvh] rounded-t-[36px] md:my-auto md:max-h-[85dvh] md:rounded-[28px]',
                sizeClasses[size],
              ),
        )}
      >
        {/* Mobile drag handle for bottom sheet */}
        {presentation !== 'side-panel' && (
          <div className="flex md:hidden w-full items-center justify-center pt-2.5 pb-1">
            <div className="h-[5px] w-11 rounded-full bg-wa-line" aria-hidden="true" />
          </div>
        )}

        {(title || !hideCloseButton) && (
          <div
            className="flex shrink-0 items-start justify-between gap-4 border-b border-wa-line-soft px-5 py-4 md:px-6"
            style={{ paddingTop: presentation === 'side-panel' ? 'calc(1rem + var(--safe-area-top))' : undefined }}
          >
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id={titleId} className="font-display text-xl font-bold text-wa-plum">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="mt-1 text-[13px] text-wa-muted">
                  {description}
                </p>
              )}
            </div>
            {!hideCloseButton && (
              <IconButton
                label={closeLabel}
                icon={<X size={20} />}
                onClick={() => onOpenChange(false)}
                className="text-wa-muted hover:text-wa-plum hover:bg-wa-ground rounded-full"
              />
            )}
          </div>
        )}

        <div className={cn('min-h-0 overflow-y-auto overscroll-contain px-5 py-5 md:px-6', contentClassName)}>
          {children}
        </div>

        {footer && (
          <div
            className={cn('shrink-0 border-t border-wa-line-soft px-5 py-4 md:px-6 bg-wa-surface', footerClassName)}
            style={{
              paddingBottom: 'calc(1rem + var(--safe-area-bottom))',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export const Sheet = Modal;

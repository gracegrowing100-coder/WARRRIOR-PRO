import React, { forwardRef } from 'react';
import { useFieldControlProps } from './FormField';
import { cn } from './utils';

const controlClasses = [
  'h-[52px] min-h-[52px] w-full rounded-[16px] border border-wa-line bg-wa-surface px-4 text-[16px] text-wa-plum font-body',
  'placeholder:text-wa-muted/60 focus:border-wa-plum focus:outline-none focus:ring-1 focus:ring-wa-plum',
  'disabled:cursor-not-allowed disabled:bg-wa-ground disabled:text-wa-muted/70',
  'aria-[invalid=true]:border-wa-crimson aria-[invalid=true]:focus:ring-wa-crimson',
].join(' ');

function mergeDescribedBy(fieldValue?: string, propValue?: string) {
  return [fieldValue, propValue].filter(Boolean).join(' ') || undefined;
}

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ id, required, 'aria-invalid': invalid, 'aria-describedby': describedBy, 'aria-errormessage': errorMessage, className, ...props }, ref) => {
    const field = useFieldControlProps();
    return (
      <input
        ref={ref}
        data-ui
        data-ui-field
        id={id ?? field.id}
        required={required ?? field.required}
        aria-invalid={invalid ?? field['aria-invalid']}
        aria-describedby={mergeDescribedBy(field['aria-describedby'], describedBy)}
        aria-errormessage={errorMessage ?? field['aria-errormessage']}
        className={cn(controlClasses, className)}
        {...props}
      />
    );
  },
);

TextInput.displayName = 'TextInput';

export const SelectInput = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ id, required, 'aria-invalid': invalid, 'aria-describedby': describedBy, 'aria-errormessage': errorMessage, className, ...props }, ref) => {
    const field = useFieldControlProps();
    return (
      <select
        ref={ref}
        data-ui
        data-ui-field
        id={id ?? field.id}
        required={required ?? field.required}
        aria-invalid={invalid ?? field['aria-invalid']}
        aria-describedby={mergeDescribedBy(field['aria-describedby'], describedBy)}
        aria-errormessage={errorMessage ?? field['aria-errormessage']}
        className={cn(controlClasses, className)}
        {...props}
      />
    );
  },
);

SelectInput.displayName = 'SelectInput';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ id, required, 'aria-invalid': invalid, 'aria-describedby': describedBy, 'aria-errormessage': errorMessage, className, ...props }, ref) => {
    const field = useFieldControlProps();
    return (
      <textarea
        ref={ref}
        data-ui
        data-ui-field
        id={id ?? field.id}
        required={required ?? field.required}
        aria-invalid={invalid ?? field['aria-invalid']}
        aria-describedby={mergeDescribedBy(field['aria-describedby'], describedBy)}
        aria-errormessage={errorMessage ?? field['aria-errormessage']}
        className={cn(
          controlClasses,
          'h-auto min-h-[96px] resize-y py-3',
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';

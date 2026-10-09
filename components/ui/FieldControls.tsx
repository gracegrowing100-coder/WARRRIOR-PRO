import React, { forwardRef } from 'react';
import { useFieldControlProps } from './FormField';
import { cn } from './utils';

const controlClasses = [
  'min-h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-body text-foreground',
  'placeholder:text-foreground-secondary disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground',
  'aria-[invalid=true]:border-status-danger',
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
        className={cn(controlClasses, 'min-h-24 resize-y py-2.5', className)}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';

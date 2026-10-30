import React, { createContext, useContext, useId } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from './utils';

interface FieldContextValue {
  controlId: string;
  helpId?: string;
  errorId?: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  label?: React.ReactNode;
  helpText?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  helpText,
  error,
  required = false,
  children,
  className,
  ...props
}) => {
  const generatedId = useId();
  const controlId = id ?? `field-${generatedId}`;
  const helpId = helpText ? `${controlId}-help` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;
  const context = { controlId, helpId, errorId, describedBy, invalid: Boolean(error), required };

  return (
    <FieldContext.Provider value={context}>
      <div data-ui className={cn('space-y-1 text-wa-plum font-body', className)} {...props}>
        {label && <Label>{label}</Label>}
        {children}
        {helpText && <HelpText>{helpText}</HelpText>}
        {error && <ValidationMessage>{error}</ValidationMessage>}
      </div>
    </FieldContext.Provider>
  );
};

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  requiredIndicator?: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({
  htmlFor,
  requiredIndicator = 'Required',
  className,
  children,
  ...props
}) => {
  const field = useContext(FieldContext);
  const isRequired = field?.required ?? false;

  return (
    <label
      data-ui
      htmlFor={htmlFor ?? field?.controlId}
      className={cn('block text-[14px] font-bold text-wa-plum font-body tracking-tight', className)}
      {...props}
    >
      {children}
      {isRequired && (
        <span className="ml-1 text-wa-crimson">
          <span aria-hidden="true">*</span>
          <span className="sr-only"> {requiredIndicator}</span>
        </span>
      )}
    </label>
  );
};

export const HelpText: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  id,
  className,
  ...props
}) => {
  const field = useContext(FieldContext);
  return (
    <p
      data-ui
      id={id ?? field?.helpId}
      className={cn('text-[13px] text-wa-muted font-body', className)}
      {...props}
    />
  );
};

export const ValidationMessage: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  id,
  className,
  children,
  ...props
}) => {
  const field = useContext(FieldContext);
  return (
    <p
      data-ui
      id={id ?? field?.errorId}
      className={cn('flex items-center gap-1.5 text-[13px] font-medium text-wa-crimson font-body mt-1', className)}
      {...props}
    >
      <CircleAlert aria-hidden="true" className="shrink-0" size={15} />
      <span>{children}</span>
    </p>
  );
};

export function useFieldControlProps() {
  const field = useContext(FieldContext);
  return {
    id: field?.controlId,
    required: field?.required || undefined,
    'aria-invalid': field?.invalid || undefined,
    'aria-describedby': field?.describedBy,
    'aria-errormessage': field?.errorId,
  } as const;
}

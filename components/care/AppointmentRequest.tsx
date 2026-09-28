import React, { useState } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3 } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { PageHeader } from '../layout';
import { Alert, Button, Card, FormField, StateMessage, Textarea, TextInput } from '../ui';

export interface AppointmentRequestProps {
  userId: string;
  initialReason?: string;
  onBack: () => void;
  onDone: () => void;
}

type RequestStep = 'preferences' | 'review' | 'result';

function todayAsInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function displayPreferredDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export const AppointmentRequest: React.FC<AppointmentRequestProps> = ({
  userId,
  initialReason = '',
  onBack,
  onDone,
}) => {
  const [step, setStep] = useState<RequestStep>('preferences');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [reason, setReason] = useState(initialReason);
  const [errors, setErrors] = useState<{ date?: string; time?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [savedLocally, setSavedLocally] = useState(false);

  const reviewRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = {
      date: preferredDate ? undefined : 'Choose a preferred date.',
      time: preferredTime ? undefined : 'Choose a preferred time.',
    };
    setErrors(nextErrors);
    if (nextErrors.date || nextErrors.time) return;
    setSubmitError('');
    setStep('review');
  };

  const submitRequest = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await firebaseService.addAppointment(userId, {
        bookedDate: preferredDate,
        bookedTime: preferredTime,
        ...(reason.trim() ? { patientNote: reason.trim() } : {}),
        status: 'Requested',
      });
      setSavedLocally(Boolean(userId) && !result);
      setStep('result');
    } catch {
      setSubmitError('The request could not be recorded. Your selections are still here so you can try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'result') {
    return (
      <div className="space-y-6" data-semantic>
        <StateMessage
          state="success"
          title={savedLocally ? 'Appointment request saved on this device' : 'Appointment request recorded'}
          description={savedLocally
            ? 'Cloud recording is currently unavailable. This is not a confirmed appointment, and no clinician response is implied.'
            : 'Your preferred date and time were recorded. This is a request, not a confirmed appointment or reserved clinic time.'}
          icon={<CheckCircle2 size={24} />}
          live="polite"
          action={<Button onClick={onDone}>Done</Button>}
        />
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="space-y-6" data-semantic>
        <Button variant="ghost" leadingIcon={<ArrowLeft size={18} />} onClick={() => setStep('preferences')}>
          Edit request
        </Button>
        <PageHeader
          title="Review appointment request"
          description="Check your preferences before recording this request for hematology care."
        />
        <Alert tone="info" title="This is a request, not a confirmed appointment">
          The selected date and time are your preferences. They are not verified clinic availability or a reserved slot.
        </Alert>
        <Card as="section" aria-labelledby="request-summary-title" className="max-w-2xl shadow-none">
          <h2 id="request-summary-title" className="text-heading-2 text-foreground">Request summary</h2>
          <dl className="mt-5 divide-y divide-line">
            <div className="flex gap-4 py-4 first:pt-0">
              <CalendarDays size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-action" />
              <div>
                <dt className="text-small font-semibold text-foreground-secondary">Preferred date</dt>
                <dd className="mt-1 text-body text-foreground">{displayPreferredDate(preferredDate)}</dd>
              </div>
            </div>
            <div className="flex gap-4 py-4">
              <Clock3 size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-action" />
              <div>
                <dt className="text-small font-semibold text-foreground-secondary">Preferred time</dt>
                <dd className="mt-1 text-body text-foreground">{preferredTime}</dd>
              </div>
            </div>
            <div className="py-4 last:pb-0">
              <dt className="text-small font-semibold text-foreground-secondary">Reason for appointment</dt>
              <dd className="mt-1 whitespace-pre-wrap text-body text-foreground">{reason.trim() || 'Not provided'}</dd>
            </div>
          </dl>
        </Card>
        {submitError && <Alert tone="danger" title="Request not recorded" live="assertive">{submitError}</Alert>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setStep('preferences')}>Edit request</Button>
          <Button loading={submitting} loadingLabel="Submitting request…" onClick={submitRequest}>
            Submit request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-semantic>
      <Button variant="ghost" leadingIcon={<ArrowLeft size={18} />} onClick={onBack}>
        Back to appointments
      </Button>
      <PageHeader
        title="Request a hematology appointment"
        description="Share your preferred date and time. The clinic has not confirmed availability at this stage."
      />
      <form noValidate onSubmit={reviewRequest} className="max-w-2xl space-y-6">
        <Card as="section" className="space-y-5 shadow-none">
          <FormField
            label="Preferred date"
            required
            error={errors.date}
            helpText="Choose the date you would prefer. This does not reserve clinic time."
          >
            <TextInput
              type="date"
              min={todayAsInputValue()}
              value={preferredDate}
              onChange={(event) => {
                setPreferredDate(event.target.value);
                if (event.target.value) setErrors((current) => ({ ...current, date: undefined }));
              }}
            />
          </FormField>
          <FormField
            label="Preferred time"
            required
            error={errors.time}
            helpText="Choose a preferred time. It is not verified provider availability."
          >
            <TextInput
              type="time"
              value={preferredTime}
              onChange={(event) => {
                setPreferredTime(event.target.value);
                if (event.target.value) setErrors((current) => ({ ...current, time: undefined }));
              }}
            />
          </FormField>
          <FormField
            label="Reason for appointment"
            helpText="Optional. Add only information you want included with this request."
          >
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder="Briefly describe what you would like to discuss"
            />
          </FormField>
        </Card>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onBack}>Cancel</Button>
          <Button type="submit">Review request</Button>
        </div>
      </form>
    </div>
  );
};

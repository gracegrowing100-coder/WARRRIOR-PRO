import React, { useState } from 'react';
import { ArrowLeft, Building2, CalendarDays, CheckCircle2, Clock3, Home, MapPin, Video } from 'lucide-react';
import { firebaseService } from '../../services/firebaseService';
import { PageHeader } from '../layout';
import { Alert, Button, Card, FormField, StateMessage, Textarea, TextInput } from '../ui';

export interface AppointmentRequestProps {
  userId: string;
  initialReason?: string;
  onBack: () => void;
  onDone: () => void;
}

export type AppointmentMode = 'clinic' | 'virtual' | 'home';

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

function formatModeLabel(mode: AppointmentMode) {
  switch (mode) {
    case 'virtual':
      return 'Virtual consultation (telemedicine)';
    case 'home':
      return 'Home visit (doctor to your house)';
    case 'clinic':
    default:
      return 'Clinic visit (in-person)';
  }
}

export const AppointmentRequest: React.FC<AppointmentRequestProps> = ({
  userId,
  initialReason = '',
  onBack,
  onDone,
}) => {
  const [step, setStep] = useState<RequestStep>('preferences');
  const [appointmentType, setAppointmentType] = useState<AppointmentMode>('clinic');
  const [homeAddress, setHomeAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [reason, setReason] = useState(initialReason);
  const [errors, setErrors] = useState<{ date?: string; time?: string; address?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [savedLocally, setSavedLocally] = useState(false);

  const reviewRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = {
      date: preferredDate ? undefined : 'Choose a preferred date.',
      time: preferredTime ? undefined : 'Choose a preferred time.',
      address: appointmentType === 'home' && !homeAddress.trim() ? 'Enter your home address for the visiting doctor.' : undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.date || nextErrors.time || nextErrors.address) return;
    setSubmitError('');
    setStep('review');
  };

  const submitRequest = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload: Record<string, any> = {
        bookedDate: preferredDate,
        bookedTime: preferredTime,
        ...(reason.trim() ? { patientNote: reason.trim() } : {}),
        status: 'Requested',
      };
      if (appointmentType !== 'clinic') {
        payload.appointmentType = appointmentType;
      }
      if (appointmentType === 'home' && homeAddress.trim()) {
        payload.homeAddress = homeAddress.trim();
      }

      const result = await firebaseService.addAppointment(userId, payload);
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
              {appointmentType === 'home' ? (
                <Home size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-action" />
              ) : appointmentType === 'virtual' ? (
                <Video size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-action" />
              ) : (
                <Building2 size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-action" />
              )}
              <div>
                <dt className="text-small font-semibold text-foreground-secondary">Consultation type</dt>
                <dd className="mt-1 text-body font-semibold text-foreground">{formatModeLabel(appointmentType)}</dd>
              </div>
            </div>
            {appointmentType === 'home' && homeAddress && (
              <div className="flex gap-4 py-4">
                <MapPin size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-action" />
                <div>
                  <dt className="text-small font-semibold text-foreground-secondary">Home visit location</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-body text-foreground">{homeAddress}</dd>
                </div>
              </div>
            )}
            <div className="flex gap-4 py-4">
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
        description="Share your preferred consultation type, date and time. The clinic has not confirmed availability at this stage."
      />
      <form noValidate onSubmit={reviewRequest} className="max-w-2xl space-y-6">
        <Card as="section" className="space-y-5 shadow-none">
          {/* Consultation Type Selector */}
          <div>
            <label className="block text-small font-semibold text-foreground">
              Consultation type <span className="text-status-danger" aria-hidden="true">*</span>
            </label>
            <p className="mt-1 text-caption text-foreground-secondary">
              Select how you would like to receive care: in clinic, virtually, or a home visit by a healthcare professional.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Consultation type">
              {/* Option 1: Clinic Visit */}
              <button
                type="button"
                role="radio"
                aria-checked={appointmentType === 'clinic'}
                onClick={() => setAppointmentType('clinic')}
                className={`flex flex-col justify-between rounded-[20px] p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson ${
                  appointmentType === 'clinic'
                    ? 'border-2 border-wa-crimson bg-wa-rose/40 dark:bg-wa-rose/10 text-wa-plum dark:text-white'
                    : 'border border-wa-line-soft bg-wa-surface hover:bg-wa-ground/60 dark:border-white/10 dark:bg-white/5 text-wa-plum dark:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                      appointmentType === 'clinic' ? 'bg-wa-crimson text-white' : 'bg-wa-ground dark:bg-white/10 text-wa-crimson'
                    }`}>
                      <Building2 size={18} />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-wa-plum-muted dark:text-wa-on-plum-muted">
                      In-Person
                    </span>
                  </div>
                  <div className="mt-3 font-display text-sm font-bold">Clinic visit</div>
                  <p className="mt-0.5 text-xs text-wa-plum-muted dark:text-wa-on-plum-muted leading-tight">
                    Visit your specialist hospital or clinic
                  </p>
                </div>
              </button>

              {/* Option 2: Virtual Consultation */}
              <button
                type="button"
                role="radio"
                aria-checked={appointmentType === 'virtual'}
                onClick={() => setAppointmentType('virtual')}
                className={`flex flex-col justify-between rounded-[20px] p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson ${
                  appointmentType === 'virtual'
                    ? 'border-2 border-wa-crimson bg-wa-rose/40 dark:bg-wa-rose/10 text-wa-plum dark:text-white'
                    : 'border border-wa-line-soft bg-wa-surface hover:bg-wa-ground/60 dark:border-white/10 dark:bg-white/5 text-wa-plum dark:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                      appointmentType === 'virtual' ? 'bg-wa-crimson text-white' : 'bg-wa-ground dark:bg-white/10 text-wa-crimson'
                    }`}>
                      <Video size={18} />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-wa-plum-muted dark:text-wa-on-plum-muted">
                      Online
                    </span>
                  </div>
                  <div className="mt-3 font-display text-sm font-bold">Virtual consult</div>
                  <p className="mt-0.5 text-xs text-wa-plum-muted dark:text-wa-on-plum-muted leading-tight">
                    Secure video or phone call with doctor
                  </p>
                </div>
              </button>

              {/* Option 3: Home Visit */}
              <button
                type="button"
                role="radio"
                aria-checked={appointmentType === 'home'}
                onClick={() => setAppointmentType('home')}
                className={`flex flex-col justify-between rounded-[20px] p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa-crimson ${
                  appointmentType === 'home'
                    ? 'border-2 border-wa-crimson bg-wa-rose/40 dark:bg-wa-rose/10 text-wa-plum dark:text-white'
                    : 'border border-wa-line-soft bg-wa-surface hover:bg-wa-ground/60 dark:border-white/10 dark:bg-white/5 text-wa-plum dark:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                      appointmentType === 'home' ? 'bg-wa-crimson text-white' : 'bg-wa-ground dark:bg-white/10 text-wa-crimson'
                    }`}>
                      <Home size={18} />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-wa-crimson font-black">
                      Doctor to House
                    </span>
                  </div>
                  <div className="mt-3 font-display text-sm font-bold">Home visit</div>
                  <p className="mt-0.5 text-xs text-wa-plum-muted dark:text-wa-on-plum-muted leading-tight">
                    Doctor or nurse comes to your house
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Mode Notices */}
          {appointmentType === 'virtual' && (
            <Alert tone="info" title="Virtual consultation setup">
              Your clinic will provide video connection or phone details when confirming your requested slot.
            </Alert>
          )}

          {appointmentType === 'home' && (
            <div className="space-y-4">
              <Alert tone="neutral" title="Home visits are for supportive non-emergency care">
                A doctor or clinical nurse will be dispatched to your residential address. Availability depends on clinic location and coverage area. For acute emergencies or sudden severe pain crises, use the Emergency SOS button immediately.
              </Alert>

              <FormField
                label="Home visit address & location details"
                required
                error={errors.address}
                helpText="Provide your full residential address, apartment/flat number, and any nearby landmark for the visiting clinician."
              >
                <Textarea
                  value={homeAddress}
                  onChange={(event) => {
                    setHomeAddress(event.target.value);
                    if (event.target.value) setErrors((current) => ({ ...current, address: undefined }));
                  }}
                  rows={3}
                  placeholder="e.g. 14 Admiralty Way, Flat 3B, Lekki Phase 1, Lagos (Near the central roundabout)"
                />
              </FormField>
            </div>
          )}

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
              placeholder="Briefly describe what you would like to discuss (e.g. routine check-up, recent pain flare review, medication adjustment)"
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

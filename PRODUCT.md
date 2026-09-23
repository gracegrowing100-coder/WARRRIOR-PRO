# Warrior AI

## Product purpose

Warrior AI helps people living with sickle cell disease record daily health
information, understand changes over time, and share a clearer summary with the
healthcare team responsible for their care.

The first clinical product is a patient-monitoring and follow-up tool for a
specialist clinic in Lagos. It is intended to reduce the information gap between
scheduled visits by making pain, symptoms, hydration, medication, appointments,
and relevant alerts easier to record and review.

Warrior AI does not diagnose a crisis, replace a clinician, or guarantee an
emergency response.

## Primary users

### Patient

A diagnosed sickle cell patient who records daily status and reviews personal
trends. A caregiver may perform the same actions for a child or dependent when
the eventual permissions model allows it.

### Caregiver

A parent, guardian, or trusted supporter who helps a patient record information
and follow an agreed care plan. The current application contains caregiver
features, but a complete consent and delegated-access model is not yet present.

### Healthcare professional

A sickle-cell programme nurse, programme coordinator, pharmacist, or doctor who
reviews patient-reported information and decides whether human follow-up is
required. The current production application does not yet provide a complete,
role-protected clinician workspace.

## Core patient problem

Patients and clinic staff currently depend heavily on scheduled visits, paper
records, telephone calls, and informal messaging. Important changes between
visits can be forgotten, recorded inconsistently, or discovered late. Staff also
lack a concise, reliable view of which patients may need attention first.

## Core clinic problem

Clinic staff cannot continuously review every patient. A useful pilot must make
routine monitoring faster, highlight incomplete or concerning patient-reported
information, and keep the clinician in control of every care decision.

## Product principles

- Calm before clever: the interface should reassure and orient the patient.
- Fast daily use: routine check-in should take less than a few minutes.
- Human-reviewed care: software can organize signals; clinicians decide care.
- Explain status: patients should know whether data is saved locally, saved to
  the cloud, pending, or unavailable.
- Mobile first: the main workflows must work from approximately 360px upward.
- Low-connectivity tolerant: useful logging and guidance should degrade safely
  when connectivity is poor.
- Preserve trust: never claim an alert, prediction, encryption property, or
  clinical result that the system cannot verify.
- Accessible and multilingual: plain language, visible labels, keyboard access,
  and support for English, Yoruba, Hausa, and Igbo where content is approved.

## Existing capabilities

- Email/password and Google popup authentication, password reset, inline signup
  profile setup, and a three-step recovery onboarding screen for authenticated
  users whose profile record is missing.
- Patient, caregiver, and healthcare-professional role selection.
- Daily mood and wellness check-in.
- Pain, symptom, trigger, hydration, and medication tracking.
- Trend charts and generated report surfaces. Some current chart series include
  simulated or inferred values and are not purely patient-recorded history.
- Appointment booking and cancellation.
- Browser reminders and notification permission handling.
- Emergency information, caregiver details, and an ER toolkit.
- Care Vault records, chat, community, education, games, and advocacy.
- Dark mode, high-contrast mode, and four-language UI elements.
- Firebase persistence with feature-specific local-storage fallbacks. Fallback
  coverage and error behavior are not uniform, and there is no general replay
  queue.
- A service worker and an offline multilingual knowledge base.
- A synthetic patient check-in and nurse-queue demonstration that does not
  write patient data to Firebase.

See [`docs/CURRENT_STATE.md`](./docs/CURRENT_STATE.md) for the implementation
baseline.

## MVP priorities

The first pilot-grade MVP should prove a narrow monitoring loop:

1. Enrol an approved group of diagnosed patients at one specialist clinic.
2. Let patients complete a simple daily check-in.
3. Record pain, symptoms, hydration, and medication adherence quickly.
4. Show the patient an understandable daily summary and recent history.
5. Give an assigned clinic professional a human-review queue and patient summary
   after the workflow and permissions are validated.
6. Support low-connectivity logging with honest data-state messaging.
7. Measure adoption, completion, follow-up workload, and data quality during a
   12-week pilot.

The current planning assumption is up to 50 newly enrolled patients per week.
That number is a founder estimate, not verified clinic capacity. It must be
validated with the proposed clinical champion before it becomes an operational
commitment.

## Safety boundaries

- Patient-entered information is not a diagnosis.
- Automated pattern summaries are not clinical predictions.
- No AI output may autonomously prescribe treatment, change medication, triage a
  patient, or contact emergency services.
- High-risk information must recommend appropriate human or emergency review
  without claiming certainty.
- Care-facing AI output requires source visibility and clinician approval.
- Patient data must not be used for model training without explicit authority,
  a lawful basis, governance, de-identification where required, and a documented
  validation protocol.

## Experimental features

These features may appear only in a clearly labelled synthetic demonstration or
research track until separately validated:

- Forecasting the timing or probability of a sickle-cell crisis.
- Estimating PCV or haemoglobin-related values from eye images.
- AI-generated clinician briefs or pattern confidence scores.
- A multilingual “AI haematologist”. The acceptable product concept is an
  educational or documentation assistant with escalation to a human clinician,
  not a replacement specialist.
- Automated research-paper discovery and multilingual summarisation.

## Out of scope for the first redesign

- Training a clinical machine-learning model.
- Deploying eye-based PCV estimation to real patients.
- Autonomous diagnosis, treatment, triage, or emergency dispatch.
- A production clinician dashboard before permissions, patient assignment,
  alert ownership, escalation times, and clinic staffing are agreed.
- SMS and USSD production integration until providers, consent, costs, and
  operational ownership are defined.
- Replacing the current Firebase data model solely for visual redesign reasons.

## Pilot assumptions requiring confirmation

- Proposed owner: a specialist sickle-cell clinic in Lagos.
- Proposed clinical champion: a named sickle-cell programme nurse or programme
  coordinator.
- Supporting reviewers: nurses, pharmacists, and doctors within the clinic.
- Proposed duration: 12 weeks.
- Founder enrolment estimate: 50 new patients per week.
- Still unconfirmed: the champion’s most painful workflow, review capacity,
  alert thresholds, response expectations, consent process, and success targets.

## Success criteria

The pilot should define numeric targets before enrolment. At minimum it should
measure:

- Enrolled patients who complete onboarding.
- Weekly active patients and daily/weekly check-in completion.
- Median time needed to complete a check-in.
- Medication and hydration logging completion.
- Percentage of patient records that staff can review without clarification.
- Number and type of human follow-ups generated.
- Staff time required to review the patient list.
- Retention through weeks 4, 8, and 12.
- Offline/local-fallback usage and recovery failures.
- Safety incidents, false reassurance, confusing advice, and missed escalation.

Clinical-outcome claims must not be made from the pilot unless the study design,
sample, approvals, and analysis support them.

# Screen specifications

These specifications define the screen purpose and hierarchy for the redesign.
They do not authorize changes to the data contracts in `DATA_CONTRACTS.md`.

## Priority map

| Priority | Screens |
|---|---|
| P0 | Application shell, Home, Daily check-in, Pain check-in, Symptom check-in, Hydration, Medication |
| P1 | Trends, Appointments, Notifications/reminders, Profile/settings, Authentication/onboarding |
| P2 | Care Vault, Chat, Community, Education/games, Advocacy/research |
| Deferred | Production clinician overview, patient list, review queue, and patient detail |

## Shared screen requirements

Every screen must define:

- A clear page title and one primary purpose.
- One dominant primary action where an action is required.
- Loading, empty, success, error, and offline behavior where relevant.
- Visible labels and patient-safe validation.
- Approximately 44px minimum action targets.
- Keyboard navigation and visible focus.
- Text and icon support for status; color is never the only indicator.
- No uncontrolled horizontal scrolling at 360px.
- Restrained motion that respects reduced-motion preferences.

## P0: Application shell

### Purpose

Provide stable navigation, current page context, account access, connectivity
state, and emergency access without competing with page content.

### Content hierarchy

1. Page title/context.
2. Notification indicator where supported.
3. Account/profile action.
4. Main content.
5. Six top-level destinations, with mobile presentation validated in Phase 2.2B.
6. Emergency/help action.

### Mobile

- Target destinations: Home, Chat, Care, Community, More, and Profile.
- Phase 2.2B must determine whether all six appear in bottom navigation or
  whether the five activity destinations appear there while Profile remains
  persistently accessible through the application header.
- Icon and visible short label for every destination.
- Validate at 360px, 375px, 390px, and 430px without reducing accessible target
  sizes or shrinking labels merely to fit six items.
- Global actions must not overlap form submit buttons or the bottom bar.
- Connectivity state uses a short label; detailed explanation belongs in a
  disclosure or status sheet.

### Desktop

- Labelled left sidebar based on the same six top-level destinations.
- Page header and constrained content column.
- No icon-only primary navigation.

### Existing logic to preserve

Authentication gate, hash destinations, theme, high contrast, language,
profile, synthetic demo, emergency component, and offline assistant.

## P0: Home

### Purpose

Give the patient an immediate understanding of today’s health and next actions.

### Primary action

Complete or update today’s check-in.

### Content hierarchy

1. Greeting and date.
2. Current health status with last-updated time.
3. Daily check-in.
4. Today’s pain and hydration.
5. Medication due/taken summary.
6. Next appointment.
7. Short seven-day trend summary.
8. Crisis/help.

Full reminders, Care Vault, mental-wellness history, generated reports, and
administrative forms must move to their owning sections.

### States

- **Loading:** skeleton for status and today cards.
- **Empty:** invite the patient to start today’s check-in.
- **Error:** explain what failed and offer retry without losing local data.
- **Offline:** show which information is local and whether cloud state is known.
- **Success:** concise “Check-in saved” confirmation.

### Mobile

Use a single-column reading order. The first viewport should establish status
and the next action, not a decorative hero.

### Desktop

Use a restrained two-column layout only where it improves scanning. Keep the
health status and daily action dominant.

### Existing logic to preserve

Daily mood data, pain and symptom refresh, hydration, medication, trends,
appointments when added to the summary, and emergency access.

## P0: Daily check-in

### Purpose

Record a quick daily wellness state with optional context.

### Primary action

Save today’s check-in.

### Content hierarchy

1. “How are you feeling today?”
2. Clearly labelled choices.
3. Optional note.
4. Save state and data-status message.

### States

Show previously saved data when editing. Prevent duplicate submission. Preserve
the local result if the cloud write fails.

### Existing logic to preserve

`saveDailyMoodCheckIn`, the linked mood-history entry, current date key, and
streak update.

## P0: Pain check-in

### Purpose

Record current pain quickly and safely.

### Primary action

Save pain entry.

### Content hierarchy

1. 0–10 pain selection with text anchors.
2. Optional body location when supported.
3. Optional triggers.
4. Optional note if added to the data contract later.
5. Severity summary.
6. Escalation guidance for concerning input.

### Accessibility

The score control must work by keyboard and announce its value. Faces may
supplement but cannot replace the numeric/text scale.

### Existing logic to preserve

Daily upsert by `dateStr`, trigger array, local cache, Firestore path, and pain
trend compatibility.

## P0: Symptom check-in

### Purpose

Record symptoms and related daily context with minimal friction.

### Primary action

Save symptom check-in.

### Content hierarchy

1. Symptom choices.
2. Pain value.
3. Triggers.
4. Water intake.
5. Review and save.

### Mobile

Use large wrap-safe choice controls. Keep the save action visible after the
content, not underneath global floating controls.

### Existing logic to preserve

Daily symptom upsert and, for an authenticated successful symptom Firestore
write, the linked updates to pain, hydration, and streak. Preserve and test the
different guest and failure paths explicitly.

## P0: Hydration

### Purpose

Show today’s progress and make adding water encouraging and fast.

### Primary action

Add water.

### Content hierarchy

1. Current amount and goal.
2. Remaining amount in supportive language.
3. Common quick-add amounts.
4. Manual adjustment/reset where retained.
5. Seven-day history link or compact chart.

### Existing logic to preserve

Date document, amount, goal, local key, default 3.0 goal, and seven-day loader.

## P0: Medication

### Purpose

Help the patient understand what is due and record a dose.

### Primary action

Mark the next due medication as taken.

### Content hierarchy

1. Next due medication.
2. Today’s schedule and status.
3. Adherence summary.
4. Medication management.
5. Reminder settings.

### States

Due, taken, missed, upcoming, empty, saving, save failed, and local-only must be
visually and textually distinct.

### Existing logic to preserve

Medication list/create/delete, current record fields, Firestore list ordering by
`time`, exact-time alarm behavior, taken-state updates through
`lastTakenDate`, the generic update service, and notification permission. The
current UI has no edit-details flow and only labels items `Pending` or `Taken`.

## P1: Trends

### Purpose

Help the patient understand history without asking them to interpret a clinical
dashboard.

### Primary action

Change metric or time period.

### Content hierarchy

1. Plain-language summary.
2. Metric/time controls.
3. Accessible chart.
4. Recorded events/list.
5. Share/export when supported.

### Existing logic to preserve

Pain, symptoms, hydration, mood, and Care Vault laboratory data loaders and
Recharts datasets. There is no current medication-adherence chart or medication
trend loader. The pain chart's simulated unlogged days and the mood chart's
inferred/placeholder values must not be presented as recorded patient history.
Generated correlations remain experimental.

## P1: Appointments

### Purpose

View, book, and cancel planned care.

### Content hierarchy

1. Next confirmed appointment.
2. Book appointment action.
3. Upcoming list.
4. Past/cancelled list.

Seeded clinician profiles and simulated video calls must not appear as verified
clinical services without operational support.

### Existing logic to preserve

Appointment create/list/cancel methods and existing record fields, including the
current local-provisional/immediate-cloud-refresh behavior on failed creates.

## P1: Notifications and reminders

### Purpose

Manage local browser reminders and, later, review defined health/system notices.

### Content hierarchy

1. Browser permission state.
2. Enabled reminders.
3. Add reminder.
4. Test notification.
5. Future notification inbox after lifecycle rules exist.

### Existing logic to preserve

Browser Notification API behavior and scheduled-reminder persistence.

## P1: Profile and settings

### Purpose

Manage identity, accessibility, language, appearance, emergency information,
privacy, and sign-out.

### Mobile

Use a full screen rather than a narrow side drawer when forms require editing.

### Existing logic to preserve

Profile reads/writes, language, theme, high contrast, and sign-out.

## P1: Authentication and onboarding

### Purpose

Explain the product, establish a secure session, and collect only required
profile information.

### Content hierarchy

1. Product purpose and safety statement.
2. Sign in / create account / request pilot access.
3. Synthetic demo entry.
4. Password recovery.
5. Progressive onboarding after registration.

Role selection must not imply that an unverified professional receives
clinician permissions.

Current-flow note: ordinary registration performs profile/health setup inside
the signup form and opens the app. The separate three-step onboarding screen is
currently reached only when an existing authenticated account has no profile.

## P2: Care Vault

### Purpose

Store and present longitudinal records and emergency information outside the
daily tracking flow.

Decompose its current tabs into separately maintainable feature sections. Keep
the existing Firestore document compatible until a deliberate migration exists.

## P2: Community and secondary experiences

Chat and Community remain first-class destinations. Education/Games,
Advocacy/Research, genotype education, and other secondary tools are reached
through More unless a later approved usability decision establishes another
location. All of these surfaces should inherit the stable design primitives
after the patient MVP screens are complete, and their content and data behavior
remain preserved.

## Deferred clinician screens

Do not implement clinician Overview, Patients, Review Queue, Patient Detail, or
Reports from this document alone. They require a separate approved specification
covering clinic tenancy, permissions, assignment, alerts, review ownership,
audit history, and escalation expectations.

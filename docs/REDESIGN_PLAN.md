# Phased redesign plan

The redesign proceeds one verified phase at a time. A phase is not complete
until its code, responsive behavior, accessibility, data behavior, and relevant
regression checks pass.

## Delivery rules

- Do not redesign the whole application in one change.
- Preserve current routes and data contracts until an explicit migration phase.
- Build primitives before feature-specific styling.
- Use the patient MVP screens to establish the visual system.
- Keep experimental AI separate from clinical MVP workflows.
- End every phase with `npm run lint`, the relevant regression subset, console
  review, responsive checks, and a visual review against `../../DESIGN.md`.

## Phase 0: Regression protection

### Goal

Create a reliable baseline before moving UI structure.

### Work

- Fix or formally capture the direct-hash startup defect.
- Record route, element-ID, Firebase, local-storage, API, and notification
  dependencies.
- Add smoke coverage for authentication, logging, medication, hydration,
  appointments, settings, and the synthetic demo.
- Capture baseline screenshots at 360, 375, 768, 1200, and 1440px.
- Capture current browser console warnings.
- Establish approved test accounts and isolated browser-storage fixtures.

### Exit gate

Critical user flows have repeatable test evidence and existing data can be read.

## Phase 1: Design tokens and primitives

### Goal

Implement the reusable system from `../../DESIGN.md` without redesigning feature
screens yet.

### Work

- Semantic navy, red, neutral, status, typography, spacing, radius, border, and
  shadow tokens.
- Button and icon-button variants.
- Form field, label, help, and error primitives.
- Card, metric card, status badge, progress, alert, and callout.
- Skeleton, empty, success, error, offline, and save-status components.
- Modal, drawer, and mobile bottom-sheet behavior.
- Chart container and accessible summary pattern.
- Reduced-motion treatment.

### Exit gate

Primitive gallery or isolated examples pass light/dark/high-contrast,
keyboard, target-size, and mobile checks.

## Phase 2: Application shell

### Goal

Introduce the five-destination information architecture while preserving every
existing destination.

### Work

- Central route map and initial-hash handling.
- Mobile navigation: Home, Track, Care, Connect, More.
- Labelled desktop sidebar.
- Simplified responsive header.
- Notification, account, connectivity, and emergency placement.
- Compatibility redirects/mappings for existing hashes.
- Remove overlap between floating controls and primary content.

### Exit gate

Every old route remains reachable, deep links open correctly, and navigation
works by keyboard at all target widths.

## Phase 3: Patient Home

### Goal

Make Home a calm daily summary rather than a complete application inventory.

### Work

- Greeting, date, health status, and last update.
- Daily check-in.
- Pain, hydration, and medication summaries.
- Next appointment.
- Short trend summary.
- Crisis/help entry.
- Move full trackers, reports, reminders, wellness history, and Care Vault to
  their owning sections.

### Exit gate

The first mobile viewport communicates status and next action. No important
workflow or data loader is removed.

## Phase 4: Pain and symptom tracking

### Goal

Create fast, accessible, safe daily logging flows.

### Work

- Consolidated pain check-in.
- Consolidated symptom check-in.
- Numeric/text pain anchors and optional simple body location.
- Trigger and symptom choice primitives.
- Clear save, local fallback, error, and severe-state feedback.
- Protect symptom-to-pain/hydration coupled writes.

### Exit gate

Pain and symptom flows pass keyboard, 360px, online, local fallback, and linked
data regression checks.

## Phase 5: Hydration and medication

### Goal

Make routine adherence actions quick and unambiguous.

### Work

- Encouraging hydration progress and quick-add controls.
- Due/taken/missed/upcoming medication states.
- Medication management and reminder entry.
- Duplicate/default medication safeguards.
- Text alternatives for progress and status.

### Exit gate

Existing records remain readable and all CRUD/logging checks pass without
cross-account cache contamination in test fixtures.

## Phase 6: Appointments and trends

### Goal

Surface planned care and understandable personal history.

### Work

- Appointment summary on Home and full management under Care.
- Separate upcoming, past, and cancelled states.
- Stable chart containers.
- Metric/time filters and textual chart summaries.
- Experimental labels for generated correlations and reports.

### Exit gate

Booking/cancellation pass, charts render without size warnings, and no generated
pattern is presented as a validated prediction.

## Phase 7: Profile, notifications, onboarding, and authentication

### Goal

Apply the stable design system to account and supporting patient workflows.

### Work

- Profile/settings screen and accessible account trigger.
- Language, theme, high contrast, emergency information, and sign-out.
- Reminder permission and management UI.
- Notification inbox only if its lifecycle has been defined.
- Auth, recovery, and progressive onboarding.
- Clear pilot-access and synthetic-demo choices.

### Exit gate

Auth and settings regressions pass, raw backend errors are hidden, and the
professional role does not bypass authorization.

## Phase 8: Care Vault decomposition

### Goal

Break the monolithic Care Vault into maintainable sections without data loss.

### Work

- Extract feature modules and shared record components.
- Preserve `careVault/medicalHistory` compatibility.
- Separate daily tracking from longitudinal records.
- Distinguish verified patient data from seeded/demo content.
- Review the local unlock mechanism and security language.

### Exit gate

An existing Care Vault fixture loads, edits, saves, exports, and reopens without
field loss.

## Phase 9: Secondary experiences

### Goal

Apply the system to Connect and More content after the patient MVP is stable.

### Work

- Chat and peer-support surfaces.
- Community and support centres.
- Education and games.
- Advocacy, research, and genotype education.
- Consistent loading/error/empty behavior and navigation.

### Exit gate

Existing routes, chat/media operations, posts, education progress, and local
assistant history remain functional.

## Phase 10: Accessibility, responsive, offline, and performance QA

### Goal

Verify the product as one coherent system.

### Work

- WCAG 2.2 AA review where practical.
- Keyboard and screen-reader naming audit.
- 360px through 1440px responsive pass.
- Reduced motion and high contrast.
- Network-loss and local-fallback scenarios.
- Service-worker update behavior.
- Bundle and route-loading review.
- Final console, chart, and error-state cleanup.

### Exit gate

The full regression checklist passes, known exceptions are documented, and the
patient experience satisfies the acceptance criteria in `../../DESIGN.md`.

## Deferred track: Clinician product

Begin only after a clinic confirms:

- Clinical champion and programme owner.
- Patient enrolment and assignment model.
- Which signals create a review item.
- Who owns review and within what time.
- Escalation and callback procedures.
- Role verification, clinic tenancy, consent, and audit requirements.
- Pilot success measures and realistic weekly capacity.

The synthetic nurse queue can demonstrate the concept but is not the production
clinician architecture.

## Deferred track: Experimental AI validation

Crisis prediction, eye-based PCV estimation, multilingual clinical assistance,
and research summarisation require separate data, validation, governance, and
human-review plans. They must not block the patient monitoring redesign or be
smuggled into it as ordinary UI components.


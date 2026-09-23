# Information architecture

The current product’s main UX problem is not its color palette. Home owns too
many unrelated jobs, while six persistent destinations compete for limited
mobile space. This document defines the target navigation model for the
incremental redesign.

## Current structure

```text
HOME
├── Wisdom and status
├── Mood check-in
├── Pain and symptoms
├── Hydration
├── Medication
├── Reminders
├── AI insights and reports
├── Caregiver
├── Trends
├── Mental wellness
└── Care Vault
    ├── Symptoms
    ├── Mood
    ├── Hydration
    ├── Prediction
    ├── Emergency toolkit
    ├── Diagnostics
    ├── Procedures
    ├── Medication
    ├── Labs
    └── Passport

PLAY        CHAT        CARE        GROUP        ACT
```

Problems:

- Home mixes today’s actions, history, records, AI, settings, and education.
- Six bottom items fall below the intended mobile target size.
- Labels such as Play, Care, Group, and Act do not describe the full contents.
- Several features appear in more than one place.
- Desktop navigation hides labels even though space is available.

## Target primary navigation

The target patient shell has five persistent destinations:

```text
HOME        TRACK        CARE        CONNECT        MORE
```

The emergency action is a global safety action, not a sixth navigation
destination.

### Home

Purpose: answer “How am I today, and what should I do next?”

- Greeting and current health status.
- Daily check-in.
- Today’s pain, hydration, and medication summary.
- Next medication and next appointment.
- Short, readable trend summary.
- Crisis/help entry.

Home must link to deeper workflows instead of embedding their full history and
administration interfaces.

### Track

Purpose: record health and review personal history.

- Daily check-in.
- Pain.
- Symptoms and triggers.
- Hydration.
- Medication and adherence.
- Mood/wellness where retained in the MVP.
- Trends and history.

Track should use task-level tabs or a short menu. It must not render all trackers
simultaneously on mobile.

### Care

Purpose: manage planned human care and share useful summaries.

- Appointments.
- Care team/contact information when real data exists.
- Reports and export.
- Approved clinic messages or callbacks when implemented.
- Telemedicine surfaces that have real operational support.

Seeded clinicians and simulated calls must be visibly labelled or removed from
the clinical MVP surface.

### Connect

Purpose: access social support and education without competing with daily health
tasks.

- Chat.
- Community circles and support centres.
- Peer-support concepts.
- Sickle-cell education and academy.
- Games and learning experiences.

On desktop, Chat, Community, and Learn may appear as secondary items under the
Connect section. Their existing routes remain valid during migration.

### More

Purpose: house important but non-daily destinations.

- Notifications and reminders.
- Care Vault and clinical passport.
- Emergency information settings.
- Advocacy and research.
- Profile.
- Accessibility, language, and appearance settings.
- About, privacy, and sign-out.

## Global actions

Global actions are available from appropriate screens without becoming
persistent navigation destinations:

- Emergency/help.
- Notifications indicator.
- Profile/account.
- Offline/save status.

On mobile, global actions must not obscure form controls or bottom navigation.

## Route preservation and migration

The first shell refactor should preserve existing hashes:

| Existing hash | Target ownership |
|---|---|
| `#/home` | Home |
| `#/games` | Connect > Learn |
| `#/chat` | Connect > Chat |
| `#/telemedicine` | Care > Appointments/Care |
| `#/community` | Connect > Community |
| `#/advocacy` | More > Advocacy |

New Track, More, and nested destinations should be introduced through one
central route table. Existing hashes may redirect to their new destinations,
but bookmarks must not silently open the wrong screen.

## Mobile behavior

- Show icon and short text label for all five persistent destinations.
- Keep every destination’s target approximately 44px or larger.
- Keep active state visible without relying only on color.
- Use a bottom sheet or full screen for secondary actions, not hover-only menus.
- Keep emergency/help reachable but visually separate from normal navigation.
- Avoid horizontally scrolling primary navigation.

## Desktop behavior

- Convert the same five-destination model to a labelled left sidebar.
- Do not create a second competing navigation tree.
- Show section context and page title in the header.
- Constrain patient content according to `../../DESIGN.md`; do not stretch
  tracking forms across the full viewport.

## Clinician information architecture

Do not reuse the patient shell for a future clinician product. When approved,
the clinician workspace should begin from actual responsibilities:

```text
OVERVIEW
PATIENTS
REVIEW QUEUE
REPORTS
SETTINGS
```

This structure remains deferred until clinic membership, patient assignment,
alert ownership, escalation, and permissions are specified.

## Content ownership rules

- Home owns summaries, not full histories.
- Track owns patient-entered health data.
- Care owns human clinical interaction and appointments.
- Connect owns social and educational experiences.
- More owns records, settings, advocacy, and infrequent administration.
- One task should have one primary entry flow. Other surfaces link to it.

## Related documents

- [User flows](./USER_FLOWS.md)
- [Screen specifications](./SCREEN_SPECIFICATIONS.md)
- [Requirements](./REQUIREMENTS.md)


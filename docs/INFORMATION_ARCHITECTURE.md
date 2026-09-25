# Information architecture

The current product’s main UX problem is not its color palette. Home owns too
many unrelated jobs, and the current navigation labels do not clearly express
feature ownership. This document defines the target navigation model for the
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

The target patient information architecture has six top-level destinations:

```text
HOME        CHAT        CARE        COMMUNITY        MORE        PROFILE
```

Whether all six appear in persistent mobile navigation is deferred to Phase
2.2B. The emergency action is a global safety action, not another navigation
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

### Chat

Purpose: answer “I want to ask Warrior AI something.”

- Existing Chat experience.
- AI assistant interaction.
- Existing compatible chat functionality.

Preserve the current Chat feature and route during migration.

### Care

Purpose: manage planned human care and share useful summaries.

- Appointments.
- Health records and Care Vault.
- Health history.
- Care team/contact information when real data exists.
- Trends, reports, and export where appropriate.
- Medication management beyond today's Home summary.
- Approved clinic messages or callbacks when implemented.
- Telemedicine surfaces that have real operational support.

Seeded clinicians and simulated calls must be visibly labelled or removed from
the clinical MVP surface.

### Community

Purpose: answer “I want to connect with other warriors.”

- Existing Community experience.
- Community circles and support centres.
- Peer-support concepts.
- Related social and support functionality.

Community remains a first-class destination.

### More

Purpose: answer “Show me the other things Warrior AI offers.”

- Games and learning experiences.
- Sickle-cell education and academy.
- Advocacy and research.
- Research and updates where applicable.
- Other secondary tools that do not justify persistent navigation.

Games and education must remain reachable through More unless later usability
work establishes an approved alternative.

### Profile

Purpose: answer “My account and preferences.”

- Personal profile and account information.
- Language, theme, high contrast, and accessibility settings.
- Caregiver and profile-related settings where appropriate.
- Sign out.

The existing Profile overlay may remain temporarily. A dedicated Profile screen
can be introduced in its scheduled redesign phase.

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
| `#/games` | More > Games/Education |
| `#/chat` | Chat |
| `#/telemedicine` | Care > Appointments/Care |
| `#/community` | Community |
| `#/advocacy` | More > Advocacy |

New destinations and nested destinations should be introduced through one
central route table. Existing hashes must remain available during migration
unless a later approved phase explicitly removes them; bookmarks must not
silently open the wrong screen.

## Mobile behavior

- Validate the six top-level destinations at 360px, 375px, 390px, and 430px.
- Phase 2.2B must determine whether all six appear persistently or whether Home,
  Chat, Care, Community, and More appear in bottom navigation while Profile
  remains persistently accessible through the header.
- Show an icon and short text label for every bottom-navigation destination.
- Keep every destination’s target approximately 44px or larger.
- Keep active state visible without relying only on color.
- Use a bottom sheet or full screen for secondary actions, not hover-only menus.
- Keep emergency/help reachable but visually separate from normal navigation.
- Avoid horizontally scrolling primary navigation.
- Do not shrink labels or controls below accessibility requirements to fit six
  items.

## Desktop behavior

- Present the same six top-level destinations in a labelled left sidebar.
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

- Home owns today's health summary and prominent links to daily health actions.
- Chat owns the existing Warrior AI conversation experience.
- Care owns human clinical interaction, appointments, records, Care Vault,
  longitudinal history, appropriate trends/reports, and deeper medication
  management.
- Community owns community interaction and peer support.
- More owns games, education, advocacy, research, updates, and other secondary
  tools.
- Profile owns account information, preferences, accessibility, and sign-out.
- One task should have one primary entry flow. Other surfaces link to it.

## Related documents

- [User flows](./USER_FLOWS.md)
- [Screen specifications](./SCREEN_SPECIFICATIONS.md)
- [Requirements](./REQUIREMENTS.md)

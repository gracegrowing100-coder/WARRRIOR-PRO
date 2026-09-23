# Current application state

This document records what exists in the Warrior Cell application today. It is
a brownfield baseline, not a promise that every visible feature is clinically
validated or production-ready.

Last source audit: 23 September 2026.

## Architecture

| Layer | Current implementation |
|---|---|
| UI | React 19.2 with TypeScript 5.8 |
| Build | Vite 6 with the React plugin |
| Server | Express 5, run with `tsx` in development and bundled with esbuild |
| Authentication | Firebase Authentication |
| Database | Firestore |
| Media | Firebase Storage for chat images, with inline Base64 fallback |
| Styling | Tailwind CSS 3.4, PostCSS, and global CSS |
| Icons | Lucide React, plus emoji used throughout existing content |
| Charts | Recharts |
| Animation | Motion 12 and CSS/Tailwind animations |
| Reports | jsPDF and html2canvas |
| AI endpoints | Express proxy using `@google/genai`, with curated fallbacks |
| Offline surfaces | Service worker, local storage, Firebase client behavior, and a local multilingual knowledge base |

`index.tsx` renders `App.tsx`. `App.tsx` owns authentication resolution,
language, theme, high contrast, synthetic-demo mode, current page state, the
header, and primary navigation.

Most feature state lives inside individual components. `services/firebaseService.ts`
centralizes the main Firestore and local-storage operations, but several UI
components still combine presentation, domain decisions, audio effects, and
persistence calls.

## Current navigation

Navigation uses custom hash state rather than React Router, although
`react-router-dom` is installed.

| Hash | Screen | Component |
|---|---|---|
| `#/home` | Patient dashboard | `Dashboard` |
| `#/games` | Games and education | `GamesHub` |
| `#/chat` | Chat and peer-support surfaces | `ChatSystem` |
| `#/telemedicine` | Appointments and remote-care concepts | `Telemedicine` |
| `#/community` | Community and support centres | `Community` |
| `#/advocacy` | Advocacy and research content | `Advocacy` |

The mobile shell renders all six destinations in a fixed bottom bar. At the
Tailwind `md` breakpoint it becomes an 80px-wide left rail. The header remains
sticky and the main content is constrained to `max-w-5xl`.

Known routing defect: `App.tsx` registers a `hashchange` listener but does not
apply the existing hash when the app first mounts. Opening a deep link can show
Home until another navigation action occurs.

## Existing screens and feature surfaces

### Authentication and onboarding

- Logged-out product landing screen.
- Email/password login and registration.
- Google popup login. A redirect-capable helper is exported, but the current UI
  always requests the popup path and does not process a redirect result.
- Password reset.
- Remember-email option and local/session authentication persistence.
- Signup collects profile, role, medication, hydration, and emergency details in
  the registration form and then opens the app. A separate three-step onboarding
  screen exists only on the recovery path where an already-authenticated account
  has no profile record.
- Role choice: patient, caregiver/parent, or healthcare professional.
- Synthetic demo entry without Firebase writes.

### Patient Home

The current Home screen includes all of the following in one long page:

- Greeting, streak, status, and health-wisdom hero.
- Daily mood check-in.
- Hydration tracker.
- Medication reminders.
- Seven-day mood and hydration chart.
- AI pattern insights and doctor-report generation.
- Scheduled reminders.
- Caregiver widget.
- Thirty-day pain chart.
- Quick symptom/pain logging modal.
- Mood and mental-wellness tracker.
- Full Care Vault.

### Health tracking

- Pain score, selected face, triggers, history, and charting.
- Symptom checklist with daily upsert behavior.
- Hydration amount and daily goal, plus seven-day history.
- Medication list, create, delete, and taken-state behavior. The generic update
  service exists, but the current UI uses it only to change `lastTakenDate`; there
  is no edit-medication-details UI. The list displays `Pending` or `Taken`, not
  distinct missed/upcoming states.
- Mood journal, daily check-in, and trend aggregation.
- Streak and XP updates attached to some logging actions.

For an authenticated user, after the symptom Firestore upsert succeeds, saving a
symptom log calls the pain-log and water-log services and then updates the
streak. The guest path stores the symptom locally and updates the local streak,
but does not call the linked pain or water services. A failed authenticated
symptom write also prevents those linked calls. This conditional coupling must
be protected and made explicit during redesign work.

### Appointments and notifications

- Appointment creation, listing, and cancellation exist within Telemedicine.
- Browser notification permission, scheduled reminder creation, enable/disable,
  deletion, and test notification exist.
- Reminder checks run from a component interval while that surface is mounted;
  there is no service-worker push or guaranteed background delivery.
- There is no dedicated notification inbox.
- There is no delivery acknowledgement for external care alerts.

### Profile, settings, and accessibility

- Profile view/edit surface.
- Theme selection.
- High-contrast mode.
- English, Yoruba, Hausa, and Igbo selector.
- Sign-out.

The profile launcher is currently a clickable `div`, so it is not keyboard
equivalent to a button.

### Care Vault and emergency surfaces

Care Vault contains symptoms, mood, hydration, predictive analysis, an ER
toolkit, diagnostics, procedures, medications, labs, and a clinical passport.
It is implemented as one component of roughly 2,000 lines.

Emergency information, caregiver information, and the ER toolkit use seeded
defaults when no stored record exists. These defaults look like real patient
data and must not be mistaken for verified user information.

The caregiver SOS action opens a prefilled `sms:` draft, but immediately labels
that draft as dispatched. The browser cannot verify that the user sent or that a
recipient received the message.

### Community, education, and advocacy

- Group chat with messages, reactions, media, typing state, moderation, and
  custom groups.
- Community posts and likes.
- Peer-support concepts.
- Sickle-cell academy, anatomy learning, empathy stories, games, rewards, and XP.
- Advocacy petition generation and research/update content.
- Premarital genotype education.

### Clinician functionality

Clinician-related concepts exist, but a production clinician product does not:

- Signup includes a healthcare-professional role.
- Chat includes seeded clinician channels and moderation controls.
- Telemedicine displays seeded professional profiles.
- Patient reports can be generated.
- The synthetic demo contains a nurse queue and approval action.

There is no enforced clinician authorization model, assigned patient list,
real alert queue, clinic tenancy, audit-ready reviewer workflow, or role-based
application shell. All authenticated roles currently reach the same main app.

## Styling and responsive behavior

Tailwind uses class-based dark mode. The configuration extends a small number of
red and slate values and one radius, but does not yet contain the semantic navy,
medical-red, spacing, shadow, typography, or health-state tokens required by
`../../DESIGN.md`.

Global CSS imports Inter, Bangers, and JetBrains Mono from Google Fonts. Fonts
are also requested in `index.html`, which duplicates the network dependency.
High-contrast rules are global and heavily use `!important`.

Observed at 375px:

- The header is crowded and status text wraps excessively.
- Six bottom-navigation destinations reduce touch-target width.
- Floating emergency and AI controls overlap dashboard content.
- Some chip groups clip or require unclear horizontal scrolling.
- A large amount of supporting text is below 14px.

Tablet and desktop widths avoid page-level horizontal overflow, but the same
information-density and icon-only navigation problems remain.

## Loading, empty, success, and error states

- Loading is handled mostly with local spinning borders or icons.
- Empty states exist for medications, chat, hydration, reminders, appointments,
  and some community filters.
- Success messages are implemented independently by each feature.
- Errors may appear inline, as browser `alert()` calls, in the console, or not at
  all when a local fallback succeeds.
- There is no shared skeleton, toast, recoverable error card, route error
  boundary, or not-found screen.

## Offline and fallback behavior

The service worker attempts to pre-cache the root shell, `index.html`,
`index.css`, and `metadata.json`, then applies stale-while-revalidate behavior
to same-origin GET requests. The current production build does not emit root
`index.css` or `metadata.json` files; because the Express wildcard returns the
SPA HTML for unknown paths, those cache keys can contain HTML rather than the
named assets. Hashed Vite assets are cached only after a service-worker-controlled
request fetches them successfully. It does not intercept Google or Firestore
hosts. Development on localhost unregisters service workers.

Many service methods write to or read from local storage when the user is absent
or Firestore fails. This is fallback storage, not a complete queued-sync system.
The code does not maintain a general pending-operation queue, conflict policy,
or user-visible sync ledger. Documentation and UI must not promise automatic
replay of every failed cloud write.

Fallback reads are also not merge reads: for several features, a successful
empty Firestore response replaces or ignores an existing global local cache.
Local data is generally consulted on guest or error paths, with feature-specific
exceptions such as mood history and reminders.

Firestore is initialized with long-polling auto-detection, not an explicit
persistent IndexedDB cache. The connection-test console message that says the
app is “fully functional offline” and will sync all data is stronger than the
implementation can support.

The offline knowledge base can answer curated sickle-cell topics in four
languages without calling the Gemini server.

## Charts and aggregation reality

- The 30-day pain chart fills dates without patient logs with deterministic
  simulated pain values. Its `isReal` field identifies recorded points, but the
  line still visually combines recorded and simulated values.
- The seven-day mood/hydration aggregator uses the daily mood score when
  available, otherwise infers wellness as `10 - painLevel` from the local pain
  cache. If neither exists, it plots a `7.0` placeholder. Its current
  `hasMoodLogged` flag also becomes true for pain-inferred values.
- Recharts surfaces cover pain, symptom frequency, hydration, mood/hydration,
  and Care Vault laboratory data. There is no medication-adherence chart or
  medication trend loader in the current application.

## Current runtime warnings

The audited application produced:

- Firestore permission failures for mood logs, daily mood check-ins, and
  reminder settings, followed by local fallback.
- Recharts warnings where responsive containers temporarily measured `-1` width
  or height.

The current `firestore.rules` file includes the established patient
subcollections but does not include explicit rules for `moodLogs`,
`dailyMoodCheckIns`, or `reminderSettings`.

Because `saveDailyMoodCheckIn` writes a local daily record and then calls
`saveMoodLog` before attempting the daily Firestore document, a permission
failure on `moodLogs` can reject the method before the daily Firestore write and
streak update. The local daily and mood-history records have already been
written, but the UI may not show its success state.

## Known technical debt

- Very large components: `ChatSystem`, `CareVault`, `AuthFlow`, `GameEngine`,
  `Telemedicine`, `Community`, and `Dashboard`.
- Thin shared domain typing and extensive use of `any`.
- No reusable `components/ui` or feature-boundary structure.
- No automated unit, integration, accessibility, or end-to-end tests.
- Installed React Router is unused.
- Hard-coded element IDs and delayed scrolling connect some quick actions.
- Global local-storage keys such as `warrior_meds` and `warrior_pain` are not
  scoped by user and can mix cached data across accounts on one browser.
- Firestore profile documents under `users/{uid}` can currently be read by any
  signed-in user, while create/update are owner-restricted. Whether clinic staff
  should ever read another profile requires an explicit authorization model.
- Seeded medication, emergency, clinician, and Care Vault data can look real.
- The symptom modal can display “synchronized successfully” without a distinct
  cloud acknowledgement, and the caregiver SMS draft can be labelled
  “dispatched” without delivery confirmation.
- Constant pulse, bounce, gradients, and red surfaces conflict with the design
  specification.
- Some icon controls have no accessible name.
- Several clinical-sounding claims and confidence percentages are not backed by
  a validated model.

## Experimental features

Treat predictive pain analysis, crisis forecasting, doctor-report generation,
AI pattern confidence, AI counselling, and any future eye-based PCV estimate as
experimental. They must remain separated from the clinical MVP and use
synthetic data until validation and governance requirements are met.

## Related documents

- [Product definition](../PRODUCT.md)
- [Requirements](./REQUIREMENTS.md)
- [Information architecture](./INFORMATION_ARCHITECTURE.md)
- [Data contracts](./DATA_CONTRACTS.md)
- [Redesign plan](./REDESIGN_PLAN.md)

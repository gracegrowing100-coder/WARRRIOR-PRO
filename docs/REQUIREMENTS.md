# Brownfield redesign requirements

These requirements are derived from the current source, `PRODUCT.md`, the
canonical `../../DESIGN.md`, and the UI/UX audit. They distinguish existing
behavior from genuinely new work.

## Requirement classes

- **PRESERVE:** behavior or contract must continue to work.
- **IMPROVE:** retain behavior and improve usability, accessibility, or clarity.
- **REFACTOR:** retain user outcome and data contract while restructuring code or
  information architecture.
- **ADD:** capability is missing and requires new product/engineering work.
- **DEFER:** intentionally outside the current redesign.

## Functional requirements

| ID | Class | Requirement | Acceptance evidence |
|---|---|---|---|
| FR-01 | PRESERVE | Firebase email/password login, Google login, password reset, auth persistence, session restoration, and sign-out must remain functional. | Auth regression flows pass with approved test accounts. |
| FR-02 | IMPROVE | Authentication and onboarding must use visible labels, plain language, accessible errors, inline loading, and clear recovery actions. | Keyboard and 360px checks pass; raw Firebase errors are not shown. |
| FR-03 | PRESERVE | Existing profile fields and onboarding persistence must remain readable by the current Firebase service. | Existing profile fixture opens and saves without schema migration. |
| FR-04 | REFACTOR | Patient Home must prioritize current status, daily check-in, pain, hydration, medication, next appointment, trends, and crisis help. Historical and administrative modules must not dominate Home. | Home hierarchy matches the screen specification at 375px and desktop. |
| FR-05 | REFACTOR | Persistent mobile navigation must contain no more than five destinations and preserve access to every current top-level feature. | Route inventory has no orphaned destination. |
| FR-06 | PRESERVE | Pain logging must retain the 0–10 value, date, triggers, local fallback, daily upsert behavior, Firestore path, and trend compatibility. | Existing and new pain entries render in trends online and locally. |
| FR-07 | IMPROVE | Pain logging must provide one clear primary flow with readable severity, non-color indicators, optional triggers/notes, and safe escalation copy. | A patient can complete the flow by keyboard and at 360px. |
| FR-08 | PRESERVE | Symptom logging must retain pain, symptoms, triggers, water intake, date, and the authenticated successful-write path that links the symptom entry to pain and hydration records until explicitly redesigned and migrated. The current guest and failed-symptom-write paths do not perform those linked calls. | Authenticated online symptom-save regression verifies all three affected data surfaces; fallback behavior is tested and labelled separately. |
| FR-09 | IMPROVE | Symptom logging must use clear grouped choices, visible selection, optional body location when supported, and concise success/error feedback. | Check-in completes without horizontal clipping. |
| FR-10 | PRESERVE | Hydration must retain amount, goal, date-based storage, quick logging, reset/update behavior, and seven-day retrieval. | Existing hydration records and charts remain readable. |
| FR-11 | IMPROVE | Hydration language must be encouraging and clearly show progress and the next useful action. | No guilt-based language; current amount and goal are available as text. |
| FR-12 | PRESERVE | Medication list, create, delete, scheduled-time, alarm, and taken-state behavior must remain functional. Preserve the generic update service used for `lastTakenDate`; do not assume an edit-details UI already exists. | Existing list/create/delete/taken flows pass; guest/read-cache behavior and authenticated write failures are tested separately. |
| FR-13 | IMPROVE | Medication UI must distinguish due, taken, missed, upcoming, and empty states without relying on color alone. | Each state has icon, text, and color where appropriate. |
| FR-14 | PRESERVE | Appointment creation, listing, and cancellation must retain current Firestore and local-cache behavior, including the present limitation that an authenticated provisional local booking can be replaced by the immediate cloud refresh. | Booking and cancellation regression records both cloud-success and failed-write/refresh behavior. |
| FR-15 | IMPROVE | The next appointment must be visible from Home; full appointment management belongs in Care. | Home summary links to the correct appointment surface. |
| FR-16 | PRESERVE | Browser reminder permission, test notification, reminder creation, enable/disable, removal, and the current in-page interval scheduler must remain available. Do not describe it as background push delivery. | Notification regression passes while the reminder surface is mounted in a supported browser. |
| FR-17 | ADD | Add a coherent notification centre only after the source and lifecycle of each notification type are defined. | Product rules identify source, read state, expiry, and navigation target. |
| FR-18 | PRESERVE | Emergency information and crisis-help entry points must remain reachable from every primary patient screen. | Emergency action is reachable without being visually confused with normal actions. |
| FR-19 | IMPROVE | Emergency UI must clearly distinguish stored information, suggested guidance, and actions that actually contact another person. | No unverified “sent”, “dispatched”, or “notified” claim appears. |
| FR-20 | REFACTOR | Care Vault must be decomposed into feature modules while preserving `users/{uid}/careVault/medicalHistory` compatibility. | Existing Care Vault document loads before and after refactor. |
| FR-21 | PRESERVE | Theme, high contrast, language selection, and profile editing must remain functional. | Settings persist after reload and remain keyboard accessible. |
| FR-22 | PRESERVE | Chat, community, education, games, advocacy, genotype education, and research surfaces must remain reachable even when moved to secondary navigation. | Route mapping and smoke checks cover each surface. |
| FR-23 | IMPROVE | Every async screen or card must define appropriate loading, empty, success, error, and offline states. | Shared state components are used and documented. |
| FR-24 | ADD | Add honest save-state messaging: local, cloud-confirmed, failed, or pending where the underlying service can determine it. | The UI never labels a local fallback as cloud-synced. |
| FR-25 | ADD | A production clinician workspace requires role authorization, clinic membership, patient assignment, an alert lifecycle, reviewer ownership, and audit history. | Separate approved clinician specification and permission tests exist. |
| FR-26 | DEFER | Do not build the production clinician workspace during the patient UI foundation phases. | No fabricated clinician data or unsecured role switch is shipped. |
| FR-27 | DEFER | Do not train or deploy crisis-prediction or eye-based PCV models as part of this redesign. | Experimental demos remain labelled and separated. |
| FR-28 | PRESERVE | The synthetic demo must continue to work without Firebase writes and must state that its data and actions are simulated. | Demo works offline and creates no production patient record. |

## Data and integration requirements

| ID | Class | Requirement |
|---|---|---|
| DR-01 | PRESERVE | Firestore collection paths documented in `DATA_CONTRACTS.md` must not change during visual refactoring. |
| DR-02 | PRESERVE | Existing Firebase Storage chat media paths must remain readable. |
| DR-03 | PRESERVE | Existing local-storage keys must remain readable until a versioned migration is implemented and tested. |
| DR-04 | REFACTOR | Introduce explicit domain types at the service/component boundary instead of adding more `any` usage. |
| DR-05 | ADD | Scope health caches by authenticated user through a versioned migration; do not simply rename or delete current global keys. |
| DR-06 | ADD | Resolve Firestore rules for mood, daily check-in, and reminder paths before presenting those writes as cloud-persisted. |
| DR-07 | ADD | Define a real offline operation queue and conflict policy before claiming automatic synchronization of failed writes. |
| DR-08 | PRESERVE | Existing Gemini routes and curated fallbacks must not be moved to client-side secret-bearing calls. |

## Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-01 | The UI must follow `../../DESIGN.md`: dark navy, white, restrained medical red, calm surfaces, and restrained motion. |
| NFR-02 | Primary workflows must work from 360px upward; validate at 360, 375, 768, 1200, and 1440px. |
| NFR-03 | Interaction targets should be approximately 44px or larger. |
| NFR-04 | Controls require programmatic names, visible focus, keyboard operation, and understandable validation. |
| NFR-05 | Health status must combine text and icon with color, never color alone. |
| NFR-06 | Ordinary screens must not be dominated by bright red, constant pulse, bounce, or multiple gradients. |
| NFR-07 | Charts need readable summaries and must render without invalid-size console warnings. |
| NFR-08 | Route-level and feature-level errors must not expose raw API or Firebase messages to patients. |
| NFR-09 | Every phase must pass `npm run lint`, its regression subset, responsive checks, keyboard checks, and a visual audit. |
| NFR-10 | Existing patient data must remain readable without destructive migration. |
| NFR-11 | Clinical and AI claims must comply with the safety boundary in `PRODUCT.md` and `AGENTS.md`. |

## Requirement traceability

- Screen behavior: [SCREEN_SPECIFICATIONS.md](./SCREEN_SPECIFICATIONS.md)
- Navigation ownership: [INFORMATION_ARCHITECTURE.md](./INFORMATION_ARCHITECTURE.md)
- Critical workflows: [USER_FLOWS.md](./USER_FLOWS.md)
- Storage and API details: [DATA_CONTRACTS.md](./DATA_CONTRACTS.md)
- Delivery order: [REDESIGN_PLAN.md](./REDESIGN_PLAN.md)
- Verification: [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md)

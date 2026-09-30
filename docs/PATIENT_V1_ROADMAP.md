# WARRIOR AI — Patient V1 Delivery Roadmap

**Status:** Temporary execution roadmap
**Purpose:** What remains before Patient V1 is functionally frozen and
released as a demo/release candidate?
**Stable product/architecture direction:**
See [WARRIOR_AI_MASTER_PLAN.md](./WARRIOR_AI_MASTER_PLAN.md)

---

## 1. Status

- **Current branch:** `redesign/warrior-ui`
- **Current overall milestone:** Phase 4I complete (role planning boundary,
  documentation only). The Patient/Care foundation is substantially
  implemented: Home, pain/symptom tracking, hydration, daily check-ins,
  medication, Health History, Care Hub, patient-maintained Medical Records,
  appointment requests, emergency/offline surfaces, and legacy Chat.
- **Patient V1 functional freeze status:** NOT FROZEN. Documented audit
  findings below (P0–P5A, plus P5B before identifiable-patient deployment)
  remain unresolved.
- **Visual polish status:** NOT STARTED. Polish is deliberately deferred
  until after functional freeze (P7).
- **Release status:** NOT STARTED. No release candidate has been produced.

Do not treat any item above as more complete than the repository and
[CURRENT_STATE.md](./CURRENT_STATE.md) actually support.

## 2. Freeze philosophy

Truthfulness, data isolation, persistence reliability and scope clarity
come **before** visual polish. No visual polishing begins until the P0–P6
batches are stable.

## 3. P0 — Patient data integrity and invented-data removal

**Do first. No visual polishing before this batch is stable.**

Audit findings to resolve:

- [x] Fix cross-account symptom cache contamination (the cache writer
      currently matches an existing record by date alone, allowing
      Account B to overwrite Account A's cached same-day clinical values
      while retaining Account A's identity).
- [x] Remove date-only ownership corruption (same root defect as above).
- [x] Scope remaining global health caches appropriately (e.g. unscoped
      `warrior_*` local-storage keys such as medications and pain).
- [x] Remove automatic medicine creation triggered by empty medication
      records.
- [x] Remove invented/sample emergency information (seeded contacts,
      allergies, medications, clinical facts) from real patient flows.
- [x] Review seeded caregiver identity where exposed to patients.
- [x] Preserve uncertain historical data without heuristic deletion
      (legacy samples without provenance stay, flagged, not purged).

**Status:** COMPLETE IN WORKTREE (2026-09-30), pending human review. Authenticated
health and caregiver caches are UID-scoped; legacy unscoped values remain
untouched and are not attached to authenticated accounts. Account setup,
medication empty states, emergency information and scheduled reminders no
longer create sample patient records. Focused Vitest coverage verifies account
isolation, missing-data states and preservation of explicit user entries.

**Freeze gate:** No patient health data can leak to, or overwrite, another
account's cached information; no invented clinical data appears in real
patient flows.

## 4. P1 — Persistence truthfulness

### Daily check-in

- [x] Save/rule failure behavior (`moodLogs` failure no longer prevents the
      independent daily Firestore write; the returned history result remains explicit).
- [x] Visible failure outcome (UI must not show success when the method
      rejected).
- [x] Coupled-write interruption semantics made explicit.

### Hydration

- [x] Missing vs zero.
- [x] Unavailable vs empty (read failure must not display as recorded
      zero).
- [x] Explicit save result.
- [x] Stale/duplicate behavior where applicable.

### Medication

- [x] Save outcomes.
- [x] Empty-state behavior.
- [x] Duplicate/stale behavior appropriate to existing contracts.

**Status:** COMPLETE IN WORKTREE (2026-09-30), pending human review. Focused
service and component coverage verifies confirmed/device-only/failure outcomes,
missing and unavailable hydration, genuine recorded zero, and non-optimistic
medication mutations. No replay ledger or repository-wide framework was added.

**Freeze gate:** The patient can distinguish successful, device-only,
failed, unavailable and missing outcomes where those distinctions apply.

## 5. P2 — Clinical / AI truthfulness

Isolate or remove:

- [x] Simulated professional identities (seeded named hematology persona).
- [x] Scripted professional-looking replies.
- [x] Fabricated/fixed clinical-looking confidence and correlation values.
- [x] Generated reports filling missing facts with synthetic values.
- [x] Generated content appearing as recorded/factual history.
- [x] Unnecessary hidden AI side effects / API calls.

**Important:** This phase does NOT commit the roadmap to implementing a
full new AI assistant. First make the current application truthful.

**Status:** COMPLETE IN WORKTREE (2026-09-30), pending human review. The legacy
community UI labels seeded conversations as synthetic and exposes no named fake
clinician or emergency-dispatch channel. Pattern/report failures do not create
fallback health facts; missing profile/statistical values stay missing; output is
labelled experimental and generated. Collapsed Home tools mount only when opened.

**Freeze gate:** The patient cannot reasonably mistake synthetic/generated
information for a real clinician or a recorded health fact.

## 6. P3 — Appointment semantic repair

- [x] Request ≠ confirmed booking (Home must not describe a request as an
      "active booking" or "upcoming confirmed appointment").
- [x] Deterministic Home selection (do not present the first non-cancelled
      request as the next chronological appointment).
- [x] Truthful Home wording: "Appointment request — requested for
      <date/time>".
- [x] Consistency across Home / Care / Appointments.

**Status:** COMPLETE IN WORKTREE (2026-09-30), pending human review. Home selects
the earliest future preferred date, then the most recent past date, with a stable
fallback for non-ISO legacy dates. Non-cancelled legacy statuses are presented as
recorded requests; no clinic acceptance or reserved time is implied.

**Freeze gate:** Request-only semantics are consistent across Home, Care
and Appointments.

## 7. P4 — Chat V1 scope decision

> **DECISION REQUIRED** — the product owner must choose before functional
> freeze. Existing docs record the open question, not the answer.

**Option A — Full WARRIOR AI assistant is part of V1.**
Requires a focused AI identity/safety/API work phase before freeze
(assistant clearly identified as AI, no simulated clinician personas, safe
escalation boundaries, reviewed API boundary).

**Option B — Full assistant is post-V1.**
Remove/isolate misleading simulated clinician behavior and keep only
supported functionality in V1; the full assistant is deferred.

Do not let the existing legacy Chat implementation define this product
decision by default.

## 8. P5 — Offline and privacy boundary

Two separate concerns; do not conflate them. P5 is split into P5A and P5B
because they gate different outcomes.

### P5A — Offline contract (required before Patient V1 functional freeze)

- [ ] Document exactly: what loads offline; what can be recorded offline;
      what stays device-only; what synchronizes; what does not; what
      emergency functionality remains available.
- [ ] UI wording matches only verified capability (no "fully functional
      offline / will sync all data" claims).

### P5B — Identifiable-patient deployment / privacy boundary (required
before production use with real identifiable patient health data)

- [ ] Approved authentication boundary.
- [ ] Approved AI-processing boundary (external AI endpoints and
      Firebase-token verification/rate limiting).
- [ ] Authorization/rules review (profile read scope, rule gaps for
      `moodLogs`, `dailyMoodCheckIns`, `reminderSettings`).
- [ ] Consent requirements and sensitive-data handling expectations.

P5B is NOT required merely to declare Patient V1 functionally complete or
create a non-identifiable/demo release candidate.

This split stays consistent with
[WARRIOR_AI_MASTER_PLAN.md](./WARRIOR_AI_MASTER_PLAN.md) §14:
**PATIENT V1 FUNCTIONALLY COMPLETE ≠ APPROVED FOR PRODUCTION USE WITH
IDENTIFIABLE PATIENT HEALTH DATA.**

**Status:** OPEN. Current rule gaps and broad profile reads are documented
in DATA_CONTRACTS.md and ROLE_ACCESS_MODEL.md.

## 9. P6 — Functional acceptance and freeze

One deliberate acceptance cycle after P0–P5A. Validate:

- account isolation;
- patient logging;
- hydration;
- medication;
- Health History;
- Medical Records;
- appointments;
- emergency;
- Chat according to approved scope;
- offline claims;
- authentication;
- error states;
- **functional accessibility and minimum responsive usability:**
  - keyboard/accessibility-critical behavior;
  - no unusable overflow at supported widths;
  - dark/high-contrast modes remain functionally usable;
- full tests;
- production build.

Detailed visual polish and visual acceptance are owned by P7/P8
(typography, spacing, hierarchy, polished responsive composition,
dark/high-contrast visual QA, screenshots) — not by P6.

Record results in [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md).
Do not write current test results here unless explicitly supported by
current repository docs. Historical validation evidence exists, but it
does not count as the final Patient V1 acceptance run. P6 must record a
fresh full-suite and production build result after P0–P5A are complete.

Then declare: **PATIENT V1 FUNCTIONAL FREEZE**.

## 10. P7 — Consolidated WARRIOR AI visual polish

Only after freeze. One coordinated system-wide polish (not a chain of
isolated page redesigns), per [DESIGN.md](../DESIGN.md):

- Home; Care Hub; Health History; Appointments; Medical Records;
- user-facing WARRIOR AI branding;
- typography; spacing; hierarchy; surface treatment;
- responsive layouts; dark mode; high contrast;
- accessible interactions and states.

Do not implement polish now.

## 11. P8 — Release candidate

- [ ] Focused regression.
- [ ] One full test suite run.
- [ ] One production build.
- [ ] Authenticated screenshots / visual QA (360 / 390 / 430 / 768 /
      1200; light / dark / high contrast).
- [ ] Accessibility review.
- [ ] Git diff review.
- [ ] Merge `redesign/warrior-ui` to the actual Vercel production branch
      **after confirming which branch Vercel uses** — do not assume it is
      `main`.
- [ ] Verify the deployed build.

This produces a Patient V1 demo/release candidate. That remains separate
from authorization to deploy with real identifiable patient health data.

## 12. Explicit post-V1 backlog

- Caregiver delegation (invitation, consent, scope, revocation,
  attribution, audit).
- Clinician workspace (verified identity, assignment, review,
  verification).
- Administrator workspace (distinct from clinician).
- Clinic scheduling/acceptance workflow.
- Clinician verification.
- Secure clinical document workflows.
- Research dataset (consent, extraction, de-identification, lineage,
  governance).
- Wearables.
- Predictive models.
- Advanced offline reconciliation / replay queue.
- Full provenance migration.

## 13. Decision log

| Date | Decision | Reason | Impact |
|---|---|---|---|
| Current baseline | WARRIOR AI is the user-facing brand; legacy technical identifiers remain | Renaming persistence/routes/cache/Firebase contracts is high-risk, low-value | Brand wording migrates in polish phase only |
| Current baseline | Five primary nav items: Home, Chat, Care, Community, More; Profile via header | Approved navigation architecture | Navigation not reopened during V1 repairs |
| Current baseline | Health History and Medical Records are separate domains | Longitudinal events vs patient-maintained background are different jobs | Architectural boundary; enforced in Care |
| Current baseline | Appointments are requests, not confirmed bookings | No clinic backend exists to establish confirmation | Submit/review/cancel semantics preserved |
| Current baseline | Future roles (Caregiver, Clinician, Administrator) deferred | Require consent/verification architectures that do not exist | Documented in ROLE_ACCESS_MODEL.md |
| Current baseline | Chat V1 scope (P4) unresolved | Product decision, not technical | Open — blocks freeze |

Do not invent dates; use "Current baseline" when a decision date is
unavailable.

## 14. Completion evidence

To be recorded as work lands (do not fabricate):

| Item | Evidence | Date |
|---|---|---|
| P0 commit hash | — | — |
| Focused tests | — | — |
| Full test suite | — | — |
| Production build | — | — |
| Manual QA | — | — |
| Known residual issues | — | — |

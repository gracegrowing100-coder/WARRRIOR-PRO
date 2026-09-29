# WARRIOR AI — Master Product & Architecture Plan

**Status:** Canonical product and architecture reference
**Primary implementation target:** Patient V1
**Product identity:** WARRIOR AI
**Current delivery status:** See [PATIENT_V1_ROADMAP.md](./PATIENT_V1_ROADMAP.md)

---

## 1. Purpose and authority

This document is the canonical high-level product and architecture reference
for WARRIOR AI. It answers: what WARRIOR AI is, what we are building now,
where it is going, and which architectural rules future development must
respect.

Specialist documents remain authoritative in their own domains and are
cross-referenced here rather than duplicated:

- [PRODUCT.md](../PRODUCT.md) — detailed product requirements.
- [DESIGN.md](../DESIGN.md) — visual and interaction system.
- [ROLE_ACCESS_MODEL.md](./ROLE_ACCESS_MODEL.md) — role permissions and provenance.
- [DATA_CONTRACTS.md](./DATA_CONTRACTS.md) — persistence and data behavior.
- [CURRENT_STATE.md](./CURRENT_STATE.md) — what actually exists now.
- [INFORMATION_ARCHITECTURE.md](./INFORMATION_ARCHITECTURE.md),
  [SCREEN_SPECIFICATIONS.md](./SCREEN_SPECIFICATIONS.md),
  [USER_FLOWS.md](./USER_FLOWS.md) — specialist references.
- [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md) — acceptance evidence.

Temporary delivery work, phase ordering and completion status belong in
[PATIENT_V1_ROADMAP.md](./PATIENT_V1_ROADMAP.md), not here. This document is
not a delivery log.

## 2. Product identity

The canonical user-facing product name is **WARRIOR AI**.

Legacy technical and internal identifiers may remain where renaming would
affect persistence, routes, cache keys, Firebase paths, package names or
other contracts. Do not casually rename:

- the repository name `warrior-cell`;
- Firestore paths;
- `warrior_*` local-storage keys;
- service-worker keys;
- environment variables;
- component filenames solely for branding.

User-facing brand wording migrates during the consolidated polish phase,
unless wording constitutes a false capability claim, in which case it is a
truthfulness fix and is handled earlier.

## 3. Product North Star

WARRIOR AI is a **patient-first sickle-cell health support application**.

Patient V1 must help a person living with sickle cell:

- understand what they have recorded about their health;
- record pain, symptoms, hydration and daily check-ins;
- manage their medication schedule;
- maintain personal medical/background information;
- review factual health history;
- request hematology appointments;
- access emergency information and support;
- eventually interact with a clearly identified WARRIOR AI assistant.

The product must remain useful independently of any future machine-learning
ambition, and must not pretend to provide functionality that does not exist.

## 4. Patient V1 definition

Patient V1 is the current implementation priority. It comprises:

- Patient Home (today's health and immediate actions);
- pain and symptom tracking;
- hydration tracking;
- daily check-ins;
- medication schedule and taken state;
- Health History (longitudinal recorded events);
- patient-maintained Medical Records;
- appointment request flow;
- emergency/offline functionality within verified limits;
- Chat according to the scope decision recorded in the roadmap.

Known defects, open repair work and freeze gates are tracked in
[PATIENT_V1_ROADMAP.md](./PATIENT_V1_ROADMAP.md), not in this document.

## 5. Information architecture

The approved primary navigation is:

```text
HOME        Today's health and immediate actions
CHAT        WARRIOR AI / communication experience
CARE        Health History, Appointments, Medical Records
COMMUNITY   Peer/community experience
MORE        Secondary tools, settings, features
PROFILE     Header-level identity/settings access
```

Home owns "what matters to me today". Chat owns communication. Care owns
recorded health information and appointment requests. Community owns peer
experience. More owns secondary tools. Profile remains accessible from the
header rather than as a sixth navigation slot.

Do not reopen navigation architecture during remaining Patient V1 work
unless a blocker requires it. See
[INFORMATION_ARCHITECTURE.md](./INFORMATION_ARCHITECTURE.md) for detail.

## 6. Canonical Patient journey

At a durable product level, the Patient journey is:

```text
Sign in
   ↓
Home: today's health at a glance
   ↓
Daily check-in / pain / symptoms / hydration / medication
   ↓
Review recorded history in Health History
   ↓
Maintain longer-term information in Medical Records
   ↓
Request an appointment when professional review is wanted
   ↓
Access emergency information when needed
   ↓
(Optionally) communicate via Chat within approved scope
```

Each step must present truthful save/recording state and must not imply
clinical verification or delivery that does not exist.

## 7. Health History vs Medical Records

This distinction is architectural.

**Health History** answers *"What have I recorded over time?"* — pain,
symptoms, triggers, hydration, daily check-ins, factual timelines and
recorded trends where sufficient real data exists.

**Medical Records** answers *"What longer-term information do I maintain
about my health and care?"* — diagnosis/background, allergies, conditions,
medication/therapy history, hospital admissions, procedures, transfusions,
laboratory information, immunizations, care information and factual export.

Medical Records are **patient-maintained information, not
clinician-verified medical records**. That distinction remains until an
actual professional verification architecture exists.

## 8. Medication domain boundary

Two separate concepts:

- **Home medication schedule** (operational): what should I take today,
  what have I marked as taken, what remains pending.
- **Medical Records medication/therapy history** (contextual): what
  medications or therapies have I used.

Changing Medical Records must not silently alter today's medication
schedule. Changing today's schedule must not rewrite historical medical
information. Do not merge them conceptually.

## 9. Appointment architecture

Patient V1 supports **appointment requests**, not clinic-confirmed
scheduling.

Canonical lifecycle:

```text
Request appointment
   ↓ Preferred date → Preferred time → Optional reason
   ↓ Review
   ↓ Explicit submit by the Patient
   ↓ Requested (recorded)
   ↓ Details
   ↓ Optional cancellation (Cancelled history retained)
```

Terminology rules: use *request*, *preferred date/time*, *requested*,
*request recorded*, *cancel request*. Avoid *confirmed appointment*,
*doctor accepted*, *slot reserved*, *clinic notified*, or *scheduled with
hematologist* unless a future backend actually establishes those facts.

## 10. WARRIOR AI assistant architecture

The intended direction is a **clearly identified AI
sickle-cell/hematology-oriented assistant** that provides bounded
informational support and recognizes when professional care may be
appropriate.

Architectural rules:

- The assistant is AI, not a verified human hematologist.
- Generated information is not a medical record.
- Future human-care escalation must remain Patient-controlled.
- The AI must never silently create or submit an appointment; any future
  AI-to-appointment handoff ends with explicit Patient review and submit.

The full assistant is **not** claimed to be implemented. Whether Chat is in
or out of Patient V1 scope is the open decision recorded in
[PATIENT_V1_ROADMAP.md](./PATIENT_V1_ROADMAP.md) (P4).

## 11. Emergency and offline principles

Emergency surfaces must provide clearly recorded emergency information,
emergency contacts, appropriate crisis actions and clear limitations. They
must not silently manufacture emergency contacts, allergies, medications or
clinical facts.

Offline truthfulness: claim only verified capability. Distinguish
*available offline*, *saved on this device*, *saved* (confirmed outcome per
contract) and *unavailable*. Do not promise synchronization, replay or
offline capabilities beyond current verified functionality. See
[DATA_CONTRACTS.md](./DATA_CONTRACTS.md) for actual persistence behavior.

## 12. Role architecture

- **Patient** — current priority; owns personal tracking, health history,
  patient-maintained records, medication schedule, appointment requests,
  settings/profile and bounded support features.
- **Caregiver** — future delegated role requiring explicit invitation,
  patient consent, delegated scope, revocation, attribution and audit trail.
- **Clinician** — future verified professional role requiring verified
  identity, patient relationship, scoped access, clinician-authored records
  and review/verification.
- **Administrator** — future operational role; operational privilege never
  implies clinical authority.

See [ROLE_ACCESS_MODEL.md](./ROLE_ACCESS_MODEL.md) for the detailed
capability matrix, ownership and provenance boundaries.

## 13. Data ownership and truthfulness principles

Every health value is conceptually one of:

```text
patient-reported        entered directly by the patient
system-derived          calculated from known recorded data
AI-generated            produced by an AI system
caregiver-reported      future, attributed to a caregiver
clinician-recorded      future professional-authored
clinician-verified      future explicit review/verification
imported                future external medical/device source
missing/unknown         not known
```

Core rules:

> missing ≠ zero
> missing ≠ normal
> AI-generated ≠ recorded fact
> patient-maintained ≠ clinician-verified
> request ≠ confirmed appointment

No schema migration is required for Patient V1; the application must simply
stop corrupting these distinctions. See
[ROLE_ACCESS_MODEL.md](./ROLE_ACCESS_MODEL.md) §4–5 for the provenance model.

## 14. Privacy/deployment boundary

```text
PATIENT V1 FUNCTIONALLY COMPLETE
        ≠
APPROVED FOR PRODUCTION USE WITH IDENTIFIABLE PATIENT HEALTH DATA
```

Functional completion is a separate milestone from any approval for
production use with identifiable patient health data. No regulatory or
compliance approval is claimed. The approved authentication, AI-processing,
authorization and consent boundary must be established before any
identifiable-patient deployment.

## 15. Future longitudinal-data architecture

Long term, WARRIOR AI may use appropriately consented, governed,
high-quality longitudinal sickle-cell patient data. Future architecture
will require: provenance, timestamp quality (event-level timestamps,
timezone semantics), event histories, source attribution, consent, amendment
history and dataset lineage.

This is future direction only. Patient V1 collects data because it benefits
the patient experience, not merely because it might be useful to a future
model.

## 16. Future research / predictive ML direction

The progression is:

```text
Patient workflows
   → high-quality longitudinal observations
   → governed research dataset
   → retrospective research
   → feature engineering
   → model development
   → validation
   → clinical/product evaluation
   → approved deployment if justified
```

No current predictive models, crisis prediction, research-readiness or
clinical validation are claimed. Do not redesign Patient V1 around
hypothetical ML requirements; instead, prevent V1 from contaminating or
misrepresenting data in ways that would make future research harder.

## 17. Product evolution

```text
Patient V1                Patient experience
   → Connected Care       Caregiver, clinician, administrator roles
   → Longitudinal Platform  Provenance, consent, event histories
   → Predictive Intelligence  Validated, governed models
```

This progression is conceptual, not date-bound.

## 18. Explicit Patient V1 exclusions

The following are out of scope for Patient V1:

- Caregiver delegated workspace;
- Clinician workspace;
- Administrator workspace;
- clinic scheduling/acceptance;
- clinician verification;
- research dataset pipeline;
- predictive models;
- wearable integration;
- advanced synchronization/reconciliation.

## 19. Documentation authority hierarchy

```text
1. WARRIOR_AI_MASTER_PLAN.md      Product/architecture authority (this file)
2. PATIENT_V1_ROADMAP.md          Temporary execution roadmap
3. PRODUCT.md                     Product requirements
4. DESIGN.md                      Visual/interaction system
5. ROLE_ACCESS_MODEL.md           Role access, ownership, provenance
6. DATA_CONTRACTS.md              Persistence and data behavior
7. CURRENT_STATE.md               What exists now
8. REGRESSION_CHECKLIST.md        Acceptance/regression evidence
Supporting: INFORMATION_ARCHITECTURE.md, SCREEN_SPECIFICATIONS.md,
USER_FLOWS.md, REQUIREMENTS.md
```

Historical documents (e.g. REDESIGN_PLAN.md, PHASE_0_BASELINE.md,
HANDOFF.md, SYSTEM_DOCUMENTATION.md) remain useful history but must not
override current architecture. Where a historical doc conflicts with this
hierarchy, the newer architecture wins; mark the older content as
historical rather than deleting it.

## 20. Change-control rule

New ideas are **classified before implementation**, not automatically built:

```text
NEW IDEA
 ├─ V1 blocker?                    → Remaining V1 roadmap
 ├─ V1 improvement?                → V1 roadmap, after blockers
 ├─ Pre-freeze truthfulness/safety issue? → Pre-freeze repairs
 ├─ Polish only?                   → Polish backlog (P7)
 ├─ Post-V1 role feature?          → Post-V1 role backlog
 ├─ Future data/ML only?           → Data/ML roadmap
 └─ Conflicts with this plan?      → STOP: architecture decision first
```

This rule prevents every new idea from becoming an immediate implementation
phase.

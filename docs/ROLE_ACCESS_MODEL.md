# Warrior Cell Role & Access Model

## 1. Purpose and status

Patient V1 is the current delivery priority. Patient, Caregiver, Clinician /
Healthcare Professional and Administrator are distinct product roles. This is
the canonical planning reference for role boundaries, ownership, provenance and
future access decisions, subordinate to PRODUCT.md.

CURRENT describes implemented behavior, including Phase 4H. FUTURE describes
direction requiring separate approval, not existing functionality. UNDECIDED
means no permission/commitment is approved. NOT PLANNED denotes an explicit
exclusion from the stated role/scope. Current persisted contracts remain in
[DATA_CONTRACTS.md](./DATA_CONTRACTS.md); this document grants no permissions.

## 2. Role definitions

### Patient

The subject of the health information. CURRENT capabilities include Home health
tracking, symptom/pain and hydration logging, daily check-ins, medication
management and taken-dose interactions, Health History, patient-maintained
Medical Records, appointment requests/cancellation, chat/community, AI advice,
offline assistance and emergency/support tools. Availability does not imply
clinical validation, reliable cloud synchronization or emergency delivery.

### Caregiver

FUTURE trusted person supporting a Patient through specifically permitted
viewing, reminders, care tasks, emergency information or assisted data entry.
No automatic access to all Patient health information is intended. Read/write
scope requires an approved consent and authorization model.

CURRENT caregiver profile labels and a designated-contact widget exist. The
widget uses global localStorage key warrior_designated_caregiver and includes
sample contacts. Phone/SMS links are not invitations, delegated account access,
caregiver authentication or verified delivery.

### Clinician / Healthcare Professional

FUTURE authorized professional role for reviewing Patient information, recording
professional observations, clinician-created records, appointment review,
clinical decisions, explicit verification and appropriate human escalation.
Patient information does not become verified merely by being viewed by a
professional. Professional identity and access authorization require future work.

### Administrator

FUTURE operational role for account support, configuration, controlled role/access
administration and potentially appointment operations. Administrator is not
Clinician. Operational privileges must not automatically grant clinical-data
access or clinical sign-off authority. Exact scope is UNDECIDED.

### Current role and enforcement limitations

- AuthFlow offers Patient, Caregiver / Parent and Healthcare Professional labels;
  UserProfile can edit role data. These are not verified permission grants.
- types.ts has legacy warrior/caregiver/advocate/doctor values; runtime profile
  labels differ. No normalization/migration occurs here. Advocate is a legacy
  label, not an approved privileged role.
- App uses a shared shell; complete role-protected clinician/admin and delegated
  caregiver workspaces are not implemented.
- Firestore health subcollections listed in DATA_CONTRACTS use owner UID checks.
  Profile reads allow any signed-in user: a current limitation, not the target
  privacy policy. Mood/check-in/reminder rule gaps remain documented there.
- Chat group moderators/admins are not system Administrators or Clinicians.
  Broad authenticated chat rules are not a confidential clinical-access model.
- Synthetic demos, seeded professional names and role labels establish no
  clinician identity, patient assignment or clinical relationship.

## 3. Capability matrix

CURRENT Patient cells describe the patient-facing experience, not a complete
role-enforced permission model. FUTURE cells are candidate responsibilities;
permissions require approval. UNDECIDED cells do not imply access.

| Capability | Patient | Caregiver | Clinician | Administrator |
|---|---|---|---|---|
| Home | CURRENT personal dashboard | FUTURE support view | FUTURE professional workspace | FUTURE operational workspace |
| Pain/symptom logging | CURRENT own entries | FUTURE assisted entry; permission UNDECIDED | FUTURE review/separate professional observations | NOT PLANNED clinical authorship by admin role |
| Hydration | CURRENT own logging | FUTURE support; writes UNDECIDED | FUTURE authorized review | UNDECIDED; no implicit access |
| Daily check-in | CURRENT own entries | FUTURE assisted entry; scope UNDECIDED | FUTURE authorized review | UNDECIDED; no implicit access |
| Health History | CURRENT recorded timeline | FUTURE consent-scoped view | FUTURE authorized review | UNDECIDED; no implicit access |
| Medical Records | CURRENT patient-maintained CRUD | FUTURE scoped assistance with attribution | FUTURE professional records/verification | NOT PLANNED clinical verification by admin role |
| Medications | CURRENT Home management and separate records history | FUTURE reminders/support; writes UNDECIDED | FUTURE review; prescribing workflow UNDECIDED | UNDECIDED; no implicit access |
| Appointments | CURRENT request/review/details/cancel | FUTURE on-behalf requests UNDECIDED | FUTURE review/acceptance workflow | FUTURE operational scope UNDECIDED |
| AI hematology chat | FUTURE clearly identified assistant in Chat; current legacy chat is not this guarantee | UNDECIDED | FUTURE escalation participation; scope UNDECIDED | UNDECIDED; no implicit conversation access |
| Emergency information | CURRENT summary/support tools, no delivery guarantee | FUTURE independent access UNDECIDED | FUTURE authorized review | UNDECIDED; no implicit access |
| Health-summary export | CURRENT recorded-field PDF, not verified | FUTURE export permission UNDECIDED | FUTURE provenance-preserving export UNDECIDED | UNDECIDED; no implicit export rights |
| Caregiver access | FUTURE consent controls | FUTURE delegated access | UNDECIDED | FUTURE access operations UNDECIDED |
| Clinician review | FUTURE visible review status | UNDECIDED | FUTURE professional review | NOT PLANNED clinical sign-off by admin role |
| Appointment operations | CURRENT own request status only | UNDECIDED | FUTURE clinical review | FUTURE operational management |
| User/role administration | CURRENT own profile editing only | UNDECIDED | UNDECIDED | FUTURE controlled account/role administration |

Autonomous AI diagnosis, treatment changes and automatic appointment submission
are NOT PLANNED within this architecture. Profile role editing is not security
administration. All future workspace details remain subject to approval.

## 4. Data ownership and authorship

Subject, author, storage owner and authorized viewer are separate concepts.
Current users/{uid} paths identify an account namespace, not independently
verified authorship or legal ownership. A future caregiver's UID must not become
the subject simply because that caregiver entered the information.

| Category | Status and meaning |
|---|---|
| Patient-reported | CURRENT symptoms, pain, hydration, check-ins, manually entered background, allergies, medication history and labs; no clinician verification implied. Legacy authorship may be unknown. |
| Caregiver-reported | FUTURE information about a Patient attributed to a caregiver; never silently relabel as Patient-authored or clinician-verified. |
| Clinician-recorded | FUTURE entries by an authorized professional; professional authorship does not verify every referenced Patient report. |
| Clinician-verified | FUTURE explicit review of identified information/version through an approved clinical workflow. |
| System-generated | CURRENT derived values, generated advice/reports and legacy inferred/synthetic charts exist elsewhere; distinguish from reported facts. FUTURE provenance must identify derivation. |

AI inference, generated summaries, predictions, mapped mood scores and synthetic
values must never become recorded clinical history. A mapped score remains a
derivation even if stored beside a check-in. Missing values stay unknown.
Historical sample values without provenance cannot be relabelled genuine reports.

## 5. FUTURE conceptual provenance model

This is not a deployed schema or migration instruction:

```text
HealthRecord
  subjectPatientId       subject of information
  ownerUserId            responsible owner where applicable; policy unresolved
  sourceType             patient | caregiver | clinician | system
  createdBy              authenticated author or identified system process
  verificationStatus     self_reported | caregiver_reported |
                         clinician_recorded | clinician_verified
  createdAt
  updatedAt
```

These fields are not uniformly present today. Some existing records have userId
and timestamps, but there is no shared HealthRecord provenance/verification
contract. Unknown legacy authorship stays unknown; do not infer it from paths,
profile labels or the migration actor. System/unknown verification states remain
UNDECIDED and must not be forced into a human-reported category.

Future design must preserve original authorship after review, identify who
verified which version and when, and retain amendment/derivation lineage. A
status string alone is insufficient evidence. Provenance and uncertainty must
survive display/export. Adoption requires a separately approved migration and
security phase, including compatibility, backfill policy, consent and enforcement.

## 6. Medical Records boundary

CURRENT: Medical Records is Patient-maintained health information, not a
clinician-authored/verified record system. Background, therapy/medication history,
procedures, admissions, transfusions, labs, immunizations, contacts and notes use
the existing careVault/medicalHistory document. PDF export uses recorded fields,
warns about unverified legacy entries and adds no generated medical advice.

Health History is separate: stored symptom/pain check-ins, hydration and daily
check-ins according to existing contracts. It does not merge the Medical Records
schema or fill missing days with synthetic events. Home medication scheduling is
separate from manually maintained medication history. Phase 4H excludes legacy
Vault security simulation, OCR and generated analytics from Medical Records.

Authenticated Vault fallback is UID-scoped; ambiguous global data is not
imported. Isolation is not encryption. Other global health caches retain their
documented limitations; not all patient data is account-isolated.

FUTURE possible areas, not implemented in Phase 4I:

- Your health information: Patient-maintained information.
- Clinical records: separately attributed professional entries/verification.
- Sharing & access: approved Patient-controlled caregiver/clinical sharing.

## 7. Appointment ownership

CURRENT: the Patient reviews/edits and submits an appointment REQUEST. New
requests use Requested; cancellation writes Cancelled. Legacy status strings may
be read for compatibility but establish no operational acceptance workflow.
Storage success, including cloud acknowledgement, does not mean confirmed
availability, clinic acknowledgement, clinician acceptance, guaranteed booking
or notification. Device-only outcomes have no replay guarantee.

FUTURE conceptual lifecycle: requested -> reviewed -> accepted/confirmed or
declined, with cancelled/completed where appropriate. Requested/Cancelled already
exist; remaining states, transition permissions, responsible actors, availability
and notification contracts require approval. No schema/transitions change here.

## 8. AI hematology chat and human escalation

CURRENT: ChatSystem has shared message persistence and legacy scripted hematology
replies under a named doctor persona. This is neither a verified human
hematologist nor evidence of a complete AI clinical assistant. AI advice services
and Offline AI exist separately. Names, moderation flags and simulated typing
are not professional credentials.

FUTURE: a clearly identified AI hematology-oriented assistant may offer a
Patient-controlled request when human clinical judgement is appropriate:

```text
AI conversation -> human judgement appropriate -> offer appointment request
-> optional reason prefill -> Patient reviews/edits -> Patient explicitly submits
```

Telemedicine and Appointments already accept initialReason as editable form
state; review does not save it. This is handoff readiness, not a wired AI-to-clinic
handoff. AI must never silently create an appointment or imply notification.
Selection/consent for conversation excerpts and future retention remain unresolved.
Clinical decisions remain with authorized human professionals.

## 9. Caregiver consent: FUTURE PRODUCT/SECURITY DECISIONS

- Who invites a caregiver, including for children/dependents?
- Can a Patient revoke access; how are guardianship exceptions handled?
- Is access whole-account or category-specific?
- Is access read-only by default?
- Can caregivers record symptoms or other information on behalf of a Patient?
- How is caregiver authorship retained across edits, display and export?
- Can caregivers independently access emergency information?
- Can caregivers request or cancel appointments?
- What happens to sessions, cached copies and pending actions on revocation?
- Is historical caregiver-authored information retained, under what policy?

No answers or permissions are approved by this document.

## 10. Clinician/Admin: FUTURE PRODUCT/SECURITY DECISIONS

Resolve professional identity verification, organization/clinic association,
patient assignment and clinician authorization separately from admin membership.
Approve least-privilege permissions, consent/revocation, audit logging, record
provenance, export scope, retention, amendment and clinical verification policy.
Determine whether operations staff need any health details to manage requests.

Review Firestore Security Rules and server enforcement before granting access;
profile role strings/frontend controls are insufficient. Address broad current
profile/chat reads, rule gaps, shared-device caches and offline revocation limits
in that approved phase. Define verification revocation/amendments while retaining
original attribution. No fake security or compliance certification is proposed.

## 11. Privacy/access principles (target requirements)

- Least privilege and explicit Patient consent where appropriate.
- Operational privilege alone conveys no clinical-data access.
- Preserve provenance and uncertainty through display and export.
- Distinguish Patient, caregiver, professional and generated information.
- Missing information remains missing; no manufactured clinical defaults.
- Enforce revocation at the server/data layer, with explicit policy for offline
  copies and already exported data; hiding controls is insufficient.
- Do not claim current compliance certifications or guaranteed emergency delivery.

These are future acceptance requirements, not assertions that current behavior
already satisfies every principle.

## 12. Roadmap and implementation gates

1. CURRENT: Patient V1.
2. NEXT / FUTURE: Caregiver Experience.
3. LATER: Clinician Experience.
4. LATER: Administrator Experience, distinct from Clinician.

Before each role, require an approved capability matrix, approved data-access
rules, Firestore/security-rule review, provenance requirements, applicable
consent model and a regression boundary against Patient V1. Plan migration and
security validation separately. This document implements no dashboards, role
switching, invitations, sharing controls, collections, security rules, appointment
confirmations or human-clinician messaging.

## Source references

- [Product purpose/safety](../PRODUCT.md), [current state](./CURRENT_STATE.md),
  [persisted contracts](./DATA_CONTRACTS.md), [regression gates](./REGRESSION_CHECKLIST.md).
- Roles: [types](../types.ts), [AuthFlow](../components/AuthFlow.tsx),
  [UserProfile](../components/UserProfile.tsx), [rules](../firestore.rules).
- [Medical Records](../components/care/MedicalRecords.tsx),
  [Health History](../components/health/HealthHistory.tsx),
  [appointment request](../components/care/AppointmentRequest.tsx),
  [Telemedicine](../components/Telemedicine.tsx), [service](../services/firebaseService.ts).
- Legacy limits: [caregiver widget](../components/DesignatedCaregiverWidget.tsx)
  and [ChatSystem](../components/ChatSystem.tsx); these are not approved future capabilities.

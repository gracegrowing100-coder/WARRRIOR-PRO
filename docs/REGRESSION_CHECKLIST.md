# Redesign regression checklist

Use this checklist at the end of every redesign phase. Mark an item only when it
has current evidence. Record skipped or blocked items with a reason; do not treat
“not tested” as “passed”.

## Build and baseline

- [ ] `npm run lint` completes successfully.
- [ ] Development server starts and `GET /api/health` responds.
- [ ] No new uncaught browser-console errors appear.
- [ ] Existing Firestore records used by the test account remain readable.
- [ ] No application source was changed outside the current phase scope.

## Routing and shell

- [ ] `#/home` opens Home on initial load.
- [ ] Direct existing hashes open the correct screen without an intermediate wrong screen.
- [ ] Home, Games, Chat, Telemedicine, Community, and Advocacy remain reachable during migration.
- [ ] Browser back/forward follows the visible screen state.
- [ ] Unknown hashes produce a safe fallback or not-found state.
- [ ] The six top-level destinations remain reachable after Phase 2; the mobile
      presentation matches the approved Phase 2.2B outcome without shrinking
      labels or interaction targets below accessibility requirements.
- [ ] Desktop navigation has visible labels and a clear active state.
- [ ] Emergency/help remains reachable from primary patient screens.

## Authentication and onboarding

- [ ] Existing user can sign in with email and password.
- [ ] Google sign-in starts through the configured Firebase flow.
- [ ] Password reset can be requested.
- [ ] New-user registration completes the current inline profile/health setup and opens Home.
- [ ] An authenticated account with no profile can reach and complete the separate three-step recovery onboarding.
- [ ] Onboarding profile persists to the same Firebase UID.
- [ ] Existing session restores after reload.
- [ ] Remember-user and session-only persistence behave as selected.
- [ ] User can sign out.
- [ ] Selecting a healthcare-professional role does not grant unsecured clinician access.
- [ ] Synthetic demo opens without creating a Firebase patient account.

## Daily check-in and mood

- [ ] User can save today’s check-in.
- [ ] Saved check-in reappears for the same date.
- [ ] Saving creates/updates the linked mood-history entry as expected.
- [ ] Duplicate submission is prevented while saving.
- [ ] Permission failure produces a local fallback rather than data loss.
- [ ] UI does not call local-only data “synced”.

## Pain and symptoms

- [ ] User can record pain from 0 through 10.
- [ ] Keyboard user can operate the pain control and hear/see the selected value.
- [ ] Pain triggers persist.
- [ ] A second entry for the same date updates rather than creates an unintended duplicate.
- [ ] Existing pain history remains readable.
- [ ] User can record symptoms and triggers.
- [ ] Authenticated symptom save updates pain history after the symptom Firestore write succeeds.
- [ ] Authenticated symptom save updates the date’s hydration record after the symptom Firestore write succeeds.
- [ ] Guest and failed-symptom-write behavior is recorded without assuming linked pain/hydration writes.
- [ ] Severe input uses icon, text, and color.
- [ ] Severe input does not claim a diagnosis or completed emergency contact.

## Hydration

- [ ] User can add water using each supported quick amount.
- [ ] Current amount and goal are readable as text.
- [ ] Date-based hydration record persists.
- [ ] Seven-day history loads existing records.
- [ ] Empty hydration state gives a clear action.
- [ ] Local fallback remains usable when Firestore is unavailable.

## Medication

- [ ] Existing medication list loads.
- [ ] User can add a medication.
- [ ] Existing medication update behavior for `lastTakenDate` remains functional.
- [ ] Any new edit-medication-details flow is treated as proposed scope and tested if implemented.
- [ ] User can mark the supported taken/adherence state.
- [ ] User can delete a medication with appropriate confirmation.
- [ ] Current Pending, Taken, and empty states remain functional.
- [ ] Due, missed, and upcoming states are distinguishable after the Phase 5 enhancement.
- [ ] Empty-list handling does not create repeated default medications.
- [ ] Shared-browser test does not silently show another account’s cached medication data.

## Appointments

- [ ] Existing appointment list loads.
- [ ] User can book an appointment.
- [ ] Provisional local state is labelled if the cloud write fails.
- [ ] User can cancel an appointment.
- [ ] Cancelled state persists after reload.
- [ ] Next active appointment appears on Home after its redesign phase.
- [ ] Seeded providers are not presented as verified available clinicians.

## Notifications and reminders

- [ ] Browser notification support is detected.
- [ ] Permission is requested only after a user action.
- [ ] Granted, denied, and unsupported states are explained.
- [ ] Test notification works when permission is granted.
- [ ] User can add, enable/disable, and remove a reminder.
- [ ] Reminder local fallback persists after reload.
- [ ] Firestore permission failure is not reported as cloud success.

## Profile, settings, and accessibility

- [ ] Profile can be opened by mouse, touch, and keyboard.
- [ ] Profile edits persist without dropping unknown existing fields.
- [ ] Language selection persists after reload.
- [ ] Dark mode persists after reload.
- [ ] High-contrast mode persists after reload.
- [ ] Every interactive control has an accessible name.
- [ ] Focus order follows the visual task order.
- [ ] Focus is visible in light, dark, and high-contrast modes.
- [ ] Primary touch targets are approximately 44px or larger.
- [ ] Status is never communicated by color alone.
- [ ] Reduced-motion users are not exposed to constant pulse, bounce, or spin.

## Care Vault and emergency

- [ ] Existing Care Vault document loads without field loss.
- [ ] Care Vault edits preserve current Firestore path and unrelated fields.
- [ ] Existing PDF/passport export still works where supported.
- [ ] Seeded defaults are visibly distinguished from verified patient data.
- [ ] Emergency information can be reviewed and edited.
- [ ] Emergency action does not claim that a message or dispatch succeeded without confirmation.
- [ ] Care Vault local unlock state is not described as encryption or clinical-grade security.

## Chat, community, and secondary features

- [ ] Existing chat channels open.
- [ ] Messages send and realtime/local fallback behaves as documented.
- [ ] Reactions and moderation actions still work for their current roles.
- [ ] Chat media upload retains Firebase Storage and Base64 fallback behavior.
- [ ] Typing indicator does not block message entry.
- [ ] Community posts load, create, and like.
- [ ] Education progress and XP persist.
- [ ] Games remain reachable and playable at supported widths.
- [ ] Advocacy and genotype education remain reachable.
- [ ] Offline assistant history remains local and clearable.

## Charts and reports

- [ ] Pain chart renders with positive width and height.
- [ ] Hydration chart renders with positive width and height.
- [ ] Mood/hydration chart renders with positive width and height.
- [ ] Charts include a textual summary or equivalent accessible information.
- [ ] Missing data shows an explanatory empty state.
- [ ] Generated reports and correlations are labelled experimental/advisory.
- [ ] No unvalidated probability is presented as a clinical prediction.

## Offline and service worker

- [ ] App shell reloads from cache in the intended production/offline scenario.
- [ ] Service worker is not masking current assets during localhost development.
- [ ] Supported local health logs remain available after network loss.
- [ ] UI distinguishes local fallback from cloud-confirmed data.
- [ ] No claim promises replay/synchronization without an operation queue.
- [ ] Reconnection behavior is observed and recorded for the changed feature.
- [ ] External font failure does not make the UI unusable.

## Responsive checks

- [ ] 360px: no page-level horizontal overflow.
- [ ] 375px: header, forms, and bottom navigation do not collide.
- [ ] 768px: sidebar transition and content width are correct.
- [ ] 1200px: content remains appropriately constrained.
- [ ] 1440px: layout does not become sparse or over-stretched.
- [ ] Floating actions do not cover submit buttons, charts, or navigation.
- [ ] Choice chips wrap or scroll with an obvious affordance.
- [ ] Modals and sheets fit the viewport and retain a reachable close action.

## Clinical safety

- [ ] Patient-entered information is not labelled as a diagnosis.
- [ ] Crisis prediction is absent from the clinical MVP or clearly experimental.
- [ ] Eye-based PCV estimation is absent from real patient workflows.
- [ ] Generated medical guidance includes appropriate human escalation.
- [ ] AI output does not change medication or treatment autonomously.
- [ ] Synthetic data is clearly labelled.
- [ ] Care-facing AI output requires human review.

## Phase completion record

```text
Phase:
Date:
Reviewer:
Typecheck:
Automated tests:
Manual regression subset:
Responsive widths:
Keyboard/accessibility:
Browser console:
Known exceptions:
Evidence links/screenshots:
Decision: PASS / PASS WITH EXCEPTIONS / FAIL
```

## Phase 4G completion record — 28 September 2026

- Scope: Care navigation and appointment flow integrity; no visual redesign.
- Typecheck: npm run lint passed.
- Focused regression: 64 tests passed across 8 files.
- Full regression: npm test passed once, 126 tests across 31 files.
- Production build: npm run build passed once; large-bundle warning remains.
- Browser: localhost:3000, existing authenticated session; no request submitted
  or cancelled against the account. Keyboard entry/return verified for Medical
  Records, Health History, and Appointments. Required date/time validation,
  optional reason, review, edit, and return verified without saving.
- Direct Care and Appointments reloads and browser back/forward verified.
- Widths: 360px, 375px, 768px, 1200px; no horizontal overflow in Medical Records
  entry, loaded Health History, appointment preferences, or review.
- Console: no errors observed; existing daily-check-in Firestore permission
  warnings remain, with unavailable state and reachable Back to Care.
- Mocked contract coverage: cloud success, offline/permission failure, local-only
  creation/cancellation, cancellation without a stored record, UID isolation,
  duplicate-submit prevention, retained cancelled history, and editable handoff
  reason with no persistence during review. Real network-offline mutation was
  not exercised; tests simulate failures without writing account data.
- Preserved limitations: successful cloud reads can replace device-only changes;
  no replay queue. Vault internals, sample defaults, security wording, and legacy
  tools remain deferred to the separate Care Vault phase. No screenshots added.
- Decision: Phase 4G navigation and request architecture ready to freeze within
  this scope; this is not clinical validation or a full Care Vault safety audit.

## Phase 4H Medical Records verification — 29 September 2026

- Focused: 26 tests across five files passed (Medical Records, CareHub, App Care
  routing, UID/persistence contracts and PDF content).
- TypeScript: npm run lint (tsc --noEmit) passed.
- Browser subset: live authenticated empty state at 390px and 1200px; opens
  from Care, Back to Care works, keyboard return works, no horizontal overflow.
- Recorded-state browser checks used a temporary read-only service fixture at
  both widths, including recorded zero and missing optional laboratory values.
  No real account mutation, screenshot matrix, or fixture remains. No console
  errors/warnings observed in checked tabs. Layout inspected via rendered DOM
  and geometry; consolidated visual polish remains deferred.
- Mocked coverage verifies UID A/B isolation, ignored global cache, preserved
  unknown fields, zero/false, empty defaults, Firestore merge path, cloud/device
  outcomes, total save failure, retry, add/edit/remove and focus restoration.
- Limits: stored legacy samples lack provenance; no heuristic purge. Browser
  local data is not encrypted, no replay queue or conflict resolution was added.
  Future clinician verification, secure documents/OCR, biometrics and validated
  prediction infrastructure remain deferred.
- Final full suite ran once: 145 passed, 2 failed across 34 files (147 tests).
  Both failures were in unchanged SymptomPainCheckIn: a 5-second timeout, then
  a hydration assertion mismatch. Targeted rerun of that unchanged file passed
  all 6 tests in 9 seconds. This is a full-run flakiness exception, not a claim
  that the single full run was green. No timeout or product code was changed.
- Production build ran once and passed; existing >500 kB chunk warning remains.
- git diff --check passed. No dependency or lockfile changes.
- Decision: architecture ready to freeze with the full-run test exception above;
  this does not certify clinical correctness or production security.

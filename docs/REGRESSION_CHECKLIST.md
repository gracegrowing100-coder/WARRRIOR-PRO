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
- [ ] Mobile primary navigation has no more than five persistent destinations after Phase 2.
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

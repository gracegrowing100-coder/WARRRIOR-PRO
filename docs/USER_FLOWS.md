# Critical user flows

These flows combine the observed brownfield path with the approved redesign
target. Lines labelled **Current** describe code that exists now. Lines labelled
**Proposed** are future navigation, state, or UX decisions and must not be used
as evidence of current behavior.

## Flow conventions

- **Cloud-confirmed:** Firestore accepted the write.
- **Local fallback:** data is available on this browser through local storage,
  but cloud replay is not guaranteed by the current implementation.
- **Experimental:** the result cannot be presented as clinical diagnosis or
  prediction.

## UF-01: Sign in and restore a session

```text
Logged out
  -> choose email/password or Google popup
  -> authenticate with Firebase
  -> auth observer resolves
  -> patient shell opens
```

Success: the correct authenticated account opens and its profile can be loaded.

Failure: show a patient-safe error and preserve entered email where the remember
option is enabled. Do not expose a raw Firebase error.

Regression risk: theme and high-contrast state are also reapplied when auth
state resolves.

## UF-02: Register and complete onboarding

**Current — ordinary registration:**

```text
Landing
  -> Create account
  -> enter profile/role/health setup in the signup form
  -> submit credentials and request email verification
  -> create users/{uid} plus initial medication/hydration/emergency records
  -> Home
```

**Current — missing-profile recovery:** an already registered account that can
authenticate but has no profile record is routed to the separate three-step
onboarding screen. Ordinary new registration does not traverse that screen.

**Proposed:** redesign this into a coherent progressive onboarding flow without
changing UID ownership or stored field names.

Success: authentication and profile records remain associated with the same UID.

Safety: selecting “Healthcare Professional” does not grant clinician access by
itself.

## UF-03: Complete the daily check-in

```text
Home
  -> choose current feeling
  -> add optional note
  -> Save
  -> local daily record written
  -> mood-history record added
  -> mood-history Firestore write attempted
  -> daily Firestore write and streak update attempted only if the preceding
     mood-history call does not reject
```

Success: the current date shows the saved check-in and the action cannot be
submitted repeatedly while saving.

Failure/offline: retain the local record and label it accurately. Current code
does not guarantee later replay of the failed Firestore write. A permission
failure from `moodLogs` currently rejects before the daily document and streak
steps, even though both local mood records have already been written.

## UF-04: Log pain

```text
Home
  -> open Pain check-in
  -> select 0-10 value
  -> select optional triggers
  -> review severity wording
  -> Save
  -> update the date's pain record
  -> return to summary
```

Current: the record appears in pain history/the pain chart. **Proposed:** expose
it in a concise today summary on the redesigned Home screen.

Safety: severe pain and red-flag symptoms provide clear escalation guidance but
must not claim that a crisis has been diagnosed or that help was contacted.

## UF-05: Log symptoms

```text
Home
  -> open Symptom check-in
  -> choose symptoms
  -> choose pain and triggers
  -> record water intake
  -> Save
  -> local symptom record upserted
  -> if authenticated, symptom Firestore record attempted
  -> after that authenticated write succeeds, pain and hydration records updated
  -> guest path updates the local streak but does not call pain/hydration services
  -> summary refreshed where the component supports it
```

Regression risk: the current authenticated success path intentionally performs
three linked data operations. A visual refactor must not silently remove that
coupling, nor claim the same behavior for guest or failed-write paths without an
approved contract change.

## UF-06: Add hydration

```text
Home
  -> open Hydration
  -> add an amount
  -> local date record updates
  -> Firestore date document attempted
  -> progress and seven-day view refresh
```

Success: amount and goal remain visible as text, not only a graphic.

Failure/offline: show the local state without saying it is synchronized.

## UF-07: Manage medication

```text
Home
  -> open Medication
  -> mark dose taken OR add/delete medication
  -> Firestore operation attempted (create is cloud-first for authenticated users)
  -> local cache updates according to the service path
  -> Pending/Taken state refreshes
```

Current: the UI shows `Pending` or `Taken`, triggers an alarm only at an exact
scheduled minute, and has no edit-details flow. **Proposed:** distinguish due,
taken, missed, and upcoming states and add editing only if product scope confirms
it.

Regression risks: the current cache key is global to the browser, and the UI may
seed defaults when it finds an empty list. Testing must use isolated browser
storage to prevent duplicate or cross-account records.

## UF-08: Book and cancel an appointment

```text
Home or Care
  -> Appointments
  -> choose provider/date/details
  -> Reserve
  -> local appointment inserted
  -> Firestore document attempted
  -> confirmation/list state

Existing appointment
  -> Cancel
  -> local status becomes Cancelled
  -> Firestore status update attempted
```

Current: the full record is listed in Telemedicine. **Proposed:** show the next
active appointment on Home and own full management under Care.

Failure: avoid raw database alerts; explain whether a local provisional record
exists. The service inserts a local provisional item before the cloud create,
but the component immediately reloads from Firestore; a successful cloud read
can therefore replace the cache and remove a failed provisional booking.

## UF-09: Configure reminders and notifications

```text
More or Care
  -> Notifications/Reminders
  -> request browser permission when user asks
  -> add or toggle reminder
  -> save local settings
  -> Firestore setting attempted
  -> optional test notification
```

Success: the interface reflects browser permission and reminder enabled state.

Known issue: current Firestore rules do not explicitly allow the reminder path,
so the local fallback may be the only successful write.

## UF-10: Review trends

```text
Current chart surfaces on Home/Care Vault; proposed Care destination
  -> Trends
  -> choose metric/time period (proposed unified control)
  -> load existing logs
  -> chart plus textual interpretation
```

Success: charts have valid dimensions, readable axis/legend information, and a
plain-language summary. Missing data produces an action-oriented empty state.

Safety: generated correlations and confidence values remain experimental and
must not be stated as clinical predictions.

## UF-11: Open emergency information

```text
Any primary patient screen
  -> Emergency/help
  -> review stored emergency information
  -> choose a supported contact/navigation action
```

Success: stored patient data is clearly distinguished from seeded or suggested
content.

Safety: only show “sent” or “contacted” after verifiable external confirmation.
Current UI navigation and prefilled messages are not emergency dispatch.

## UF-12: Change accessibility and account settings

```text
Current header/Profile controls; proposed Profile destination
  -> Profile/Settings
  -> change language, theme, high contrast, or profile
  -> save
  -> reload
  -> setting remains active
```

Success: the full flow works by keyboard and maintains visible focus.

## UF-13: Use local fallback during poor connectivity

```text
Network unavailable or Firestore rejected
  -> user records supported health data
  -> service writes local storage where implemented
  -> operation may still reject for permission errors
  -> UI should label data as local (proposed; not consistently implemented now)
  -> user can continue the supported local flow
```

Current limitation: there is no general operation queue or conflict-resolution
engine. “Back online” does not prove that every failed write synchronized. A
future recovery flow must enumerate pending operations before making that claim.

## UF-14: Open the synthetic AI demonstration

```text
Logged-out landing
  -> Open synthetic demo
  -> synthetic patient check-in
  -> local nurse queue updates
  -> nurse approves demo brief/callback request
```

Success: no Firebase patient record, real callback, diagnosis, or prediction is
created. Every action remains visibly simulated.

## Regression mapping

Each flow maps to one or more items in
[`REGRESSION_CHECKLIST.md`](./REGRESSION_CHECKLIST.md). Data paths and fallback
semantics are defined in [`DATA_CONTRACTS.md`](./DATA_CONTRACTS.md).

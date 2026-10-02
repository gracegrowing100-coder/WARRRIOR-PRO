# Data contracts

This file protects the current storage and service interfaces during the UI
redesign. It describes code as it exists; it does not certify the model for
clinical use.

## Data-flow pattern

```text
React component
    |
    v
firebaseService or auth helper
    |
    +----> Firestore / Firebase Storage
    |
    +---- failure or guest path ----> localStorage fallback
```

Important: local fallback is not a general synchronization queue. Many writes
update local storage and then attempt Firestore, but the application does not
persist an operation ledger or resolve later conflicts.

Reads do not generally merge cloud and local records. For medications, pain,
symptoms, and appointments, a successful Firestore list (including an empty
list) becomes the returned value and cached value. Hydration, emergency, and
Care Vault similarly prefer a successful cloud result (Vault uses an empty object for a missing document) rather
than an older local value. Mood history/daily mood and reminders have different,
more local-first behavior. Preserve these differences until an explicit
reconciliation policy replaces them.

## Authentication contract

`firebase-init.ts` exposes:

- `configureAuthPersistence(rememberUser)` using local or session persistence.
- `loginWithGoogle(useRedirect)`.
- `registerWithEmail(email, password)`.
- `loginWithEmail(email, password)`.
- `sendPasswordReset(email)`.
- `triggerEmailVerification()`.
- `updateUserDisplayNameAndPhoto(name, photoURL?)`.
- `logout()`.
- `subscribeToAuth(callback)`.
- `getRedirectResult`.

The current `AuthFlow` calls `loginWithGoogle(false)`, so the rendered UI uses
popup authentication only. Redirect support is an exported helper capability,
not an exercised application flow, and no component currently calls
`getRedirectResult`.

Firebase UID is the primary owner key for patient Firestore paths. A profile
role string is not authorization for clinician capabilities.

## Firestore paths

| Path | Operations in current service | Important fields/behavior |
|---|---|---|
| `users/{uid}` | get, create, update | Profile plus `streak`, `lastActiveDate`, `xp`; create/update are owner-restricted, but reads are currently allowed to any signed-in user. |
| `users/{uid}/medications/{medId}` | list, create, update, delete | UI-defined medication data plus `createdAt`; list ordered by `time`. |
| `users/{uid}/waterLogs/{dateStr}` | get, set | `amount`, `goal`, `updatedAt`; default goal is `3.0`. |
| `users/{uid}/painLogs/{logId}` | list, daily query/upsert | `painLevel`, `dateStr`, `triggers`, timestamp/update time. |
| `users/{uid}/symptomLogs/{logId}` | list, daily query/upsert | `userId`, `painLevel`, `symptoms`, `triggers`, `waterIntake`, `dateStr`, timestamp. |
| `users/{uid}/emergencyInfo/summary` | get, merge set | Contact, blood/genotype, allergies, medications, notes; missing records remain empty. |
| `users/{uid}/appointments/{appointmentId}` | list, create, cancel | UI-defined request preferences, `createdAt`, `status`; cancellation writes `Cancelled`. No clinic confirmation is established. |
| `users/{uid}/careVault/medicalHistory` | get, merge set | Large document holding diagnosis/history arrays and other Care Vault fields. |
| `users/{uid}/moodLogs/{logId}` | list, create | `emotion`, `intensity`, `symptoms`, `journalText`, optional `aiResponse`, `createdAt`. |
| `users/{uid}/dailyMoodCheckIns/{dateStr}` | get, set | `emoji`, `emotion`, `score`, optional `note`, `dateStr`, timestamps. |
| `users/{uid}/reminderSettings/config` | get, merge set | `reminders[]`, `updatedAt`. |
| `chats/{chatId}` | subscribe/update settings | `admins`, `mutedUsers` and other chat document state. |
| `chats/{chatId}/messages/{messageId}` | realtime list, create, react, delete/moderate | Message text/media/reaction/moderation fields and timestamp. |
| `chats/{chatId}/typing/{uid}` | merge-set, subscribe | `userId`, `userName`, `isTyping`, timestamp. Setting false removes the local key but writes `isTyping: false` to Firestore rather than deleting the document. |
| `posts/{postId}` | list, create, increment likes | `title`, `content`, `tags`, author identity, likes, `createdAt`. |

## Firestore rules reality

`firestore.rules` currently allows owner access for medication, appointment,
water, pain, symptom, emergency, and Care Vault subcollections. It also defines
authenticated chat and post access.

Profile reads are broader: `users/{userId}` uses `allow read: if isSignedIn()`.
The current rules therefore allow any authenticated user to read any profile
document if its UID is known. Create and update remain owner-restricted. This is
not a clinician authorization model.

It does not currently define explicit matches for:

- `users/{uid}/moodLogs/{logId}`
- `users/{uid}/dailyMoodCheckIns/{dateStr}`
- `users/{uid}/reminderSettings/config`

The default deny rule therefore causes these calls to fall back locally in the
audited environment. Do not represent them as cloud-saved until rules and tests
confirm the intended access.

## Coupled write behavior

For a non-empty authenticated `userId`, `addSymptomLog(...)` currently:

1. Upserts the date’s symptom record.
2. Calls `addPainLog(...)` with the same pain and triggers.
3. Calls `saveWaterLog(...)` with the recorded water value and goal `3.0`.
4. Updates streak behavior.

Steps 2–4 occur only after the symptom Firestore upsert succeeds. With no
`userId`, the method stores the symptom locally and updates the local streak but
returns before pain and water calls. If the authenticated symptom write fails,
the local symptom remains but the linked calls do not run. This is the exact
existing contract; refactoring must preserve it or replace it through an
explicit, tested data decision.

`saveDailyMoodCheckIn(...)` writes the local daily record, attempts the optional
mood-history write, and still attempts the independent daily Firestore document
when mood history fails. It returns the daily persistence `state` plus
`historyState` (`recorded`, `device-only`, or `failed`). Streak failure does not
change an already established daily result. The UI presents recorded,
device-only/partial, and failed outcomes separately.

## Fallback semantics by feature

| Feature/write | Current local behavior | Cloud/error nuance |
|---|---|---|
| Profile create/update | Local profile written first. | Permission errors can still reject after the local write. |
| Medication create | Guest writes locally; authenticated create is cloud-first and caches only after success. | Returns `recorded` or `device-only`; authenticated cloud failure rejects rather than appearing successful. There is no offline create queue. |
| Medication update/delete | Existing local cache is changed first. | Returns `recorded` after cloud success or `device-only` after a local-only mutation; throws when neither destination changed. |
| Hydration | Local value is written first. | Save returns `recorded` or `device-only` and throws when neither destination saved. Reads distinguish `recorded`, `cached`, `missing`, and `unavailable`; data is nullable so missing/error is not recorded zero. |
| Pain, emergency, Care Vault | Local value is written first. | Firestore is attempted afterward; no replay ledger exists. |
| Symptom | Local symptom is written first. | Linked pain/water calls are conditional as described above. |
| Appointment create | Local provisional item is written first into the UID-scoped cache. | Returns a record after cloud success, or undefined after cloud failure (including permission denial) once local saving succeeded. The result remains visible until Done; a later successful cloud list can still replace provisional items. |
| Appointment cancel | Existing local status changes first. | Returns `{ state: "recorded" }` after cloud success or `{ state: "device-only" }` after a local-only update. Throws when neither destination saved the cancellation. No clinic notification is implied. |
| Mood/daily check-in | Local records are written first. | Mood history and daily check-in expose separate outcomes; a history failure no longer prevents the daily cloud attempt. Missing rules can produce device-only/partial results. |
| Reminders | Local settings are written first. | Firestore errors are logged but not surfaced as a delivery/sync state. |
| Chat/posts | Local cache is updated first for sends/creates and several mutations. | This is optimistic fallback, not queued synchronization. |

## Firebase Storage

Chat media uploads use:

```text
chats/{chatId}/images/{prefix}_{timestamp}_{random}.jpg
```

String inputs use `uploadString(..., 'data_url')`; file/blob inputs use
`uploadBytes` with JPEG content type. If Storage fails, the method returns a
Base64/data URL fallback where possible.

No Firebase Storage rules file is present in this repository, so deployed
upload/read authorization cannot be verified from source alone.

Do not move these media URLs or delete inline fallback support during visual
refactoring.

## Local-storage keys

### Account and UI preferences

| Key | Purpose |
|---|---|
| `warrior_language` | Current app language. |
| `warrior_theme` | `light` or `dark`. |
| `warrior_high_contrast` | High-contrast boolean string. |
| `warrior_remembered_email` | Remembered login email. |
| `user_profile_{uid}` | Cached user profile. |

### Health and care data

| Key | Purpose |
|---|---|
| `warrior_meds_{uid}` | Authenticated medication cache. The legacy `warrior_meds` key remains guest-only and is never attached to an authenticated account. |
| `water_{uid}_{dateStr}` | Authenticated hydration record. The legacy `water_{dateStr}` key remains guest-only. |
| `warrior_pain_{uid}` | Authenticated pain-log cache. The legacy `warrior_pain` key remains guest-only. |
| `warrior_symptom_logs_{uid}` | Authenticated symptom-log cache. The legacy `warrior_symptom_logs` key remains guest-only. |
| `warrior_emergency_{uid}` | Authenticated emergency summary. Missing records return an empty object; the legacy `warrior_emergency` key remains guest-only. |
| `warrior_appointments` | Guest-only legacy appointment list; never read for authenticated users. |
| `warrior_appointments_{uid}` | Authenticated appointment cache; cloud success replaces this cache. |
| `warrior_carevault_<uid>` | Authenticated Medical Records fallback; only the matching account reads it. |
| `warrior_carevault` | Legacy guest-only fallback; never imported into an authenticated account. |
| `warrior_carevault_unlocked` | Obsolete prototype key; production Medical Records ignores it. |
| `warrior_mood_logs_{uid|guest}` | Mood history. |
| `warrior_daily_mood_{uid|guest}_{dateStr}` | Daily mood check-in. |
| `warrior_reminders_{uid|guest}` | Scheduled reminder settings. |
| `warrior_designated_caregiver_{uid}` | Authenticated designated-caregiver data. The legacy unscoped key remains guest-only. |
| `warrior_er_checklist` | ER toolkit checklist state. |

### Community, education, and local assistant

| Key | Purpose |
|---|---|
| `warrior_chat_{chatId}` | Cached chat messages. |
| `typing_{chatId}_{uid}` | Local typing status cache where used. |
| `group_settings_{chatId}` | Admin/mute settings. |
| `warrior_custom_groups_{uid|guest}` | Custom group definitions. |
| `warrior_posts` | Cached community posts. |
| `warrior_offline_ai_history` | Local assistant history. |
| `warrior_favorite_tips` | Saved wisdom tips. |
| `warrior_academy_progress` | Education progress. |
| `warrior_xp` | Local XP value. |
| `warrior_streak_info` | Guest/local streak state. |
| `warrior_daily_challenge` | Daily game completion. |
| `warrior_active_skin` | Selected game skin. |

Legacy global health keys are preserved without deletion because ownership
cannot be established. Authenticated reads and writes use UID-scoped keys and
do not migrate or expose legacy global values. Guest flows retain the legacy
keys for compatibility.

## Server API contracts

The Express server exposes:

| Method and path | Client purpose |
|---|---|
| `POST /api/gemini/advice` | Health-advice response with curated fallback. |
| `POST /api/gemini/advocacy` | Advocacy petition generation. |
| `POST /api/gemini/game-story` | Educational game narrative. |
| `POST /api/gemini/genotype-counselor` | Genotype education response. |
| `POST /api/gemini/mood-response` | Mood reflection response. |
| `POST /api/gemini/pattern-insights` | Experimental generated pattern summary; client failure remains unavailable rather than fabricating statistics. |
| `POST /api/gemini/doctor-report` | Generated discussion-summary content; client failure remains unavailable rather than fabricating clinical facts. |
| `GET /api/health` | Server health endpoint. |
| `GET /sw.js` | Service-worker asset. |

`services/gemini.ts` calls every listed POST route except the genotype route,
which is called from its feature component. API credentials remain server-side.

All generated health, pattern, genotype, mood, and report content is advisory or
experimental and requires the safety treatment defined in `PRODUCT.md`. The
current Patient pattern/report UI does not persist generated output as clinical
history, does not display model-provided confidence as clinical confidence, and
passes missing name/genotype/blood/statistical inputs as missing.

Collapsed secondary Home tools are lazily mounted. Their reads and AI requests
begin only after the patient opens that specific tool.

## Appointment presentation contract

Appointment documents store patient requests and preferred dates/times. A legacy
`Confirmed` status does not establish clinic acceptance and is presented as
`Request recorded` unless cancelled. Home chooses the earliest future
non-cancelled ISO preferred date, then the most recent past date, then a stable
legacy fallback. Home, Care and Appointments use `Appointment request` and
`Requested for ...`; no slot, clinician response, or reserved time is implied.

## Component-to-service relationships

| Component/surface | Main service contract |
|---|---|
| `App`, `AuthFlow`, `UserProfile` | Firebase auth helpers and user profile methods. |
| `Dashboard` | Symptom, pain, hydration, mood, reminders, and nested feature components. |
| `MedicationReminder` | Medication CRUD. |
| `WaterIntakeTracker` | Water get/save and seven-day aggregation. |
| `PainTrendsChart`, `PainAndSymptomTrends` | Pain and symptom reads. |
| `DailyMoodCheckIn`, `MoodWellnessTracker` | Daily mood and mood-history methods. |
| `Telemedicine` | Appointment methods and auth observer. |
| `ScheduledRemindersManager` | Reminder methods plus Browser Notification API. |
| `EmergencyButton` | Emergency summary methods. |
| `CareVault` / `MedicalRecords` | UID-keyed compatibility wrapper; getCareVaultResult and patch-based saveCareVault. |
| `ChatSystem` | Message subscription, send, media, typing, reactions, and moderation. |
| `Community` | Post list/create/like. |

## Chart and aggregation contracts

- `PainTrendsChart` constructs 30 points and fills dates without logs with a
  deterministic simulated curve. Each point has `isReal`, but recorded and
  simulated points share one rendered series.
- `getMoodAndHydrationTrends7Days` uses an explicit daily mood score when
  present, otherwise may infer a score from the acting account's UID-scoped
  `warrior_pain_{uid}` cache as
  `max(1, 10 - painLevel)`. With no mood or pain it returns `7.0` for chart
  continuity. The current `hasMoodLogged` value is true for inferred pain-based
  scores as well as explicit mood entries.
- Current Recharts data covers pain, symptom occurrence, hydration,
  mood/hydration. Medical Records now lists recorded laboratory values without synthetic charts. Medication has no current
  trend aggregation or Recharts dataset.

## Type contract limitations

`types.ts` defines only basic `Message`, `UserProfile`, `GameConcept`, and
`ForumPost` types. The persistence service and many components use `any`, and
several feature interfaces exist only inside their UI files.

During refactoring:

- Add shared types without changing stored field names.
- Parse Firestore timestamps and local ISO strings deliberately.
- Keep unknown existing fields when performing merge updates.
- Do not infer clinical validity from a TypeScript type.

## Service worker and cache contract

`sw.js` uses cache name `warrior-cell-carevault-v2` and attempts to pre-cache
`/`, `/index.html`, `/index.css`, and `/metadata.json`. Same-origin GET responses
are cached using stale-while-revalidate. Navigation failures fall back to `/`.

The current Vite output contains hashed CSS/JS assets, but no root `index.css`
or `metadata.json`. In production, the Express wildcard responds to those
missing paths with `dist/index.html`, so the corresponding cache entries can
contain HTML rather than the intended files. Hashed assets are not listed in
`ASSETS_TO_CACHE`; they are cached only after a controlled successful GET.

Do not claim complete offline availability based on this shell cache. Google
fonts remain network dependencies, and Firebase/Google hosts are excluded from
service-worker interception. Firestore is initialized with long-polling
auto-detection only; the code does not enable persistent IndexedDB caching.

## Change rules

Before changing a path, field, key, or endpoint:

1. Identify all readers and writers.
2. Add a versioned migration or compatibility reader.
3. Test existing Firestore documents and local browser data.
4. Update this document and the regression checklist.
5. Keep the old contract until verification shows migration is safe.

## Phase 4H Medical Records contract

Medical Records contains patient-maintained background, conditions, allergies,
medication/therapy history, procedures, admissions, transfusions, laboratory
values, immunizations, care contacts and notes. Daily recorded check-ins stay
in Health History; Home medication scheduling is separate. No clinician
authorship or verification is established.

- Firestore remains `users/{uid}/careVault/medicalHistory`, using merge writes.
- Missing documents return `{}`; no clinical defaults are injected. Zero and
  false remain recorded values. Blank optional numeric/boolean edits use null.
- `getCareVaultResult` distinguishes recorded, cached, empty and unavailable.
  Cloud reads win, including empty documents. Cache write failure does not hide
  a valid cloud read. Offline corrupt/missing cache is unavailable for accounts.
- Authenticated reads/writes use only `warrior_carevault_<uid>`. Ambiguous global
  data is neither deleted nor migrated; guest compatibility retains its old key.
  The component remounts on UID changes to clear prior account screen state.
- `saveCareVault` merges explicit patches into the scoped local copy and attempts
  Firestore. Recorded means cloud acknowledgement; device-only means only local
  storage succeeded. If neither succeeds, it throws and the editor retains input.
  There is no replay queue; future cloud reads can replace device-only edits.
- Unknown fields, excluded painCrises/attachedFiles, and untouched nested fields
  are preserved. Editing/removing an array entry writes that array; concurrent
  edits can still overwrite each other (no conflict resolution added).
- PIN/fingerprint simulation, OCR, generated analytics, fabricated verification
  and seeded fallbacks are excluded from this production boundary. Existing
  sample values already saved cannot be reliably distinguished from user input;
  screen and PDF warn users to review them rather than deleting matching values.
- PDF uses the same recorded-field allowlist, with missing-value labels and no
  invented treatment advice or verification. No upload pipeline is provided.
- Future production claims need clinician identity/sign-off, attachment storage
  and processing, real reauthentication/biometrics, encryption/key management,
  and validated prediction infrastructure as applicable. Local cache remains
  browser-readable storage; UID isolation is not encryption.

## Phase P4 Mira assistant contract

Mira ("Mira by WARRIOR AI") is the Patient V1 assistant. Text and voice share one
conversation, one escalation model and one safety layer; only the modality
differs.

- API (Express, authenticated with a Firebase ID token):
  `POST /api/mira/chat`, `POST /api/mira/transcribe`, `POST /api/mira/speak`.
  The backend derives the UID from the verified token; a client-supplied user id
  is never trusted. Provider keys stay server-side.
- Only `/api/mira/transcribe` uses an 8 MB JSON parser for short base64 voice
  clips; the normal parser limit remains in force for every other API. Each
  Mira route caps its payload: message 2,000 characters, spoken text 900
  characters, audio base64 4,000,000 characters, history 8 turns.
- Conversations are stored separately from clinical data:
  `users/{uid}/miraConversations/{conversationId}` (language, mode, escalation
  urgency, timestamps) and
  `users/{uid}/miraConversations/{conversationId}/messages/{messageId}`
  (role, text, source, createdAt). Nothing generated by Mira is written to
  Health History, Medical Records or any other clinical collection.
- Raw audio is not persisted in Warrior AI. Gemini uploads are deleted by
  provider file name after transcription. YarnGPT ASR uploads are transient to
  Warrior AI but the provider documents remote retention for up to 30 days and
  exposes no deletion endpoint. Only the
  transcript and reply text are stored. The device fallback key is
  UID-scoped (`warrior_mira_conversation_<uid>`).
- Escalation is bounded (`none` / `specialist` / `urgent`). The deterministic
  red-flag scan runs before provider resolution, can only escalate, and returns
  urgent guidance without an AI call. Generated text that claims a human
  clinical identity is filtered before it reaches the client.
- Handoff summaries separate patient-stated fields from an explicitly labelled
  AI-generated rationale, are labelled
  AI-generated, and reach the appointment request only as pre-filled form state.
  Appointment semantics are unchanged: request ≠ confirmed.
- Voice selection is server-side and follows live-verified capability. YarnGPT
  handles TTS for all five pitch languages and STT for English, Igbo, Yorùbá and
  Nigerian Pidgin. Hausa STT stays on the previously verified Gemini `ha-NG`
  path because a genuine human-sample YarnGPT check produced unusable mixed-script
  output. Provider failure never changes the React endpoint contract. One bounded
  retry covers transient YarnGPT transport/provider failures and zero-byte TTS;
  the same idempotency key is reused, and an accepted ASR job is only polled,
  never uploaded again. Unverified capabilities remain unavailable in the UI.

## Future role/provenance planning (Phase 4I)

[Role & Access Model](./ROLE_ACCESS_MODEL.md) defines conceptual future ownership,
authorship and verification requirements. Its HealthRecord fields are not the
current persisted schema and must not be assumed present or backfilled from
profile roles. Adoption requires a separately approved migration/security phase.
Current paths, fields, rules and fallback contracts above remain unchanged.

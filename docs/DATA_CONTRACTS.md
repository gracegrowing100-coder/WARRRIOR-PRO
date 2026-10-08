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
popup authentication. Redirect support remains an exported helper capability,
but embedded browser environments that cannot complete Google OAuth must use a
standard browser or email/password sign-in. `App` stops showing its startup
session loader after eight seconds if Firebase auth initialization never
resolves; late auth callbacks are still processed. No component currently calls
`getRedirectResult` directly.

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
water, pain, symptom, emergency, Care Vault, mood history, daily mood check-in,
reminder-setting, and Mira conversation subcollections. It also defines
authenticated chat and post access.

Profile reads are broader: `users/{userId}` uses `allow read: if isSignedIn()`.
The current rules therefore allow any authenticated user to read any profile
document if its UID is known. Create and update remain owner-restricted. This is
not a clinician authorization model.

The source rules now define explicit owner-only matches for
`users/{uid}/moodLogs/{logId}`, `users/{uid}/dailyMoodCheckIns/{dateStr}`,
`users/{uid}/reminderSettings/{docId}`, and the Mira conversation paths. These
calls must still be treated as local fallback until the rules are deployed to
the named Firestore database and the deployed behavior is verified.

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
- Provider calls are bounded to 30 seconds. A provider that does not settle
  returns the existing temporary-unavailable response instead of leaving the
  patient UI in a permanent thinking, transcribing or speaking state.
- Gemini text generation gives the primary Flash-Lite candidate 12 seconds and
  its two fallbacks eight and seven seconds inside that route limit. Transient
  timeouts, DNS/connectivity failures, rate limits and 5xx responses may advance
  to the next configured model. Safe server
  diagnostics contain only model, language, error type/status and transport code;
  they exclude prompts, replies, headers, tokens and credentials.
- Conversations are stored separately from clinical data:
  `users/{uid}/miraConversations/{conversationId}` (language, mode, escalation
  urgency, timestamps) and
  `users/{uid}/miraConversations/{conversationId}/messages/{messageId}`
  (role, text, source, createdAt). Nothing generated by Mira is written to
  Health History, Medical Records or any other clinical collection.
- Conversation writes keep the UID-scoped device copy first and wait at most
  three seconds for Firestore. A stalled cloud write returns `device-only` so
  conversation setup and replies do not hang indefinitely; this is not a claim
  that the cloud write completed.
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
- Voice selection is server-side and follows live-verified capability. Gemini
  3.5 Transcribe is the primary STT path for all five pitch languages; the
  adapter uploads the short-lived audio file, calls `generateContent`, reads the
  returned `audioTranscription` part, and deletes the upload by provider file
  name. Generated-audio live checks returned non-empty transcripts for English,
  Hausa, Igbo, Yorùbá and Nigerian Pidgin. YarnGPT handles TTS for all five and
  remains an STT fallback except for Hausa, where a genuine human-sample check
  produced unusable mixed-script output. Provider failure never changes the
  React endpoint contract. Bounded retries cover transient YarnGPT
  transport/provider failures and zero-byte TTS. An ASR upload that reports
  `ALREADY_EXISTS` waits once and replays the same file with the same idempotency
  key; once accepted, that job is only polled and never uploaded again. Final
  YarnGPT ASR upload/status failures log only the
  operation, HTTP status, provider error code/service and trace identifier;
  recording bytes, transcripts, authorization headers, API keys and provider
  messages are excluded. Unverified capabilities remain unavailable in the UI.

## Phase P4.5 H1 hematology contract foundation

H1 defines shared, server-safe contracts for future structured clinical support.
It does not connect those contracts to Mira routes, prompts, providers, Firestore
or the UI. Current Mira responses and persistence behavior are unchanged.

- Patient context provenance is limited to `patient-entered` and
  `patient-maintained`. No clinician-confirmed provenance exists in the current
  product, so the contracts do not expose it.
- Context values retain explicit storage state (`recorded`, `cached`,
  `device-only`, `missing`, `unavailable`) and freshness (`current`, `stale`,
  `unknown`). Missing or unavailable values stay `null`; validation never
  supplies a zero, normal value or other default.
- The versioned knowledge-module shape records topics, supported languages,
  risk, reviewer metadata, HTTPS source references, educational boundaries and
  escalation categories. H1 adds no production modules or clinical guidance.
- The retrieval contract is an interface only. There is no Firestore reader,
  embedding, vector database, registry content or patient-context reader.
- Future structured results are fail-closed at runtime. Unknown enum values,
  changed disclaimers, unsafe module identifiers/versions, malformed references,
  duplicate or unknown module IDs, and oversized strings/arrays are rejected
  with a typed validation error. Values are not silently normalized.

The H1 safety limits are: reply 2,000 characters; six guidance items of 500
characters each; two follow-up questions of 300 characters each; 12 patient
context references; five knowledge-module IDs; escalation reason 600 characters;
model identifier 120 characters; module ID 80 characters; numeric `x.y.z`
version 32 characters; module title 160 characters; five languages; 12 source
references; and 25 modules in a validated registry. A single module permits 20
educational points, 12 allowed self-care items, 20 prohibited claims and 20
escalation categories. Module text items are limited to 1,000 characters and
source URLs to 2,048 characters. Retrieval input is limited to one through five
modules.

## Phase P4.5 H2 patient-context foundation

H2 adds `MiraPatientContextSnapshot` and a dormant context-builder entry point.
It reads through existing UID-scoped services and is not called by the current
Mira API, prompt, provider or UI. No snapshot is sent to Gemini in H2.

- Profile values (`scdType`, `bloodType`, `age`) are patient-entered. Pain,
  symptom, hydration and daily check-in values are also patient-entered.
  Medication schedule, selected Medical Records and appointment request context
  are patient-maintained. Clinician-confirmed provenance is not available.
- Every category preserves an H1 storage state. Cloud failure with a valid
  account-scoped fallback is `cached` (or `device-only` when a source can prove
  that state); failure without a valid fallback is `unavailable`. Confirmed
  absence is `missing`. A missing or unavailable category always has a `null`
  value and is never converted into zero, normal, healthy or another default.
- Default event context covers the current day for `hydrationToday` and the last
  seven calendar days, including today, for pain, symptoms, hydration and daily
  check-ins. A 30-day window is available only when
  `includeTrendWindow: true`; it is never loaded by default. Event output is
  bounded to 12 items per category by default and 30 for an explicit trend.
- Active medication output is bounded to 12 entries. Explicitly inactive,
  stopped or discontinued schedule entries are excluded. Medical Records are
  selected by topic and bounded to eight entries per selected list. Appointment
  context is bounded to five active requests and is read only for
  `care_navigation` or `appointment_preparation` intent.
- Topic selection is minimal: hydration reads hydration plus limited symptoms
  and check-ins; pain reads pain and symptoms; medication/hydroxyurea reads the
  active schedule and selected medication background; relevant SCD, infection,
  anemia and transfusion topics read only their allowlisted Medical Records
  fields. A general/other request reads profile context only.
- Freshness uses a reliable stored timestamp only. It is `current` when the
  timestamp is within the category window, `stale` when it is older, and
  `unknown` when no reliable timestamp exists. Calendar `dateStr` can select a
  record for a bounded window but is not promoted into an invented timestamp.
- Snapshot allowlists exclude email, phone, Firebase UID, exact address,
  emergency-contact identity, Firestore document IDs, raw Firestore metadata,
  audio, attachments, whole Medical Records documents and unrelated free-text
  notes. The snapshot itself contains no account identifier.
- Independent source reads fail separately. A profile, symptom or other source
  failure marks only that category unavailable and does not discard successfully
  loaded categories. Authenticated fallbacks remain isolated by their existing
  UID-scoped cache keys; legacy unscoped health caches are not adopted.

## Phase P4.5 H3 structured safety foundation

H3 defines a server-authoritative `MiraSafetyResult` with urgency, matched
categories, deterministic status, current-turn status, continuation status and
patient-safe reasons. The 12 categories are chest pain, breathing difficulty,
neurological warning, seizure or unconsciousness, fever or infection, severe or
worsening pain, inability to drink or retain fluids, priapism, confusion or
severe weakness, sudden pallor or splenic concern, pregnancy emergency and
mental-health crisis.

- Chest pain, breathing difficulty, neurological warning, seizure or
  unconsciousness, fever or infection, severe or worsening pain, inability to
  retain fluids, priapism and mental-health crisis use deterministic urgent
  rules. Confusion or severe weakness, sudden pallor or splenic concern and
  pregnancy warning language use hybrid specialist review. `LLM_ASSISTED` is a
  supported detection level but is not relied on for emergency detection in H3.
- Safety detection receives the current message and recent patient turns as
  separate inputs. Only a current cue triggers a category. History can mark the
  same current category as a continuation; history alone cannot carry urgent
  status into an unrelated new turn.
- Obvious local negation, preventive questions and historical statements are
  suppressed. Ambiguous non-emergency categories use specialist review rather
  than diagnosis or reassurance.
- Clear severe-pain, fever and breathing phrases have bounded cue sets in
  English, Nigerian Pidgin, Yoruba, Igbo and Hausa. English cues are code
  reviewed. Every non-English cue set remains marked
  `native-human-review-required`; automated tests confirm matching behavior,
  not linguistic or clinical approval.
- Deterministic safety is evaluated before the provider. After a provider reply,
  the final urgency is the higher server result: the validated model may raise
  concern but can never lower deterministic urgent handling.
- Urgent guidance is returned without waiting for the provider and truthfully
  states that Mira has not contacted emergency services, a clinician or an
  appointment service. The short assistant reply and the urgent guidance are
  separate so the full emergency paragraph is not duplicated.
- Medication-selection and dose-change requests enter specialist review. H3
  adds no drug choice, dose choice, start, stop or doubling recommendation.
- H3 does not call the H2 patient-context builder, add knowledge retrieval,
  diagnose a condition or persist safety output as a clinical record.

## Future role/provenance planning (Phase 4I)

[Role & Access Model](./ROLE_ACCESS_MODEL.md) defines conceptual future ownership,
authorship and verification requirements. Its HealthRecord fields are not the
current persisted schema and must not be assumed present or backfilled from
profile roles. Adoption requires a separately approved migration/security phase.
Current paths, fields, rules and fallback contracts above remain unchanged.

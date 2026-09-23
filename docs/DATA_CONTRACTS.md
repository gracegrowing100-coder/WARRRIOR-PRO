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
Care Vault similarly prefer a successful cloud result or their defaults rather
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
| `users/{uid}/emergencyInfo/summary` | get, merge set | Contact, blood/genotype, allergies, medications, notes; seeded defaults exist. |
| `users/{uid}/appointments/{appointmentId}` | list, create, cancel | UI-defined booking data, `createdAt`, `status`; cancellation writes `Cancelled`. |
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

`saveDailyMoodCheckIn(...)` writes both local records first, then calls
`saveMoodLog(...)` before writing the daily Firestore document. Because the
error helper rethrows permission errors, a denied `moodLogs` create prevents the
daily Firestore write and streak update, even though the local daily and
historical mood records already exist.

## Fallback semantics by feature

| Feature/write | Current local behavior | Cloud/error nuance |
|---|---|---|
| Profile create/update | Local profile written first. | Permission errors can still reject after the local write. |
| Medication create | Guest writes locally; authenticated create is cloud-first and caches only after success. | There is no authenticated offline create queue. |
| Medication update/delete | Existing local cache is changed first. | Permission errors can reject after the local change. |
| Hydration, pain, emergency, Care Vault | Local value is written first. | Firestore is attempted afterward; no replay ledger exists. |
| Symptom | Local symptom is written first. | Linked pain/water calls are conditional as described above. |
| Appointment create | Local provisional item is written first. | The Telemedicine component immediately reloads; a successful cloud list can overwrite the cache and drop a failed provisional item. |
| Appointment cancel | Local status changes first. | Cloud update is attempted afterward. |
| Mood/daily check-in | Local records are written first. | Missing rules and rethrown permission errors can stop later steps. |
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
| `warrior_meds` | Cached medication array. Not currently UID-scoped. |
| `water_{dateStr}` | Date hydration record. Not currently UID-scoped. |
| `warrior_pain` | Cached pain logs. Not currently UID-scoped. |
| `warrior_symptom_logs` | Cached symptom logs. Not currently UID-scoped. |
| `warrior_emergency` | Emergency summary. Not currently UID-scoped. |
| `warrior_appointments` | Appointment list. Not currently UID-scoped. |
| `warrior_carevault` | Care Vault document. Not currently UID-scoped. |
| `warrior_carevault_unlocked` | Local unlock UI state. |
| `warrior_mood_logs_{uid|guest}` | Mood history. |
| `warrior_daily_mood_{uid|guest}_{dateStr}` | Daily mood check-in. |
| `warrior_reminders_{uid|guest}` | Scheduled reminder settings. |
| `warrior_designated_caregiver` | Caregiver widget data. |
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

Global health keys create cross-account leakage risk on shared browsers. Fix
through a versioned read-old/write-new migration, not by deleting or renaming
keys without a compatibility path.

## Server API contracts

The Express server exposes:

| Method and path | Client purpose |
|---|---|
| `POST /api/gemini/advice` | Health-advice response with curated fallback. |
| `POST /api/gemini/advocacy` | Advocacy petition generation. |
| `POST /api/gemini/game-story` | Educational game narrative. |
| `POST /api/gemini/genotype-counselor` | Genotype education response. |
| `POST /api/gemini/mood-response` | Mood reflection response. |
| `POST /api/gemini/pattern-insights` | Experimental pattern summary. |
| `POST /api/gemini/doctor-report` | Generated report content. |
| `GET /api/health` | Server health endpoint. |
| `GET /sw.js` | Service-worker asset. |

`services/gemini.ts` calls every listed POST route except the genotype route,
which is called from its feature component. API credentials remain server-side.

All generated health, pattern, genotype, mood, and report content is advisory or
experimental and requires the safety treatment defined in `PRODUCT.md`.

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
| `CareVault` | Care Vault get/save plus health subcomponents. |
| `ChatSystem` | Message subscription, send, media, typing, reactions, and moderation. |
| `Community` | Post list/create/like. |

## Chart and aggregation contracts

- `PainTrendsChart` constructs 30 points and fills dates without logs with a
  deterministic simulated curve. Each point has `isReal`, but recorded and
  simulated points share one rendered series.
- `getMoodAndHydrationTrends7Days` uses an explicit daily mood score when
  present, otherwise may infer a score from the global `warrior_pain` cache as
  `max(1, 10 - painLevel)`. With no mood or pain it returns `7.0` for chart
  continuity. The current `hasMoodLogged` value is true for inferred pain-based
  scores as well as explicit mood entries.
- Current Recharts data covers pain, symptom occurrence, hydration,
  mood/hydration, and Care Vault laboratory history. Medication has no current
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

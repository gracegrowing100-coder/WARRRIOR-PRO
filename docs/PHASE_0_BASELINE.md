# Phase 0 regression baseline

Recorded: 2026-09-25

Phase 0 establishes a small characterization suite for verified current
behavior. It does not define redesign behavior and does not correct known
application defects.

## Test tooling

- npm is the authoritative package manager.
- `package-lock.json` is the authoritative lockfile.
- `bun.lock` remains unchanged and is treated as legacy.
- Vitest runs with jsdom, React Testing Library, user-event, and jest-dom.
- The suite is single-worker and serial to remain deterministic on the current
  Windows/OneDrive workspace.
- Firebase, Firestore, Storage imports, browser APIs, and network requests are
  mocked. No test authenticates to or writes to production services.

## Automated coverage

The focused suite currently protects:

- App authentication loading, signed-out, and signed-in rendering states.
- Authenticated Patient Home selection and emergency-entry availability.
- Hash changes that occur after App mount.
- Synthetic-demo entry without creating an authenticated session.
- Language, dark-mode, and high-contrast local persistence.
- Patient Home profile summary and presence of its critical health modules.
- Guest pain upsert-by-date behavior.
- Guest and authenticated symptom ordering and fallback behavior.
- Hydration date-key persistence and guest fallback.
- Medication load fallback, add, taken-date update, delete, and authenticated
  cloud-first cache behavior.
- Appointment load fallback, provisional-to-cloud ID replacement, and
  local-first cancellation behavior.
- Profile updates preserving unknown cached fields while omitting `createdAt`
  from the Firestore update payload.
- Emergency information rendering and `tel:` handoff links.
- Gemini online response, offline short-circuit, and failed-network fallback.
- Express 5 registration and ordering of the health API, root/nested SPA
  fallback, and unknown API 404 behavior.

The suite intentionally avoids exact Tailwind classes, large snapshots, and
non-behavioral text assertions.

## Command results

| Command/check | Result |
| --- | --- |
| `npm run test` | Pass: 6 files, 23 tests passed, 1 todo |
| `npm run lint` | Pass |
| `npm run build` | Pass |
| Development server startup | Pass |
| `npm start` production startup | Pass |
| `GET /api/health` | Pass: `{ "status": "ok" }` |
| Development root request | Pass: HTTP 200 with the React `#root` mount point |
| Production root request | Pass: HTTP 200 with the React `#root` mount point |
| Production `/patient/home` fallback | Pass: HTTP 200 with the React `#root` mount point |
| Production unknown API request | Pass: HTTP 404; not served by the SPA fallback |

The production build reports the pre-existing large-chunk warning: the main
minified JavaScript chunk is approximately 2.6 MB. Phase 0 does not change
bundling or code splitting.

## Manual checks completed

- Confirmed the development server starts after the dependency-lock update.
- Confirmed the health endpoint responds successfully.
- Confirmed the development root document responds and contains the React mount
  point.
- Confirmed the actual `npm start` command starts the production server without
  initializing Vite.
- Confirmed production `/`, `/patient/home`, `/api/health`, and
  `/api/not-found` behavior, then terminated the test server.
- Confirmed tests use mocked Firebase and network boundaries and do not require
  Firebase or Gemini credentials.
- Confirmed the only application-source change is the approved production SPA
  fallback repair in `server.ts`.
- Confirmed `bun.lock` was not modified.
- Confirmed Playwright, Cypress, MSW, Firebase Emulator tooling, Jest,
  Storybook, Chromatic, coverage tooling, and accessibility frameworks were not
  installed as direct dependencies.

## Resolved Phase 0.1 baseline repair

### Production server startup

Original defect: the production bundle built successfully but failed before
listening. Express 5 rejected `app.get('*', ...)` with `Missing parameter name
at index 1`, and `npm start` did not establish production mode.

Root cause: installed Express `5.2.1` uses router `2.2.0` and
`path-to-regexp 8.4.2`. That matcher requires named wildcard parameters; a bare
`*` is invalid. The start script also left `NODE_ENV` undefined, selecting the
development Vite branch.

Repair:

- Replaced the bare wildcard with the verified zero-or-more named wildcard
  `/{*splat}`, which matches both `/` and nested SPA paths.
- Kept `/api` paths out of the SPA fallback so unknown API requests retain a
  404 response.
- Updated `npm start` to set `NODE_ENV=production` inside Node before loading
  `dist/server.cjs`, avoiding an additional cross-platform environment package.

Verification: the Express routing regression test passes; lint, all tests, and
the production build pass; the actual `npm start` process listens successfully;
`/api/health` returns HTTP 200 with `{ "status": "ok" }`; `/` and
`/patient/home` return the SPA document; `/api/not-found` returns HTTP 404 and
does not return the SPA document.

## Known defects captured, not fixed

### Initial hash handling

`App.tsx` installs a `hashchange` listener but does not apply the existing hash
on initial mount. A valid direct hash can therefore show Home until another hash
change occurs. The suite contains a named `todo` test for this limitation.

### Existing persistence limitations

- A guest symptom save remains local and does not create linked pain or
  hydration records.
- An authenticated symptom Firestore failure retains the local symptom but
  stops the linked pain, hydration, and streak operations.
- Authenticated medication creation remains cloud-first; a failed create is not
  cached locally.
- Appointment creation writes provisional local state before cloud creation,
  while component refresh behavior can still replace that provisional state.
- The current persistence fallbacks are not an operation queue and do not
  guarantee replay after reconnect.

### Current UI limitations retained

- The Dashboard pain slider currently exposes 1–10 although the documented
  contract refers to 0–10.
- Some current controls do not expose sufficiently stable accessible names for
  safe interaction tests without changing application source.
- Current synchronization wording can overstate cloud confirmation on some
  fallback paths.

## Deferred manual coverage

The following remain manual for Phase 0 as approved:

- Real Firebase email/password, Google provider, password-reset, and session
  restoration behavior using an approved non-production account.
- Existing Firestore record readability and security-rule behavior.
- Actual service-worker installation, cache behavior, offline reload, reconnect,
  and external-font failure.
- Browser-console inspection in a real browser.
- Browser back/forward behavior where jsdom is insufficient.
- Responsive and visual verification at 360px, 375px, 768px, 1200px, and
  1440px.
- Full keyboard, focus, contrast, touch-target, and reduced-motion review.
- Real operating-system notifications.
- Microphone and camera behavior.
- Chart layout and positive rendered dimensions.
- PDF visual verification.
- Real phone/SMS handoff behavior.
- Deep chat, community, games, education, advocacy, Care Vault, and report
  workflows.

Playwright and Chromium remain deferred until browser-level protection is
approved for the redesigned shell/Home or final QA.

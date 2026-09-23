# Warrior AI implementation handoff

Last updated: 2026-09-20  
Status: Local synthetic-demo work unit completed  
Application root: `warrior-cell/`

## Current objective

Stabilize the existing Warrior AI prototype on the development PC, improve its
authentication and interface safely, and map existing features while founder and
clinic validation is pending.

The working product direction is still two-track:

1. A nurse-led clinical monitoring MVP.
2. A visibly separate AI capability demonstration using synthetic data.

Do not treat crisis prediction, eye-based PCV estimation, generated clinical
advice, or automated pattern claims as validated patient-care functionality.

## Local setup

Prerequisites:

- Node.js `v24.15.0`
- npm `11.12.1`

On this Windows PC, Node must use the Windows certificate store when contacting
the npm registry:

```powershell
$env:NODE_USE_SYSTEM_CA='1'
npm install
npm run dev
```

Open `http://localhost:3000`. The health endpoint is
`http://localhost:3000/api/health`.

For immediate access, click **Open synthetic demo**. No Firebase account is
required. **Sign in** is for configured test accounts, while **Request pilot
access** opens an email draft to the current placeholder support address.

The Gemini key is optional for local evaluation. If required, create
`.env.local` from `.env.example` and set `GEMINI_API_KEY`. Never place a real key
in documentation or source control.

## Verified baseline

- Dependencies installed: 406 packages.
- `npm run lint`: passes (`tsc --noEmit`).
- `npm run build`: passes.
- Local server: responds successfully on port 3000.
- `/api/health`: returns HTTP 200 with `{"status":"ok"}`.
- Authentication landing screen renders in the browser.
- Logged-out experience has three clear entry routes: sign in, request pilot
  access, and open the synthetic demo.
- Synthetic demo works without Firebase and includes a patient check-in, local
  save confirmation, nurse review queue, AI-assisted brief, and explicit nurse
  approval step.
- Service workers are unregistered on localhost so development reloads do not
  serve stale application code.
- Tailwind is compiled locally through Vite/PostCSS; the Tailwind CDN and its
  production warning have been removed.
- Browser verification passed at desktop and 390 px mobile width with no
  console errors or warnings.

Build warning:

- Main JavaScript bundle is approximately 2.58 MB before gzip and 717 KB after
  gzip. Route-level code splitting is needed.
- Google font files are still requested remotely. Package the chosen fonts
  locally before claiming fully offline typography.

## Authentication changes completed

- Added explicit Firebase persistence configuration:
  - checked “Remember my email” uses local persistence;
  - unchecked uses session persistence.
- Added an authentication-resolution screen to prevent the login page flashing
  while Firebase restores an existing session.
- Removed the evaluator flow that created disposable Firebase users with a
  predictable shared password.
- Evaluator buttons are now safe placeholders for a future synthetic-data demo.
- Replaced unsupported HIPAA, GDPR, AES-256, zero-knowledge, WHO-partner, and
  24/7-service claims with accurate pilot warnings.
- Updated local-run documentation, including the secure certificate workaround.

## Existing feature map

The following map describes source that exists, not completed clinical validation.

| Area | Existing source | Current status |
| --- | --- | --- |
| Authentication | Email/password, Google sign-in, reset, onboarding | Runs; needs end-to-end testing with approved Firebase test accounts |
| Patient dashboard | Pain, symptoms, hydration, medication, mood and summary widgets | Present; workflow and clinical wording need review |
| Caregiver support | Caregiver role and designated-caregiver widget | Present; authorization boundaries are not yet proven |
| Emergency tools | Emergency button and ER toolkit | Present; must not imply monitored emergency response |
| Communication | Chat, community and telemedicine screens | Present; real provider identity and messaging governance are unverified |
| Education | SCD Academy, genotype education and health tips | Present; clinical content review is required |
| Games | Multiple educational games and rewards | Present; outside the first clinical pilot wedge unless retained as engagement support |
| Offline support | Service worker, local cache and offline knowledge base | Partial; Tailwind CSS is local, but fonts and wider offline flows still need verification |
| Synthetic pilot demo | Patient check-in, nurse queue and approval-gated AI brief | Implemented locally; no Firebase writes and no clinical prediction |
| AI endpoints | Health advice, advocacy, game stories, genotype guidance, mood response, pattern insights and doctor reports | Present; must be separated as demonstrations and safety-reviewed |
| Provider workflow | Patient review queue, alert ownership and escalation closure | Not yet implemented as a coherent clinic MVP |
| Crisis prediction | Predictive analysis components and generated correlation claims | Experimental only; no validated model is established |
| Eye-based PCV | Product idea | Not implemented or clinically validated |

## Known risks

1. `npm audit` reports 13 dependency findings: 2 low, 3 moderate, 7 high and
   1 critical. Audit the dependency tree before any deployment; do not run a
   blind force upgrade.
2. External Google fonts still weaken full offline support.
3. Firebase configuration is embedded in the client as expected for Firebase,
   but authorization still depends on correct Firestore rules and role checks.
4. A signed-in user without a profile is automatically assigned default patient
   medical values. This should be replaced with explicit onboarding and unknown
   values, not assumed genotype, blood type or medication.
5. Several seeded screens use fictional clinicians, laboratory results and
   clinical-sounding confidence percentages. These must be clearly labelled as
   synthetic or removed from the clinical MVP.
6. Terms, privacy and support links need real destination pages before pilot use.
7. The workspace is not currently a Git repository, so there is no branch,
   commit history or rollback point.

## Next implementation unit

1. Remove automatic medical defaults from first login and Google onboarding.
2. Add route or role guards for patient, caregiver and future clinic-staff views.
3. Make the synthetic nurse queue fully selectable and align its fields and
   alert rules with the clinic champion's approved workflow.
4. Replace the placeholder pilot-access email address with the founder's chosen
   contact or a controlled access-request form.
5. Test the signed-in dashboard using an approved non-patient Firebase test
   account.
6. Map the dashboard to the founder-approved D1-D10 decisions before locking the
   provider queue, alert rules and enrolment workflow.
7. Review dependency findings without using a blind force upgrade, then package
   fonts locally and verify the intended offline flows.

## Files changed in this work unit

- `../AGENTS.md`
- `CLAUDE.md`
- `firebase-init.ts`
- `App.tsx`
- `components/AuthFlow.tsx`
- `components/SyntheticDemo.tsx`
- `index.html`
- `index.css`
- `tailwind.config.cjs`
- `postcss.config.cjs`
- `package.json`
- `package-lock.json`
- `README.md`
- `HANDOFF.md`

## Resume checklist

```powershell
Set-Location 'C:\Users\USER\OneDrive\Documents\myJOB\task\WARRIOR_AI\warrior-cell'
$env:NODE_USE_SYSTEM_CA='1'
npm run lint
npm run dev
```

Then open `http://localhost:3000`, click **Open synthetic demo**, and continue
with the onboarding-default and role-guard work unit.

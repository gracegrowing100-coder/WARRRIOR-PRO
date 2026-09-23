<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Warrior AI prototype

This repository contains the current Warrior AI prototype. It is for product
evaluation and must not be used with identifiable patient information until the
pilot organisation approves the privacy, security, consent, and clinical workflow.

View your app in AI Studio: https://ai.studio/apps/3704fda8-13cb-40a5-a194-79068a8db468

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:

   ```powershell
   $env:NODE_USE_SYSTEM_CA='1'
   npm install
   ```

   `NODE_USE_SYSTEM_CA=1` is required on the current Windows PC so Node trusts
   the same certificate authorities as Windows. Do not disable npm SSL checks.

2. Optional: copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`.
   Without a key, the server uses its curated local fallback responses.

3. Run the app:

   ```powershell
   $env:NODE_USE_SYSTEM_CA='1'
   npm run dev
   ```

4. Open `http://localhost:3000`.

5. Click **Open synthetic demo** for immediate access without a Firebase
   account. The demo contains sample patient data only and lets you switch
   between the patient check-in and nurse review views.

## Verification

```powershell
npm run lint
npm run build
```

The synthetic demo is local React state only: it does not create an account,
write to Firebase, send a callback request, diagnose a crisis, or predict a
clinical outcome. Real sign-in remains reserved for configured Firebase test
accounts.

## Product and redesign documentation

Start with these documents before changing application behavior or UI:

| Document | Purpose |
|---|---|
| [PRODUCT.md](./PRODUCT.md) | Product users, MVP, safety boundary, experimental features, and success criteria. |
| [../DESIGN.md](../DESIGN.md) | Canonical visual and UX design system. |
| [docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md) | Source-backed record of what exists today. |
| [docs/REQUIREMENTS.md](./docs/REQUIREMENTS.md) | Preserve, improve, refactor, add, and defer requirements. |
| [docs/INFORMATION_ARCHITECTURE.md](./docs/INFORMATION_ARCHITECTURE.md) | Target five-destination navigation and feature ownership. |
| [docs/USER_FLOWS.md](./docs/USER_FLOWS.md) | Critical patient workflows that must not break. |
| [docs/SCREEN_SPECIFICATIONS.md](./docs/SCREEN_SPECIFICATIONS.md) | P0/P1/P2 screen purpose, hierarchy, states, and behavior. |
| [docs/DATA_CONTRACTS.md](./docs/DATA_CONTRACTS.md) | Firebase, local-storage, API, offline, and component/service contracts. |
| [docs/REDESIGN_PLAN.md](./docs/REDESIGN_PLAN.md) | Phase-by-phase implementation order and exit gates. |
| [docs/REGRESSION_CHECKLIST.md](./docs/REGRESSION_CHECKLIST.md) | Verification gate for every redesign phase. |

Agents working inside this folder must also follow [AGENTS.md](./AGENTS.md).

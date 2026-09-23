# Warrior Cell application instructions

This file applies to work inside `warrior-cell/`. It extends the workspace
instructions in `../AGENTS.md`; it does not replace them.

## Sources of truth

Read these before changing product behavior or UI:

1. [`PRODUCT.md`](./PRODUCT.md) defines the product, users, MVP boundary, and
   safety limits.
2. [`../DESIGN.md`](../DESIGN.md) is the canonical visual and UX specification.
3. [`docs/CURRENT_STATE.md`](./docs/CURRENT_STATE.md) records what exists now.
4. [`docs/REQUIREMENTS.md`](./docs/REQUIREMENTS.md) classifies behavior as
   preserve, improve, refactor, add, or defer.
5. [`docs/DATA_CONTRACTS.md`](./docs/DATA_CONTRACTS.md) protects Firebase,
   local-storage, authentication, and API contracts.
6. [`docs/REGRESSION_CHECKLIST.md`](./docs/REGRESSION_CHECKLIST.md) is the
   acceptance gate for every redesign phase.

If these documents disagree with the implementation, verify the code and update
`CURRENT_STATE.md` or `DATA_CONTRACTS.md`. Do not silently change working data
contracts to make a redesign easier.

## Redesign rules

- Treat this as a brownfield redesign. Preserve working routes, data access,
  authentication, offline fallbacks, and health logging behavior.
- Complete one phase in [`docs/REDESIGN_PLAN.md`](./docs/REDESIGN_PLAN.md) at a
  time.
- Build shared design primitives before restyling individual feature screens.
- Keep mobile navigation to no more than five persistent destinations.
- Keep the emergency action available without making ordinary screens visually
  alarming.
- Use Lucide icons for production controls. Do not introduce new emoji-based
  navigation or status controls.
- Every asynchronous surface needs loading, empty, success, error, and offline
  behavior where applicable.
- Maintain keyboard access, visible focus, meaningful labels, and approximately
  44px minimum interaction targets.

## Clinical safety boundary

- Warrior AI is a monitoring and clinical-support product under validation, not
  a diagnostic or autonomous treatment system.
- Do not present crisis prediction, eye-based PCV estimation, generated medical
  advice, or model confidence values as clinically proven.
- Keep experimental AI demonstrations visibly separate from the clinical MVP.
- Use synthetic data for demonstrations unless approved patient data and its
  permitted use are documented.
- Require human clinical review before any AI output can affect care.
- Do not imply that an emergency message, callback, or clinical alert was sent
  unless the application has verifiable delivery confirmation.

## Required verification

For every completed redesign phase:

1. Run `npm run lint`.
2. Exercise the relevant items in `docs/REGRESSION_CHECKLIST.md`.
3. Test at 360px, 375px, 768px, and desktop width.
4. Check keyboard navigation and browser console warnings.
5. Verify online and local-fallback behavior without changing stored schemas.


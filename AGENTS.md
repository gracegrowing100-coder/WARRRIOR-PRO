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

## Design and Frontend Skill Policy

The purpose is to define how the installed project-local skills may be used
during the Warrior AI brownfield redesign.

### Source-of-truth hierarchy

Skills are advisory implementation tools. They do not define product
requirements.

When instructions or recommendations conflict, follow this order:

1. `PRODUCT.md`
2. `DESIGN.md`
3. `docs/REQUIREMENTS.md`
4. `docs/INFORMATION_ARCHITECTURE.md`
5. `docs/SCREEN_SPECIFICATIONS.md`
6. `docs/DATA_CONTRACTS.md`
7. `docs/REGRESSION_CHECKLIST.md`
8. Installed design/frontend skills

A skill must never silently override an authoritative project document.

### Impeccable

Use `impeccable` as the primary UI/UX design skill for:

- visual hierarchy
- typography
- spacing
- layout
- design-system implementation
- component quality
- responsive design
- accessibility
- interface consistency
- visual critique and polish

Impeccable must implement `DESIGN.md` rather than create a competing design
language.

Do not allow Impeccable to redefine:

- product scope
- information architecture
- clinical behavior
- persistence behavior
- Firebase contracts
- health guidance

### Emil design engineering

Use `emil-design-eng` after basic screen structure and behavior are stable.

Use it for:

- interaction quality
- component polish
- thoughtful micro-interactions
- motion decisions
- refined frontend behavior

It supplements Impeccable rather than replacing it.

### Mobile/PWA

Use `mobile-native` when implementing or reviewing mobile and PWA experiences.

Apply its guidance only where compatible with `DESIGN.md` and Warrior AI
accessibility requirements.

Warrior AI remains a responsive web/PWA product. Do not introduce React Native
or Expo architecture.

### Animation

Do not introduce animation during structural implementation merely for
decoration.

Use:

- `find-animation-opportunities` for read-only motion audits;
- `animate` for approved motion implementation;
- `improve-animations` for animation improvement planning;
- `review-animations` for final motion QA;
- `animation-vocabulary` only when terminology/reference is useful.

Animation must never:

- delay emergency access;
- hide or delay critical health information;
- make clinical states ambiguous;
- interfere with form completion;
- create excessive cognitive load;
- override reduced-motion preferences.

Respect `prefers-reduced-motion`.

### Toasts and feedback

Use `ask-sonner` only if the project adopts Sonner for the shared toast/feedback
primitive.

Do not add Sonner solely because the skill exists.

### UI library selection

Use `pick-ui-library` only when an implementation requirement cannot reasonably
be satisfied by the existing stack.

Prefer the existing React + Tailwind stack and shared project primitives before
adding another component library.

Any significant new UI dependency must be justified before installation.

### Prototyping

Use `prototype` only when a screen or interaction has a genuine unresolved
design decision where comparing variants would help.

Do not generate competing variants for already-approved designs or
specifications.

### Skills not applicable to the current application

Do not use these skills unless the technology or product requirements explicitly
change:

- `animate-expo`
- `write-swift`

Do not use `apple-design` as the Warrior AI visual language.

Individual Apple interaction/accessibility principles may only be borrowed when
they do not conflict with `DESIGN.md`.

### Implementation sequence

For redesign work follow this sequence:

1. Read authoritative project documentation.
2. Preserve verified existing behavior.
3. Implement correct structure and functionality.
4. Run regression/type checks.
5. Apply Impeccable guidance.
6. Apply mobile-native guidance where relevant.
7. Verify responsive behavior and accessibility.
8. Apply Emil/motion guidance only after structure is stable.
9. Run regression verification again.

### Phase restrictions

Phase 0:
Do not use design or animation skills to modify the UI. Phase 0 is regression
protection only.

Phase 1:
Use Impeccable for design-system foundations. Use mobile-native where relevant.
Do not add decorative motion.

Phase 2 onward:
Use Impeccable for screen implementation and review. Use mobile-native for
mobile/PWA behavior.

Motion phases:
Use Emil and animation-specific skills only after each relevant screen's
structure and core interactions are stable.

Final QA:
Use Impeccable for UI/UX review and review-animations for motion review.

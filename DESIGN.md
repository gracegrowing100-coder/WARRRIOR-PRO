# Sickle Cell Patient Monitoring App
## Product UI/UX Design System & Implementation Specification

> **Status:** Canonical Design Specification  
> **Primary audience:** Codex and developers working on the application  
> **Location:** `/DESIGN.md`  
> **Design authority:** This document is the primary visual and UX source of truth for the application.

---

# 1. Purpose

This document defines the visual language, UX principles, component behavior, responsive rules, accessibility requirements, screen hierarchy, implementation strategy, and visual references for the Sickle Cell Patient Monitoring application.

Codex and other coding agents MUST read this document before performing substantial frontend or UI/UX work.

The objective is to transform the existing application into a polished, modern, patient-friendly healthcare product while preserving all working application logic.

The application should feel:

- Calm
- Modern
- Trustworthy
- Clinically credible
- Personal
- Accessible
- Easy to understand
- Supportive
- Reassuring
- Purpose-built for ongoing health monitoring

The application MUST NOT feel like:

- An ICU monitor
- Hospital administration software
- A generic SaaS dashboard
- A cryptocurrency dashboard
- A futuristic medical control panel
- An overly technical analytics application
- A visually alarming interface

The patient should feel that the application helps them understand and manage their health rather than constantly reminding them that they have a medical condition.

---

# 2. Existing Application Comes First

This is an EXISTING application.

The redesign is primarily a UI/UX improvement, not permission to rebuild the application from scratch.

Before modifying frontend code, Codex MUST inspect the existing project.

Identify:

- Framework
- Framework version
- Project structure
- Application entry points
- Routes
- Pages/screens
- Layouts
- Existing components
- Existing design system
- CSS architecture
- Tailwind configuration, if present
- Authentication flow
- API integrations
- Database interactions
- State management
- Forms
- Validation
- Charts
- Icon libraries
- Animation libraries
- Patient data structures
- Medication functionality
- Symptom functionality
- Pain tracking
- Hydration functionality
- Appointments
- Notifications
- Profile/settings
- Clinician functionality
- Existing responsive behavior

Do not assume functionality exists simply because this document describes a possible interface for it.

The existing codebase determines what currently exists.

---

# 3. Preservation Rule

Preserve working functionality.

Prefer:

1. Restyling existing components
2. Improving component composition
3. Extracting reusable UI components
4. Improving spacing and hierarchy
5. Replacing inconsistent styling
6. Improving accessibility
7. Improving responsive behavior
8. Incrementally refactoring weak UI architecture

over rewriting functional application logic.

Do NOT remove or rename existing:

- Routes
- APIs
- Database fields
- Actions
- Hooks
- State structures
- Authentication logic
- Business logic
- Working integrations

unless technically necessary.

Before replacing an existing component ask:

1. Does it already work?
2. Can it simply be restyled?
3. Can its public API remain unchanged?
4. Can its state logic be preserved?
5. Can it be incrementally refactored?

Prefer incremental improvement.

---

# 4. Product Design Philosophy

The interface combines the friendliness of a consumer wellness application with the trustworthiness of a healthcare product.

The design should prioritize:

**CLARITY > DECORATION**

**USABILITY > VISUAL COMPLEXITY**

**ACCESSIBILITY > AESTHETIC NOVELTY**

**PATIENT REASSURANCE > CLINICAL INTIMIDATION**

**CONSISTENCY > ONE-OFF DESIGNS**

**MEANINGFUL DATA > DASHBOARD CLUTTER**

Use:

- Large readable cards
- Generous whitespace
- Rounded surfaces
- Clear typography
- Simple charts
- Concise labels
- Familiar interactions
- Clear health-status indicators
- Progressive disclosure

Do not expose every available metric simultaneously.

---

# 5. Core Patient Questions

The primary patient experience should answer seven questions:

1. How am I doing today?
2. Is anything requiring my attention?
3. Have I taken my medication?
4. Am I sufficiently hydrated?
5. What symptoms have I recorded?
6. How has my health changed recently?
7. What should I do if I need help?

These questions should guide information hierarchy.

---

# 6. Brand Color Direction

The visual identity combines:

- Dark navy blue
- Medical red
- Clean white
- Soft blue-gray neutrals
- Controlled red-to-navy gradients

Dark navy should provide stability and trust.

White should provide breathing room.

Medical red should provide identity and emphasis.

Strong red MUST NOT dominate ordinary screens because red must remain meaningful when communicating urgency.

---

# 7. Primary Navy Palette

```css
--navy-950: #071426;
--navy-900: #0B1F3A;
--navy-800: #102A4C;
--navy-700: #173B68;
--navy-600: #21518B;
```

Primary brand:

```css
--primary: #0B1F3A;
```

Use navy for:

- Navigation
- Primary text
- Headers
- Selected navigation states
- Primary buttons
- Important data
- Hero cards
- Charts
- Section titles
- Selected controls

---

# 8. Medical Red Palette

```css
--red-700: #B91C32;
--red-600: #D1223E;
--red-500: #E63950;
--red-400: #F05A6E;
--red-100: #FDE8EC;
--red-50: #FFF4F6;
```

Primary accent:

```css
--accent: #D1223E;
```

Strong red should primarily communicate:

- Crisis
- Important symptoms
- High pain
- Urgent attention
- Missed important medication
- Important health alerts
- Destructive actions

Soft red backgrounds may be used for:

- Medication reminders
- Wellness prompts
- Selected states
- Brand accents
- Low-intensity informational cards

Never create an ordinary screen dominated by bright red.

---

# 9. Neutral Palette

```css
--white: #FFFFFF;

--gray-25: #FCFCFD;
--gray-50: #F8FAFC;
--gray-100: #F1F5F9;
--gray-200: #E2E8F0;
--gray-300: #CBD5E1;
--gray-400: #94A3B8;
--gray-500: #64748B;
--gray-600: #475569;
--gray-700: #334155;
--gray-800: #1E293B;
--gray-900: #0F172A;
```

Application background:

```css
--background: #F7F9FC;
```

Surface:

```css
--surface: #FFFFFF;
```

Primary text:

```css
--text-primary: #0B1F3A;
```

Secondary text:

```css
--text-secondary: #64748B;
```

Border:

```css
--border: #E2E8F0;
```

---

# 10. Semantic Health Colors

Color MUST NOT be the only health indicator.

Always combine:

**ICON + TEXT + COLOR**

## Stable

```css
--success: #168A5B;
--success-soft: #EAF8F1;
```

Example:

`✓ Stable`

## Attention

```css
--warning: #D98C10;
--warning-soft: #FFF6DF;
```

Example:

`! Needs attention`

## Critical

```css
--danger: #D1223E;
--danger-soft: #FDE8EC;
```

Example:

`! Seek medical help`

## Information

```css
--info: #2563EB;
--info-soft: #EAF2FF;
```

---

# 11. Gradient System

Gradients should feel sophisticated rather than decorative.

## Primary Brand Gradient

```css
linear-gradient(
  135deg,
  #D1223E 0%,
  #8B2745 35%,
  #173B68 70%,
  #0B1F3A 100%
);
```

Suitable for:

- Main health hero
- Welcome/onboarding
- Important branded surfaces
- Selected premium visual elements

---

## Navy Gradient

```css
linear-gradient(
  145deg,
  #173B68 0%,
  #0B1F3A 100%
);
```

Suitable for:

- Health overview
- Profile header
- Data summary cards

---

## Soft Red Gradient

```css
linear-gradient(
  135deg,
  #FFF4F6 0%,
  #FDE8EC 100%
);
```

Suitable for:

- Medication reminders
- Mild symptom cards
- Wellness prompts

---

# 12. Gradient Rules

Maximum approximately one strong gradient surface per viewport.

If the hero card uses the brand gradient, surrounding cards should generally remain white.

Avoid:

- Rainbow gradients
- Neon gradients
- Gradients behind long paragraphs
- Multiple competing gradient cards
- Gradient buttons everywhere

---

# 13. Typography

Preferred font:

**Inter**

Fallback:

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Typography hierarchy:

## Display

32px / 40px  
Weight 700

## H1

28px / 36px  
Weight 700

## H2

24px / 32px  
Weight 700

## H3

20px / 28px  
Weight 600

## Body Large

18px / 28px  
Weight 400–500

## Body

16px / 24px  
Weight 400

## Small

14px / 20px  
Weight 400–500

## Caption

12px / 16px  
Weight 500

Avoid normal body text below 14px.

Important health information should generally be 16px or larger.

Large numerical health values may use 24–32px.

---

# 14. Spacing System

Use an 8px-oriented spacing system:

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
```

Mobile horizontal padding:

```text
16px–20px
```

Desktop:

```text
24px–32px
```

Card padding:

```text
16px mobile
20px–24px larger screens
```

Major section spacing:

```text
24px–32px
```

Whitespace is intentional.

Avoid cramped dashboards.

---

# 15. Border Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-2xl: 24px;
--radius-pill: 9999px;
```

Recommended:

Standard cards: 16–20px

Hero cards: 20–24px

Buttons: 12–14px

Inputs: 12px

Bottom sheets: 24px top corners

Chips: pill radius

---

# 16. Shadows

Avoid heavy shadows.

Standard:

```css
box-shadow:
  0 1px 2px rgba(15, 23, 42, 0.03),
  0 4px 12px rgba(15, 23, 42, 0.05);
```

Elevated:

```css
box-shadow:
  0 8px 24px rgba(15, 23, 42, 0.08);
```

Prefer subtle borders over excessive floating shadows.

---

# 17. Application Navigation

Recommended patient navigation:

```text
Home
Chat
Care
Community
More
Profile
```

Conceptually:

```text
Home      Chat      Care      Community      More      Profile
```

Use a consistent outline icon library rather than emoji in production.

Secondary functionality belongs inside those sections.

The target information architecture contains six top-level destinations: Home,
Chat, Care, Community, More, and Profile. The final mobile navigation
presentation remains subject to Phase 2.2B usability validation at 360px,
375px, 390px, and 430px widths.

Phase 2.2B will determine whether all six destinations can safely appear in the
persistent mobile navigation, or whether Home, Chat, Care, Community, and More
appear in bottom navigation while Profile remains persistently accessible
through the application header.

Do not shrink labels, controls, or touch targets below these design and
accessibility requirements merely to fit six bottom-navigation items.

---

# 18. Mobile Navigation

Bottom navigation should:

- Remain easy to reach
- Clearly show active state
- Include icon + short label
- Maintain sufficient touch target
- Avoid excessive visual decoration

The number and placement of bottom-navigation items remains deferred to Phase
2.2B as described above.

Selected item:

Navy or brand accent.

Inactive:

Gray.

---

# 19. Desktop Navigation

Where appropriate, mobile bottom navigation may become a left sidebar.

Example:

```text
Logo

Home
Chat
Care
Community
More

────────

Profile
```

Do not create duplicate navigation systems unnecessarily.

---

# 20. Patient Home Dashboard

Home is the most important patient screen.

Information priority:

1. Greeting
2. Current health status
3. Daily check-in
4. Pain
5. Hydration
6. Medication
7. Health trends
8. Upcoming appointment
9. Crisis/help

Conceptual structure:

```text
Good morning, Alex                   Notifications
Tuesday, 22 September


TODAY'S HEALTH

Stable

Pain                   Hydration
2 / 10                 5 / 8 cups

Last updated 10:32 AM


How are you feeling?

Good       Okay       Unwell


TODAY

Medication              Hydration
2 of 3 taken             5 / 8 cups


PAIN TREND

[ simple 7-day line chart ]


NEXT MEDICATION

Hydroxyurea
500 mg
8:00 PM

[ Mark as Taken ]


NEXT APPOINTMENT

Haematology Clinic
24 September • 10:30 AM

[ View Details ]


Feeling a crisis coming on?

Know what to do and get help.

[ Get Help ]
```

Do not interpret this wireframe as a requirement to invent missing backend features.

Map existing data into this hierarchy where possible.

---

# 21. Today's Health Hero

This should be one of the strongest visual elements.

Use:

- Navy gradient
- Or controlled brand gradient

Example content:

```text
TODAY'S HEALTH

✓ Stable

Pain
2 / 10

Hydration
5 / 8 cups
```

White text on the dark background.

Maximum approximately 3–4 important metrics.

Do not turn the hero into a mini dashboard containing everything.

---

# 22. Daily Check-In

Check-in should require minimal effort.

Initial interaction:

```text
How are you feeling today?

Good
Okay
Unwell
```

Use expressive but professional icons where appropriate.

After selection, optionally ask:

```text
Any symptoms today?

Pain
Fatigue
Headache
Fever
Breathing difficulty
Dizziness
Swelling
Other
```

Use large selectable chips/cards.

Avoid long mandatory forms for routine daily check-ins.

---

# 23. Pain Tracking

Pain tracking is a primary feature.

Use a clear 0–10 scale:

```text
0 ───────────────────────── 10

No pain                 Severe pain
```

Recommended descriptions:

```text
0       No pain
1–3     Mild
4–6     Moderate
7–10    Severe
```

Always show:

- Numeric value
- Text description

Example:

```text
Pain level

6 / 10

Moderate pain
```

Do not rely only on color.

---

# 24. Body Pain Map

If body-location tracking already exists or is part of planned functionality, present a simple anatomical selector.

Possible areas:

- Head
- Chest
- Abdomen
- Back
- Left arm
- Right arm
- Left leg
- Right leg
- Joints

Selected areas may use medical red.

Keep anatomy simple and non-graphic.

Do not use graphic injury imagery.

---

# 25. Hydration

Hydration tracking should feel encouraging.

Example:

```text
Hydration

5 / 8 cups

██████████░░░░

[ + Add Water ]
```

Alternative:

```text
1.25 L / 2 L
```

Preferred language:

`3 cups to reach today's goal.`

Avoid guilt-based language.

Do not say:

`You failed to drink enough water.`

---

# 26. Medication Card

Example:

```text
Hydroxyurea

500 mg
8:00 PM

Next dose in 2h 15m

[ Mark as Taken ]
```

Medication statuses:

```text
Upcoming
Taken
Missed
Skipped
```

Taken:

Success styling.

Upcoming:

Neutral/navy.

Missed:

Warning or soft red.

Do not make entire medication cards bright red.

---

# 27. Medication Screen

Recommended sections:

```text
Today
Upcoming
History
```

Each item may include:

- Medication name
- Dosage
- Scheduled time
- Status
- Optional instructions

Primary action:

`Mark as Taken`

Secondary:

`Skip`

If skipping requires a reason, prefer a bottom sheet rather than unnecessary page navigation.

---

# 28. Symptoms

Symptoms should use selectable cards or chips.

Example:

```text
What are you experiencing?

Pain

Fatigue

Fever

Headache

Dizziness

Shortness of breath

Swelling

Other
```

Selected state:

```text
✓ Fatigue
```

Ask severity only where useful.

Avoid forcing patients to complete irrelevant fields.

---

# 29. Health Screen

Health should focus on longitudinal understanding.

Possible sections:

```text
Health Overview

Pain

Hydration

Medication adherence

Symptoms

Vitals

Crisis history
```

Do not display every metric simultaneously.

Allow users to switch between important metrics.

---

# 30. Charts

Prefer:

- Line charts
- Area charts
- Progress bars
- Simple bar charts
- Progress rings where appropriate

Avoid:

- 3D charts
- Complex pie charts
- Excessive grid lines
- Too many colors
- Tiny labels
- Dense analytics dashboards

Pain trend:

Primarily navy line.

High or critical points may use red.

Hydration:

Blue/navy progress.

Medication adherence:

Progress ring, percentage, or simple trend.

---

# 31. Chart Accessibility

Charts should not be the only way health information is communicated.

Where useful, include a textual summary such as:

```text
Average pain this week

3.2 / 10

Down from 4.1 last week
```

Do not communicate positive/negative changes through color alone.

---

# 32. Crisis / Emergency UX

Help should always be easy to locate.

The application should NOT constantly look like an emergency interface.

Example:

```text
Need urgent help?

If you're experiencing severe symptoms,
follow your care plan or contact your
healthcare provider.

[ Get Help ]
```

Critical action may use strong red.

Do not:

- Flash warnings
- Use frightening animation
- Use unnecessarily alarming language
- Imply that the application replaces emergency medical care

---

# 33. Alert Hierarchy

## Information

Blue/navy.

## Reminder

Neutral.

## Attention

Amber.

## Critical

Red.

Example:

```text
! Important

Your recorded symptoms may require attention.

[ View guidance ]
```

Always pair status with text/icon.

---

# 34. Appointments

Compact Home card:

```text
NEXT APPOINTMENT

Haematology Clinic

24 Sep
10:30 AM

[ View Details ]
```

Avoid putting every appointment detail on Home.

Full details belong on the appointment screen.

---

# 35. Profile

Possible structure:

```text
Personal Information
Care Team
Emergency Contact
Health Information
Medication
Notification Preferences
Privacy & Security
Accessibility
Sign Out
```

Avoid exposing sensitive information unnecessarily on the first profile screen.

---

# 36. Notifications

Categories may include:

```text
Medication
Health
Appointments
System
```

Unread state:

Small red dot or clearly labelled unread styling.

Avoid large aggressive notification counters.

---

# 37. Buttons

## Primary

```css
background: #0B1F3A;
color: #FFFFFF;
```

Use for everyday primary actions.

## Accent

```css
background: #D1223E;
color: #FFFFFF;
```

Use selectively.

## Secondary

```css
background: #FFFFFF;
border: 1px solid #CBD5E1;
color: #0B1F3A;
```

## Ghost

Transparent background.

## Danger

Strong red.

Reserve for:

- Destructive actions
- Critical actions

Recommended height:

44–52px.

Touch targets should generally be at least approximately 44px.

---

# 38. Inputs

Inputs require:

- Visible label
- Optional supporting text
- Clear focus state
- Clear validation
- Appropriate touch height

Example:

```text
Pain notes

┌──────────────────────────────┐
│ Describe how you feel...     │
└──────────────────────────────┘
```

Never use placeholder text as the only label.

Focus:

Navy border/ring.

Error:

Red border + icon + explanatory text.

Do not expose raw backend validation errors.

---

# 39. Cards

Standard card:

```css
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 18px;
padding: 16px;
```

Hierarchy:

1. Hero
2. Primary health cards
3. Secondary cards
4. Utility cards

Not every section needs a floating card.

Group related information naturally.

---

# 40. Icons

Preferred:

- Lucide
- Heroicons
- Existing consistent icon library already used by the application

Do not introduce another icon library if the project already has a suitable one.

Recommended sizes:

```text
16px inline
20px standard
24px navigation
```

Avoid mixing filled, outline, 3D, emoji, and unrelated icon styles.

---

# 41. Bottom Sheets

On mobile, bottom sheets are suitable for:

- Quick symptom entry
- Medication actions
- Filters
- Date selection
- Quick health logging

Example:

```text
────────

Log symptom

Pain
Fatigue
Fever
Headache

[ Continue ]
```

Top radius:

Approximately 24px.

---

# 42. Modals

Use modals for:

- Confirmation
- Important decisions
- Destructive actions

Do not use modal dialogs as ordinary navigation.

---

# 43. Empty States

Never leave unexplained blank screens.

Example:

```text
No symptoms recorded today

Your daily check-in helps you understand
changes in your health over time.

[ Start Check-in ]
```

Use simple icons/illustrations sparingly.

---

# 44. Loading States

Prefer skeleton loading for page/card content.

Do not use a full-screen spinner for small updates.

Buttons performing asynchronous actions should provide inline feedback.

Prevent duplicate submissions.

---

# 45. Success States

Example:

```text
✓ Check-in saved

Your health log has been updated.
```

Keep success messaging concise.

---

# 46. Error States

Example:

```text
We couldn't save your check-in.

Your information hasn't been lost.

[ Try Again ]
```

Never expose raw API errors to patients.

Technical details belong in logs.

---

# 47. Mobile-First Design

Primary target widths:

```text
360px
375px
390px
430px
```

Design for mobile first and expand gracefully.

Do not create a desktop dashboard and merely compress it.

---

# 48. Tablet

Tablet may use two-column layouts.

Example:

```text
Health Overview      Medication

Pain Trend           Appointments

Symptoms             Hydration
```

Do not force two columns when content readability would suffer.

---

# 49. Desktop

Maximum primary content width:

```text
1200px–1440px
```

Patient dashboards should not stretch cards across extremely wide displays.

Use a centered container.

Possible desktop structure:

```text
Sidebar | Main Health Content | Supporting Information
```

---

# 50. Responsive Rules

Mobile:

1 column.

Tablet:

1–2 columns.

Desktop:

2–3 columns where useful.

Never make health information tiny simply to increase information density.

---

# 51. Accessibility

Target WCAG 2.2 AA where practical.

Requirements include:

- Minimum 4.5:1 contrast for normal text
- Large touch targets
- Keyboard navigation
- Visible focus states
- Semantic HTML
- Screen-reader labels
- Explicit form labels
- Accessible error messages
- Accessible charts
- Reduced-motion support

Never use color alone to communicate:

- Pain severity
- Medication status
- Health status
- Errors
- Crisis state

Always prefer:

```text
Icon + Text + Color
```

---

# 52. Motion

Recommended timing:

```text
Fast:   120ms
Normal: 180ms
Slow:   250ms
```

Appropriate animation:

- Button feedback
- Progress changes
- Bottom-sheet transitions
- Check-in completion
- Subtle card transitions

Avoid:

- Constant pulsing
- Bouncing UI
- Decorative spinning
- Flashing warnings
- Excessive parallax
- Animations that delay tasks

Respect:

```css
prefers-reduced-motion
```

---

# 53. Dark Mode

Dark mode is optional.

Do not prioritize dark mode over core usability unless the application already supports it.

Suggested palette:

Background:

```css
#071426
```

Surface:

```css
#0B1F3A
```

Elevated surface:

```css
#102A4C
```

Primary text:

```css
#F8FAFC
```

Secondary:

```css
#CBD5E1
```

Border:

```css
rgba(255,255,255,0.10)
```

Do not simply invert light mode.

---

# 54. Recommended CSS Variables

```css
:root {
  --background: #F7F9FC;
  --surface: #FFFFFF;

  --primary: #0B1F3A;
  --primary-light: #173B68;

  --accent: #D1223E;
  --accent-light: #FDE8EC;

  --text-primary: #0B1F3A;
  --text-secondary: #64748B;

  --border: #E2E8F0;

  --success: #168A5B;
  --success-soft: #EAF8F1;

  --warning: #D98C10;
  --warning-soft: #FFF6DF;

  --danger: #D1223E;
  --danger-soft: #FDE8EC;

  --info: #2563EB;
  --info-soft: #EAF2FF;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-pill: 9999px;
}
```

---

# 55. Tailwind Direction

If Tailwind is already installed, extend the existing theme.

Do not replace the application's styling architecture unnecessarily.

Conceptual mapping:

```js
colors: {
  navy: {
    950: "#071426",
    900: "#0B1F3A",
    800: "#102A4C",
    700: "#173B68",
    600: "#21518B"
  },

  medical: {
    700: "#B91C32",
    600: "#D1223E",
    500: "#E63950",
    400: "#F05A6E",
    100: "#FDE8EC",
    50: "#FFF4F6"
  }
}
```

Adapt this to the project's Tailwind version and existing theme structure.

---

# 56. Component Architecture

Create reusable components where doing so improves consistency.

Potential structure:

```text
components/
  ui/
    Button
    Card
    Badge
    Input
    Textarea
    Progress
    Modal
    BottomSheet
    Skeleton
    Alert

  health/
    HealthStatusCard
    PainScore
    PainTrendChart
    HydrationCard
    MedicationCard
    MedicationStatus
    SymptomChip
    DailyCheckIn
    AppointmentCard
    CrisisHelpCard

  layout/
    AppHeader
    BottomNavigation
    Sidebar
    PageContainer
    SectionHeader
```

This is conceptual.

Adapt it to the existing repository.

Do NOT restructure the whole application simply to reproduce this folder tree.

---

# 57. Patient vs Clinician Experience

If clinician functionality exists, do not simply reuse the patient dashboard.

## Patient

Prioritize:

- Simplicity
- Reassurance
- Actions
- Daily tasks
- Limited data density

## Clinician

May prioritize:

- Higher information density
- Patient lists
- Alerts
- Longitudinal trends
- Medication adherence
- Crisis history
- Search
- Filtering

Both should share:

- Color tokens
- Typography
- Components
- Status language
- Accessibility rules

---

# 58. Clinician Patient Card

Conceptual example:

```text
Alex Johnson

✓ Stable

Pain          3 / 10
Adherence     92%
Last check    Today, 9:42 AM

[ View Patient ]
```

Urgent state may use:

- Red badge
- Red left border
- Alert icon

Do not make entire cards bright red.

---

# 59. Design Anti-Patterns

DO NOT:

- Cover the application in red
- Use gradients everywhere
- Create excessive glassmorphism
- Use neon colors
- Use tiny dashboard text
- Use excessive shadows
- Create 3D charts
- Use more than five bottom-nav destinations
- Hide important labels behind icons
- Use color as the only health indicator
- Create hospital-monitor aesthetics
- Show every available metric on Home
- Use giant decorative illustrations where data matters more
- Add animation that delays health tasks
- Replace functioning components merely because they are not written in a preferred style
- Change business logic solely for visual reasons
- Remove existing functionality during redesign
- Introduce unnecessary dependencies
- Create visual inconsistency between pages
- Copy reference designs pixel-for-pixel

---

# 60. Desired Visual Impression

When users first open the application, the intended reaction is:

> "This feels calm."

> "I can immediately understand how I'm doing."

> "I know what I need to do today."

> "I can log my health quickly."

> "I know where to go if something is wrong."

The intended reaction is NOT:

> "This looks like I'm in a hospital."

or:

> "There is too much medical information."

or:

> "Everything looks urgent."

---

# 61. Visual References

The following external designs are VISUAL REFERENCES ONLY.

They are NOT specifications to reproduce pixel-for-pixel.

Do not copy:

- Logos
- Brand names
- Proprietary illustrations
- Photographs
- Unique graphical assets
- Exact screen compositions

Study them for:

- Information hierarchy
- Composition
- Spacing
- Card proportions
- Typography scale
- Navigation patterns
- Chart presentation
- Health metric presentation
- Symptom logging UX
- Medication UX
- Whitespace
- Visual polish
- Micro-interaction ideas

The rules in this `DESIGN.md` take precedence over visual references.

---

# 62. Reference 1 — Primary Visual Reference

## Health Tracker App UI Design — Habibur Rahman

URL:

https://dribbble.com/shots/26903087-Health-Tracker-App-UI-Design

This is the PRIMARY visual reference for the patient-facing experience.

Study it primarily for:

- Overall visual quality
- Mobile composition
- Rounded components
- Soft visual treatment
- Health tracking cards
- Symptom presentation
- Reports and insights
- Whitespace
- Typography hierarchy
- Friendly health tracking experience
- Card sizing
- Screen rhythm
- Modern consumer-health aesthetics

IMPORTANT:

Do NOT copy its purple/pink palette.

Translate its visual language into this application's:

**DARK NAVY + MEDICAL RED + WHITE**

identity.

Its strongest influence should be:

**visual softness + layout polish + patient friendliness**

rather than exact appearance.

---

# 63. Reference 2 — Symptom + Medication UX

## Medical Reminder & Symptom Tracker App UI

URL:

https://dribbble.com/shots/27156799-Medical-Reminder-Symptom-Tracker-App-UI-Healthcare-Mobile-De

Study primarily for:

- Medication cards
- Medication scheduling
- Daily dosage presentation
- Symptom selection
- Anatomical/body symptom interaction
- Calendar layout
- Healthcare information hierarchy
- Mobile health logging

Use this reference mainly when working on:

- Symptoms
- Pain
- Medication
- Daily logging

Do not copy its branding or assets.

---

# 64. Reference 3 — Dashboard Architecture

## Healthcare Dashboard Mobile App — Smart Health Monitoring

URL:

https://dribbble.com/shots/27003477-Healthcare-Dashboard-Mobile-App-Smart-Health-Monitoring

Study primarily for:

- Dashboard hierarchy
- Health overview
- Health status presentation
- Trend cards
- Quick actions
- Appointment/consultation presentation
- Patient profile presentation
- Health snapshots
- Information prioritization

Use this reference mainly for STRUCTURE.

The Sickle Cell Patient Monitoring app should remain visually softer and less dashboard-heavy.

---

# 65. Reference 4 — Health Monitoring Data

## MedAxis — Heart Health Monitoring Mobile App UI

URL:

https://dribbble.com/shots/27156733-MedAxis-Heart-Health-Monitoring-Mobile-App-UI

Study primarily for:

- Health metric cards
- Health analytics
- Trend visualization
- Data-heavy health screens
- Mobile health-data presentation

Do NOT make the application resemble a heart-monitoring product.

Borrow presentation patterns, not medical content.

---

# 66. Reference 5 — Daily Health Monitoring

## Smart Daily Health Monitoring Mobile App

URL:

https://dribbble.com/shots/26936644-Smart-Daily-Health-Monitoring-Mobile-App

Study primarily for:

- Daily monitoring
- Metric hierarchy
- Compact health cards
- Mobile dashboard organization
- Quick health understanding

Do not treat this as a required screen layout.

---

# 67. Visual Reference Priority

When references conflict, use this priority:

1. `DESIGN.md`
2. Existing working application functionality
3. Health Tracker App UI Design
4. Medical Reminder & Symptom Tracker
5. Smart Health Monitoring Dashboard
6. MedAxis
7. Smart Daily Health Monitoring
8. Other references

Never sacrifice:

- Accessibility
- Functionality
- Readability
- Medical clarity
- Responsiveness

simply to resemble a reference.

---

# 68. Design Synthesis Rule

Do NOT reproduce any reference exactly.

The final product must feel like an original sickle-cell monitoring application.

Combine:

**Health Tracker**

→ visual softness  
→ polish  
→ spacing  
→ patient-friendly composition

**Symptom Tracker**

→ symptoms  
→ medication UX  
→ body/pain interaction

**Healthcare Dashboard**

→ information architecture  
→ status hierarchy  
→ dashboard organization

**MedAxis**

→ health-data visualization  
→ metric presentation

**DESIGN.md**

→ colors  
→ branding  
→ accessibility  
→ components  
→ interaction rules  
→ final design authority

Translate everything into:

**DARK NAVY + MEDICAL RED + WHITE**

The finished application must be recognizably its own product.

---

# 69. External Reference Browsing Rule

If Codex has browser/web access:

Inspect the reference pages before implementing major visual changes.

Focus on:

- Overall composition
- Visual hierarchy
- Card sizing
- Spacing
- Typography
- Navigation
- Health-data presentation
- Interaction concepts

Do not attempt to scrape or reproduce proprietary assets.

If browser access is unavailable:

Continue using this `DESIGN.md`.

External references are supplementary.

They are NOT required for implementation.

Do not block development merely because a Dribbble page cannot be accessed.

---

# 70. Implementation Process

The redesign should proceed in phases.

Do not redesign every screen simultaneously.

---

# 71. Phase 1 — Audit

Before changing code inspect:

- Existing screens
- Components
- Routes
- Styles
- Forms
- Charts
- Navigation
- Responsive behavior
- Data flow
- APIs
- State management
- Authentication-related UI

Identify what can be reused.

---

# 72. Phase 2 — Design Foundation

Establish:

- Color tokens
- Typography
- Spacing
- Border radii
- Shadows
- Borders
- Buttons
- Cards
- Forms
- Status badges
- Alerts
- Progress
- Skeletons
- Layout primitives

Do not redesign every page yet.

---

# 73. Phase 3 — Navigation

Improve:

- Application shell
- Header
- Mobile bottom navigation
- Desktop sidebar where appropriate
- Active states
- Responsive navigation

Preserve routes.

---

# 74. Phase 4 — Patient Home

Home establishes the design language.

Prioritize:

- Greeting
- Health hero
- Daily check-in
- Pain
- Hydration
- Medication
- Health trend
- Appointment
- Crisis/help

Do not overload Home.

---

# 75. Phase 5 — Daily Health Tracking

Improve:

- Daily check-in
- Symptoms
- Pain
- Body location where applicable
- Hydration
- Health logging

Optimize for fast interaction.

---

# 76. Phase 6 — Health Trends

Improve:

- Pain trends
- Symptom history
- Hydration history
- Medication adherence
- Other existing health metrics

Prioritize interpretation over chart complexity.

---

# 77. Phase 7 — Medication

Improve:

- Today's medication
- Scheduling
- History
- Adherence
- Medication actions
- Missed medication state

Preserve existing medication logic.

---

# 78. Phase 8 — Supporting Screens

Apply the established system to:

- Appointments
- Notifications
- Profile
- Settings
- Onboarding
- Authentication screens

Only after the core design language is stable.

---

# 79. Phase 9 — Clinician Experience

If clinician functionality exists, improve:

- Dashboard
- Patient list
- Patient detail
- Alerts
- Trends
- Reports
- Search/filtering

Do not invent a clinician system if one does not exist.

---

# 80. Phase 10 — Polish

Verify:

- Responsive behavior
- Empty states
- Loading
- Errors
- Success states
- Accessibility
- Keyboard navigation
- Focus states
- Motion
- Typography
- Component consistency
- Visual rhythm

---

# 81. Validation Requirements

After each major implementation phase:

- Run the application
- Run existing tests
- Run linting if configured
- Run type checking if configured
- Run the build
- Inspect console errors
- Verify navigation
- Verify forms
- Verify API interactions
- Verify authentication
- Verify mobile layout
- Verify desktop layout

Fix regressions before continuing.

Do not leave the project in a broken intermediate state.

---

# 82. Visual QA

If browser automation or browser inspection is available, inspect the actual rendered interface.

Recommended viewport checks:

```text
375px mobile
768px tablet
1440px desktop
```

Look for:

- Clipping
- Horizontal scrolling
- Overflowing text
- Inconsistent spacing
- Poor alignment
- Broken navigation
- Weak contrast
- Awkward card heights
- Excessive whitespace
- Cramped sections
- Inconsistent typography
- Unclear action hierarchy

Do not consider implementation finished simply because code compiles.

Rendered UI quality matters.

---

# 83. Existing Data vs Mockup Rule

The conceptual layouts in this document show the intended information hierarchy.

They do NOT authorize the creation of fake backend functionality.

For example, if the Home specification shows:

```text
Hydration
5 / 8 cups
```

but the current application does not track hydration:

Do NOT silently fabricate a hydration API or database field just to reproduce the mockup.

Instead:

- Use existing functionality
- Identify the missing capability
- Keep architecture extensible
- Report the gap

UI redesign and product-feature development should remain distinguishable.

---

# 84. Medical Content Rule

Do not invent clinical thresholds, medical advice, treatment instructions, medication dosages, emergency criteria, or diagnostic logic merely for UI completeness.

Existing medically reviewed application content should be preserved unless explicitly being updated.

Placeholder/sample data used during development must clearly remain sample data.

Visual redesign must not accidentally change clinical meaning.

---

# 85. Copywriting Tone

Patient-facing copy should be:

- Clear
- Short
- Calm
- Respectful
- Action-oriented
- Non-judgmental

Prefer:

`3 cups to reach today's goal.`

over:

`You haven't consumed enough water.`

Prefer:

`Medication missed`

over:

`You failed to take your medication.`

Prefer:

`How are you feeling today?`

over:

`Enter today's clinical condition.`

Avoid unnecessary medical jargon.

---

# 86. Responsive Content Priority

On small screens prioritize:

1. Health status
2. Important actions
3. Daily tasks
4. Medication
5. Symptoms
6. Trends
7. Supporting information

Do not merely reduce font sizes to make desktop information fit.

Reorganize information according to priority.

---

# 87. Component Consistency Rule

Every screen should feel like the same product.

Users should never encounter:

- Different button languages
- Random radii
- Different card shadows
- Unrelated palettes
- Multiple icon styles
- Inconsistent spacing
- Different input treatments
- Inconsistent status terminology

Use shared design tokens and components.

---

# 88. Dependency Rule

Do not introduce a new package simply because a design reference appears to use it.

Before adding dependencies:

1. Check what the application already uses.
2. Determine whether existing tools can achieve the result.
3. Avoid adding libraries for trivial UI effects.
4. Prefer maintainability.

Examples:

If a chart library already exists, use it where practical.

If an icon library already exists, use it.

If Tailwind already exists, extend it.

---

# 89. Performance Rule

Visual improvements must not substantially degrade application performance.

Avoid:

- Huge image assets
- Unnecessary animation libraries
- Excessive client-side JavaScript
- Rendering dozens of hidden charts
- Large decorative video backgrounds
- Unnecessary network requests

Health information should load quickly.

---

# 90. Final Acceptance Criteria

The redesign is complete only when:

- Existing core functionality continues to work.
- Navigation remains functional.
- Mobile layouts work from approximately 360px upward.
- Desktop layouts remain appropriately constrained.
- Dark navy, white, and medical red form a consistent identity.
- Gradients remain restrained.
- Red is not overused.
- Home clearly communicates current health status.
- Pain information is easy to understand.
- Medication status is clear.
- Hydration is clear where the feature exists.
- Symptoms can be logged with minimal friction where supported.
- Health trends are readable.
- Crisis/help functionality is easy to locate where supported.
- Critical states use icon + text + color.
- Forms have labels and accessible errors.
- Loading, empty, success, and error states are handled.
- Touch targets are appropriately sized.
- Shared components are used consistently.
- The interface feels like a modern consumer healthcare application.
- The interface does not feel like hospital administration software.
- No existing API, database, authentication, or application functionality has been unnecessarily broken or rewritten.
- Visual references have been synthesized rather than copied.
- The application has its own recognizable identity.

---

# 91. Final Instruction to Codex

Treat this document as the visual and UX source of truth.

Before coding:

1. Read this entire document.
2. Inspect the existing application.
3. Understand its architecture.
4. Identify what already works.
5. Compare the current UI against this specification.
6. Determine what can be reused.
7. Plan incremental improvements.

Do NOT blindly generate an entirely new frontend.

Preserve working functionality.

Reuse existing components where practical.

Create shared design primitives where inconsistency exists.

Implement improvements incrementally.

When external visual references are accessible, study them for visual context.

Do not copy them.

When external references are unavailable, continue using this document without blocking implementation.

Remember the priority:

**FUNCTIONALITY**

↓

**ACCESSIBILITY**

↓

**CLARITY**

↓

**CONSISTENCY**

↓

**VISUAL POLISH**

The final product should look polished enough for a healthcare startup demonstration while remaining practical, maintainable, accessible, and capable of evolving into a real patient-monitoring product.

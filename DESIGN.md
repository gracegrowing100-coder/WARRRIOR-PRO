# Warrior AI — DESIGN.md (v2)

> **For the coding agent (Gemini).** This is the canonical visual spec for the Warrior AI redesign.
> It replaces the colour, type and layout rules in the repo's current `DESIGN.md`.
> Product scope, data contracts and clinical rules in `PRODUCT.md`, `docs/DATA_CONTRACTS.md` and `docs/REGRESSION_CHECKLIST.md` still apply.
> Visual reference: the "Screens v2" page of the design canvas (19 screens + bottom-nav component). Logo files: `warrior-ai-logo-pack.zip`.

---

## 0. Ground rules (read first)

This is a **brownfield restyle, not a rewrite.**

- **Keep:** all hash routes (`#/home`, `#/chat`, `#/care`, `#/community`, `#/more`), `App.tsx` page state, Firebase auth and Firestore schemas, `firebaseService.ts` method signatures, localStorage keys, offline fallbacks, Mira/YarnGPT providers, demo mode.
- **Change:** markup, Tailwind classes, component composition, copy, icons, layout.
- Work one screen at a time, in the order of §8. After each: `npm run lint`, `npm run build`, check 360 / 375 / 768 / 1280 px, keyboard Tab through it, no console errors, test offline.
- Never add emoji. Icons come from `lucide-react` (already installed) or the brand SVGs.
- Don't add or remove code comments unless asked; follow existing patterns; prefer compact code.

---

## 1. Brand

### 1.1 Logo (approved: mark D2 + wordmark W1)
A blood drop with a four-point spark cut out of it: blood and care, plus Mira's intelligence. The wordmark is "Warrior" in Sora ExtraBold with a crimson "AI" badge.

Put the pack in `public/brand/`:

| Use | File |
|---|---|
| Header / landing on light | `svg/lockup/warrior-ai-horizontal-primary.svg` |
| On plum / dark | `svg/lockup/warrior-ai-horizontal-reverse.svg` |
| Small mark, avatars, Mira icon, loaders | `svg/mark/warrior-ai-mark-coral.svg` (on plum), `…-crimson.svg` (on light) |
| Favicon, PWA, app icons | `favicon.ico`, `favicon.svg`, `png/icon/*` (manifest: 192 + 512, `theme_color` and `background_color` `#3B0F2C`) |

Rules: clear space = height of the AI badge; lockup ≥ 120 px wide; mark ≥ 16 px; never retype the wordmark in live text, stretch, outline, add effects, or put the coral mark on crimson. **Product name is "Warrior AI" everywhere** (the app currently mixes "Warrior Cell" and "WARRIOR AI").

For inline use in React, the mark is one path (`fill-rule="evenodd"`, `viewBox="14 2 72 96"`):

```tsx
export const WarriorMark = ({ className = '', color = 'currentColor' }) => (
  <svg viewBox="14 2 72 96" className={className} aria-hidden="true">
    <path fill={color} fillRule="evenodd" d="M50 6C50 6 82 42 82 63A32 32 0 0 1 18 63C18 42 50 6 50 6ZM50 40L44.5 56.5L28 62L44.5 67.5L50 84L55.5 67.5L72 62L55.5 56.5Z"/>
  </svg>
);
export const Spark = ({ className = '', color = 'currentColor' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill={color} d="M12 2L14.6 9.4 22 12 14.6 14.6 12 22 9.4 14.6 2 12 9.4 9.4Z"/>
  </svg>
);
```

### 1.2 Personality
Calm, warm, confident; a companion, not a hospital monitor. **Not** an ICU dashboard, crypto dashboard, or futuristic control panel.

### 1.3 Signature moves (what makes v2 look like Warrior AI, not a template)
1. **Plum hero blocks**: the top of Home, Log pain, History, Profile, auth screens is a deep plum panel with 36 px bottom corners. Content cards float up over its lower edge.
2. **The spark ✦** as the brand's bullet and accent: section eyebrows, tips, Mira's avatar, AI-related actions. Never decorative clutter; max 3 per screen.
3. **Ghost mark**: one oversized drop mark at 8–12 % opacity bleeding off the edge of a plum block (Home, Login, Care history tile, Profile).
4. **Floating plum pill nav** with a crimson active tab.
5. **Water is drops and sachets**, never ml-only: drop-shaped progress, rows of sachet tiles.
6. **Big Sora numbers** for anything the user records (pain 96 px on Log pain, 26–36 px in tiles).

---

## 2. Tokens

Put these in the global CSS and map them in `tailwind.config` (`colors.wa.*`, `fontFamily.display/body`, `borderRadius.*`). Remove the old navy/red palette.

```css
:root {
  /* brand */
  --wa-plum: #3B0F2C;        /* ink text, hero blocks, nav, dark buttons */
  --wa-crimson: #C4122F;     /* primary actions, pain, selected, AI badge */
  --wa-crimson-press: #9E0E26;
  --wa-coral: #E8344F;       /* mark and accents ON plum only (not text on white) */
  --wa-rose: #FBE4E8;        /* selected chip fill, tips, red-flag box */
  --wa-rose-text: #FF8A9B;   /* numbers/accents on plum */

  /* neutrals */
  --wa-ground: #F7F2F5;      /* app background (blush) */
  --wa-surface: #FFFFFF;     /* cards, sheets, inputs */
  --wa-line: #E6D8E0;        /* borders */
  --wa-line-soft: #F1E6EC;   /* list dividers */
  --wa-muted: #6E4A63;       /* secondary text on light (7:1 on white) */
  --wa-on-plum-muted: #D9B9CC;  /* secondary text on plum */
  --wa-on-plum-soft: #E8D3DF;

  /* functional */
  --wa-water: #1C7C8C;  --wa-water-soft: #E1F2F4;  --wa-water-ink: #11535E;  --wa-water-bright: #7FD6DF; /* bright = on plum */
  --wa-sun: #B45309;    --wa-sun-soft: #FDF0DC;    --wa-sun-ink: #7A3E06;
  --wa-success: #1E7B4A; --wa-success-bright: #9FE3B5;  --wa-online: #3DDC84;
}
:root[data-theme="dark"] {
  --wa-ground: #1A0A15; --wa-surface: #2A1323; --wa-line: #44243A; --wa-line-soft: #3A1E31;
  --wa-plum: #F7F2F5;          /* ink flips to light text */
  --wa-muted: #C9A9BC;
  --wa-rose: #4A1626; --wa-water-soft: #0F3036; --wa-sun-soft: #3A2610;
  /* hero blocks and nav keep #3B0F2C on a darker ground: use --wa-hero */
  --wa-hero: #3B0F2C;
}
:root { --wa-hero: #3B0F2C; }
```

High-contrast mode: text `#000`/`#FFF` only, borders 2 px `#3B0F2C`, no tinted fills behind text.

### Type
```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```
| Token | Font | Size / line-height | Weight | Use |
|---|---|---|---|---|
| `display-hero` | Sora | 96 / 0.9, −0.04em | 800 | Pain number on Log pain |
| `display-xl` | Sora | 34–38 / 1.05, −0.03em | 800 | Landing, Login, Emergency titles |
| `display-l` | Sora | 30–32 / 1.1, −0.02em | 800 | Screen titles (h1) |
| `stat` | Sora | 22–36 | 800 | Numbers in tiles |
| `title` | Sora | 16–20 / 1.25 | 700–800 | Card and section titles |
| `eyebrow` | Sora | 12, +0.06em, uppercase | 700 | Onboarding eyebrows with ✦ |
| `body-l` | Inter | 15–16 / 1.5 | 400 | Intros, chat |
| `label` | Inter | 13–15 | 600–700 | Buttons, chips, form labels |
| `caption` | Inter | 12–13 / 1.4 | 500–600 | Meta, disclaimers |

Minimum 12 px; inputs 16 px. Test Yorùbá/Igbo diacritics (ẹ ọ ṣ ị ụ ń) in both fonts.

### Shape, space, depth
- Radius: chip/pill/button **full** (height/2); input 16; small card 18–22; card **26–28**; hero/sheet **32–36**; icon tile 12–16 (quick-action tiles 22).
- Screen padding 16 (cards) / 20 (forms). Card gap 14–16. Card padding 16–18.
- Shadows only: floating nav `0 12px 30px rgb(59 15 44 / .35)`; card overlapping a hero `0 12px 30px rgb(59 15 44 / .12)`; SOS call button `0 16px 40px rgb(196 18 47 / .45)`.
- Cards on light ground have **no border**; white on blush is enough. Inputs and unselected chips get a 1 px `--wa-line` border.
- Motion (Motion/framer-motion, already installed): 180 ms ease-out for selection, 260 ms spring for sheets, number count-up on stats ≤ 400 ms. Wrap all in `useReducedMotion()`.

---

## 3. Components (`components/ui/`, restyle the existing primitives)

| Primitive | Spec |
|---|---|
| `Button` variants | `primary` crimson h56 full-pill white 16/700 · `dark` plum · `water` teal · `outline` 1.5 px plum border · `ghost` crimson text · `onPlum` white bg plum text · `icon` 40–44 circle (needs `aria-label`) |
| `ChoiceChip` | h42–46 pill. Off: white + line border. On: **crimson fill + white text** (Log pain) or rose fill + 2 px crimson border (onboarding cards). Custom chip: plum fill + × remove button (30 px circle). Add-own: dashed `#A8909F` |
| `OptionCard` (new) | min-h 56–68, radius 18–20, leading icon tile or code badge (48 px, crimson when selected), trailing radio dot or ✓ circle |
| `Card` | `surface` (white r28) · `hero` (plum r36 bottom-only or all) · `tint` (rose / water-soft / sun-soft) · `glass` (white 8 % on plum, 1 px white 12 % border) |
| `FormField` | label 14/700 above; input h52 r16; helper 13 muted; error 13 crimson with icon; focus = 2 px plum border |
| `ProgressSegments` (new) | N equal bars h6 r3 gap 5, crimson done, line upcoming, plus "2/5" in Sora |
| `Modal` → `Sheet` | Bottom sheet on mobile (r36 top, 44×5 handle, plum 85 % scrim), centred dialog ≥768 px. Focus trap, Esc closes |
| `StateMessage` | loading = skeletons same height as content; empty = ghost mark + one line + action; error = one line + retry, never a white screen |
| `PatientNavigation` | See §4 |
| `SafetyBanner` (new) | crimson card r22, white text, one "Get help" button → emergency |
| `DropProgress` (new) | SVG drop with clipPath fill = value/goal; label inside switches to dark text when fill < 40 % |

---

## 4. Navigation

- **Mobile (< 768):** floating plum pill nav, 16 px from sides and bottom, h68, five tabs: **Home · Mira · Care · Community · More** (routes unchanged; "Chat" is labelled "Mira"). Active tab = crimson pill with white icon + label; others `--wa-on-plum-muted`. Page content gets 120 px bottom padding. Hide on auth/onboarding/emergency/sheets.
- **Desktop (≥ 768):** left sidebar in plum, same five items, logo lockup (reverse) at top, SOS button at bottom.
- **SOS:** crimson pill "SOS" in the top-right of Home and Care (and every main page header on desktop). Opens the Emergency screen. This **replaces the floating "Emergency HUD" + "Offline AI" buttons**, which cover content on mobile. Offline AI becomes reachable from Mira (it is still Mira when offline: show "Offline mode" in Mira's status line).
- **Profile:** avatar button on Home header, and first row of More.
- **Language:** "EN" pill on Home header opens the language sheet; also in Profile → Preferences.

---

## 5. Copy rules

Plain, warm, second person. Keep honesty, lose jargon. Replace these strings from `AuthFlow.tsx` and elsewhere:

| Current | New |
|---|---|
| Create Medical Profile | Create my profile |
| Full name is required for medical reference. | Please add your name. |
| Please enter a valid institutional address. | That email doesn't look right. |
| Date of birth is critical for automated medication schedules. | Add your date of birth so reminders fit you. |
| Please choose a password meeting safe protocol guidelines. | Your password needs a few more things (see the checklist). |
| You must authorize the standard terms of use. | Please agree to the Terms to continue. |
| SCD health metrics access is required for clinical assistance. | We need your OK to store your health logs. |
| We couldn't locate matching credentials… | Email or password is wrong. Try again or reset your password. |
| Sudden Atmospheric Cold (Thermal Shock) | Cold weather or rain |
| Extreme Dryness / Passive Dehydration | Not drinking enough water |
| Infectious Fever or Physiological Load | Fever or infection |
| Strenuous Skeletal Fatigue / Exhaustion | Overdoing it physically |
| Prolonged Sleep Deficit | Poor sleep |
| Emotional Distress or Sympathetic Stress | Stress or worry |
| Hypoxia / Low Oxygen Environments | Low oxygen (flights, high places) |
| Genotype severity labels ("High vigilance", "Moderate control") | Remove from patient view. Keep the suggested water target only |
| Hello, [Name] | Good morning / afternoon / evening, [first name] |

**Keep the stored values** for triggers/genotypes exactly as they are in Firestore. Change only the displayed label via a label map, so existing data still matches.

Clinical lines that must appear:
- Landing + login footer: "Pilot version for product evaluation. Use sample information only."
- Mira header: "AI assistant, not a doctor. It can make mistakes."
- Weather card: "General wellbeing tips, not medical advice."
- History patterns: "…a pattern in your records, not a diagnosis."
- Onboarding water step: "Use your doctor's number if you have one."
- Never show AI confidence scores, never claim crisis prediction.

---

## 6. Languages (fix "Yorùbá doesn't work")

1. `i18n/{en,yo,ig,ha,pcm}.json`, keys grouped by screen. Seed from `APP_TRANSLATIONS` in `offlineKnowledgeBase.ts`.
2. `LanguageProvider` context at the top of `App.tsx`, reading/writing the existing localStorage key; `useT()` hook returns `t(key)`; English fallback per key; dev warning on missing keys.
3. Components call `useT()`; no prop drilling.
4. Set `document.documentElement.lang` (`pcm` for Pidgin).
5. Same setting drives Mira (`yo-NG`, `ig-NG`, `ha-NG`, `pcm-NG` already fixed). Mira's in-chat language chips change only Mira's language unless the user ticks "use for whole app".
6. Add Pidgin to every selector. Native-speaker review before release.

---

## 7. Data shown, and where it comes from

| UI | Source (existing) |
|---|---|
| Greeting name | `getUserProfile().displayName` → first name |
| Streak pill | `updateStreak` value |
| Pain tile / Log pain | `addSymptomLog`, `getPainLogs` (latest today; "↓ from 6" compares with previous entry) |
| Water tiles, sachet row, drop | `getWaterLog(today)`, `saveWaterLog`; goal from profile; sachets = ceil(goal ÷ 0.5) |
| Medicine card | existing `MedicationReminder` data |
| Next appointment | `UpcomingAppointmentCard` data |
| Your week line | `getPainLogs` last 7 days; days with no entry = hollow dot, no line through them |
| History stats/chart/top symptoms | `getSymptomHistory`, `getHydrationHistory` → pure function `utils/trends.ts` |
| Community list | existing support-centre data in `Community.tsx` |
| XP, level, daily challenge | existing `GamesHub` state |

---

## 8. Screens (build in this order)

Mobile frame 390 wide; everything must also work at 360.

### 8.1 Splash · `App.tsx` loading state
Plum full-bleed. Three concentric coral rings (18–35 % opacity) + soft radial glow behind a 120 px coral mark. Reverse lockup below. 3 tiny sparks scattered. Bottom: thin coral progress bar + "Pilot version · sample data only". Show while auth resolves (max ~1.2 s if cached).

### 8.2 Landing · `AuthFlow` screen `landing`
Plum top: small lockup, language pill, theme toggle. Three tilted floating cards (pain 3/10 with 10-segment bar, teal water card with mini drop "5 sachets", crimson Mira bubble in Pidgin). Headline "Live strong. / Track smart." (second line coral). One-line description. Blush bottom sheet (r32 top): **Get started** (crimson) → signup, **Sign in** (outline) → login, **Try the demo first →** (ghost) → `onOpenDemo`, pilot disclaimer + Terms · Privacy.

### 8.3 Sign up · `signup`
Plum header (back, "Account · then 5 quick steps", title "Create your profile", offline reassurance). Role picker as 3 cards ("Living with sickle cell" / "A carer or parent" / "A health worker") mapped to the existing role values. Fields: Full name, Email, Phone (country code defaults to **+234**, not +1), Date of birth + City side by side, Password with Show toggle, 4-segment strength bar and a live checklist (8+, upper & lower, number, symbol), Confirm password. White consent card: Terms + Privacy, health-data consent, "Keep me signed in" (= Remember me). Crimson "Create my profile". Keep all existing validation logic; only the messages change (§5). Errors show inline under each field.

### 8.4 Sign in · `login` (and `forgot`)
Plum top with ghost mark: "Welcome back, / warrior." Blush sheet: Email, Password (Forgot password? link right of label, Show toggle), Keep me signed in, Sign in, divider, Continue with Google, "New here? Create a profile", Terms · Privacy. **Forgot password** reuses this layout: title "Reset your password", one email field, "Send reset link", success state with a check and "Check your inbox".

### 8.5 Onboarding · `onboarding`, steps 1–5
Shared header: back, 5-segment progress, "n/5". Each step: ✦ eyebrow, h1, one-line intro, content, bottom CTA (Skip + Continue on optional steps). Save each step as today.
1. **Genotype**: six option rows with a code badge (SS, SC, Sβ⁰, Sβ⁺, AS, ?), name, short note. Below: plum info strip "Suggested starting goal for SS: 3.8 L a day" (from `CLINICAL_GENOTYPES`).
2. **Medicines**: 2-column cards for `PRESET_MEDS` (name + form, ✓ circle), add-your-own field + Add button, custom meds as plum chips with ×.
3. **Triggers**: one row per `PRESET_TRIGGERS` with icon tile, plain label (§5), ✓ circle; add-your-own field.
4. **Water goal**: white card with − / + and a **DropProgress** showing the goal (1–6 L, 0.5 steps), tiles "8 sachets of pure water" and "3.8 1-litre bottles"; reminder frequency pills.
5. **Emergency contact**: name, phone (+234), relationship chips, plum reassurance "We never contact anyone without you pressing a button first." CTA "Finish setup".

### 8.6 Home · `Dashboard.tsx`, `TodaysHealthCard`, `HomeActionHub`, `WaterIntakeTracker`, `UpcomingAppointmentCard`, `HealthTipsWisdom`, `DailyMoodCheckIn`
Top to bottom:
1. **Plum hero** (r36 bottom, ghost mark): mark · EN pill · SOS pill · avatar. Date, "Good morning, Alex", streak pill with ✦. Three glass tiles: Pain (rose number, change vs last), Water (teal number + mini bar), Medicine (taken/total, next time). Tiles link to Log pain / Add water / medicine card.
2. **Check-in card** overlapping the hero by 48 px: "How are you feeling?" with 4 mood pills (Thriving, Good & steady, Exhausted, Pain flare) + "More feelings · add a note" (opens the full existing mood list). Selected = plum fill + ✓. **Choosing "Severe crisis" opens the Emergency screen** in addition to saving.
3. **Quick actions**: four 64 px rounded tiles with labels: Log pain (crimson), Add water (teal), Medicine (plum), Ask Mira (white with crimson ✦).
4. **Weather card** (§8.12).
5. **Today's water**: "4 of 8 sachets", row of 8 sachet tiles (filled teal / soft), buttons + Sachet, + Bottle (one tap, no sheet), More… (opens Add water sheet).
6. **Medicine**: checklist rows, "Mark taken", "Full schedule" link.
7. **Next appointment**: date block (plum) + title + time/place → Care.
8. **Your week**: 7-day pain line, gaps for missing days, "Trends →" History.
9. **Warrior tip**: rose card with ✦ (from `HealthTipsWisdom`).
The other existing widgets (Pain trends, Mood & hydration trends, Care vault, Caregiver widget, Reminders manager, Doctor report) move: trends → History; Care vault/records → Care; Caregiver + reminders → Profile; Doctor report → Care. Keep the components, change where they mount.

### 8.7 Log pain · `SymptomPainCheckIn.tsx`
Full screen on mobile, sheet on desktop. Plum top: close, "How's your pain?", time; **96 px pain number** (rose at ≥ 7) + plain label; 11-button scale (0–10) in the plum block (selected crimson with white ring, lower values tinted coral) replacing the slider (keep the slider's value/state). **SafetyBanner at ≥ 8.** White cards: "Where does it hurt?", "Other symptoms" (presets + custom input, keep Enter-to-add), "Possible triggers (optional)". Teal row "Add water with this check-in +" opens the water sheet in-context. Crimson "Save check-in". After save: toast "Saved. Your history is updated."

### 8.8 Add water · `WaterIntakeTracker.tsx` (shared with Log pain)
Bottom sheet. Mini DropProgress + "Add water" + "2.0 L of 3.8 L today". Three container cards: **Sachet** (50cl), **Bottle** (1 L), **Litres** (0.25 L steps), selected = teal fill. Quantity: − / n× / + and quick pills 1×–5× (max 10). Example line ("3 sachets = 1.5 L"). Summary + big teal total. "Add 1.5 L". Keep existing multiplier logic and storage in litres.

### 8.9 Mira · `ChatWorkspace.tsx`
Plum header (r28 bottom): crimson avatar with white ✦ and online dot (grey + "Offline mode" when offline), name, one-line disclaimer, new-chat and voice-replies buttons; language chips row (English, Yorùbá, Igbo, Hausa, Pidgin). Bubbles: user = plum r22/22/6/22; Mira = white r22/22/22/6 with soft shadow. Mira health replies include the rose red-flag box and action chips (Log this pain, Add water, **Draft appointment** = existing appointment-draft handoff), plus play-aloud. Suggested prompts above the composer. Composer: pill input + crimson hold-to-speak mic. Replace the "Make Mira yours" card with the language chips row.

### 8.10 Care · `CareHub.tsx`
Title + SOS. **Health history** = large plum tile with ghost mark, 30-day pain sparkline and two stat chips → History. **Appointments** card: next appointment + 3-step status bar (Requested ✓ → Clinic confirmed ✓ → Visit) + "+ Request" button. **Medical records** row. **Report for your doctor** rose card with Share / Download (`PatternInsightsDoctorReport`).

### 8.11 Health history · `HealthHistory.tsx`, `RecordedPainChart.tsx`, `RecordedHistoryTimeline.tsx`
Plum top: back to Care, share, title, range segmented control (7 days / 30 days / 3 months), 2×2 glass stats (Average pain, Highest + date, Days logged of range, Water daily avg). White chart card: line with **breaks for missing days**, tinted band for flagged periods (e.g. a rainy week from weather data), highest point labelled. "What showed up most": top 3 symptom bars + pattern sentence with ✦ (only when ≥ 5 entries on each side). Share with doctor / Download CSV. Entries list: pain number tile (sun tint < 4, rose ≥ 4), date, symptoms · triggers · water.

**Fix the crash before restyling.** Guard every access (`history?.symptoms ?? []`), parse dates safely, skip entries with missing/invalid pain, coerce Firestore Timestamps vs ISO strings, give list items stable keys, and wrap chart + timeline in an error boundary that shows "We couldn't draw your chart. Your entries are safe." Move stats into `utils/trends.ts` with unit tests for empty, single, and malformed data.

### 8.12 Weather · new `components/home/WeatherCard.tsx` + `server/weather.ts`
Express route `GET /api/weather?lat&lon` (or `?city=`), key in server env only, 30 min cache. Card: sun-soft bg, location + "now", 36 px temperature + feels-like + condition, condition icon, **max two** ✦ tips from a rules table (hot ≥ 32 °C feels-like; cold/rain ≤ 22 °C; drop ≥ 6 °C vs yesterday; heat + humidity; harmattan dry/dusty Nov–Feb), footer disclaimer. States: skeleton, "Turn on weather tips" (no location), last cached + "Updated 2h ago" (offline), hidden on error.

### 8.13 Community · `Community.tsx`
Title + intro, pill search with icon, city chips (Lagos, Abuja, London, Houston), underline tabs (All, Groups, NGOs, Clinics). First result as a plum feature card (type tag, name, description, Call + Directions). Others as white rows: tinted icon tile (rose = clinic/NGO, teal = group), type · city eyebrow, name, area, 44 px call button.

### 8.14 More · `GamesHub.tsx`
"Learn & play". Plum level card: level circle, XP to next level, coral progress bar, daily-challenge strip with Play. 3×2 tile grid: Academy, Games, Body (Anatomy), Stories (Empathy), Rewards (Progression/skins), Advocacy. Games row: three colour cards (Blood Flow Puzzle crimson, Red Cell Racer plum, Gene Journey teal). Settings list: Profile & health details, Language, Accessibility (text size, colour-blind modes), Help, terms & privacy.

### 8.15 Profile · `UserProfile.tsx`
Plum header with ghost mark, back, Edit, 84 px coral initials avatar, name, role pill + genotype pill. **Health profile** list: Medicines, Triggers, Daily water goal, Emergency contact (each opens the same editor used in onboarding). **Preferences**: language segmented (EN YO IG HA PCM), Dark mode, High contrast, Read Mira's replies aloud, Text size (A / A / A). Account: email, Sign out (crimson). Caregiver widget and reminders manager live here too.

### 8.16 Emergency · `EmergencyButton` target
Plum full screen, works offline from cache. "Works offline" pill, close. "Get help now / You're not alone. Pick one." Crimson **Call 112** card (`tel:112`, white phone disc, glow shadow). Two glass tiles: Call [contact], Share location (SMS with last check-in, **confirm before sending**). Clinic row with Directions. Blush **Medical card**: name, genotype, medicines, last pain. Confirm 112 coverage with the team before launch.

---

## 9. Responsive

- < 768: single column, floating nav, sheets from bottom.
- 768–1279: plum sidebar; content max-width 720; Home hero spans content width with tiles in a row of 3.
- ≥ 1280: content max-width 1080; Home = 2 columns (left: hero, check-in, quick actions, water, medicine; right: weather, appointment, your week, tip). History: stats + chart side by side. Auth screens: plum panel left (illustration/floating cards), form right.

---

## 10. Accessibility

Real buttons/links/inputs with labels; `aria-label` on icon buttons; selected state shown by fill + ✓ or border weight, never colour alone; text ≥ 4.5:1 (every token pair here passes; don't put coral text on white); charts have a text summary and the entries list as alternative; focus ring 2 px plum (white on plum) with 2 px offset; layouts survive 200 % text; reduced motion respected.

---

## 11. Definition of done

- [ ] Logo pack in `public/brand`, favicon + manifest updated, name "Warrior AI" everywhere.
- [ ] Tokens + fonts in CSS and Tailwind; old palette removed; dark + high-contrast work.
- [ ] Primitives restyled and used by every screen; floating nav + SOS replace Emergency HUD / Offline AI buttons.
- [ ] Full flow works: splash → landing (+ demo) → sign up / sign in / forgot → 5 onboarding steps → Home.
- [ ] All copy in §5 replaced; stored values unchanged.
- [ ] Language switch changes the whole UI and Mira; Pidgin present.
- [ ] Health History renders with 0, 1, many and malformed entries; trends, CSV, share work.
- [ ] Weather card with all four states; key never in client bundle.
- [ ] `npm run lint` + `npm run build` pass; regression checklist passes; checked at 360 / 375 / 768 / 1280; online + offline.

# Warrior AI — Logo pack

Approved: **Mark D2** (blood drop with a cut-out four-point spark) + **Wordmark W1** ("Warrior" in Sora ExtraBold + "AI" badge).
The drop stands for blood and care; the spark for Mira, the AI. The spark is cut out of the drop, so the mark works in a single colour.

All SVG text is converted to outlines, so files render correctly without the font installed.

## What's inside

| Folder | Files | Use |
|---|---|---|
| `svg/lockup/` | horizontal + stacked × primary, reverse, black, white | Website header, docs, decks, splash |
| `svg/mark/` | mark in crimson, coral, plum, white, black | Avatars, Mira icon, loaders, small spaces |
| `svg/icon/` | app icon (square + rounded), crimson variant, Android adaptive foreground/background, favicon | App stores, PWA, browser |
| `png/icon/` | app icon 1024, 512, 192, 180, 167, 152, 120, 96, 48; apple-touch-icon; Android foreground 432 | App store / manifest |
| `png/favicon/` + `favicon.ico` | 16, 32, 48 | Browser tab |
| `png/lockup/`, `png/mark/` | @2x transparent PNGs | Anywhere SVG isn't supported |
| `warrior-ai-brand-sheet.png/.pdf` | One-page reference | Share with designers/devs |

**Which lockup:** `primary` on light backgrounds, `reverse` on plum/dark, `black`/`white` for one-colour printing.

## Colours

| Name | Hex | Use |
|---|---|---|
| Crimson | `#C4122F` | Primary brand, mark on light, buttons, the AI badge |
| Coral | `#E8344F` | Mark on plum/dark backgrounds |
| Plum | `#3B0F2C` | Wordmark text, app icon background, dark surfaces |
| Blush | `#F7F2F5` | Light background |
| White | `#FFFFFF` | Surfaces, reversed text |

## Type

- **Sora** (Google Fonts, OFL), ExtraBold 800 for the wordmark, Bold 700 for the badge.
- In the app: Sora for headings, Inter for body text.

## Rules

- **Clear space:** keep at least the height of the AI badge free on every side.
- **Minimum size:** horizontal lockup 120 px wide; mark 16 px.
- **Don't:** stretch, rotate, outline, add shadows or gradients, recolour outside this palette, put the coral mark on crimson, or retype the wordmark in a live font (use the files).

## Web snippet

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#3B0F2C">
```

PWA `manifest.json` icons: `app-icon-192.png` and `app-icon-512.png`, `background_color` `#3B0F2C`.

# Coinstash Reel Studio

A tiny, framework-free web app for producing **branded, animated comparison
charts** — Bitcoin vs any other asset — sized **9:16 (1080×1920)** for Instagram
Reels and Stories. Pick a comparison, tweak the data and copy, hit **Record
mode**, and screen-record a clean, chrome-free 9:16 stage.

Styled with the [Coinstash design system](https://design.coinstash.com.au):
brand palette, logos, and typography.

## Quick start

No build step. It's static HTML/CSS/JS.

```bash
# open directly…
open index.html            # macOS (or just double-click)

# …or serve locally (recommended, so fonts + logos load over http)
npx serve .                # then visit the printed URL
python3 -m http.server 8080
```

## Deploy

Any static host works. **Vercel** (zero config — `vercel.json` is included):

```bash
npm i -g vercel
vercel            # preview
vercel --prod     # production
```

Or drag the folder into Netlify, or enable GitHub Pages on this repo.

## How to make a reel

1. **Comparison** — choose a preset (Bitcoin vs Apple / AMD) or **Custom**.
2. **Data** — paste two number series (comma/space separated). Both start at
   `100` and should have the same number of points. The source data has no
   dates, so the x-axis defaults to *Observation #* (switch to *Year* if you
   prefer).
3. **Text / Style** — set the title, subtitle, handle, theme, scale, and
   animation length.
4. Click **Record mode**. The editor disappears and the 9:16 stage fills the
   window (optionally after a 3-2-1 countdown).
5. Screen-record the window:
   - **macOS:** `Cmd+Shift+5` → record the window/region, or QuickTime.
   - **Windows:** `Win+G` (Xbox Game Bar) or the Snipping Tool recorder.
   - **iOS/Android:** open the deployed URL in the browser and use the OS
     screen recorder.
   - Press **Space** to replay, **Esc** to exit.
6. Import the clip into Instagram as a Reel. The stage is already 9:16, so no
   cropping is needed.

> Tip: **Linear** scale makes Bitcoin's growth tower dramatically; **Log** scale
> keeps both lines readable when the gap is huge.

## Project structure

```
index.html                 # the app shell + editor form
assets/css/style.css       # layout, editor, record-mode styles
assets/js/brand.js         # Coinstash palette, themes, preset datasets
assets/js/chart.js         # ReelChart — the SVG animation engine
assets/js/app.js           # form wiring, presets, record mode
assets/brand/*.svg         # official Coinstash logos
vercel.json                # static deploy config
```

## Branding notes

- **Colours** come straight from the Coinstash design system (Purple Bright
  `#5C5BD5`, Purple Dark `#373184`, Coral `#FF7262`, etc.) — see
  `assets/js/brand.js`.
- **Typography:** the brand face is **PP Telegraf** (commercial). This app ships
  with **Space Grotesk** (free, from Google Fonts) as a close geometric-grotesque
  stand-in. To match the brand exactly, add the licensed PP Telegraf web-font
  files under `assets/fonts/`, register them with an `@font-face` block in
  `style.css`, and PP Telegraf is already first in the `--font` stack.
- **Logos** are the official Coinstash SVGs in `assets/brand/`.

## Adding more comparisons

Add entries to `COINSTASH.presets` in `assets/js/brand.js`:

```js
{ id: 'nvidia', name: 'Nvidia', asset: [100, /* 11 values, start = 100 */ ] }
```

The shared Bitcoin series lives in `COINSTASH.BITCOIN`.

## Compliance

A "not financial advice / past performance" disclaimer is shown on every chart
and is editable in the sidebar. Keep it on for public content.

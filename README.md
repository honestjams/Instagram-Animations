# Coinstash Reel Studio

A framework-free web app for producing **branded, animated comparison charts** —
Bitcoin against any number of other assets — sized **9:16 (1080×1920)** for
Instagram Reels and Stories. Edit the data, preview live, then **record** or
**export a video**.

Styled with the [Coinstash design system](https://design.coinstash.com.au):
brand palette, logos, and typography.

## Features

- **Multiple named series** — compare Bitcoin against one asset or many at once,
  each with its own name and colour.
- **Per-series logos** — upload a logo per series (the **IMG** box on each row);
  it rides the front of that line as a circular badge and is baked into exports.
- **Invert a series** — the per-row **Invert** toggle mirrors a series below the
  baseline into negative territory, turning a rising quantity into a falling
  "cost" (e.g. compare a rising Bitcoin investment against a negative running
  cost). Reads most clearly in **% increase** mode (starts at 0, goes negative).
- **Percentage-increase framing** — figures read as `+X%` growth since the start
  (also switchable to multiple `×`, dollars `$`, or raw index).
- **Dynamic zoom** — the chart starts tight and zooms out as values grow, for a
  dramatic reveal.
- **Instagram safe zones** — content is padded inside the Reel-safe area; an
  optional guide overlay shows the bounds.
- **Legible values** — live value labels sit in pills on top of the lines.
- **One-click video export** — records the animation to a video file
  (MP4 where the browser supports it, otherwise WebM).
- **Deep customisation** — theme, linear/log scale, line thickness, glow, grid,
  dots, x-axis as observations or years, animation draw/hold timing, and toggles
  for the logo, handle, and disclaimer.

## Quick start

No build step. Static HTML/CSS/JS.

```bash
open index.html            # or double-click
npx serve .                # or serve locally over http (recommended)
```

## Deploy

Connected to **Vercel** (zero-config static; `vercel.json` included). Every push
to the production branch auto-deploys. Any static host also works (Netlify,
GitHub Pages).

## Make a reel

1. **Comparison** — pick a preset or **Custom**.
2. **Series** — edit each series' name, colour, and numbers (comma/space
   separated, indexed to `100` at the start). **+ Add series** for more lines.
   Series are trimmed to the shortest length so they share one timeline.
3. **Text / Values / Chart / Style / Timing** — tune the copy, figure format,
   theme, scale, and animation.
4. Either:
   - **Record mode** → clean 9:16 stage → screen-record the window
     (`Cmd+Shift+5` mac / `Win+G` win). Space = replay, Esc = exit.
   - **Export video** → downloads a video file directly.
5. Drop it into Instagram — already 1080×1920, no cropping.

### Export format note

`MediaRecorder` outputs **MP4** in Safari (and recent Chrome) and **WebM** in
most Chrome/Firefox builds. Instagram wants MP4/MOV, so for a guaranteed
Instagram-ready file, export in **Safari**, or use **Record mode** + a screen
recorder (which always yields MP4/MOV). WebM imports fine into CapCut, Premiere,
DaVinci, etc. if you'd rather convert.

## Project structure

```
index.html                 # app shell + editor
assets/css/style.css       # layout, editor, record-mode styles
assets/js/brand.js         # Coinstash palette, themes, preset datasets
assets/js/logos.js         # generated: logos as data URIs (for canvas)
assets/js/chart.js         # ReelChart — Canvas2D animation + video export
assets/js/app.js           # editor wiring, presets, record/export
assets/brand/*.svg         # official Coinstash logos
vercel.json                # static deploy config
```

The renderer is **Canvas2D** (not SVG) so exported video has correct fonts and
the frame can be captured via `canvas.captureStream()`.

## Branding

- **Colours** from the Coinstash design system (Purple Bright `#5C5BD5`, Purple
  Dark `#373184`, Coral `#FF7262`, Mint `#B2FFBE`, Pine `#527658`, Umber
  `#C46751`) — see `assets/js/brand.js`.
- **Type:** the licensed brand fonts ship with the app in `assets/fonts/` —
  **PP Telegraf** for headings/figures (title, leading value labels, legend
  figures, handle) and **FK Grotesk Neue** for body (subtitle, axes, legend
  names, disclaimer). They're declared via `@font-face` in `style.css`
  (`--font-head` / `--font-body`) and referenced on the canvas through the `FH`
  (heading) and `FB` (body) constants in `chart.js`; `ReelChart.ready()`
  preloads the exact faces so exported video renders with the brand type.

## Adding comparisons

Add to `COINSTASH.presets` in `assets/js/brand.js`:

```js
{
  id: 'gold', title: 'Bitcoin vs Gold',
  subtitle: '% increase since 2016 · indexed to 100',   // optional
  startYear: 2016,                                      // optional
  scale: 'log',                                         // optional
  series: [
    { name: 'Bitcoin', values: COINSTASH.BITCOIN.slice() },
    { name: 'Gold',    values: [100, /* …, indexed to 100 */ ] }
  ]
}
```

Optional preset fields, all applied when the preset is selected. Omit any and
the editor keeps whatever you already have set:

| Field | Effect |
| --- | --- |
| `subtitle` | Overrides the subtitle copy |
| `startYear` | Sets the first x-axis year and switches **X-axis** to *Year* |
| `scale` | `'linear'` or `'log'` |
| `series[].invert` | Pre-ticks **Invert** on that series row |

**Every series in a preset must start at the same year.** Series are trimmed to
the shortest series, so mixing a 2016-based line with a 2020-based one silently
truncates the whole chart. Presets with a later base (`altcoins` 2018, `lego`
2017) are kept separate for this reason.

Most presets set `scale: 'log'` because Bitcoin's index reaches ~13,500 while
everyday items top out near 175 — on a linear axis the slower lines flatten
onto the baseline.

### Data provenance

Crypto, stocks and benchmarks are computed from daily closes; stocks and indices
are split- and dividend-adjusted, so they are total return rather than share
price. Everyday Australian items are built from ABS CPI category sub-indices.
The `collectibles` preset contains **modelled years** interpolated between real
sales, and its subtitle says so — keep that visible and extend the disclaimer
rather than relying on "past performance" alone.

If you regenerate or replace the logos in `assets/brand/`, rebuild
`assets/js/logos.js` (it embeds them as data URIs so they can be drawn onto the
canvas and survive video export).

## Compliance

A "not financial advice / past performance" disclaimer shows on every chart and
is editable. Keep it on for public content.

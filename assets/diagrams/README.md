# Diagrams

Detailed architecture, flow, and strategy diagrams authored in [draw.io](https://www.drawio.com/)
and rendered live on depth pages (case study entries, Case Studies, Design, and the
Design System demo). Never on Home, Resume, or Portfolio.

## Files

Every diagram is a pair, always committed together:

| File | Purpose |
|---|---|
| `<slug>.drawio` | Editable source. Save uncompressed (File > Properties > uncheck "Compressed"). |
| `<slug>.svg` | Static export. The default on the page and the fallback when the live viewer can't load. |

- **Slug:** lowercase kebab-case describing the content, e.g. `onboarding-flow`, `pricing-model-map`.
- Diagrams live in this folder only. No Google Drive or other external links.

## Export settings (File > Export as > SVG)

- **Include a copy of my diagram: ON**, so the SVG stays re-editable in draw.io.
- Zoom 100%, border width 10.
- Background: white (not transparent). The page frame is always light, in both site themes.
- Appearance: **Light**. Dark-adaptive colors would flip inside a dark page.
- Text: leave "Embed fonts" off; the palette below uses Helvetica/Arial.

## Canvas and style

- Canvas width: **1600px maximum**. Aim for about 1000–1200px so labels stay readable on laptops.
- Font size 13–15px for labels, bold only for decisions and the one step that matters.
- Lines 2px, block arrowheads, orthogonal rounded connectors.
- Put notes that aren't part of the diagram itself on a second layer named `Annotations`, so readers can toggle them.
- Never encode meaning by color alone. Pair color with a label, a dashed line, or a shape.

## Palette (matches the site's light-theme tokens)

| Role | Hex |
|---|---|
| Text | `#0B1220` |
| Secondary text / de-emphasized strokes | `#55617A` |
| Default stroke | `#3B475C` |
| Default fill | `#FFFFFF` |
| Soft fill (decisions, groups) | `#E9EEF8` |
| Accent (one key element per diagram) | `#2447E0` |
| Accent dark (accent borders) | `#15289A` |
| Teal (second category, sparingly) | `#0E8A82` |
| Violet (third category, sparingly) | `#6D3AE0` |
| Page background | `#FFFFFF` |

## Confidentiality

Diagrams must be conceptual or based on public information. Never depict a specific client
or employer system: no service names, thresholds, configuration, or architecture specifics
unless they have been cleared in writing for publication.

## Every diagram needs a text description

The live viewer is not reliably screen-reader friendly. Each figure carries a caption and a
**Text description** that states the full meaning in prose. A reader who never sees the
diagram must still get everything it says.

## Page markup

Paths are relative to the page. From a page in `pages/`:

```html
<figure class="diagram" data-drawio="../assets/diagrams/<slug>.drawio">
  <div class="diagram-canvas">
    <img class="diagram-static" src="../assets/diagrams/<slug>.svg"
         alt="Short description" width="1022" height="315" loading="lazy">
  </div>
  <figcaption>Caption</figcaption>
  <details class="diagram-text"><summary>Text description</summary>
    <p>Full description in prose.</p>
  </details>
  <p class="diagram-links"><a href="../assets/diagrams/<slug>.svg">Open full-size SVG</a></p>
</figure>
```

Set `width` and `height` on the `img` to the SVG's own size. The canvas uses that ratio, so the
live upgrade causes no layout shift. From `pages/entries/`, use `../../assets/diagrams/...`.

## How it loads

`js/visuals.js` does nothing, and makes no network request, unless the page has a
`figure[data-drawio]`. When the first diagram comes within about 200px of the viewport it loads
the draw.io viewer once from `viewer.diagrams.net`, then upgrades each figure in place (zoom,
layers, lightbox; editing disabled). The static SVG stays in the DOM and returns if the viewer
fails, times out (about 6 seconds), is blocked, or the visitor has Data Saver on. Print always
uses the static SVG.

## Checklist before committing

1. `<slug>.drawio` and `<slug>.svg` both exist and match.
2. The SVG was exported with "Include a copy of my diagram".
3. The `img` has `alt`, `width`, `height`, and `loading="lazy"`.
4. The figure has a caption and a full text description.
5. Nothing in it identifies a client or employer system unless cleared for publication.

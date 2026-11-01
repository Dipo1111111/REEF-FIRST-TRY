# Design
<!-- impeccable:design -->
## World
Bathymetric survey. The page is a depth chart of one session: pale sea-glass at the surface, a dark shelf where the cost is shown, back to daylight for the mechanism, then the abyss for install. Contour lines, hairline rules, and measured figures carry the identity. It is a working instrument, not a brochure.

## Palette
| Token | Value | Use |
|---|---|---|
| `--sea-0` | #f1f4ee | surface band, page ground |
| `--sea-1` | #e3eae1 | inset panels on light |
| `--ink` | #06201a | text and fills on light |
| `--ink-70` | #3a5850 | secondary text on light |
| `--shelf` | #0c2a24 | dark band |
| `--abyss` | #040f0d | terminal and install band |
| `--bone` | #e9efe6 | text on dark |
| `--coral` | #ff5b35 | single accent: actions, the mark, the reduced set |
| `--phos` | #84f0c0 | terminal status only |

Coral appears at most twice per viewport. It never fills a large surface.

## Type
- Display and body: **Archivo** variable (wdth 62-125, wght 100-900). Headlines at weight 800, width 108, tracking -0.035em.
- Data, code, labels: **IBM Plex Mono** 400/500. Mono is used for identifiers, counts, commands, and table figures only.

## Layout
12-column grid capped at 1240px. Bands alternate surface, shelf, surface, shelf, abyss. Hairline rules instead of cards. The hero terminal overlaps the band boundary by 72px on desktop, which ties the two halves together. Comparison data is a real two-row figure, not a stat strip.

## Motion
One gesture: content rises 14px and fades on entry, staggered by 60ms. The 15 tool slots settle into 2 on reveal. Nothing loops, nothing parallaxes. All of it is disabled under `prefers-reduced-motion`.

## Browser surfaces
Coral text selection on ink, themed focus rings at 2px coral with 3px offset, custom scrollbar in ink on bone, tabular numerals in every figure, underline offsets on inline links.

## Refused
No eyebrow above headings, no gradient text, no glass, no icon cards, no hard offset shadows, no section numbering except the four loop layers where build order is real information, no monospace as decoration.

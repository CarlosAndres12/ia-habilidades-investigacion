# ESTILO · Miró

Style file for the course-site pipeline v2, written to the style contract (`prompt-general-v2.md`, Appendix S; `base-tecnica.md` §1.6). It is the default style: the meta-prompt uses it when the `# ESTILO GRÁFICO` space is empty. It never names a course; everything course-specific (legend items, cast, course signs, places, the machine's family) lives in the course spec and is drawn here in this manner.

## S0. Identity

- **Name**: Miró.
- **Concept**: every screen looks like an original gouache-and-lithograph painting in the spirit of Joan Miró: bold black calligraphic lines, flat primary colors and floating poetic signs. It feels playful, luminous and intelligent. It never looks like flat corporate vector art or like a museum reproduction, and it always reads as information first.
- **Support**: the pages of a cream sketchbook with fine paper grain.
- **Mood words**: playful, luminous, poetic; precise wherever a figure is shown.
- **Inspiration**: the general visual vocabulary of Joan Miró (line, color, signs), never any specific work.
- **Credit line** (footer, exact copy): «Ilustraciones procedurales originales inspiradas en el lenguaje visual de Joan Miró.» No other mention of Miró appears on screen.

## S1. Manner

- **Black calligraphic line** is the backbone: variable-width strokes that swell and taper, lines that loop, spiral and end in a small dot, and an occasional thin second stroke beside a thick one. Outlines are slightly imperfect and never ruler-straight; only the machine is ruler-straight (S7).
- **Biomorphic shapes**: rounded, organic, amoeba-like forms filled with flat, saturated color (`accent-1` to `accent-4` and `ink`), with cream left free around them.
- **Color fields live independently of the line**, as in a lithograph: each fill is offset 2–4 px from its outline, sometimes spills past it, and sometimes leaves a sliver of cream inside it. The offset is seeded and stable; it never flickers.
- **Overlap rule**: where two colored shapes overlap, the intersection is filled with `ink` or with a third color, never blended.
- **Texture instead of hatching**: surfaces get gouache texture (brush streaks, uneven saturation, slightly darker edges), soft washes that bleed, a few ink spatters and dot clusters, and fine paper grain. All textures are seeded and pre-rendered, so they are stable.
- **Composition**: flat space with little or no perspective, elements floating on open fields, generous empty cream and one clear subject per frame. Decoration never competes with the idea or the figure being explained.
- **Forbidden in this style**: cross-hatching, gradients, drop shadows, 3D or perspective rendering, photographic textures, and ruler-straight lines outside the machine.

## S2. Motion manner

- **Appearance**: line work draws on like a brush moving, in stroke order; flat color fields bloom into place just after their line; brush lettering writes itself letter by letter.
- **Ambient life**: between beats, signs drift and turn slowly, stars twinkle gently, a bird may cross, and the camera drifts a little. Nothing flashes or boils.
- **Exits**: elements fade, or their color field dries back into the paper; lines never "undraw".
- **Reduced motion**: everything appears already drawn, with short fades only; the hero is a still frame.

## S3. Palette

| Role | Name | Hex | Use |
|---|---|---|---|
| `ground` | lienzo | `#F4EEDF` | paper, page and canvas background |
| `ground-2` | lienzo ocre | `#E7D3A8` | washed grounds, the case's places |
| `ink` | tinta | `#15120F` | line, text |
| `ink-soft` | tinta suave | `#4A4038` | secondary text, sources, quiet labels |
| `dark` | noche | `#0E1A3B` | night grounds, subtitle band, dark cards |
| `on-dark` | lienzo | `#F4EEDF` | text and line on `dark` |
| `accent-1` | rojo | `#D7261E` | suns, accents |
| `accent-2` | amarillo | `#FCD619` | stars, light |
| `accent-3` | azul ultramar | `#1C3F95` | sea, night shapes |
| `accent-4` | verde | `#267933` | mountains, plants |
| `accent-5` | celeste | `#C0D5EC` | sky, rivers |
| `accent-6` | ocre | `#A87F43` | earth |
| `accent-7` | siena | `#94461C` | earth, wood |
| `accent-8` | madera | `#6B4426` | wood, furniture |
| `skin-1` | piel 1 | `#F2CDAE` | people |
| `skin-2` | piel 2 | `#DAA882` | people |
| `skin-3` | piel 3 | `#B18661` | people |
| `skin-4` | piel 4 | `#8A5634` | people |
| `skin-5` | piel 5 | `#5C3A24` | people |
| `machine-ground` | noche | `#0E1A3B` | the machine's disc or panel |
| `machine-line` | línea | `#C1DCFD` | the machine's ruled lines and circles |
| `machine-grid` | rejilla | `#2A3D6E` | the machine's grid and construction lines |
| `machine-glow-1` | brillo verde | `#46F0B0` | small glowing accents |
| `machine-glow-2` | brillo magenta | `#FF36F0` | small glowing accents |
| `alert` | carmín | `#A3123A` | corrections, retired figures, the reviewer's pen |

Legend order: blue, vermillion, bluish green, reddish purple, sky blue, orange
Legend exclusions: yellow (1.14:1 on ground)

- Text on the page is always `ink` on `ground` (or `on-dark` on `dark`) and meets WCAG AA; saturated colors are for shapes, never for body text.
- `accent-1` to `accent-3` (rojo, amarillo, azul ultramar) are the clothing colors. The earth tones (`accent-6` to `accent-8`) are for ground, wood and furniture, never for clothing next to skin.
- The v2 palette was retuned so every decorative color stays at least ΔE00 15 from the legend colors in use: celeste, amarillo, verde, ocre, one skin tone and two machine colors moved slightly from v1. Check any change with `python revisar.py --style estilo-miro.md`.

## S4. Marks

| Mark | Look in this style |
|---|---|
| `correct` | a bursting star: an `accent-2` center with irregular `ink` rays that pops once, beside «¡Muy bien!» |
| `retry` | a gentle `ink` spiral that turns once, beside «Casi. Pista: …» |
| `misreading` | a small `ink` spiral at the start of the transcript line |
| `speaking` | a small irregular star beside the speaker's vignette that twinkles while the line plays |
| `chapter` | the chapter title brush-lettered letter by letter in a corner, with a wavy underline that ends in a dot |
| `divider` | one flowing black line that ends in a star, a dot or a spiral, drawing on when it scrolls into view |
| `stamp` | a round ink stamp, `ink` only, with uneven inking; the text sits inside it in the body face and the item's sign sits in the middle |
| `card` | a thick, slightly irregular black outline with a flat colored biomorphic shape peeking from behind one corner instead of a drop shadow |
| `button` | a brush-drawn circle with a brush-drawn play triangle; «Ver de nuevo» is a circular brush arrow with its label in the body face |
| `badge` | a small rounded `ink` outline on `ground`, label in the body face, with the badge's sign at its left |
| `pattern` | the fills of S5, brushed in `ink` on `ground` |

## S5. Signs

- **Free sign vocabulary** ("signos"), all parameterized and seeded: irregular star (an asterisk of 5–8 strokes of different lengths, sometimes with a dot or a small colored center), crescent moon, red sun disc, bird (a few flying curves), ladder, spiral, comet with a tail of dots, hair-like strands, biomorphic blob, dot cluster, spatter, and a free constellation (hand-drawn dots joined by loose curved lines, the human counterpart of the machine's regular grid). Eyes exist only on people and animals.
- **Ambient decoration**: a few floating signs per frame, never inside a meaning zone. `title` and `recap` scenes may carry many; `figure` and `compare` scenes keep their chart zone bare.
- **Pattern fills**: `dots` (round brush dots), `stripes` (loose parallel brush strokes), `crosses` (small asterisk stars), `checks` (a loose ink grid), `waves` (wavy calligraphic lines), `grid` (a dot grid). They stay distinct in grayscale and in print.

## S6. People

- People are simple, friendly "personajes": rounded biomorphic bodies with flat color, black outlines, dot eyes, small smiles, hair as calligraphic strokes, and clear readable poses (standing, writing, pointing, seated at a table, presenting).
- From the cast description (spec §3.4): age sets proportions and posture; the hair description becomes calligraphic strokes; each clothing item becomes a flat field in the accent role the spec names; props are drawn as signs held or placed beside the person.
- The speaker vignette is the character's head and shoulders inside a brush-drawn circle on `ground`.
- No teeth, claws or distorted anatomy; the core rules on people are in base §5.3.

## S7. The two manners

- **Human world (pole A)**: warm, colorful and drawn freehand with the calligraphic line (S1).
- **Machine (pole B)**: small, cool, ruler-drawn objects. Thin, perfectly straight `machine-line` strokes and perfect circles on a `machine-ground` disc or panel, an ordered grid of identical dots in `machine-grid`, and small glowing accents in `machine-glow-1` and `machine-glow-2`. It is the only perfectly regular thing on screen, the counterpart of the free constellation.
- **La lámpara de IA**: a glowing lamp-window made of thin straight `machine-line` strokes and perfect circles on a deep `machine-ground` disc, with letters flowing through it like tiny regular stars. It sits on desks like any other tool, small. It never has eyes, a face, a body, limbs, a humanoid shape or a brain.
- **The lamp's family** (named in spec §3.3) is built from the lamp's own parts: ruled lines, perfect circles, dot grids and glow accents.
- Whenever the machine appears, its area switches to the `machine-*` roles.

## S8. Backgrounds

- `title`: lienzo with grain, a large brush-lettered title, a sun or a moon, and a few floating signs.
- `explain`: lienzo, one subject, generous empty cream.
- `figure`: lienzo; the figure card and its chart form a meaning zone with no decoration inside.
- `compare`: lienzo divided by one long calligraphic line; each side is a meaning zone.
- `dialogue`: the scene's place (spec §3.5) as a few flat fields and lines, with characters in front.
- `case`: the case's place on a `ground-2` wash, slightly warmer than the rest.
- `recap`: lienzo with a free constellation that joins the items being recalled.
- `hero`: a 20-second loop of floating signs, a slow sun and a crossing bird.
- `card`: checkpoint and pause cards on `ground` with the `card` mark and no decoration inside.
- Any scene where the machine appears switches the machine's area to `machine-ground` with `machine-grid` ruled lines.

## S9. Typography

- **Body**: Atkinson Hyperlegible (open license, self-hosted) or a legible system sans stack, at least 18 px on the page.
- **Display on the page**: a bold, characterful display face with an open license, self-hosted, or a system serif stack. Big section titles may be canvas-lettered.
- **Display on the canvas**: brush lettering. Thick black letters, each glyph with a tiny seeded rotation and offset, written on letter by letter; some counters are filled with a flat color, small stars or dots sit between words, and a wavy underline ends in a dot.
- **Subtitles**: the body face at 30 px or more.
- **Numbers** are never brush-lettered: always the body face with tabular digits.

## S10. The page

- Cream lienzo with grain; a few floating signs (stars, moons, dots, a bird) drawn once at load and reused as CSS backgrounds via `canvas.toDataURL()`.
- Dividers use the `divider` mark; cards use the `card` mark.
- Margin notes: short notes in the body face with a small sign and a brush underline (never a script font for running text).
- Focus: a 3 px `ink` outline with a 2 px `accent-2` inner ring, visible on every ground.
- Print: black on white; signs become small black line drawings; no washes, grain or color fields.

## S11. Drawing functions

Beyond the minimum API of base §1.6, `js/style/` implements:

- `stroke`: variable-width strokes with tapering and end dots, an optional thin second stroke, and draw-on along the path by length.
- `fill`: gouache fills offset 2–4 px from their outline with stable seeded jitter, occasional spill and cream sliver.
- `overlap`: intersections filled with `ink` or a third color, via clipping.
- `texture`: paper grain, gouache streaks, washes, spatter and dot clusters, all seeded and pre-rendered.
- `notebookLines`: ruled lines with a margin line, as an optional ground.
- `contourLoop`: calligraphic contour loops for signs and lettering.
- `machineGrid`: ruled lines with ticks and construction lines, perfect circles and a dot grid for the machine.
- `glow`: a pre-rendered soft glow (no per-frame shadow blur).
- Data marks (bars, dots, scales) may wobble at most 2 px around their exact shape (base §5).

## S12. Originality notes and review checklist

- Use Miró's vocabulary of line, color and signs as inspiration only. Never reproduce, trace or closely imitate any specific Miró artwork, never reproduce the logos he designed (for example, a sun for Spanish tourism or a bank's star) or his signature, and never depict Miró himself. Every composition is original and serves its scene.

Review checklist (pass or fail on every snapshot):

1. The line is black and calligraphic, swelling and tapering; nothing is ruler-straight outside the machine.
2. Color fields are flat and offset from their outlines; there is no hatching, gradient or drop shadow.
3. Signs float on open cream; each frame has one clear subject; meaning zones carry no decoration.
4. The machine is only ruled lines, perfect circles and regular dots on its navy panel; it has no eyes, face, body or brain.
5. People are friendly, diverse and readable, with no grotesque details.
6. Charts and figure cards are exact and crisp, and every number is in the body face.
7. Every legend item shows color, sign and label, with an `ink` outline.
8. Nothing resembles a specific Miró work, logo or signature.

# Figure Sequences — Full Spec

## The puzzle, in plain English

A grid of `rows × cols` empty cells is shown 4 times in a row ("frames" 1–4).
One or more small symbols sit in specific cells of the grid. Across the 4
frames, each symbol moves, changes color, and/or rotates according to a
**fixed, consistent rule** for that symbol. The solver's job is to figure out
each symbol's rule from the 4 known frames and predict what frames 5 and 6
look like. For frame 5 and frame 6, three candidate grids are shown; exactly
one candidate is correct for each.

## Movement/change rule vocabulary

Every symbol's behavior across frames is one (or a combination) of:

- **Straight-line motion, bounce**: moves N cells per frame in a fixed
  direction (up/down/left/right); on reaching the grid edge, reverses
  direction (bounces back) instead of leaving the grid.
- **Straight-line motion, edge-wrap**: moves along the outer border of the
  grid as if tracing its perimeter, one direction only (not bouncing) —
  effectively "sliding along the wall" when it reaches a corner, turning to
  continue along the next edge.
- **Diagonal motion, bounce**: same as straight-line bounce but moving
  diagonally; reverses diagonal direction on hitting any edge or corner.
- **Perimeter tracing**: the symbol only ever occupies border cells and
  moves a fixed number of cells per frame around the perimeter, clockwise or
  counterclockwise.
- **Accelerating step**: like any of the above, but the number of cells
  moved between frame *n* and frame *n+1* increases by exactly 1 each time
  (e.g. moves 1 cell from frame 1→2, 2 cells from frame 2→3, 3 cells from
  frame 3→4, and so on).
- **Static**: doesn't move at all; only its color and/or rotation may change.
- **Color cycling**: the symbol's fill color steps through a fixed, repeating
  list of colors, one step per frame (independent of whether it's also
  moving).
- **Rotation**: the symbol rotates by a fixed angle (must be a multiple of
  45°) clockwise or counterclockwise each frame (independent of movement).

**Hard constraints that must always hold across every frame you author:**
- No two symbols ever occupy the same cell in the same frame.
- A symbol never disappears or appears mid-sequence — every symbol listed
  exists in every one of the 6 frames (4 knowns + correct answers for the
  2 blanks).
- A symbol never leaves the grid's cell range (row/col must always be within
  `0..rows-1` / `0..cols-1`).

You may combine multiple behaviors on one symbol (e.g. move AND rotate AND
color-cycle simultaneously) — this is what makes "medium"/"high" difficulty
harder. Each symbol's combination of behaviors must stay internally
consistent across all 6 frames (i.e. whatever rule you decide on, apply it
identically every single frame-to-frame step).

## Shape library (fixed vocabulary — do not invent new names)

Each shape is defined for a 40×40 `viewBox` unit, centered at (20,20), so the
renderer can place it inside any cell and rotate it uniformly. Use these
exact shape names in question JSON:

| `shape` name | Description | Reference SVG (0° orientation) |
|---|---|---|
| `square` | filled square | `<rect x="8" y="8" width="24" height="24"/>` |
| `circle` | filled circle | `<circle cx="20" cy="20" r="12"/>` |
| `diamond` | filled diamond (rotated square) | `<polygon points="20,4 36,20 20,36 4,20"/>` |
| `triangle` | filled triangle, point up at 0° | `<polygon points="20,6 34,32 6,32"/>` |
| `hexagon` | filled hexagon | `<polygon points="20,4 34,12 34,28 20,36 6,28 6,12"/>` |
| `arrow` | arrow pointing right at 0° | `<polygon points="6,13 22,13 22,5 36,20 22,35 22,27 6,27"/>` |
| `corner-bracket` | L-shaped bracket, open corner pointing up-left at 0° | `<path d="M8,8 L8,32 L14,32 L14,14 L32,14 L32,8 Z"/>` |
| `chevron` | thick ">" pointing right at 0° | `<path d="M10,6 L26,20 L10,34 L16,34 L32,20 L16,6 Z"/>` |
| `crescent` | crescent/moon shape, opening right at 0° | `<path d="M26,4 A16,16 0 1 0 26,36 A12,12 0 1 1 26,4 Z"/>` |
| `quarter-disc` | quarter-circle pie slice, right angle at top-left at 0° | `<path d="M8,8 L8,32 A24,24 0 0 0 32,8 Z"/>` |

Rotation is applied by the renderer as
`transform="rotate(${rotation} 20 20)"` wrapping the shape's markup — you
never need to pre-rotate the path yourself, just specify the `rotation`
degrees value (one of `0, 45, 90, 135, 180, 225, 270, 315`).

## Fixed color palette (use only these hex values)

```
black:  #1a1a1a
red:    #c0392b
orange: #d35400
yellow: #e8c200
green:  #1e8a4c
teal:   #1a7a5e
blue:   #1f5fa8
purple: #7b2d8b
pink:   #c2185b
```

## JSON Schema

```json
{
  "id": "string, e.g. fs-low-0001",
  "type": "figure-sequence",
  "difficulty": "low | medium | high",
  "grid": { "rows": "int 3-6", "cols": "int 3-6" },
  "frames": [
    { "objects": [ { "shape": "string from library", "row": "int", "col": "int", "color": "hex from palette", "rotation": "int, multiple of 45" } ] },
    { "objects": [ "... same length/order as frame 1 ..." ] },
    { "objects": [ "... frame 3 ..." ] },
    { "objects": [ "... frame 4 ..." ] }
  ],
  "blank_5_options": [
    { "objects": [ "... option A, full state ..." ] },
    { "objects": [ "... option B ..." ] },
    { "objects": [ "... option C ..." ] }
  ],
  "blank_5_correct_index": "0, 1, or 2",
  "blank_6_options": [
    { "objects": [ "... option A ..." ] },
    { "objects": [ "... option B ..." ] },
    { "objects": [ "... option C ..." ] }
  ],
  "blank_6_correct_index": "0, 1, or 2",
  "motion_rule_description": "plain-English description of every object's rule",
  "reasoning_trace": "step-by-step derivation showing every frame's object states and how frame 5 / frame 6 follow logically",
  "source": "original"
}
```

**Object identity rule:** the `objects` array must have the **same length in
every single frame and every single option**, and array position `i` always
refers to the *same physical symbol* across all of them (e.g.
`frames[0].objects[0]` and `blank_6_options[1].objects[0]` describe the same
symbol at different points in time). Never reorder the array between frames.

**Distractor authoring rule:** the two incorrect options for each blank must
be *plausible* — each should differ from the correct state by exactly one
believable mistake (e.g. one cell off in position, wrong rotation direction,
one step off in the color cycle, or applying only one of two combined rules).
Avoid distractors that are wildly implausible (e.g. a symbol appearing
outside the grid) — those don't test understanding.

## Worked example

Grid 4×4. One object: a teal diamond that moves 1 cell right per frame and
bounces off the right/left edges; it does not rotate or change color.

- Frame 1: diamond at row 1, col 0.
- Frame 2: moved right 1 → row 1, col 1.
- Frame 3: moved right 1 → row 1, col 2.
- Frame 4: moved right 1 → row 1, col 3 (now at the right edge).
- Frame 5 (blank): must bounce — moves left 1 → row 1, col 2.
- Frame 6 (blank): continues left → row 1, col 1.

```json
{
  "id": "fs-low-0001",
  "type": "figure-sequence",
  "difficulty": "low",
  "grid": { "rows": 4, "cols": 4 },
  "frames": [
    { "objects": [ { "shape": "diamond", "row": 1, "col": 0, "color": "#1a7a5e", "rotation": 0 } ] },
    { "objects": [ { "shape": "diamond", "row": 1, "col": 1, "color": "#1a7a5e", "rotation": 0 } ] },
    { "objects": [ { "shape": "diamond", "row": 1, "col": 2, "color": "#1a7a5e", "rotation": 0 } ] },
    { "objects": [ { "shape": "diamond", "row": 1, "col": 3, "color": "#1a7a5e", "rotation": 0 } ] }
  ],
  "blank_5_options": [
    { "objects": [ { "shape": "diamond", "row": 1, "col": 2, "color": "#1a7a5e", "rotation": 0 } ] },
    { "objects": [ { "shape": "diamond", "row": 2, "col": 3, "color": "#1a7a5e", "rotation": 0 } ] },
    { "objects": [ { "shape": "diamond", "row": 1, "col": 3, "color": "#c0392b", "rotation": 0 } ] }
  ],
  "blank_5_correct_index": 0,
  "blank_6_options": [
    { "objects": [ { "shape": "diamond", "row": 1, "col": 0, "color": "#1a7a5e", "rotation": 0 } ] },
    { "objects": [ { "shape": "diamond", "row": 1, "col": 1, "color": "#1a7a5e", "rotation": 0 } ] },
    { "objects": [ { "shape": "diamond", "row": 0, "col": 1, "color": "#1a7a5e", "rotation": 0 } ] }
  ],
  "blank_6_correct_index": 1,
  "motion_rule_description": "The teal diamond moves one cell to the right each frame and bounces off the left/right edges of the grid, reversing direction on contact. It does not change color or rotation.",
  "reasoning_trace": "Frame1: row1,col0. Frame2: row1,col1 (right 1). Frame3: row1,col2 (right 1). Frame4: row1,col3 (right 1, now at right edge, col=cols-1=3). Since it's at the right edge, the next move bounces: Frame5: row1,col2 (left 1). Frame6: row1,col1 (left 1, continuing the bounce). Therefore blank_5 correct = row1,col2 (option index 0) and blank_6 correct = row1,col1 (option index 1).",
  "source": "original"
}
```

## Renderer contract (for the Dev Agent)

- Cell size: 50×50 px on screen. Grid line stroke: `1px solid #ccc`.
- Each frame panel is an `<svg>` with `viewBox="0 0 ${cols*50} ${rows*50}"`
  containing the grid lines, then one `<g transform="translate(${col*50},{row*50})">`
  per object, containing that object's shape markup (scaled from the 40×40
  shape viewBox to fit within the 50×50 cell with 5px padding on each side)
  wrapped in the rotation transform.
- Frames 1–4 render read-only, left to right, with a small "Frame N" label
  under each.
- Blank 5 and Blank 6 each render as a bordered box containing a large "?"
  until an option is picked; below each, its 3 options render at a smaller
  scale, side by side, each clickable (clicking sets that blank's selected
  index and re-renders the "?" box to show the chosen option's grid, with a
  distinct highlight border so the user can tell it's provisional vs.
  confirmed).
- "Check answer" button compares selected indices to
  `blank_5_correct_index` / `blank_6_correct_index` and colors the "?" boxes
  green/red accordingly, then reveals `motion_rule_description` and
  `reasoning_trace` in a text block below.

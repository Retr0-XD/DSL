# Dev Agent Instructions — Build the dMAT Practice Bank

You are building a static website. Read `00_OVERVIEW_AND_ARCHITECTURE.md`
first — it defines the folder structure and constraints you must follow.
Then read the three spec files (`03_..._SPEC.md`, `04_..._SPEC.md`,
`05_..._SPEC.md`) — they contain the exact JSON schema for each puzzle type,
which your renderers must consume.

## Hard rules

- **No build step.** Plain HTML/CSS/JS with `<script type="module">`. No
  npm install, no bundler, no TypeScript, no framework.
- **No backend, no database, no fetch to any external API.** Everything
  reads local JSON files via `fetch()` (works fine when served over
  `http://localhost` or any static file server; note `file://` may block
  `fetch` in some browsers due to CORS — if so, tell the user to run
  `python3 -m http.server` in the project folder and open
  `http://localhost:8000`).
- **Renderers do not reason.** A renderer function's only job is: take a
  validated question JSON object, return an SVG/HTML string or DOM node. No
  "figuring out" what the puzzle means — the JSON already fully describes
  the visual state of every frame/cell.
- **Solvers are separate from renderers.** `solveLatinSquare.js` and
  `solveLinearSystem.js` are pure functions with no DOM code, so they can be
  unit-tested independently (e.g. by pasting them into a Node REPL).
- Keep styling minimal: clean layout, readable monospace-ish font for
  equations, clear spacing between grid cells, a visible border on the grid
  used for figure sequences and Latin squares. No design system, no
  animations required.

## Build checklist (do these in order)

### 1. Folder scaffold
Create the exact folder tree from `00_OVERVIEW_AND_ARCHITECTURE.md`. Create
empty `questions/index.json` with all three arrays present but empty:
```json
{ "figure-sequences": [], "latin-squares": [], "math-equations": [] }
```

### 2. `lib/shapes.js`
Implement the shape library exactly as defined in
`03_FIGURE_SEQUENCES_SPEC.md` → "Shape library". Export a function like:
```js
export function shapeMarkup(shapeName, opts) {
  // opts = { color, rotationDeg }
  // returns an SVG string for a single shape, sized to fit a 40x40 viewBox cell,
  // with `transform="rotate(${rotationDeg} 20 20)"` applied.
}
```
Only implement the exact shape names listed in the spec. If a question JSON
references an unknown shape name, render a visible red "?" placeholder and
log a console error — never crash the page.

### 3. `lib/renderFigureSequence.js`
Implement per the contract in `03_FIGURE_SEQUENCES_SPEC.md` → "Renderer
contract". Input: one question object matching the Figure Sequence schema.
Output: a DOM element containing:
- 4 small grid panels (the "known" frames), each drawn as an SVG grid of
  `rows × cols` cells with the frame's objects placed via `shapeMarkup`.
- 2 "blank" panel slots, each showing "?" until the user picks an option.
- Under each blank slot, its 3 option panels, clickable. Clicking one
  highlights it as selected.
- A "Check answer" button that compares selected indices against
  `blank_5_correct_index` / `blank_6_correct_index`, shows correct/incorrect,
  and reveals `motion_rule_description` + `reasoning_trace` on request.

### 4. `lib/renderLatinSquare.js`
Input: one question object matching the Latin Square schema. Output: a DOM
element containing:
- An `size × size` HTML table. Filled cells show their letter. The cell
  containing `"?"` in the `grid` array is visually highlighted (border/bg).
- A row of clickable letter buttons, one per entry in `letters`.
- A "Check answer" button comparing the clicked letter against `answer`,
  then revealing `reasoning_trace`.
- On load, call `solveLatinSquare.js`'s validator (see step 6) and if it
  reports the puzzle is *not* uniquely solvable or the stated answer is
  wrong, render a small non-blocking warning banner ("⚠ this question may
  have a data error") — do not hide the question, just flag it.

### 5. `lib/renderMathEquation.js`
Input: one question object matching the Math Equations schema. Output: a DOM
element containing:
- Each equation in `equations` rendered as readable text, using this term
  formatting rule for each `{coef, var}`:
  - `var === null` → just the number (`coef`)
  - `coef === 1` → `var` alone (e.g. `A`)
  - `coef === -1` → `-var` (e.g. `-A`)
  - otherwise → `${coef} × ${var}`
  - join terms on the same side with `" + "`, but render a leading `-` term
    as `" - "` joining instead of `" + -"` (i.e. normalize signs for
    readability)
  - join lhs/rhs with `" = "`
- One number input per entry in `variables`, labeled with that letter.
- A "Check answer" button comparing entered numbers against the `answer`
  map, then revealing `reasoning_trace`.
- On load, call `solveLinearSystem.js` (see step 6) and show the same kind
  of non-blocking warning banner if the computed solution doesn't match
  `answer`.

### 6. `lib/solveLatinSquare.js`
Pure function(s), no DOM:
```js
// Returns { solvable: bool, unique: bool, solvedValueAtBlank: string|null }
export function validateLatinSquare(question) {
  // 1. Parse `grid`, find the single "?" cell.
  // 2. Backtracking fill: for each empty cell (row-major order), try each
  //    letter in `letters` not already used in that row or column; recurse;
  //    on success return the fully solved grid.
  // 3. Read off the letter placed at the "?" cell = candidate answer.
  // 4. Uniqueness check: re-run the solve, but this time exclude the
  //    candidate answer as an option specifically for the "?" cell (try
  //    every OTHER letter there and see if a valid completion exists for
  //    the rest of the grid). If any alternative letter also yields a full
  //    valid completion, the puzzle is NOT uniquely solvable.
  // 5. Return { solvable, unique, solvedValueAtBlank } and compare
  //    solvedValueAtBlank to question.answer in the caller.
}
```

### 7. `lib/solveLinearSystem.js`
Pure function(s), no DOM:
```js
// Returns { solvable: bool, solution: {A: number, B: number, ...} | null }
export function solveLinearSystem(question) {
  // 1. Build matrix A (rows = equations, cols = variables) and vector b:
  //    for each equation, move all variable terms to the left (lhs - rhs)
  //    and all constant terms to the right, summing coefficients per
  //    variable. This gives one row of A and one entry of b per equation.
  // 2. Solve A * x = b via Gaussian elimination with partial pivoting,
  //    using floating point.
  // 3. Round each solution value to the nearest integer; if the rounded
  //    value differs from the raw float by more than 1e-6, treat as
  //    "not a clean integer solution" (data problem) and return
  //    solvable: false.
  // 4. Return { solvable: true, solution: { "A": 5, "B": 1, ... } }.
}
```
Equation count must equal variable count for this to have a unique solution
— if `equations.length !== variables.length`, return `solvable: false`
immediately (this indicates a malformed question).

### 8. `app.js`
- On load, `fetch('questions/index.json')`, then for every filename listed,
  `fetch` the actual question JSON from its folder.
- Render three collapsible sections (Figure Sequences / Latin Squares / Math
  Equations), each listing its questions grouped by difficulty
  (low/medium/high), as a simple clickable list (id + difficulty badge).
- Clicking a list item opens that question's detail view by calling the
  matching renderer and inserting the returned element into a main content
  area.
- A fourth tab, **"Add Question"**:
  - A big `<textarea>` for pasting a raw JSON question object.
  - A "Preview" button: `JSON.parse` the text (catch and display syntax
    errors clearly), detect its `type` field, call the matching renderer to
    show a live preview, and call the matching solver if one exists to show
    a validity check.
  - A "Download as file" button: wraps the pasted text in a `Blob` and
    triggers a download with a suggested filename based on the JSON's `id`
    field (e.g. `fs-low-0007.json`). Below it, a plain-text reminder:
    *"Save this file into questions/<type>/ and add its filename to
    questions/index.json, then refresh the page."*
  - This tab must never attempt to write to disk itself.

### 9. `style.css`
Minimal, clean. Suggested: system font stack, max content width ~900px
centered, light gray grid-cell borders, a distinct highlight color for the
selected/correct/incorrect states, a monospace font for the equation text
and JSON textarea.

## Acceptance criteria — how you know you're done

Create these six hand-written test question files (one per (type, one
difficulty each is enough to prove the pipeline works — you do not need to
hand-author dozens) and confirm each renders correctly, checking answers
works, and (for Latin Squares / Math Equations) the solver agrees with the
stated `answer`:

1. A Figure Sequence question with exactly 1 moving object, straight-line
   bounce motion, no color/rotation change (simplest case).
2. A Figure Sequence question with 2 objects, one doing perimeter-tracing
   motion and one doing color-cycling + rotation (more complex case, to
   prove multiple objects render independently and don't collide visually).
3. A Latin Square question, size 5, roughly half the cells pre-filled
   (matches the visual density of the PDF's examples).
4. A Latin Square question deliberately made **unsolvable** (delete a
   pre-filled cell so two letters are equally valid at the "?" position) —
   confirm the warning banner appears and the app does not crash.
5. A Math Equations question, 3 equations / 3 unknowns, matching numbers
   that solve cleanly to integers 1–20.
6. A Math Equations question with a deliberately wrong `answer` field (off
   by one) — confirm the warning banner appears.

If all six behave as described, the site is done. Do not add extra features
(sorting, search, dark mode, etc.) unless asked.

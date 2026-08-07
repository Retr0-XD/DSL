# dMAT Practice Bank — Overview & Architecture

## What this project is

A static, no-backend website that acts as a **question bank** for dMAT-style
Core Module practice (Figure Sequences, Latin Squares, Mathematical Equations).

The core idea: **we never ask an LLM to draw a picture.** Instead:

1. An LLM ("Question Agent") describes a puzzle as **structured JSON** — grid
   size, shapes, colors, rotations, letters, equation terms, etc. — following
   a strict schema.
2. A tiny, dumb JavaScript **renderer** reads that JSON and draws it as plain
   SVG/HTML. The renderer does no reasoning; it just fills a template.
3. Two of the three puzzle types (Latin Squares, Math Equations) additionally
   get a **deterministic solver** in JS that can check the JSON's stated
   answer is actually correct and unique. Figure Sequences skip this — it's
   authored by explicit full-state-per-frame JSON instead (see its spec),
   which the renderer just displays as-is.
4. Everything is a flat file. No database, no accounts, no server, no
   deployment. Open `index.html` locally (or serve the folder with any static
   file server) and it works.

This is deliberately simple. The interesting problem (representing pictorial
puzzles in a way an LLM can reliably produce) is solved by the schemas — not
by clever code.

## Two agents, two jobs

| Agent | Job | Instructions file |
|---|---|---|
| **Dev Agent** | Build the website: renderers, solvers, app shell | `01_DEV_AGENT_INSTRUCTIONS.md` |
| **Question Agent** | Generate new question JSON files, following the schemas | `02_QUESTION_AGENT_INSTRUCTIONS.md` |

These are separate prompts. Paste `01_DEV_AGENT_INSTRUCTIONS.md` into a fresh
LLM chat once to build the site. Paste `02_QUESTION_AGENT_INSTRUCTIONS.md`
into a (possibly different, possibly weaker/free-tier) LLM chat repeatedly,
any time you want more questions.

## Puzzle types in scope (v1)

Only the three Core Module types. Subject Module (Electrical Engineering
etc.) is explicitly **out of scope** for now.

- **Figure Sequences** → spec: `03_FIGURE_SEQUENCES_SPEC.md`
- **Latin Squares** → spec: `04_LATIN_SQUARES_SPEC.md`
- **Mathematical Equations** → spec: `05_MATH_EQUATIONS_SPEC.md`

Difficulty tag on every question: `"low" | "medium" | "high"`.
No cap on question count — the bank is meant to grow unbounded.

## Folder structure (what the Dev Agent must create)

```
dmat-practice/
  index.html
  style.css
  app.js                          # app shell: loads manifest, routes to a puzzle view
  lib/
    shapes.js                     # reusable SVG shape defs for Figure Sequences
    renderFigureSequence.js       # JSON -> SVG for figure-sequence questions
    renderLatinSquare.js          # JSON -> HTML/SVG table for latin-square questions
    renderMathEquation.js         # JSON -> HTML for math-equation questions
    solveLatinSquare.js           # backtracking solver + uniqueness check
    solveLinearSystem.js          # Gaussian elimination solver for equation systems
  questions/
    index.json                    # manifest: flat list of every question file
    figure-sequences/
      fs-low-0001.json
      fs-medium-0001.json
      ...
    latin-squares/
      ls-low-0001.json
      ...
    math-equations/
      me-low-0001.json
      ...
  docs/                            # copy of these 6 spec .md files, for reference in-repo
```

## Critical constraint: no backend, no filesystem write from the browser

Client-side JS in a static site **cannot** write new files into `questions/`.
So "adding a question" is a two-step human/agent workflow, not a one-click
in-browser action:

1. The Question Agent produces a JSON file's contents (as text/a code block).
2. That JSON is saved as a new file under the correct `questions/<type>/`
   folder, **and** its filename is appended to `questions/index.json`.

The website's "Add Question" tab (see Dev Agent instructions) exists to
**preview/validate** a pasted JSON blob and let the user download it as a
file — it does not silently persist anything. This must not be "fixed" by
adding a real backend; that's an explicit non-goal.

## `questions/index.json` manifest format

Since there's no server-side directory listing, the app needs a manifest to
know which question files exist:

```json
{
  "figure-sequences": [
    "fs-low-0001.json",
    "fs-medium-0001.json"
  ],
  "latin-squares": [
    "ls-low-0001.json"
  ],
  "math-equations": [
    "me-low-0001.json"
  ]
}
```

Every time a new question file is added, its filename is appended to the
matching array in this manifest. This is the **only** place aggregation
happens — the app never tries to guess filenames or scan directories.

## Non-goals (explicitly out of scope for v1)

- Subject Module content (Electrical Engineering, circuits, Nyquist plots, etc.)
- User accounts, multi-user submission, moderation queues
- Hosting/deployment (Vercel/Netlify/GitHub Pages) — local use only
- A build step (webpack/vite/bundlers) — plain `<script>` tags only
- Auto-solving/validating Figure Sequences (too open-ended a rule space;
  rely on the schema's `reasoning_trace` field + agent discipline instead)
- Any framework (React, Vue, etc.) — vanilla JS only, so a weak LLM can edit
  any file in isolation without build tooling breaking

## Copyright note (read this before touching the source PDF)

The original dMAT preparatory PDF is copyrighted by g.a.s.t./TestDaF-Institut.
The puzzle *mechanics* (movement rules, Latin square constraints, equation
solving) are not copyrightable — only their specific wording, exact numbers,
and exact images are. The spec files in this project describe the mechanics
in original wording and invent original example questions. **Never copy
exact grids, exact letter placements, exact equation numbers, or exact
wording from the source PDF into new question files.** Every generated
question must be an original configuration.

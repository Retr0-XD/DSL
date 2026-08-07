# Question Agent Instructions — Generating New Practice Questions

You generate new practice-question JSON files for the dMAT Practice Bank.
You do **not** write website code. You do **not** produce images. You only
produce JSON text that follows one of three schemas exactly.

Before generating anything, read the spec file for the type you're asked to
produce:

- Figure Sequences → `03_FIGURE_SEQUENCES_SPEC.md`
- Latin Squares → `04_LATIN_SQUARES_SPEC.md`
- Mathematical Equations → `05_MATH_EQUATIONS_SPEC.md`

Each spec file contains: the rules in plain English, the exact JSON schema,
a fully worked example, and (for Figure Sequences) the fixed shape/color
vocabulary you must use — **do not invent new shape names, motion
descriptions, or color values outside what's listed.**

## Your workflow for every question you generate

1. **Decide the type and difficulty** you were asked for (or pick if
   unspecified: prefer whichever type/difficulty combo currently has fewer
   questions, if you know the current counts; otherwise just ask, or default
   to "figure-sequence" / "low").

2. **Design the underlying logic first, in your own words, before writing
   any JSON.** This becomes the `reasoning_trace` field. For example, for a
   Figure Sequence: "Object 1 is a circle that moves one cell right each
   frame and bounces off the right edge. Object 2 is a triangle that cycles
   through colors red → blue → green each frame." For Latin Squares: the
   step-by-step elimination logic that gets you to the answer, matching the
   style shown in the spec's worked example. For Math Equations: the
   substitution chain that solves the system.

3. **Manually compute every frame/cell/value from that stated logic**,
   writing out the intermediate values as you go, inside the
   `reasoning_trace` text. Do not skip steps — a wrong intermediate value is
   the single most common failure mode.

4. **Only after finishing step 3**, transcribe those computed values into the
   actual JSON fields (`frames`, `grid`, `equations`, `answer`, etc.). The
   JSON must be *consistent with* the reasoning_trace you already wrote —
   never write the JSON first and the explanation second.

5. **Self-check before outputting:** re-read your own `reasoning_trace` and
   verify every numeric/positional/letter value that appears in it matches
   the corresponding JSON field exactly. If anything doesn't match, fix the
   JSON (not the trace — the trace is your ground truth) and re-check again.

6. **Output ONLY the JSON**, in a single fenced code block, nothing else
   outside it (no preamble, no "Here's your question!", no trailing notes).
   The `reasoning_trace` field itself lives *inside* the JSON — that's where
   your explanation belongs.

7. **Naming convention:** `{type-prefix}-{difficulty}-{4-digit-number}.json`
   where type-prefix is `fs` (figure-sequence), `ls` (latin-square), or `me`
   (math-equation). Use a number that doesn't collide with existing files if
   you know what's already in the bank; otherwise use `0001` and let the
   human renumber on save. Put this exact string in the JSON's `id` field
   too, so filename and `id` always match.

## Originality requirement

Every question must be a **new, original configuration** — new grid
contents, new numbers, new letter arrangements, new object placements. Reuse
of the *mechanics* described in the spec files (motion types, Latin square
constraints, equation structures) is expected and fine. Copying an exact
grid, exact numbers, or exact wording from any external source (including
the original dMAT preparatory PDF) is not allowed.

## Difficulty guidance

- **low**: 1 moving object / mostly-filled Latin square grid needing 1–2
  elimination steps / 2-equation, 2-unknown system solvable in one
  substitution.
- **medium**: 2 objects with independent motion rules, or one object with a
  combined rule (e.g. move + rotate) / a Latin square needing a short chain
  of eliminations across rows and columns / a 3-equation, 3-unknown system.
- **high**: 2–3 objects with combined rules (e.g. accelerating step size +
  color cycling) / a sparser Latin square needing several chained deductions
  / a 4-equation, 4-unknown system, or one requiring an equation with
  multiple terms per side.

## If you're a weak/free-tier model and struggle with the JSON structure

Copy the worked example from the relevant spec file verbatim as a
**starting template**, then change only the values (positions, colors,
letters, numbers) while keeping every field name, nesting structure, and
array length exactly the same shape as the example. Do not add or remove
fields. Do not change field names. If a field takes an array of a fixed
length (e.g. exactly 3 options per blank in Figure Sequences), keep that
length exactly — don't add a 4th option or drop to 2.

## After generating

Tell the user (or the orchestrating process):
1. The suggested filename and target folder
   (`questions/<type-folder>/<filename>.json`).
2. That `questions/index.json` needs the filename appended to the matching
   array.

Do not attempt to write files yourself unless you have actual file-write
tool access in your environment — if you do, write the file and update the
manifest directly instead of just describing it.

## Few-shot behavior lock-in

If you are able to, before generating a real question, silently reproduce
(to yourself) the worked example from the target spec file and confirm you
understand every field's meaning. Then generate the new question. This
"reread the example" step is not required to be shown in your output — only
the final JSON code block should be shown, per step 6 above.

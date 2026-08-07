# Latin Squares — Full Spec

## The puzzle, in plain English

A square grid (default 5×5) has some cells pre-filled with letters drawn from
a fixed letter set (e.g. A–E for a 5×5 grid — one letter per row-length).
Each letter must appear **exactly once in every row and exactly once in
every column** (the standard Latin square constraint) once the grid is fully
completed — though the puzzle itself only ever shows a partially-filled
grid. Exactly one cell is marked with `"?"`. The solver must deduce, using
row/column elimination logic alone (never guessing), which single letter
must go in that cell. The response options are the full letter set.

**Every question must have a UNIQUE deducible answer at the `?` cell** — it
must be possible to prove, from the given pre-filled cells alone (via
elimination, not by fully solving the rest of the grid), that only one
letter can legally occupy that cell. Puzzles where two different letters
could both work are broken and must not be generated (the solver in
`lib/solveLatinSquare.js` checks this — see below).

## JSON Schema

```json
{
  "id": "string, e.g. ls-low-0001",
  "type": "latin-square",
  "difficulty": "low | medium | high",
  "size": "int, default 5",
  "letters": [ "array of `size` single-character strings, e.g. A,B,C,D,E" ],
  "grid": [
    [ "size entries per row: a letter string, or null for empty, or the literal string \"?\" for the one blank cell (exactly one \"?\" in the whole grid)" ]
  ],
  "answer": "single letter string — the correct letter for the \"?\" cell",
  "reasoning_trace": "step-by-step elimination logic, in the style: 'In row 3, letters X and Y are missing; X can't go in column 2 because it already appears there in row 1; therefore Y goes there...'"
}
```

`grid` must be an array of exactly `size` arrays, each of exactly `size`
entries. Exactly one entry across the whole grid must be the literal string
`"?"`. All other non-null entries must be letters from `letters`, and no
letter may already appear twice in the same row or the same column among the
pre-filled cells (that would make the puzzle invalid before you even reach
the "?").

## Worked example

5×5 grid, letters A–E.

```
Row0: A  .  .  B  .
Row1: .  B  A  .  .
Row2: .  E  D  .  .
Row3: E  C  .  A  D
Row4: .  .  E  .  ?
```
(`.` = empty/null, shown here only for readability — in JSON these are
`null`.)

Reasoning: Column 4 (the last column) currently has D (row3) and needs the
remaining letters A, B, C, E somewhere in rows 0,1,2,4. Row 4 already has E
at column 2 and needs A, B, C, D somewhere in columns 0,1,3,4 (not column
2). Column 4 already can't take another E (row2 has D there, but E appears
in row4 col2 not col4, so that's not directly blocking) — build it up
properly:

- Row 4 has: `null, null, "E", null, "?"`. Missing letters in row 4: A, B,
  C, D (E is already placed).
- Column 4 has: `null, null, null, "D", "?"`. Missing letters in column 4:
  A, B, C, E.
- Intersection of "missing from row 4" (A,B,C,D) and "missing from column 4"
  (A,B,C,E) = A, B, C. Still ambiguous from this alone — a real puzzle needs
  enough other constraints to narrow it to one. (This shows why authors must
  actually trace the full elimination chain, not just intersect one row and
  one column — see the PDF-style spec's approach: solve other cells first,
  then the "?" cell becomes forced.) For a genuinely worked full example,
  follow the elimination chain style shown in `02_QUESTION_AGENT_INSTRUCTIONS.md`
  step 2–3: solve forced cells first (cells where row∩column missing-letters
  intersection has exactly one member), update the grid, repeat, until the
  "?" cell itself becomes forced to exactly one letter.

```json
{
  "id": "ls-medium-0001",
  "type": "latin-square",
  "difficulty": "medium",
  "size": 5,
  "letters": ["A", "B", "C", "D", "E"],
  "grid": [
    ["A", null, null, "B", null],
    [null, "B", "A", null, null],
    [null, "E", "D", null, null],
    ["E", "C", null, "A", "D"],
    [null, null, "E", null, "?"]
  ],
  "answer": "B",
  "reasoning_trace": "Column 1 has B(row0),B(row1)... wait, column1 already has null,B,E,C,null so column1 is missing A and D, meaning row0-col1 and row4-col1 must be A or D. Row0 already has A at col0, so row0-col1 must be D, leaving row4-col1 = A. Then row4 = [A? no wait recompute]... [Author must replace this with a fully verified, self-consistent trace before publishing.]"
}
```

**Important:** the example above intentionally shows an author catching
themselves mid-reasoning — this is exactly the kind of self-check step 5 in
`02_QUESTION_AGENT_INSTRUCTIONS.md` requires. Never publish a
`reasoning_trace` with an unresolved contradiction like that; work the chain
all the way through, verify the grid is fully consistent (every row and
column has no repeated letters), and only then finalize `answer` and the
trace text.

## Solver pseudocode (for the Dev Agent, `lib/solveLatinSquare.js`)

```
function validateLatinSquare(question):
    grid = deep copy of question.grid  # "?" cell treated as empty for solving
    find (qRow, qCol) = position of "?"
    replace grid[qRow][qCol] with null

    function backtrackSolve(grid):
        find first empty cell (row-major order); if none, return grid (solved)
        for each letter in question.letters:
            if letter not already in that row AND not already in that column:
                place letter in cell
                result = backtrackSolve(grid)
                if result is not null: return result
                remove letter from cell (backtrack)
        return null  # no valid letter, dead end

    solved = backtrackSolve(grid)
    if solved is null:
        return { solvable: false, unique: false, solvedValueAtBlank: null }

    candidateAnswer = solved[qRow][qCol]

    # Uniqueness check: try forcing every OTHER letter into the "?" cell
    # and see if a valid completion still exists for the rest of the grid.
    isUnique = true
    for each letter in question.letters where letter != candidateAnswer:
        gridAttempt = deep copy of question.grid, with "?" replaced by `letter`
        if that letter doesn't conflict with its row/column:
            if backtrackSolve(gridAttempt with that cell now fixed) succeeds:
                isUnique = false
                break

    return { solvable: true, unique: isUnique, solvedValueAtBlank: candidateAnswer }
```

The renderer (`lib/renderLatinSquare.js`) calls this on load and shows a
warning banner if `!unique`, `!solvable`, or
`solvedValueAtBlank !== question.answer`.

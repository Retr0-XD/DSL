# Mathematical Equations — Full Spec

## The puzzle, in plain English

A small system of linear equations relates unknowns represented by capital
letters (A, B, C, D, ...). Coefficients are positive or negative integers.
Every unknown has exactly one valid solution, and that solution is always an
integer between 1 and 20 inclusive. The solver must determine the value of
each unknown letter using substitution/elimination. The number of equations
always equals the number of unknowns (so the system is exactly determined).

Equations only ever contain **linear** terms — a constant times a single
variable, or a bare constant. No variable is ever multiplied by another
variable, and no variable ever appears with an exponent.

## JSON Schema

Each equation is `{ "lhs": [terms...], "rhs": [terms...] }` where each term
is `{ "coef": <integer, can be negative>, "var": "<letter>" | null }`. A term
with `"var": null` is a plain constant (its `coef` is the number itself).

```json
{
  "id": "string, e.g. me-low-0001",
  "type": "math-equation",
  "difficulty": "low | medium | high",
  "variables": [ "array of the letter names used, e.g. A, B, C" ],
  "equations": [
    {
      "lhs": [ { "coef": "int", "var": "letter or null" }, "..." ],
      "rhs": [ { "coef": "int", "var": "letter or null" }, "..." ]
    }
  ],
  "answer": { "A": "int 1-20", "B": "int 1-20", "...": "..." },
  "reasoning_trace": "step-by-step substitution/elimination showing how each variable's value is derived"
}
```

`equations.length` must equal `variables.length`. Every letter in
`variables` must appear in `answer` with an integer value from 1 to 20
inclusive, and every letter used anywhere inside `equations` must be present
in `variables`.

## Term formatting reminder (for readability when authoring)

- `{coef: 7, var: null}` reads as the constant `7`
- `{coef: 1, var: "A"}` reads as `A`
- `{coef: -1, var: "A"}` reads as `-A`
- `{coef: 3, var: "C"}` reads as `3 × C`

An equation like "7 + A = 14" becomes:
```json
{ "lhs": [ {"coef": 7, "var": null}, {"coef": 1, "var": "A"} ], "rhs": [ {"coef": 14, "var": null} ] }
```
An equation like "3 × C = A" becomes:
```json
{ "lhs": [ {"coef": 3, "var": "C"} ], "rhs": [ {"coef": 1, "var": "A"} ] }
```

## Worked example

Original 4-unknown system (not copied from any external source):

- `A - B + C - D = 3`
- `4 × B = C`
- `2 × B = A`
- `9 + B = D`

Reasoning: from eq. 2, `C = 4B`. From eq. 3, `A = 2B`. From eq. 4,
`D = 9 + B`. Substitute all into eq. 1:
`2B - B + 4B - (9 + B) = 3` → `4B - 9 = 3` → `4B = 12` → `B = 3`.
Then `A = 2×3 = 6`, `C = 4×3 = 12`, `D = 9 + 3 = 12`.

Wait — check: `A - B + C - D = 6 - 3 + 12 - 12 = 3`. ✓ Matches. Final answer:
`A=6, B=3, C=12, D=12`.

```json
{
  "id": "me-high-0001",
  "type": "math-equation",
  "difficulty": "high",
  "variables": ["A", "B", "C", "D"],
  "equations": [
    {
      "lhs": [ {"coef": 1, "var": "A"}, {"coef": -1, "var": "B"}, {"coef": 1, "var": "C"}, {"coef": -1, "var": "D"} ],
      "rhs": [ {"coef": 3, "var": null} ]
    },
    {
      "lhs": [ {"coef": 4, "var": "B"} ],
      "rhs": [ {"coef": 1, "var": "C"} ]
    },
    {
      "lhs": [ {"coef": 2, "var": "B"} ],
      "rhs": [ {"coef": 1, "var": "A"} ]
    },
    {
      "lhs": [ {"coef": 9, "var": null}, {"coef": 1, "var": "B"} ],
      "rhs": [ {"coef": 1, "var": "D"} ]
    }
  ],
  "answer": { "A": 6, "B": 3, "C": 12, "D": 12 },
  "reasoning_trace": "From eq2, C = 4B. From eq3, A = 2B. From eq4, D = 9 + B. Substitute into eq1: 2B - B + 4B - (9 + B) = 3 => 4B - 9 = 3 => 4B = 12 => B = 3. Then A = 2*3 = 6, C = 4*3 = 12, D = 9 + 3 = 12. Check: A - B + C - D = 6 - 3 + 12 - 12 = 3, matches. Final: A=6, B=3, C=12, D=12."
}
```

## Solver pseudocode (for the Dev Agent, `lib/solveLinearSystem.js`)

```
function solveLinearSystem(question):
    vars = question.variables            # ordered list, defines column order
    n = vars.length
    if question.equations.length != n:
        return { solvable: false, solution: null }

    # Build augmented matrix [A | b], one row per equation
    matrix = []
    for eq in question.equations:
        row = array of n zeros
        constantSum = 0
        for term in eq.lhs:
            if term.var is null: constantSum -= term.coef      # move constants to RHS
            else: row[indexOf(vars, term.var)] += term.coef
        for term in eq.rhs:
            if term.var is null: constantSum += term.coef
            else: row[indexOf(vars, term.var)] -= term.coef
        matrix.push(row concatenated with [constantSum])   # constantSum is now `b` for this row

    # Gaussian elimination with partial pivoting on `matrix` (n rows x (n+1) cols)
    for col in 0..n-1:
        pivotRow = row index >= col with the largest absolute value in that column
        if matrix[pivotRow][col] is ~0: return { solvable: false, solution: null }  # singular system
        swap matrix[col] and matrix[pivotRow]
        normalize matrix[col] so matrix[col][col] == 1 (divide the row)
        for every other row r:
            eliminate column `col` from row r using matrix[col]

    solution = {}
    for i in 0..n-1:
        rawValue = matrix[i][n]
        rounded = round(rawValue)
        if abs(rawValue - rounded) > 1e-6: return { solvable: false, solution: null }
        solution[vars[i]] = rounded

    return { solvable: true, solution: solution }
```

The renderer (`lib/renderMathEquation.js`) calls this on load and shows a
warning banner if `!solvable` or if `solution` doesn't match `question.answer`
key-for-key.

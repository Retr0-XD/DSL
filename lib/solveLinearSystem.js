export function solveLinearSystem(question) {
  const { variables, equations } = question;
  const n = variables.length;
  if (equations.length !== n) {
    return { solvable: false, solution: null };
  }

  // Build augmented matrix [A | b]
  const matrix = [];
  for (const eq of equations) {
    const row = new Array(n).fill(0);
    let constantSum = 0;
    // Process lhs: move constants to RHS (subtract)
    for (const term of eq.lhs) {
      if (term.var === null) {
        constantSum -= term.coef;
      } else {
        const colIndex = variables.indexOf(term.var);
        if (colIndex === -1) {
          // Variable not in list? According to spec, every variable used must be in variables.
          // We'll treat as error -> unsolvable.
          return { solvable: false, solution: null };
        }
        row[colIndex] += term.coef;
      }
    }
    // Process rhs: move constants to RHS (add)
    for (const term of eq.rhs) {
      if (term.var === null) {
        constantSum += term.coef;
      } else {
        const colIndex = variables.indexOf(term.var);
        if (colIndex === -1) {
          return { solvable: false, solution: null };
        }
        row[colIndex] -= term.coef;
      }
    }
    // Now the equation is: row * variables = constantSum
    // So we push constantSum as the last element (b)
    row.push(constantSum);
    matrix.push(row);
  }

  // Gaussian elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot row (max absolute value in current column from row col to end)
    let pivotRow = col;
    let maxAbs = Math.abs(matrix[col][col]);
    for (let r = col + 1; r < n; r++) {
      const absVal = Math.abs(matrix[r][col]);
      if (absVal > maxAbs) {
        maxAbs = absVal;
        pivotRow = r;
      }
    }
    // If the maxAbs is zero (or very small), the system is singular
    if (maxAbs < 1e-10) {
      return { solvable: false, solution: null };
    }
    // Swap pivot row with current row if needed
    if (pivotRow !== col) {
      [matrix[col], matrix[pivotRow]] = [matrix[pivotRow], matrix[col]];
    }
    // Normalize the pivot row
    const pivotVal = matrix[col][col];
    for (let c = col; c <= n; c++) {
      matrix[col][c] /= pivotVal;
    }
    // Eliminate the current column in all other rows
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = matrix[r][col];
      if (factor !== 0) {
        for (let c = col; c <= n; c++) {
          matrix[r][c] -= factor * matrix[col][c];
        }
      }
    }
  }

  // Extract solution
  const solution = {};
  for (let r = 0; r < n; r++) {
    const rawValue = matrix[r][n]; // last column
    const rounded = Math.round(rawValue);
    if (Math.abs(rawValue - rounded) > 1e-6) {
      return { solvable: false, solution: null };
    }
    solution[variables[r]] = rounded;
  }

  return { solvable: true, solution: solution };
}
export function validateLatinSquare(question) {
  // Deep copy of the grid, treating "?" as empty (null)
  const grid = question.grid.map(row => row.map(cell => (cell === "?" ? null : cell)));
  const size = question.size;
  const letters = question.letters;

  // Find the position of the "?"
  let qRow = -1, qCol = -1;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (question.grid[r][c] === "?") {
        qRow = r;
        qCol = c;
        break;
      }
    }
    if (qRow !== -1) break;
  }

  // Backtracking solver
  function backtrackSolve(grid) {
    // Find first empty cell (null) in row-major order
    let emptyRow = -1, emptyCol = -1;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === null) {
          emptyRow = r;
          emptyCol = c;
          break;
        }
      }
      if (emptyRow !== -1) break;
    }

    // If no empty cell, we have a solution
    if (emptyRow === -1) return grid;

    // Try each letter
    for (const letter of letters) {
      // Check if letter is not already in the row or column
      let inRow = false, inCol = false;
      for (let c = 0; c < size; c++) {
        if (grid[emptyRow][c] === letter) inRow = true;
      }
      for (let r = 0; r < size; r++) {
        if (grid[r][emptyCol] === letter) inCol = true;
      }
      if (!inRow && !inCol) {
        grid[emptyRow][emptyCol] = letter;
        const result = backtrackSolve(grid);
        if (result !== null) return result;
        // Backtrack
        grid[emptyRow][emptyCol] = null;
      }
    }
    return null; // Trigger backtracking
  }

  const solved = backtrackSolve(grid);
  if (solved === null) {
    return { solvable: false, unique: false, solvedValueAtBlank: null };
  }

  const candidateAnswer = solved[qRow][qCol];

  // Uniqueness check: try forcing every OTHER letter into the "?" cell
  let isUnique = true;
  for (const letter of letters) {
    if (letter === candidateAnswer) continue;
    // Create a grid with the "?" cell forced to this letter
    const gridAttempt = question.grid.map(row => row.slice()); // shallow copy of rows
    // Replace the "?" cell with the letter, but note: we must treat the original grid's "?" as empty for the attempt?
    // Actually, we want to see if we can complete the grid with this letter at the "?" cell.
    // We'll set the "?" cell to the letter and then try to solve the rest (treating other nulls as empty).
    gridAttempt[qRow][qCol] = letter;
    // Check if this letter conflicts with the pre-filled cells in its row/column (from the original grid, excluding the "?")
    let conflict = false;
    for (let c = 0; c < size; c++) {
      if (c !== qCol && question.grid[qRow][c] === letter) {
        conflict = true;
        break;
      }
    }
    if (!conflict) {
      for (let r = 0; r < size; r++) {
        if (r !== qRow && question.grid[r][qCol] === letter) {
          conflict = true;
          break;
        }
      }
    }
    if (conflict) continue; // This letter cannot be placed at the "?" cell due to immediate conflict

    // Now try to solve the rest of the grid (treating the "?" cell as fixed to this letter, and other nulls as empty)
    const gridForSolve = gridAttempt.map(row => row.map(cell => (cell === "?" ? null : cell)));
    // Note: we already set the "?" cell to a letter, so it's not null anymore.
    const result = backtrackSolve(gridForSolve);
    if (result !== null) {
      // We found an alternative completion -> not unique
      isUnique = false;
      break;
    }
  }

  return { solvable: true, unique: isUnique, solvedValueAtBlank: candidateAnswer };
}
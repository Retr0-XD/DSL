export function validateLatinSquare(question) {
  const size = question.size;
  const letters = question.letters;

  // Normalize the grid so both "?" and null are treated as empty cells.
  const grid = question.grid.map(row => row.map(cell => (cell === "?" || cell === null ? null : cell)));

  // Find the position of the blank cell (use the first empty cell if there is one).
  let qRow = -1;
  let qCol = -1;
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (grid[r][c] === null) {
        qRow = r;
        qCol = c;
        break;
      }
    }
    if (qRow !== -1) {
      break;
    }
  }

  if (qRow === -1 || qCol === -1) {
    return { solvable: false, unique: false, solvedValueAtBlank: null };
  }

  function backtrackSolve(gridState) {
    let emptyRow = -1;
    let emptyCol = -1;

    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (gridState[r][c] === null) {
          emptyRow = r;
          emptyCol = c;
          break;
        }
      }
      if (emptyRow !== -1) {
        break;
      }
    }

    if (emptyRow === -1) {
      return gridState;
    }

    for (const letter of letters) {
      let inRow = false;
      let inCol = false;

      for (let c = 0; c < size; c += 1) {
        if (gridState[emptyRow][c] === letter) {
          inRow = true;
          break;
        }
      }
      for (let r = 0; r < size; r += 1) {
        if (gridState[r][emptyCol] === letter) {
          inCol = true;
          break;
        }
      }

      if (!inRow && !inCol) {
        gridState[emptyRow][emptyCol] = letter;
        const result = backtrackSolve(gridState);
        if (result !== null) {
          return result;
        }
        gridState[emptyRow][emptyCol] = null;
      }
    }

    return null;
  }

  const solved = backtrackSolve(grid.map(row => row.slice()));
  if (solved === null) {
    return { solvable: false, unique: false, solvedValueAtBlank: null };
  }

  const candidateAnswer = solved[qRow][qCol];

  let isUnique = true;
  for (const letter of letters) {
    if (letter === candidateAnswer) {
      continue;
    }

    const gridAttempt = question.grid.map(row => row.map(cell => (cell === "?" || cell === null ? null : cell)));
    gridAttempt[qRow][qCol] = letter;

    let conflict = false;
    for (let c = 0; c < size; c += 1) {
      if (c !== qCol && question.grid[qRow][c] === letter) {
        conflict = true;
        break;
      }
    }

    if (!conflict) {
      for (let r = 0; r < size; r += 1) {
        if (r !== qRow && question.grid[r][qCol] === letter) {
          conflict = true;
          break;
        }
      }
    }

    if (conflict) {
      continue;
    }

    const result = backtrackSolve(gridAttempt.map(row => row.slice()));
    if (result !== null) {
      isUnique = false;
      break;
    }
  }

  return { solvable: true, unique: isUnique, solvedValueAtBlank: candidateAnswer };
}
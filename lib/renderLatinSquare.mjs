import { validateLatinSquare } from './solveLatinSquare.mjs?v=20260808-2';

export function renderLatinSquare(question) {
  const { size, letters, grid, answer, reasoning_trace } = question;

  const container = document.createElement('div');
  container.className = 'latin-square-card';

  const validation = validateLatinSquare(question);
  if (!validation.solvable || !validation.unique || validation.solvedValueAtBlank !== answer) {
    const warningBanner = document.createElement('div');
    warningBanner.className = 'warning-banner';
    warningBanner.textContent = '⚠ This question may have a data error.';
    container.appendChild(warningBanner);
  }

  const gridState = grid.map(row => row.slice());
  let blankRow = -1;
  let blankCol = -1;

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (gridState[r][c] === '?' || gridState[r][c] === null) {
        blankRow = r;
        blankCol = c;
        break;
      }
    }
    if (blankRow !== -1) {
      break;
    }
  }

  const table = document.createElement('table');
  table.className = 'latin-square-table';

  for (let r = 0; r < size; r += 1) {
    const tr = document.createElement('tr');
    for (let c = 0; c < size; c += 1) {
      const td = document.createElement('td');
      td.className = 'latin-square-cell';
      const cellValue = gridState[r][c];

      if (r === blankRow && c === blankCol) {
        td.classList.add('blank');
      }

      td.textContent = cellValue === '?' || cellValue === null ? '?' : cellValue;

      if (r === blankRow && c === blankCol) {
        td.addEventListener('click', () => {
          if (!selectedLetter) {
            alert('Please choose a letter first.');
            return;
          }
          gridState[blankRow][blankCol] = selectedLetter;
          updateCellDisplay();
        });
      }

      tr.appendChild(td);
    }
    table.appendChild(tr);
  }

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'latin-square-controls';

  let selectedLetter = null;
  const letterButtons = {};

  const updateSelectionUI = () => {
    Object.values(letterButtons).forEach(button => {
      button.classList.toggle('is-selected', button.dataset.letter === selectedLetter);
    });
  };

  const updateCellDisplay = () => {
    if (blankRow === -1 || blankCol === -1) {
      return;
    }
    const cell = table.rows[blankRow].cells[blankCol];
    const currentValue = gridState[blankRow][blankCol];
    cell.textContent = currentValue === '?' || currentValue === null ? '?' : currentValue;
    cell.classList.toggle('filled', currentValue !== '?' && currentValue !== null);
  };

  letters.forEach(letter => {
    const btn = document.createElement('button');
    btn.className = 'latin-square-letter-button';
    btn.dataset.letter = letter;
    btn.textContent = letter;
    btn.addEventListener('click', () => {
      selectedLetter = letter;
      updateSelectionUI();
    });
    buttonContainer.appendChild(btn);
    letterButtons[letter] = btn;
  });

  const feedback = document.createElement('div');
  feedback.className = 'latin-square-feedback';

  const checkButton = document.createElement('button');
  checkButton.textContent = 'Check answer';
  checkButton.className = 'latin-square-check-button';
  checkButton.addEventListener('click', () => {
    if (blankRow === -1 || blankCol === -1) {
      feedback.textContent = 'This puzzle does not have a blank cell.';
      feedback.className = 'latin-square-feedback';
      return;
    }

    const placedValue = gridState[blankRow][blankCol];
    if (placedValue === '?' || placedValue === null || placedValue === undefined) {
      feedback.textContent = 'Please place a letter in the blank cell before checking.';
      feedback.className = 'latin-square-feedback';
      return;
    }

    const isCorrect = placedValue === answer;
    if (isCorrect) {
      feedback.innerHTML = `<strong>Correct!</strong> The answer is ${answer}.`;
      feedback.className = 'latin-square-feedback success';
      const existingTrace = container.querySelector('.reasoning-trace');
      if (existingTrace) {
        existingTrace.remove();
      }
      const traceContainer = document.createElement('div');
      traceContainer.className = 'reasoning-trace';
      traceContainer.innerHTML = `<div class="reasoning-trace-title">Reasoning</div><div>${reasoning_trace}</div>`;
      container.appendChild(traceContainer);
    } else {
      feedback.innerHTML = `<strong>Not quite.</strong> The correct answer is ${answer}.`;
      feedback.className = 'latin-square-feedback error';
    }
  });

  container.appendChild(table);
  container.appendChild(buttonContainer);
  container.appendChild(checkButton);
  container.appendChild(feedback);

  return container;
}
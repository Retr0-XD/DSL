import { validateLatinSquare } from './solveLatinSquare.mjs';

export function renderLatinSquare(question) {
  const { size, letters, grid, answer, reasoning_trace } = question;

  // Container for the whole question
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.gap = '20px';

  // Validate the question on load
  const validation = validateLatinSquare(question);
  if (!validation.solvable || !validation.unique || validation.solvedValueAtBlank !== answer) {
    const warningBanner = document.createElement('div');
    warningBanner.textContent = '��⚠ this question may have a data error';
    warningBanner.style.backgroundColor = '#fff3cd';
    warningBanner.style.border = '1px solid #ffeaa7';
    warningBanner.style.color = '#856404';
    warningBanner.style.padding = '8px';
    warningBanner.style.borderRadius = '4px';
    warningBanner.style.width = '100%';
    warningBanner.style.textAlign = 'center';
    container.appendChild(warningBanner);
  }

  // Create the grid table
  const table = document.createElement('table');
  table.style.borderCollapse = 'collapse';
  table.style.marginBottom = '20px';

  for (let r = 0; r < size; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < size; c++) {
      const td = document.createElement('td');
      td.style.border = '2px solid #ccc';
      td.style.width = '40px';
      td.style.height = '40px';
      td.style.textAlign = 'center';
      td.style.verticalAlign = 'middle';
      td.style.fontSize = '24px';
      td.style.fontFamily = 'monospace';
      const cellValue = grid[r][c];
      if (cellValue === null) {
        td.textContent = '';
      } else if (cellValue === '?') {
        td.textContent = '?';
        td.style.backgroundColor = '#ffebee'; // Highlight the blank cell
        td.style.borderColor = '#f44336';
      } else {
        td.textContent = cellValue;
      }
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }

  // Create letter buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '10px';
  buttonContainer.style.marginBottom = '20px';

  let selectedLetter = null;
  const letterButtons = {};

  letters.forEach(letter => {
    const btn = document.createElement('button');
    btn.textContent = letter;
    btn.style.padding = '8px 16px';
    btn.style.fontSize = '16px';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', () => {
      // Deselect all
      Object.values(letterButtons).forEach(b => {
        b.style.border = '2px solid transparent';
        b.style.backgroundColor = '';
        b.style.color = '';
      });
      // Select this
      btn.style.border = '2px solid #1976d2';
      btn.style.backgroundColor = '#e3f2fd';
      btn.style.color = '#1565c0';
      selectedLetter = letter;
    });
    buttonContainer.appendChild(btn);
    letterButtons[letter] = btn;
  });

  // Check answer button
  const checkButton = document.createElement('button');
  checkButton.textContent = 'Check answer';
  checkButton.style.padding = '8px 16px';
  checkButton.style.fontSize = '14px';
  checkButton.style.cursor = 'pointer';
  checkButton.addEventListener('click', () => {
    if (selectedLetter === null) {
      alert('Please select a letter');
      return;
    }
    const isCorrect = selectedLetter === answer;
    // Provide feedback
    if (isCorrect) {
      alert('Correct! The answer is ' + answer);
      // Reveal reasoning trace
      const traceContainer = document.createElement('div');
      traceContainer.style.marginTop = '20px';
      traceContainer.style.padding = '12px';
      traceContainer.style.backgroundColor = '#e8f5e9';
      traceContainer.style.borderRadius = '4px';
      const traceHeading = document.createElement('div');
      traceHeading.textContent = 'Reasoning:';
      traceHeading.style.fontWeight = 'bold';
      traceHeading.style.marginBottom = '4px';
      const traceText = document.createElement('div');
      traceText.textContent = reasoning_trace;
      traceText.style.whiteSpace = 'pre-wrap';
      traceContainer.appendChild(traceHeading);
      traceContainer.appendChild(traceText);
      // Remove any existing trace
      const existingTrace = container.querySelector('.reasoning-trace');
      if (existingTrace) {
        existingTrace.remove();
      }
      traceContainer.classList.add('reasoning-trace');
      container.appendChild(traceContainer);
    } else {
      alert('Incorrect. The correct answer is ' + answer);
    }
  });

  // Assemble
  container.appendChild(table);
  container.appendChild(buttonContainer);
  container.appendChild(checkButton);

  return container;
}
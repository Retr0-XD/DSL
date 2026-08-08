import { solveLinearSystem } from './solveLinearSystem.mjs?v=20260808-2';

export function renderMathEquation(question) {
  const { variables, equations, answer, reasoning_trace } = question;

  // Container for the whole question
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.gap = '20px';

  // Validate the question on load
  const validation = solveLinearSystem(question);
  if (!validation.solvable) {
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
  } else {
    // Check if solution matches answer
    const solution = validation.solution;
    let matches = true;
    for (const v of variables) {
      if (solution[v] !== answer[v]) {
        matches = false;
        break;
      }
    }
    if (!matches) {
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
  }

  // Function to format a term
  function formatTerm(term) {
    const { coef, var: variable } = term;
    if (variable === null) {
      return coef.toString();
    }
    if (coef === 1) {
      return variable;
    }
    if (coef === -1) {
      return `-${variable}`;
    }
    return `${coef} × ${variable}`;
  }

  // Function to format an expression (array of terms)
  function formatExpression(terms) {
    if (terms.length === 0) return '0';
    // Format each term
    const formattedTerms = terms.map(formatTerm);
    // Join with " + " but handle negative terms: we want to avoid "+ -"
    // Instead, we can join and then replace "+ -" with "- "
    let expression = formattedTerms.join(' + ');
    // Replace "+ -" with "- "
    expression = expression.replace(/\+ -/g, '- ');
    // If the expression starts with a minus, we can leave it as is.
    return expression;
  }

  // Create equations display
  const equationsContainer = document.createElement('div');
  equationsContainer.style.marginBottom = '20px';

  equations.forEach((eq, eqIndex) => {
    const lhs = formatExpression(eq.lhs);
    const rhs = formatExpression(eq.rhs);
    const equationRow = document.createElement('div');
    equationRow.style.fontSize = '18px';
    equationRow.style.fontFamily = 'monospace';
    equationRow.style.marginBottom = '8px';
    equationRow.textContent = `${lhs} = ${rhs}`;
    equationsContainer.appendChild(equationRow);
  });

  // Create variable inputs
  const inputsContainer = document.createElement('div');
  inputsContainer.style.display = 'flex';
  inputsContainer.style.gap = '20px';
  inputsContainer.style.marginBottom = '20px';

  const inputElements = {};
  variables.forEach(variable => {
    const label = document.createElement('label');
    label.textContent = `${variable}: `;
    label.style.fontSize = '16px';
    const input = document.createElement('input');
    input.type = 'number';
    input.style.width = '60px';
    input.style.padding = '4px';
    input.style.fontSize = '16px';
    inputElements[variable] = input;
    const wrapper = document.createElement('div');
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    inputsContainer.appendChild(wrapper);
  });

  // Check answer button
  const checkButton = document.createElement('button');
  checkButton.textContent = 'Check answer';
  checkButton.style.padding = '8px 16px';
  checkButton.style.fontSize = '14px';
  checkButton.style.cursor = 'pointer';
  checkButton.addEventListener('click', () => {
    // Collect user answers
    const userAnswers = {};
    let allFilled = true;
    for (const v of variables) {
      const val = inputElements[v].value.trim();
      if (val === '') {
        allFilled = false;
        inputElements[v].style.borderColor = '#f44336';
      } else {
        const num = parseInt(val, 10);
        if (isNaN(num)) {
          allFilled = false;
          inputElements[v].style.borderColor = '#f44336';
        } else {
          userAnswers[v] = num;
          inputElements[v].style.borderColor = '#ccc';
        }
      }
    }
    if (!allFilled) {
      alert('Please fill in all variables with integers');
      return;
    }
    // Check against answer
    let correct = true;
    for (const v of variables) {
      if (userAnswers[v] !== answer[v]) {
        correct = false;
        break;
      }
    }
    if (correct) {
      alert('Correct! The answer is: ' + JSON.stringify(answer));
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
      alert('Incorrect. Please try again.');
    }
  });

  // Assemble
  container.appendChild(equationsContainer);
  container.appendChild(inputsContainer);
  container.appendChild(checkButton);

  return container;
}
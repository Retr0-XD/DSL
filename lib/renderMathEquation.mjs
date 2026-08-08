import { solveLinearSystem } from './solveLinearSystem.mjs?v=20260808-4';

export function renderMathEquation(question) {
  const { variables, equations, answer, reasoning_trace } = question;

  // Container for the whole question
  const container = document.createElement('div');
  container.className = 'math-equation-container';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.gap = '20px';

  // Validate the question on load
  const validation = solveLinearSystem(question);
  if (!validation.solvable) {
    const warningBanner = document.createElement('div');
    warningBanner.className = 'warning-banner';
    warningBanner.textContent = '⚠ This question may have a data error.';
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
      warningBanner.className = 'warning-banner';
      warningBanner.textContent = '⚠ This question may have a data error.';
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
  equationsContainer.className = 'math-equations-display';
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
  inputsContainer.className = 'math-equation-inputs';
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
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '4px';
    inputElements[variable] = input;
    const wrapper = document.createElement('div');
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    inputsContainer.appendChild(wrapper);
  });

  // Feedback container
  const feedbackContainer = document.createElement('div');
  feedbackContainer.className = 'math-equation-feedback';
  feedbackContainer.style.width = '100%';
  feedbackContainer.style.padding = '12px';
  feedbackContainer.style.borderRadius = '6px';
  feedbackContainer.style.textAlign = 'center';
  feedbackContainer.style.display = 'none';

  // Check answer button
  const checkButton = document.createElement('button');
  checkButton.className = 'math-equation-check-button';
  checkButton.textContent = 'Check answer';
  checkButton.style.padding = '10px 20px';
  checkButton.style.fontSize = '16px';
  checkButton.style.cursor = 'pointer';
  checkButton.style.backgroundColor = '#1976d2';
  checkButton.style.color = 'white';
  checkButton.style.border = 'none';
  checkButton.style.borderRadius = '6px';
  checkButton.style.transition = 'background-color 0.2s';
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
      feedbackContainer.textContent = 'Please fill in all variables with integers';
      feedbackContainer.style.backgroundColor = '#fef2f2';
      feedbackContainer.style.color = '#b42318';
      feedbackContainer.style.display = 'block';
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
      feedbackContainer.innerHTML = `<strong>Correct!</strong> The answer is: ${JSON.stringify(answer)}`;
      feedbackContainer.style.backgroundColor = '#ecfdf3';
      feedbackContainer.style.color = '#166534';
      feedbackContainer.style.display = 'block';
      // Reveal reasoning trace
      const traceContainer = document.createElement('div');
      traceContainer.className = 'reasoning-trace';
      traceContainer.style.marginTop = '20px';
      traceContainer.style.padding = '12px';
      traceContainer.style.backgroundColor = '#f0fdf4';
      traceContainer.style.borderRadius = '6px';
      traceContainer.style.color = '#166534';
      traceContainer.style.whiteSpace = 'pre-wrap';
      traceContainer.innerHTML = `<div style="font-weight: 700; margin-bottom: 6px;">Reasoning:</div><div>${reasoning_trace}</div>`;
      // Remove any existing trace
      const existingTrace = container.querySelector('.reasoning-trace');
      if (existingTrace) {
        existingTrace.remove();
      }
      container.appendChild(traceContainer);
    } else {
      feedbackContainer.textContent = 'Incorrect. Please try again.';
      feedbackContainer.style.backgroundColor = '#fef2f2';
      feedbackContainer.style.color = '#b42318';
      feedbackContainer.style.display = 'block';
    }
  });

  // Assemble
  container.appendChild(equationsContainer);
  container.appendChild(inputsContainer);
  container.appendChild(checkButton);
  container.appendChild(feedbackContainer);

  return container;
}
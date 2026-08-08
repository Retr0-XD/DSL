import { shapeMarkup } from './shapes.mjs';

export function renderFigureSequence(question) {
  const { grid, frames, blank_5_options, blank_5_correct_index, blank_6_options, blank_6_correct_index, motion_rule_description, reasoning_trace } = question;
  const { rows, cols } = grid;
  const cellSize = 50; // px
  const viewBoxWidth = cols * cellSize;
  const viewBoxHeight = rows * cellSize;

  // State for selected options
  let selectedBlank5 = null;
  let selectedBlank6 = null;

  // Container for the whole question
  const container = document.createElement('div');
  container.className = 'figure-sequence-container';

  function createObjectSvg(obj, cellSize) {
    const objectSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    objectSvg.setAttribute('x', (obj.col * cellSize).toString());
    objectSvg.setAttribute('y', (obj.row * cellSize).toString());
    objectSvg.setAttribute('width', cellSize.toString());
    objectSvg.setAttribute('height', cellSize.toString());
    objectSvg.setAttribute('viewBox', '0 0 40 40');
    objectSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    objectSvg.innerHTML = shapeMarkup(obj.shape, { color: obj.color, rotationDeg: obj.rotation });
    return objectSvg;
  }

  // Function to create an SVG grid for a given set of objects
  function createFrame(objects, highlightObjectIndex = -1) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
    svg.setAttribute('width', viewBoxWidth);
    svg.setAttribute('height', viewBoxHeight);
    svg.style.border = '1px solid #ccc';

    // Draw grid lines
    for (let r = 0; r <= rows; r++) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', r * cellSize);
      line.setAttribute('x2', viewBoxWidth.toString());
      line.setAttribute('y2', (r * cellSize).toString());
      line.setAttribute('stroke', '#ccc');
      svg.appendChild(line);
    }
    for (let c = 0; c <= cols; c++) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', c * cellSize);
      line.setAttribute('y1', '0');
      line.setAttribute('x2', (c * cellSize).toString());
      line.setAttribute('y2', viewBoxHeight.toString());
      line.setAttribute('stroke', '#ccc');
      svg.appendChild(line);
    }

    // Draw objects
    objects.forEach((obj, idx) => {
      const g = createObjectSvg(obj, cellSize);
      // If this object is highlighted (e.g., selected option), add a highlight
      if (idx === highlightObjectIndex) {
        // We'll highlight by adding a semi-transparent overlay? Instead, we can change the stroke of the cell.
        // For simplicity, we'll just note that the highlight is done by the caller via a border on the option panel.
        // So we don't need to do anything here.
      }
      svg.appendChild(g);
    });

    return svg;
  }

  // Create the 4 known frames
  const knownFramesContainer = document.createElement('div');
  knownFramesContainer.className = 'frames-container';
  knownFramesContainer.style.display = 'flex';
  knownFramesContainer.style.gap = '10px';
  knownFramesContainer.style.justifyContent = 'center';
  frames.forEach((frame, index) => {
    const frameWrapper = document.createElement('div');
    frameWrapper.className = 'frame-wrapper';
    frameWrapper.style.display = 'flex';
    frameWrapper.style.flexDirection = 'column';
    frameWrapper.style.alignItems = 'center';
    const frameLabel = document.createElement('div');
    frameLabel.textContent = `Frame ${index + 1}`;
    frameLabel.style.fontSize = '12px';
    frameLabel.style.marginBottom = '4px';
    const frameSVG = createFrame(frame.objects);
    frameWrapper.appendChild(frameLabel);
    frameWrapper.appendChild(frameSVG);
    knownFramesContainer.appendChild(frameWrapper);
  });

  // Function to create a blank slot with options
  function createBlankSlot(blankOptions, correctIndex, blankNumber) {
    const slotContainer = document.createElement('div');
    slotContainer.className = 'blank-slot';
    slotContainer.style.display = 'flex';
    slotContainer.style.flexDirection = 'column';
    slotContainer.style.alignItems = 'center';
    slotContainer.style.gap = '12px';

    // The "?" box (initially)
    const questionBox = document.createElement('div');
    questionBox.className = 'blank-question-box';
    questionBox.style.border = '2px dashed #999';
    questionBox.style.width = `${viewBoxWidth}px`;
    questionBox.style.height = `${viewBoxHeight}px`;
    questionBox.style.display = 'flex';
    questionBox.style.alignItems = 'center';
    questionBox.style.justifyContent = 'center';
    questionBox.style.fontSize = '24px';
    questionBox.style.color = '#666';
    questionBox.textContent = '?';
    questionBox.dataset.selectedIndex = null; // Store selected index

    // Options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'blank-options-container';
    optionsContainer.style.display = 'flex';
    optionsContainer.style.gap = '8px';
    optionsContainer.style.marginTop = '8px';
    optionsContainer.style.justifyContent = 'center';

    // Create option panels
    const optionElements = blankOptions.map((optionObjects, optionIndex) => {
      const optionPanel = document.createElement('div');
      optionPanel.className = 'blank-option-panel';
      optionPanel.style.border = '2px solid transparent';
      optionPanel.style.borderRadius = '6px';
      optionPanel.style.padding = '6px';
      optionPanel.style.cursor = 'pointer';
      optionPanel.style.transition = 'all 0.2s';
      optionPanel.style.backgroundColor = '#fff';
      const optionObjectList = Array.isArray(optionObjects)
        ? optionObjects
        : (optionObjects && Array.isArray(optionObjects.objects) ? optionObjects.objects : []);
      // Mini SVG for the option
      const miniViewBoxWidth = cols * 30; // Smaller cell size for options
      const miniViewBoxHeight = rows * 30;
      const miniCellSize = 30;
      const miniSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      miniSVG.setAttribute('viewBox', `0 0 ${miniViewBoxWidth} ${miniViewBoxHeight}`);
      miniSVG.setAttribute('width', miniViewBoxWidth);
      miniSVG.setAttribute('height', miniViewBoxHeight);
      miniSVG.style.border = '1px solid #ccc';
      miniSVG.style.borderRadius = '4px';
      // Draw grid lines for mini SVG
      for (let r = 0; r <= rows; r++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('y1', (r * miniCellSize).toString());
        line.setAttribute('x2', miniViewBoxWidth.toString());
        line.setAttribute('y2', (r * miniCellSize).toString());
        line.setAttribute('stroke', '#eee');
        miniSVG.appendChild(line);
      }
      for (let c = 0; c <= cols; c++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', (c * miniCellSize).toString());
        line.setAttribute('y1', '0');
        line.setAttribute('x2', (c * miniCellSize).toString());
        line.setAttribute('y2', miniViewBoxHeight.toString());
        line.setAttribute('stroke', '#eee');
        miniSVG.appendChild(line);
      }
      // Draw objects
      optionObjectList.forEach(obj => {
        const g = createObjectSvg(obj, miniCellSize);
        miniSVG.appendChild(g);
      });
      optionPanel.appendChild(miniSVG);
      // Click handler
      optionPanel.addEventListener('click', () => {
        // Deselect all other options for this blank
        Array.from(optionsContainer.children).forEach(child => {
          child.style.border = '2px solid transparent';
          child.style.backgroundColor = '#fff';
        });
        // Select this option
        optionPanel.style.border = '2px solid #1976d2'; // Blue highlight
        optionPanel.style.backgroundColor = '#e3f2fd';
        questionBox.dataset.selectedIndex = optionIndex.toString();
        // Update the question box to show the selected option's grid (same size as option panel)
        // Clear the question box
        questionBox.innerHTML = '';
        // Create a SVG for the selected option (same as the option panel)
        const selectedSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        selectedSVG.setAttribute('viewBox', `0 0 ${miniViewBoxWidth} ${miniViewBoxHeight}`);
        selectedSVG.setAttribute('width', miniViewBoxWidth);
        selectedSVG.setAttribute('height', miniViewBoxHeight);
        selectedSVG.style.border = '1px solid #1976d2';
        selectedSVG.style.borderRadius = '4px';
        // Grid lines
        for (let r = 0; r <= rows; r++) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', '0');
          line.setAttribute('y1', (r * miniCellSize).toString());
          line.setAttribute('x2', miniViewBoxWidth.toString());
          line.setAttribute('y2', (r * miniCellSize).toString());
          line.setAttribute('stroke', '#ddd');
          selectedSVG.appendChild(line);
        }
        for (let c = 0; c <= cols; c++) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', (c * miniCellSize).toString());
          line.setAttribute('y1', '0');
          line.setAttribute('x2', (c * miniCellSize).toString());
          line.setAttribute('y2', miniViewBoxHeight.toString());
          line.setAttribute('stroke', '#ddd');
          selectedSVG.appendChild(line);
        }
        // Objects
        optionObjectList.forEach(obj => {
          const g = createObjectSvg(obj, miniCellSize);
          selectedSVG.appendChild(g);
        });
        questionBox.appendChild(selectedSVG);
      });
      return optionPanel;
    });

    // Append options
    optionElements.forEach(el => optionsContainer.appendChild(el));

    slotContainer.appendChild(questionBox);
    slotContainer.appendChild(optionsContainer);
    return { slotContainer, questionBox, optionElements };
  }

  // Create blank 5 and blank 6 slots
  const blank5 = createBlankSlot(blank_5_options, blank_5_correct_index, 5);
  const blank6 = createBlankSlot(blank_6_options, blank_6_correct_index, 6);

  // Container for the two blanks side by side
  const blanksContainer = document.createElement('div');
  blanksContainer.className = 'blanks-wrapper';
  blanksContainer.style.display = 'flex';
  blanksContainer.style.gap = '30px';
  blanksContainer.style.justifyContent = 'center';
  blanksContainer.appendChild(blank5.slotContainer);
  blanksContainer.appendChild(blank6.slotContainer);

  // Check answer button
  const checkButton = document.createElement('button');
  checkButton.className = 'check-answer-button';
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
    const selected5 = parseInt(blank5.questionBox.dataset.selectedIndex);
    const selected6 = parseInt(blank6.questionBox.dataset.selectedIndex);
    const correct5 = blank_5_correct_index;
    const correct6 = blank_6_correct_index;

    // Check and indicate correctness
    if (selected5 === correct5) {
      blank5.questionBox.style.borderColor = '#4caf50'; // Green
      blank5.questionBox.style.borderStyle = 'solid';
    } else {
      blank5.questionBox.style.borderColor = '#f44336'; // Red
      blank5.questionBox.style.borderStyle = 'solid';
    }
    if (selected6 === correct6) {
      blank6.questionBox.style.borderColor = '#4caf50';
      blank6.questionBox.style.borderStyle = 'solid';
    } else {
      blank6.questionBox.style.borderColor = '#f44336';
      blank6.questionBox.style.borderStyle = 'solid';
    }

    // Reveal motion_rule_description and reasoning_trace
    const explanationContainer = document.createElement('div');
    explanationContainer.className = 'explanation-container';
    explanationContainer.style.marginTop = '20px';
    explanationContainer.style.padding = '16px';
    explanationContainer.style.backgroundColor = '#f8f9fa';
    explanationContainer.style.borderRadius = '8px';
    explanationContainer.style.border = '1px solid #e9ecef';

    const ruleHeading = document.createElement('div');
    ruleHeading.textContent = 'Rule:';
    ruleHeading.style.fontWeight = '600';
    ruleHeading.style.marginBottom = '8px';
    ruleHeading.style.color = '#495057';
    const ruleText = document.createElement('div');
    ruleText.textContent = motion_rule_description;
    ruleText.style.marginBottom = '12px';
    ruleText.style.color = '#6c757d';

    const traceHeading = document.createElement('div');
    traceHeading.textContent = 'Reasoning:';
    traceHeading.style.fontWeight = '600';
    traceHeading.style.marginBottom = '8px';
    traceHeading.style.color = '#495057';
    const traceText = document.createElement('div');
    traceText.textContent = reasoning_trace;
    traceText.style.whiteSpace = 'pre-wrap'; // Preserve line breaks
    traceText.style.color = '#6c757d';

    explanationContainer.appendChild(ruleHeading);
    explanationContainer.appendChild(ruleText);
    explanationContainer.appendChild(traceHeading);
    explanationContainer.appendChild(traceText);

    // Remove any existing explanation
    const existingExplanation = container.querySelector('.explanation-container');
    if (existingExplanation) {
      existingExplanation.remove();
    }
    container.appendChild(explanationContainer);
  });

  // Assemble everything
  container.appendChild(knownFramesContainer);
  container.appendChild(blanksContainer);
  container.appendChild(checkButton);

  return container;
}
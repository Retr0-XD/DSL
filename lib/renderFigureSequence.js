import { shapeMarkup } from './shapes.js';

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
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '20px';
  container.style.alignItems = 'center';

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
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      // Scale the shape from 40x40 viewBox to fit in cell with 5px padding
      // So inner size = 40, outer cell = 50, we scale by 40/50 = 0.8
      // Then translate to cell center: (col*cellSize + cellSize/2, row*cellSize + cellSize/2)
      const scale = 0.8;
      const translateX = obj.col * cellSize + cellSize / 2;
      const translateY = obj.row * cellSize + cellSize / 2;
      g.setAttribute('transform', `translate(${translateX},${translateY}) scale(${scale})`);
      // Apply rotation from the object (around the shape's center, which is now at 0,0 after translate and scale)
      // The shapeMarkup expects rotation around (20,20) in its 40x40 viewBox, but we've scaled and translated.
      // However, note: the shapeMarkup function already includes a rotation transform around (20,20) for the shape's own viewBox.
      // We are going to insert the shapeMarkup inside this g, and then we have already scaled and translated the g.
      // The shapeMarkup's rotation will be applied around (20,20) in the shape's local coordinates, which after scaling and translating
      // will be around the center of the cell. That's what we want.
      g.innerHTML = shapeMarkup(obj.shape, { color: obj.color, rotationDeg: obj.rotation });
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
  knownFramesContainer.style.display = 'flex';
  knownFramesContainer.style.gap = '10px';
  frames.forEach((frame, index) => {
    const frameWrapper = document.createElement('div');
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
    slotContainer.style.display = 'flex';
    slotContainer.style.flexDirection = 'column';
    slotContainer.style.alignItems = 'center';

    // The "?" box (initially)
    const questionBox = document.createElement('div');
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
    optionsContainer.style.display = 'flex';
    optionsContainer.style.gap = '10px';
    optionsContainer.style.marginTop = '10px';

    // Create option panels
    const optionElements = blankOptions.map((optionObjects, optionIndex) => {
      const optionPanel = document.createElement('div');
      optionPanel.style.border = '2px solid transparent';
      optionPanel.style.borderRadius = '4px';
      optionPanel.style.padding = '4px';
      optionPanel.style.cursor = 'pointer';
      optionPanel.style.transition = 'border-color 0.2s';
      // Mini SVG for the option
      const miniViewBoxWidth = cols * 30; // Smaller cell size for options
      const miniViewBoxHeight = rows * 30;
      const miniCellSize = 30;
      const miniSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      miniSVG.setAttribute('viewBox', `0 0 ${miniViewBoxWidth} ${miniViewBoxHeight}`);
      miniSVG.setAttribute('width', miniViewBoxWidth);
      miniSVG.setAttribute('height', miniViewBoxHeight);
      miniSVG.style.border = '1px solid #ccc';
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
      optionObjects.forEach(obj => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const scale = 0.8;
        const translateX = obj.col * miniCellSize + miniCellSize / 2;
        const translateY = obj.row * miniCellSize + miniCellSize / 2;
        g.setAttribute('transform', `translate(${translateX},${translateY}) scale(${scale})`);
        g.innerHTML = shapeMarkup(obj.shape, { color: obj.color, rotationDeg: obj.rotation });
        miniSVG.appendChild(g);
      });
      optionPanel.appendChild(miniSVG);
      // Click handler
      optionPanel.addEventListener('click', () => {
        // Deselect all other options for this blank
        Array.from(optionsContainer.children).forEach(child => {
          child.style.border = '2px solid transparent';
        });
        // Select this option
        optionPanel.style.border = '2px solid #1976d2'; // Blue highlight
        questionBox.dataset.selectedIndex = optionIndex.toString();
        // Update the question box to show the selected option's grid (mini version)
        // We'll replace the question box content with a mini SVG of the selected option
        // But spec says: show the chosen option's grid in the "?" box, with a distinct highlight border
        // We'll instead update the question box to show the selected option (same as the option panel but maybe larger?)
        // For simplicity, we'll just show a check mark or the option index? Let's follow spec: show the chosen option's grid.
        // We'll create a mini SVG inside the question box (same as the option panel) and update it.
        // Clear the question box
        questionBox.innerHTML = '';
        // Create a mini SVG for the selected option (same as above but without click handler)
        const selectedSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        selectedSVG.setAttribute('viewBox', `0 0 ${miniViewBoxWidth} ${miniViewBoxHeight}`);
        selectedSVG.setAttribute('width', miniViewBoxWidth);
        selectedSVG.setAttribute('height', miniViewBoxHeight);
        selectedSVG.style.border = '1px solid #ccc';
        // Grid lines
        for (let r = 0; r <= rows; r++) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', '0');
          line.setAttribute('y1', (r * miniCellSize).toString());
          line.setAttribute('x2', miniViewBoxWidth.toString());
          line.setAttribute('y2', (r * miniCellSize).toString());
          line.setAttribute('stroke', '#eee');
          selectedSVG.appendChild(line);
        }
        for (let c = 0; c <= cols; c++) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', (c * miniCellSize).toString());
          line.setAttribute('y1', '0');
          line.setAttribute('x2', (c * miniCellSize).toString());
          line.setAttribute('y2', miniViewBoxHeight.toString());
          line.setAttribute('stroke', '#eee');
          selectedSVG.appendChild(line);
        }
        // Objects
        optionObjects.forEach(obj => {
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          const scale = 0.8;
          const translateX = obj.col * miniCellSize + miniCellSize / 2;
          const translateY = obj.row * miniCellSize + miniCellSize / 2;
          g.setAttribute('transform', `translate(${translateX},${translateY}) scale(${scale})`);
          g.innerHTML = shapeMarkup(obj.shape, { color: obj.color, rotationDeg: obj.rotation });
          selectedSVG.appendChild(g);
        });
        questionBox.appendChild(selectedSVG);
      });
      return optionPanel;
    });

    // Append options
    optionElements.forEach(el => optionsContainer.appendChild(el));

    // Check answer button (we'll have one global button later, but for now we can have per blank? Spec says one button for both blanks)
    // We'll move the check answer button outside, so we don't create it here.

    slotContainer.appendChild(questionBox);
    slotContainer.appendChild(optionsContainer);
    return { slotContainer, questionBox, optionElements };
  }

  // Create blank 5 and blank 6 slots
  const blank5 = createBlankSlot(blank_5_options, blank_5_correct_index, 5);
  const blank6 = createBlankSlot(blank_6_options, blank_6_correct_index, 6);

  // Container for the two blanks side by side
  const blanksContainer = document.createElement('div');
  blanksContainer.style.display = 'flex';
  blanksContainer.style.gap = '30px';
  blanksContainer.appendChild(blank5.slotContainer);
  blanksContainer.appendChild(blank6.slotContainer);

  // Check answer button
  const checkButton = document.createElement('button');
  checkButton.textContent = 'Check answer';
  checkButton.style.padding = '8px 16px';
  checkButton.style.fontSize = '14px';
  checkButton.style.cursor = 'pointer';
  checkButton.addEventListener('click', () => {
    const selected5 = parseInt(blank5.questionBox.dataset.selectedIndex);
    const selected6 = parseInt(blank6.questionBox.dataset.selectedIndex);
    const correct5 = blank_5_correct_index;
    const correct6 = blank_6_correct_index;

    // Check and indicate correctness
    if (selected5 === correct5) {
      blank5.questionBox.style.borderColor = '#4caf50'; // Green
    } else {
      blank5.questionBox.style.borderColor = '#f44336'; // Red
    }
    if (selected6 === correct6) {
      blank6.questionBox.style.borderColor = '#4caf50';
    } else {
      blank6.questionBox.style.borderColor = '#f44336';
    }

    // Reveal motion_rule_description and reasoning_trace
    const explanationContainer = document.createElement('div');
    explanationContainer.style.marginTop = '20px';
    explanationContainer.style.padding = '12px';
    explanationContainer.style.backgroundColor = '#f5f5f5';
    explanationContainer.style.borderRadius = '4px';

    const ruleHeading = document.createElement('div');
    ruleHeading.textContent = 'Rule:';
    ruleHeading.style.fontWeight = 'bold';
    ruleHeading.style.marginBottom = '4px';
    const ruleText = document.createElement('div');
    ruleText.textContent = motion_rule_description;
    ruleText.style.marginBottom = '8px';

    const traceHeading = document.createElement('div');
    traceHeading.textContent = 'Reasoning:';
    traceHeading.style.fontWeight = 'bold';
    traceHeading.style.marginBottom = '4px';
    const traceText = document.createElement('div');
    traceText.textContent = reasoning_trace;
    traceText.style.whiteSpace = 'pre-wrap'; // Preserve line breaks

    explanationContainer.appendChild(ruleHeading);
    explanationContainer.appendChild(ruleText);
    explanationContainer.appendChild(traceHeading);
    explanationContainer.appendChild(traceText);

    // Remove any existing explanation
    const existingExplanation = container.querySelector('.explanation');
    if (existingExplanation) {
      existingExplanation.remove();
    }
    explanationContainer.classList.add('explanation');
    container.appendChild(explanationContainer);
  });

  // Assemble everything
  container.appendChild(knownFramesContainer);
  container.appendChild(blanksContainer);
  container.appendChild(checkButton);

  return container;
}
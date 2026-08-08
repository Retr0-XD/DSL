// Import the renderer functions
import { renderFigureSequence } from './lib/renderFigureSequence.mjs?v=20260808-2';
import { renderLatinSquare } from './lib/renderLatinSquare.mjs?v=20260808-2';
import { renderMathEquation } from './lib/renderMathEquation.mjs?v=20260808-2';

// State
let questionsData = {
  'figure-sequences': [],
  'latin-squares': [],
  'math-equations': []
};
let currentQuestion = null;
let currentType = null;

function normalizeQuestionEntries(type, entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.map(entry => {
    if (typeof entry === 'string') {
      const filename = entry.endsWith('.json') ? entry : `${entry}.json`;
      const id = filename.replace(/\.json$/, '');
      const parts = id.split('-');
      const difficulty = parts[1] || 'low';
      return { id, difficulty, filename };
    }
    return entry;
  });
}

// DOM elements
const appDiv = document.getElementById('app');

// Initialize the app
async function init() {
  // Load index.json
  try {
    const response = await fetch('questions/index.json?v=20260808-2');
    if (!response.ok) {
      throw new Error(`Failed to load index.json: ${response.status}`);
    }
    const rawQuestionsData = await response.json();
    questionsData = {
      'figure-sequences': normalizeQuestionEntries('figure-sequences', rawQuestionsData['figure-sequences']),
      'latin-squares': normalizeQuestionEntries('latin-squares', rawQuestionsData['latin-squares']),
      'math-equations': normalizeQuestionEntries('math-equations', rawQuestionsData['math-equations'])
    };
  } catch (error) {
    console.error('Error loading index.json:', error);
    // Show error to user
    appDiv.innerHTML = '<div class="error">Failed to load question bank. Please check the console.</div>';
    return;
  }
  
  // Render the UI
  renderUI();
}

// Render the main UI with tabs
function renderUI() {
  appDiv.innerHTML = `
    <div class="tab-container">
      <button class="tab-button active" data-tab="figure-sequences">Figure Sequences</button>
      <button class="tab-button" data-tab="latin-squares">Latin Squares</button>
      <button class="tab-button" data-tab="math-equations">Math Equations</button>
      <button class="tab-button" data-tab="add-question">Add Question</button>
    </div>
    <div id="tab-content"></div>
  `;
  
  // Set up tab switching
  const tabButtons = appDiv.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active tab
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show tab content
      const tabName = button.dataset.tab;
      showTabContent(tabName);
    });
  });
  
  // Show first tab by default
  showTabContent('figure-sequences');
}

// Show content for a specific tab
function showTabContent(tabName) {
  const tabContentDiv = document.getElementById('tab-content');
  
  if (tabName === 'add-question') {
    renderAddQuestionTab(tabContentDiv);
  } else {
    renderQuestionListTab(tabContentDiv, tabName);
  }
}

// Render a question list tab (Figure Sequences, Latin Squares, Math Equations)
function renderQuestionListTab(container, type) {
  currentType = type;
  currentQuestion = null;
  
  const questions = questionsData[type] || [];
  
  // Group questions by difficulty
  const grouped = {
    low: [],
    medium: [],
    high: []
  };
  
  questions.forEach(q => {
    const difficulty = (q.difficulty || 'low').toLowerCase();
    if (grouped[difficulty]) {
      grouped[difficulty].push(q);
    } else {
      grouped.low.push(q);
    }
  });
  
  container.innerHTML = `
    <div class="question-list">
      ${Object.keys(grouped).map(difficulty => {
        const diffQuestions = grouped[difficulty];
        if (diffQuestions.length === 0) return '';
        return `
          <div class="question-section">
            <div class="section-header">
              <span>${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
              <span class="difficulty-badge">${diffQuestions.length}</span>
            </div>
            <div class="question-list-inner">
              ${diffQuestions.map(q => `
                <div class="question-item" data-id="${q.id}">
                  <span class="question-id">${q.id}</span>
                  <span class="question-difficulty">${q.difficulty}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <div id="question-detail"></div>
  `;
  
  // Set up click handlers for question items
  const questionItems = container.querySelectorAll('.question-item');
  questionItems.forEach(item => {
    item.addEventListener('click', () => {
      // Update selected item
      questionItems.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      
      // Load and display the question
      const questionId = item.dataset.id;
      loadQuestionDetail(questionId, type);
    });
  });
  
  // If there are questions, select the first one by default
  if (questions.length > 0) {
    const firstItem = container.querySelector('.question-item');
    if (firstItem) {
      firstItem.classList.add('selected');
      loadQuestionDetail(firstItem.dataset.id, type);
    }
  }
}

// Load and display a question's detail view
async function loadQuestionDetail(questionId, type) {
  try {
    // Find the question in our data
    const question = (questionsData[type] || []).find(q => q.id === questionId || q.filename === `${questionId}.json`);
    if (!question) {
      throw new Error(`Question ${questionId} not found`);
    }
    
    // Fetch the full question JSON
    const response = await fetch(`questions/${type}/${questionId}.json?v=20260808-2`);
    if (!response.ok) {
      throw new Error(`Failed to load question ${questionId}: ${response.status}`);
    }
    const fullQuestion = await response.json();
    
    // Store current question
    currentQuestion = fullQuestion;
    
    // Render the question detail
    const detailContainer = document.getElementById('question-detail');
    detailContainer.innerHTML = '<div class="loading">Loading question...</div>';
    
    // Render based on type
    let questionElement;
    switch (type) {
      case 'figure-sequences':
        questionElement = renderFigureSequence(fullQuestion);
        break;
      case 'latin-squares':
        questionElement = renderLatinSquare(fullQuestion);
        break;
      case 'math-equations':
        questionElement = renderMathEquation(fullQuestion);
        break;
      default:
        throw new Error(`Unknown question type: ${type}`);
    }
    
    detailContainer.innerHTML = '';
    detailContainer.appendChild(questionElement);
  } catch (error) {
    console.error('Error loading question detail:', error);
    const detailContainer = document.getElementById('question-detail');
    detailContainer.innerHTML = `<div class="error">Error loading question: ${error.message}</div>`;
  }
}

// Render the "Add Question" tab
function renderAddQuestionTab(container) {
  if (!container) {
    console.error('Add Question tab container is missing');
    return;
  }

  container.innerHTML = `
    <div class="add-question-container">
      <h2>Add Question</h2>
      <textarea id="question-json" placeholder="Paste a raw JSON question object here..."></textarea>
      <div class="button-group">
        <button id="preview-btn">Preview</button>
        <button id="download-btn" class="secondary">Download as file</button>
      </div>
      <div id="preview-area"></div>
      <div class="reminder">
        <strong>Reminder:</strong> Save this file into questions/<type>/ and add its filename to questions/index.json, then refresh the page.
      </div>
    </div>
  `;
  
  const textarea = container.querySelector('#question-json');
  const previewBtn = container.querySelector('#preview-btn');
  const downloadBtn = container.querySelector('#download-btn');
  const previewArea = container.querySelector('#preview-area');

  if (!textarea || !previewBtn || !downloadBtn || !previewArea) {
    console.error('Add Question tab markup is incomplete');
    return;
  }
  
  previewBtn.addEventListener('click', () => {
    const jsonText = textarea.value.trim();
    if (!jsonText) {
      previewArea.innerHTML = '<div class="error">Please paste a JSON question object</div>';
      return;
    }
    
    try {
      const question = JSON.parse(jsonText);
      
      // Validate required fields
      if (!question.id || !question.type || !question.difficulty) {
        previewArea.innerHTML = '<div class="error">Question must have id, type, and difficulty fields</div>';
        return;
      }
      
      // Check if type is valid
      const validTypes = ['figure-sequence', 'latin-square', 'math-equation'];
      if (!validTypes.includes(question.type)) {
        previewArea.innerHTML = `<div class="error">Invalid type. Must be one of: ${validTypes.join(', ')}</div>`;
        return;
      }
      
      // Show preview
      previewArea.innerHTML = '<div class="loading">Rendering preview...</div>';
      
      // Render based on type
      let previewElement;
      try {
        switch (question.type) {
          case 'figure-sequence':
            previewElement = renderFigureSequence(question);
            break;
          case 'latin-square':
            previewElement = renderLatinSquare(question);
            break;
          case 'math-equation':
            previewElement = renderMathEquation(question);
            break;
          default:
            throw new Error(`Unknown question type: ${question.type}`);
        }
        
        previewArea.innerHTML = '';
        previewArea.appendChild(previewElement);
        
        // Enable download button
        downloadBtn.disabled = false;
        downloadBtn.dataset.questionJson = jsonText;
        downloadBtn.dataset.questionId = question.id;
        downloadBtn.dataset.questionType = question.type;
      } catch (renderError) {
        console.error('Error rendering preview:', renderError);
        previewArea.innerHTML = `<div class="error">Error rendering question: ${renderError.message}</div>`;
        downloadBtn.disabled = true;
      }
    } catch (parseError) {
      previewArea.innerHTML = `<div class="error">Invalid JSON: ${parseError.message}</div>`;
      downloadBtn.disabled = true;
    }
  });
  
  downloadBtn.addEventListener('click', () => {
    const jsonText = downloadBtn.dataset.questionJson;
    if (!jsonText) {
      alert('Please preview a question first');
      return;
    }
    
    const questionId = downloadBtn.dataset.questionId || 'unknown';
    const questionType = downloadBtn.dataset.questionType || 'unknown';
    const filename = `${questionId}.json`;
    
    // Create a blob and trigger download
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show reminder
    alert(`Question saved as ${filename}\n\nRemember to:\n1. Save this file into questions/${questionType}/\n2. Add "${filename}" to the "${questionType}" array in questions/index.json\n3. Refresh the page to see the new question`);
  });
  
  // Initially disable download button
  downloadBtn.disabled = true;
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
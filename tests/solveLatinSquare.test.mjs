import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateLatinSquare } from '../lib/solveLatinSquare.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('solves the sample Latin square puzzle when the blank cell is stored as null', () => {
  const questionPath = path.join(__dirname, '..', 'questions', 'latin-squares', 'ls-low-0001.json');
  const question = JSON.parse(readFileSync(questionPath, 'utf8'));

  const result = validateLatinSquare(question);

  assert.equal(result.solvable, true);
  assert.equal(result.unique, true);
  assert.equal(result.solvedValueAtBlank, 'D');
});

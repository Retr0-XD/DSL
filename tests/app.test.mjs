import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeQuestionEntries } from '../app.mjs';

test('normalizes string-based question entries from the index into displayable objects', () => {
  const entries = ['fs-low-0001.json', 'fs-medium-0002.json'];

  const normalized = normalizeQuestionEntries('figure-sequences', entries);

  assert.deepEqual(normalized, [
    { id: 'fs-low-0001', difficulty: 'low', filename: 'fs-low-0001.json', type: 'figure-sequences' },
    { id: 'fs-medium-0002', difficulty: 'medium', filename: 'fs-medium-0002.json', type: 'figure-sequences' }
  ]);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { percentages } from '../js/percentages.js';

test('합이 100이 되도록 반올림한다', () => {
  const p = percentages({ A: 1, B: 1, C: 1 });
  assert.equal(p.A + p.B + p.C, 100);
  assert.deepEqual(Object.values(p).sort(), [33, 33, 34]);
});

test('나누어떨어지면 그대로', () => {
  assert.deepEqual(percentages({ A: 3, B: 1 }), { A: 75, B: 25 });
});

test('0표인 키는 0%, 전부 0표면 모두 0%', () => {
  assert.deepEqual(percentages({ A: 0, B: 2, C: 0, D: 0 }), { A: 0, B: 100, C: 0, D: 0 });
  assert.deepEqual(percentages({ A: 0, B: 0 }), { A: 0, B: 0 });
});

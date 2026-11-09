import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stance, STANCES } from '../experiments/schrodinger/stance.js';

test('A, B → 실재론', () => {
  assert.equal(stance('A').key, 'realism');
  assert.equal(stance('B').key, 'realism');
});

test('C → 다세계 해석', () => {
  assert.equal(stance('C').key, 'many-worlds');
});

test('D → 코펜하겐 해석', () => {
  assert.equal(stance('D').key, 'copenhagen');
});

test('STANCES는 실재론, 코펜하겐, 다세계 순서이고 이름과 설명이 있다', () => {
  assert.deepEqual(STANCES.map((s) => s.key), ['realism', 'copenhagen', 'many-worlds']);
  for (const s of STANCES) {
    assert.ok(s.name && s.line && s.who);
  }
});

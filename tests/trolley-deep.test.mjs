import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEEP_KEYS, deepKey, crossRate, deepTally, isSameStance } from '../experiments/trolley/deep.js';

test('deepKey: 앞 글자 장면 1, 뒤 글자 심화', () => {
  assert.equal(deepKey('A', 'B'), 'AB');
  assert.equal(deepKey('B', 'C'), 'BC');
});

test('DEEP_KEYS는 장면 1(A, B) × 심화 답의 모든 조합이다', () => {
  assert.deepEqual(DEEP_KEYS[1], ['A', 'B'].flatMap((s) => ['A', 'B'].map((d) => deepKey(s, d))));
  assert.deepEqual(DEEP_KEYS[2], ['A', 'B'].flatMap((s) => ['A', 'B', 'C'].map((d) => deepKey(s, d))));
});

test('crossRate: 장면 1에서 X를 고른 사람 중 심화에서 Y를 고른 비율', () => {
  const counts = { AA: 3, AB: 1, BA: 10, BB: 6 };
  assert.equal(crossRate(counts, 'A', 'A'), 0.75);
  assert.equal(crossRate(counts, 'A', 'B'), 0.25);
  assert.equal(crossRate(counts, 'B', 'A'), 10 / 16);
});

test('crossRate: 그 집단이 0명이면 null', () => {
  assert.equal(crossRate({ AA: 0, AB: 0, BA: 4, BB: 1 }, 'A', 'A'), null);
});

test('crossRate: 세 갈래 키도 같은 방식', () => {
  const counts = { AA: 1, AB: 2, AC: 1, BA: 5, BB: 0, BC: 0 };
  assert.equal(crossRate(counts, 'A', 'C'), 0.25);
});

test('deepTally: 장면 1 답과 상관없이 심화 답별로 합친다', () => {
  assert.deepEqual(deepTally({ AA: 1, AB: 2, AC: 1, BA: 5, BB: 0, BC: 3 }), { A: 6, B: 2, C: 4 });
});

test('isSameStance: 심화 1은 A가 당긴다', () => {
  assert.equal(isSameStance('A', 1, 'A'), true);
  assert.equal(isSameStance('A', 1, 'B'), false);
  assert.equal(isSameStance('B', 1, 'B'), true);
});

test('isSameStance: 심화 2는 B와 C가 당긴다', () => {
  assert.equal(isSameStance('A', 2, 'B'), true);
  assert.equal(isSameStance('A', 2, 'C'), true);
  assert.equal(isSameStance('A', 2, 'A'), false);
  assert.equal(isSameStance('B', 2, 'A'), true);
  assert.equal(isSameStance('B', 2, 'C'), false);
});

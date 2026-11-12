import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tally, observationLine } from '../experiments/schrodinger/observe.js';

const run = (alive, dead) => [...Array(alive).fill('alive'), ...Array(dead).fill('dead')];

test('tally counts and rounds the alive share', () => {
  assert.deepEqual(tally(run(1, 2)), { total: 3, alive: 1, dead: 2, alivePct: 33 });
  assert.deepEqual(tally([]), { total: 0, alive: 0, dead: 0, alivePct: 0 });
});

test('few hand opens warn about straying from half', () => {
  assert.equal(observationLine(run(1, 4)),
    '5번 열어서 살아 있음 1번, 쓰러짐 4번(살아 있음 20%). 열어 본 횟수가 적으면 반반에서 꽤 벗어날 수 있다.');
});

test('many hand opens skip the warning', () => {
  assert.equal(observationLine(run(11, 9)), '20번 열어서 살아 있음 11번, 쓰러짐 9번(살아 있음 55%).');
});

test('bulk opens compare the hand share with the total share', () => {
  const opens = [...run(1, 4), ...run(51, 49)];
  assert.equal(observationLine(opens, 5),
    '손으로 연 5번은 살아 있음 20%였다. 100개를 더 열자 전체 105번 중 살아 있음 50%가 됐다.');
});

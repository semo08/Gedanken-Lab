import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seat, isCorrect, score, layout, splitTell } from '../experiments/imitation/judge.js';
import { ROUNDS } from '../experiments/imitation/rounds.js';

test('seat: 난수가 0.5 미만이면 X, 아니면 Y', () => {
  assert.equal(seat(() => 0.2), 'X');
  assert.equal(seat(() => 0.7), 'Y');
});

test('seat: 고정 시드 난수로 1000번 뽑으면 X와 Y가 대략 반반', () => {
  let s = 42;
  const random = () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  let x = 0;
  for (let i = 0; i < 1000; i++) if (seat(random) === 'X') x++;
  assert.ok(x > 400 && x < 600, `X ${x}번`);
});

test('isCorrect: 기계 자리를 골라야 정답', () => {
  assert.equal(isCorrect('X', 'X'), true);
  assert.equal(isCorrect('X', 'Y'), false);
});

test('score: 맞힌 수와 전체 수', () => {
  assert.deepEqual(score([true, false, true]), { correct: 2, total: 3 });
  assert.deepEqual(score([]), { correct: 0, total: 0 });
});

test('layout: 기계 자리에 따라 X와 Y의 답이 바뀐다', () => {
  const round = { turns: [{ q: '질문', human: '사람 답', machine: '기계 답' }] };
  assert.deepEqual(layout(round, 'X'), [{ q: '질문', X: '기계 답', Y: '사람 답' }]);
  assert.deepEqual(layout(round, 'Y'), [{ q: '질문', X: '사람 답', Y: '기계 답' }]);
});

test('splitTell: 단서를 기준으로 문장을 셋으로 나눈다', () => {
  assert.deepEqual(splitTell('비가 오면 어떤 기분이 드나요?', '어떤 기분'), ['비가 오면 ', '어떤 기분', '이 드나요?']);
  assert.equal(splitTell('비가 와요', '기분'), null);
  assert.equal(splitTell('비가 와요', undefined), null);
});

test('단서는 기계 답 안에 그대로 있고, 마지막 라운드에는 단서가 없다', () => {
  for (const r of ROUNDS.slice(0, -1)) {
    for (const t of r.turns) assert.ok(t.tell && splitTell(t.machine, t.tell.text) && t.tell.note, t.machine);
  }
  assert.ok(ROUNDS.at(-1).turns.every((t) => !t.tell));
});

test('라운드는 3개이고, 각 라운드는 질문 3~4개와 공개 문구를 가진다', () => {
  assert.equal(ROUNDS.length, 3);
  for (const r of ROUNDS) {
    assert.ok(r.era && r.label && r.reveal);
    assert.ok(r.turns.length >= 3 && r.turns.length <= 4);
    for (const t of r.turns) assert.ok(t.q && t.human && t.machine);
  }
});

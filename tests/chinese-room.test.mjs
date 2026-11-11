import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stance, STANCES } from '../experiments/chinese-room/stance.js';
import { NOTES, PAGES, PAGE_HINTS, expected, check } from '../experiments/chinese-room/rules.js';
import { GLYPHS } from '../experiments/chinese-room/glyphs.js';

test('입장: A 설, B 시스템 반론, C 다른 마음 반론', () => {
  assert.equal(stance('A').key, 'searle');
  assert.equal(stance('B').key, 'systems');
  assert.equal(stance('C').key, 'other-minds');
});

test('STANCES는 표시 순서가 고정이고, 이름·설명·설의 재반박이 있다', () => {
  assert.deepEqual(STANCES.map((s) => s.key), ['searle', 'systems', 'other-minds']);
  for (const s of STANCES) assert.ok(s.name && s.who && s.line && s.reply);
});

test('기호는 12개이고 id가 겹치지 않는다', () => {
  assert.equal(GLYPHS.length, 12);
  assert.equal(new Set(GLYPHS.map((g) => g.id)).size, 12);
});

test('쪽지는 5장이고, 모든 쪽지와 규칙은 정의된 기호만 쓴다', () => {
  const ids = new Set(GLYPHS.map((g) => g.id));
  assert.equal(NOTES.length, 5);
  for (const note of NOTES) note.incoming.forEach((id) => assert.ok(ids.has(id), id));
  for (const page of Object.values(PAGES)) {
    for (const rule of page) [...(rule.pattern ?? []), ...rule.out].forEach((id) => assert.ok(ids.has(id), id));
  }
});

// 정답을 차례로 내보낸 기록을 만든다
function correctHistory(upTo) {
  const history = [];
  for (let i = 0; i < upTo; i++) history.push(expected(i, history));
  return history;
}

test('쪽지 1~2: 단순 대응', () => {
  assert.deepEqual(expected(0, []), ['g01', 'g02']);
  assert.deepEqual(expected(1, correctHistory(1)), ['g05', 'g06', 'g07']);
});

test('쪽지 3~4: 맨 끝 기호에 따라 답이 갈린다', () => {
  assert.deepEqual(expected(2, correctHistory(2)), ['g09', 'g04']);
  assert.deepEqual(expected(3, correctHistory(3)), ['g08', 'g10']);
});

test('쪽지 5: 직전에 내보낸 쪽지에 따라 답이 갈린다', () => {
  const history = correctHistory(4);
  assert.deepEqual(expected(4, history), ['g12']);
  const otherHistory = [...history.slice(0, 3), ['g04']]; // 직전 답이 '좋아'로 끝나지 않았다면
  assert.deepEqual(expected(4, otherHistory), ['g01']);
});

test('check: 순서까지 같아야 맞다', () => {
  assert.equal(check(0, ['g01', 'g02'], []), true);
  assert.equal(check(0, ['g02', 'g01'], []), false);
  assert.equal(check(0, ['g01'], []), false);
});

test('PAGE_HINTS는 PAGES의 모든 키를 가진다', () => {
  assert.deepEqual(Object.keys(PAGE_HINTS).sort(), Object.keys(PAGES).sort());
  for (const hint of Object.values(PAGE_HINTS)) assert.ok(typeof hint === 'string' && hint.length > 0);
});

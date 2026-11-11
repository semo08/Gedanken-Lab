import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLANKS, KEYS, boundary, voteKey, survival } from '../experiments/theseus/line.js';
import { stance, STANCES } from '../experiments/theseus/stance.js';

const yes = (n) => Array(n).fill(true);

test('판자는 10장, 키는 P1~P10과 KEEP', () => {
  assert.equal(PLANKS, 10);
  assert.deepEqual(KEYS, ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'KEEP']);
});

test('boundary: 처음 "아니다"가 나온 판자 번호(1부터)', () => {
  assert.equal(boundary([false]), 1);
  assert.equal(boundary([...yes(3), false]), 4);
  assert.equal(boundary([...yes(9), false]), 10);
  assert.equal(boundary([true, false, true, false]), 2);
});

test('boundary: 10장 내내 "그렇다"면 KEEP, 아직 덜 끝났으면 null', () => {
  assert.equal(boundary(yes(10)), 'KEEP');
  assert.equal(boundary(yes(4)), null);
  assert.equal(boundary([]), null);
});

test('voteKey: 경계선을 투표 키로', () => {
  assert.equal(voteKey(1), 'P1');
  assert.equal(voteKey(10), 'P10');
  assert.equal(voteKey('KEEP'), 'KEEP');
});

const counts = (partial) => Object.fromEntries(KEYS.map((k) => [k, partial[k] ?? 0]));

test('survival: 아무도 없으면 빈 배열', () => {
  assert.deepEqual(survival(counts({})), []);
});

test('survival: 전부 KEEP이면 0~10장 내내 100%', () => {
  assert.deepEqual(survival(counts({ KEEP: 5 })), Array(11).fill(1));
});

test('survival: n장 교체 뒤에도 같은 배라고 본 비율 (경계선이 n보다 뒤인 사람)', () => {
  // 4명: 1번째에서 아니다 1명, 3번째에서 1명, 10번째에서 1명, 끝까지 1명
  const s = survival(counts({ P1: 1, P3: 1, P10: 1, KEEP: 1 }));
  assert.equal(s.length, 11);
  assert.equal(s[0], 1);      // 아무것도 안 바꿨을 때는 모두 같은 배
  assert.equal(s[1], 0.75);   // 1장 바꾸자 1명 이탈
  assert.equal(s[2], 0.75);
  assert.equal(s[3], 0.5);
  assert.equal(s[9], 0.5);
  assert.equal(s[10], 0.25);  // 10장 다 바꿔도 같은 배라는 사람은 KEEP 1명
});

test('입장: A 연속성, B 재료, C 규약', () => {
  assert.equal(stance('A').key, 'continuity');
  assert.equal(stance('B').key, 'material');
  assert.equal(stance('C').key, 'convention');
  assert.deepEqual(STANCES.map((s) => s.key), ['continuity', 'material', 'convention']);
  for (const s of STANCES) assert.ok(s.name && s.line);
});

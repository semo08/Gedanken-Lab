import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSim, step, temps, counts, WALL_X, DOOR_TOP, DOOR_BOTTOM } from '../experiments/maxwell/sim.js';
import { roomEntropy, createLedger } from '../experiments/maxwell/entropy.js';

// 입자 하나가 문 높이에서 벽을 향해 오른쪽으로 달려가는 상황
function oneParticleAtDoor() {
  const sim = createSim({ nFast: 0, nSlow: 0 });
  sim.particles.push({ x: WALL_X - 10, y: (DOOR_TOP + DOOR_BOTTOM) / 2, vx: 300, vy: 0, fast: true });
  return sim;
}

test('문이 닫혀 있으면 벽에서 튕겨 나온다', () => {
  const sim = oneParticleAtDoor();
  const crossed = step(sim, 0.05, false);
  assert.equal(crossed.length, 0);
  assert.ok(sim.particles[0].x < WALL_X);
  assert.ok(sim.particles[0].vx < 0);
});

test('문이 열려 있으면 지나간다', () => {
  const sim = oneParticleAtDoor();
  const crossed = step(sim, 0.05, true);
  assert.deepEqual(crossed, [{ fast: true, toLeft: false }]);
  assert.ok(sim.particles[0].x > WALL_X);
});

test('문 높이가 아니면 열려 있어도 벽에 막힌다', () => {
  const sim = oneParticleAtDoor();
  sim.particles[0].y = DOOR_TOP - 40;
  assert.equal(step(sim, 0.05, true).length, 0);
});

test('입자 수는 기본 20 + 20이고, 속도 크기는 스텝 후에도 그대로다', () => {
  const sim = createSim();
  const speeds = sim.particles.map((p) => Math.hypot(p.vx, p.vy));
  for (let i = 0; i < 200; i++) step(sim, 1 / 60, i % 2 === 0);
  assert.equal(sim.particles.length, 40);
  sim.particles.forEach((p, i) => assert.ok(Math.abs(Math.hypot(p.vx, p.vy) - speeds[i]) < 1e-9));
});

test('빠른 입자만 있는 방이 느린 입자만 있는 방보다 뜨겁고, 빈 방은 null', () => {
  const sim = createSim({ nFast: 0, nSlow: 0 });
  sim.particles.push({ x: 100, y: 100, vx: 240, vy: 0, fast: true });
  sim.particles.push({ x: 700, y: 100, vx: 90, vy: 0, fast: false });
  const t = temps(sim);
  assert.ok(t.left > t.right);
  sim.particles.pop();
  assert.equal(temps(sim).right, null);
});

test('counts는 왼쪽 방의 빠른/느린 입자 수를 센다', () => {
  const sim = createSim({ nFast: 0, nSlow: 0 });
  sim.particles.push({ x: 100, y: 100, vx: 1, vy: 0, fast: true });
  sim.particles.push({ x: 700, y: 100, vx: 1, vy: 0, fast: false });
  assert.deepEqual(counts(sim), { fastLeft: 1, nFast: 1, slowLeft: 0, nSlow: 1 });
});

test('방의 엔트로피: 반반 섞이면 최대(입자 수), 완전 분류면 0', () => {
  assert.equal(roomEntropy({ fastLeft: 10, nFast: 20, slowLeft: 10, nSlow: 20 }), 40);
  assert.equal(roomEntropy({ fastLeft: 20, nFast: 20, slowLeft: 0, nSlow: 20 }), 0);
  const partly = roomEntropy({ fastLeft: 15, nFast: 20, slowLeft: 5, nSlow: 20 });
  assert.ok(partly > 0 && partly < 40);
});

test('기억을 지우면 열이 생기고, 지운 뒤 전체(방 + 열)는 처음보다 작지 않다', () => {
  const ledger = createLedger(40);
  for (let i = 0; i < 5; i++) ledger.record();
  assert.equal(ledger.stored, 5);
  const heat = ledger.erase(10); // 방 엔트로피 40 → 10, 기록 5비트
  assert.equal(heat, 30);
  assert.equal(ledger.stored, 0);
  assert.ok(ledger.total(10) >= 40);
});

test('줄인 엔트로피보다 기록이 많으면 지운 비트만큼 열이 생긴다 (란다우어 하한)', () => {
  const ledger = createLedger(40);
  for (let i = 0; i < 12; i++) ledger.record();
  assert.equal(ledger.erase(38), 12);
  assert.equal(ledger.heat, 12);
});

test('여러 번 지워도 전체는 처음보다 작아지지 않는다', () => {
  const ledger = createLedger(40);
  for (const room of [35, 28, 30, 12, 3]) {
    ledger.record(); ledger.record();
    ledger.erase(room);
    assert.ok(ledger.total(room) >= 40);
  }
});

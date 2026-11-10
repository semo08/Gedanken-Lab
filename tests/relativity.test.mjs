import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gamma, trip, tickYears, diagram, formatYears, formatAge } from '../experiments/twin/relativity.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('gamma: 광속의 80%면 5/3, 정지에 가까우면 1에 가깝다', () => {
  close(gamma(0.8), 5 / 3);
  close(gamma(0.6), 1.25);
  assert.ok(gamma(0.001) - 1 < 1e-6);
});

test('trip: 프록시마(4.2광년), 광속 80% → 지구 10.5년, 우주선 6.3년, 차이 4.2년', () => {
  const t = trip(4.2, 0.8);
  close(t.earthYears, 10.5);
  close(t.shipYears, 6.3);
  close(t.diffYears, 4.2);
  close(t.gamma, 5 / 3);
});

test('trip: 베텔게우스(550광년), 광속 99.9% → 지구 약 1,101년, 우주선 약 49년', () => {
  const t = trip(550, 0.999);
  assert.equal(Math.round(t.earthYears), 1101);
  assert.equal(Math.round(t.shipYears), 49);
});

test('tickYears: 지구 쪽 점이 20개 이하가 되는 가장 작은 간격', () => {
  assert.equal(tickYears(10.5), 1);
  assert.equal(tickYears(20), 1);
  assert.equal(tickYears(21), 2);
  assert.equal(tickYears(100), 5);
  assert.equal(tickYears(1101), 100);
  assert.equal(tickYears(0.5), 1);
});

test('diagram: 모든 좌표가 영역 안에 있고, 우주선 경로는 별에서 꺾인다', () => {
  for (const [d, v] of [[4.2, 0.1], [4.2, 0.8], [40, 0.99], [550, 0.999]]) {
    const g = diagram(d, v, 600, 400);
    const pts = [g.earth.start, g.earth.end, ...g.ship, ...g.earthTicks, ...g.shipTicks];
    for (const p of pts) {
      assert.ok(p.x >= 0 && p.x <= 600 && p.y >= 0 && p.y <= 400, `${d}ly ${v}c: (${p.x}, ${p.y})`);
    }
    const [start, turn, end] = g.ship;
    assert.ok(turn.x > start.x);
    close(start.x, end.x);
    close(turn.y, (start.y + end.y) / 2);
  }
});

test('diagram: 우주선 시계의 점이 지구 시계의 점보다 적다 (시간이 덜 간다)', () => {
  const g = diagram(4.2, 0.8, 600, 400);
  assert.equal(g.earthTicks.length, 11); // 0~10년
  assert.equal(g.shipTicks.length, 7);   // 0~6년
});

test('formatYears: 1년 미만은 개월, 100년 이상은 정수와 쉼표', () => {
  assert.equal(formatYears(0.5), '6개월');
  assert.equal(formatYears(10.5), '10.5년');
  assert.equal(formatYears(1101.1), '1,101년');
});

test('formatAge: 20살에 더해 소수 한 자리, 100살 이상은 정수', () => {
  assert.equal(formatAge(20 + 6.3), '26.3살');
  assert.equal(formatAge(20 + 1101.1), '1,121살');
});

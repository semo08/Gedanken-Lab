// 두 방 기체 시뮬레이션. DOM 없이 동작하는 순수 모듈이다(그리기는 maxwell.js가 한다).
// 입자끼리는 부딪히지 않고 벽에서만 튕긴다. 그래서 속도 크기가 변하지 않고,
// 방의 온도는 오직 문을 통과하는 입자로만 바뀐다.

export const W = 800;
export const H = 400;
export const WALL_X = 400;
export const DOOR_TOP = 150;
export const DOOR_BOTTOM = 250;
export const R = 6;               // 입자 반지름
export const FAST = 240;          // 논리 좌표/초
export const SLOW = 90;

// 다 섞인 상태의 평균 v²가 30°가 되도록 맞춘 눈금
const TEMP_SCALE = 30 / ((FAST ** 2 + SLOW ** 2) / 2);

function particle(fast, left, random) {
  const speed = fast ? FAST : SLOW;
  const angle = random() * Math.PI * 2;
  const room = WALL_X - 3 * R; // 벽에서 조금 떨어진 곳에 놓는다
  const x = left ? R + random() * (room - R) : W - R - random() * (room - R);
  return { x, y: R + random() * (H - 2 * R), vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, fast };
}

// 빠른/느린 입자를 양쪽 방에 번갈아 놓아서, 처음 온도 차는 0이고 방의 엔트로피는 최대에서 시작한다
export function createSim({ nFast = 20, nSlow = 20, random = Math.random } = {}) {
  const particles = [];
  for (let i = 0; i < nFast; i++) particles.push(particle(true, i % 2 === 0, random));
  for (let i = 0; i < nSlow; i++) particles.push(particle(false, i % 2 === 0, random));
  return { particles };
}

function inDoorway(y) {
  return y >= DOOR_TOP + R && y <= DOOR_BOTTOM - R;
}

/** dt초만큼 움직인다. @returns 이번 스텝에 문을 통과한 입자 목록 [{ fast, toLeft, p }] */
export function step(sim, dt, doorOpen) {
  dt = Math.min(dt, 0.05); // 탭 전환 후 큰 dt로 벽을 뚫지 않게
  const crossed = [];
  for (const p of sim.particles) {
    let nx = p.x + p.vx * dt;
    let ny = p.y + p.vy * dt;

    if (ny < R) { ny = 2 * R - ny; p.vy = -p.vy; }
    if (ny > H - R) { ny = 2 * (H - R) - ny; p.vy = -p.vy; }
    if (nx < R) { nx = 2 * R - nx; p.vx = -p.vx; }
    if (nx > W - R) { nx = 2 * (W - R) - nx; p.vx = -p.vx; }

    const wasLeft = p.x < WALL_X;
    const passable = doorOpen && inDoorway(ny);
    if (wasLeft && nx > WALL_X - R && !passable) {
      nx = 2 * (WALL_X - R) - nx; p.vx = -p.vx;
    } else if (!wasLeft && nx < WALL_X + R && !passable) {
      nx = 2 * (WALL_X + R) - nx; p.vx = -p.vx;
    }

    const nowLeft = nx < WALL_X;
    if (nowLeft !== wasLeft) crossed.push({ fast: p.fast, toLeft: nowLeft, p });
    p.x = nx;
    p.y = ny;
  }
  return crossed;
}

/** 목표(빠른 입자는 왼쪽, 느린 입자는 오른쪽)에 맞는 통과인가 */
export function goodCrossing({ fast, toLeft }) {
  return fast === toLeft;
}

/**
 * 악마의 눈: 지금 문을 열면 목표에 맞게 넘어갈 입자인가.
 * 벽까지 horizon초 안에 닿고, 닿는 높이가 문 안이면 true. 위아래 벽에서 튕기는 경우는 무시한다.
 */
export function worthOpening(p, horizon = 0.5) {
  const left = p.x < WALL_X;
  if (p.fast === left) return false; // 이미 맞는 방에 있다
  // 벽 중심까지 잰다. 문 틈 안에 들어온 입자도 다 넘어갈 때까지 표시해야 문을 일찍 닫지 않는다
  const t = (WALL_X - p.x) / p.vx;
  if (!(t >= 0 && t <= horizon)) return false; // 벽에서 멀어지는 중이거나 아직 멀다
  return inDoorway(p.y + p.vy * t);
}

/** 각 방의 온도(평균 v² 눈금). 빈 방은 null. */
export function temps(sim) {
  const sum = { left: 0, right: 0 };
  const n = { left: 0, right: 0 };
  for (const p of sim.particles) {
    const side = p.x < WALL_X ? 'left' : 'right';
    sum[side] += p.vx ** 2 + p.vy ** 2;
    n[side] += 1;
  }
  return {
    left: n.left ? (sum.left / n.left) * TEMP_SCALE : null,
    right: n.right ? (sum.right / n.right) * TEMP_SCALE : null,
  };
}

export function counts(sim) {
  const c = { fastLeft: 0, nFast: 0, slowLeft: 0, nSlow: 0 };
  for (const p of sim.particles) {
    const left = p.x < WALL_X;
    if (p.fast) { c.nFast += 1; if (left) c.fastLeft += 1; } else { c.nSlow += 1; if (left) c.slowLeft += 1; }
  }
  return c;
}

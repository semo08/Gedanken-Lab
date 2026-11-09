import { createSim, step, temps, counts, W, H, WALL_X, DOOR_TOP, DOOR_BOTTOM, R } from './sim.js';
import { roomEntropy, createLedger } from './entropy.js';
import { renderOtherExperiments } from '../../js/other-experiments.js';

const VOTE_ID = 'maxwell';
const WIN_DIFF = 12;      // "2법칙을 깼다?!" 기준 온도 차 (완벽한 악마 기준 중앙값 약 20초)
const CAPACITY = 8;       // 반전 이후 악마의 기억 용량(비트)
const MAX_ENTROPY = 40;   // 입자 40개가 다 섞였을 때
const SCALE = MAX_ENTROPY * 2; // 장부 막대의 눈금

const COLOR = { ink: '#1B1F2A', a: '#B4470F', b: '#1F4E9C', rule: '#CBD2DE', white: '#FFFFFF', muted: '#5B6170' };

const $ = (id) => document.getElementById(id);
const sections = [...document.querySelectorAll('[data-step]')];
const canvas = $('chamber');
const ctx = canvas.getContext('2d');

let prediction = null;
let state;
let statsRun = 0;
let frame = null;
let last = 0;

function freshState() {
  const sim = createSim();
  const start = roomEntropy(counts(sim));
  return {
    sim,
    ledger: createLedger(start),
    phase: 'sort',       // 'sort' → 'reveal'
    held: false,
    erasedOnce: false,
    crossings: 0,
    maxDiff: 0,
    minRoom: start,
    bannerShown: false,
    shownBits: -1,
  };
}

// ── 화면 전환 ──

function show(step) {
  for (const s of sections) s.hidden = s.dataset.step !== String(step);
  window.scrollTo(0, 0);
  document.querySelector(`[data-step="${step}"] h1`).focus({ preventScroll: true });
  if (String(step) === '2') start(); else stop();
}

function pick(choice) {
  prediction = choice;
  for (const btn of document.querySelectorAll('[data-step="1"] .choice')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.choice === choice));
  }
  document.querySelector('[data-step="1"] .next').hidden = false;
}

// ── 문 ──

function locked() {
  if (state.phase !== 'reveal') return false;
  return !state.erasedOnce || state.ledger.stored >= CAPACITY;
}

function setHeld(held) {
  state.held = held;
  $('door').setAttribute('aria-pressed', String(held && !locked()));
}

function syncDoorButton() {
  const isLocked = locked();
  $('door').disabled = isLocked; // 버튼 글자는 CSS가 :disabled로 바꾼다
  if (isLocked) setHeld(false);
}

// ── 루프 ──

function start() {
  resizeCanvas();
  if (frame) return;
  last = performance.now();
  frame = requestAnimationFrame(tick);
}

function stop() {
  if (frame) cancelAnimationFrame(frame);
  frame = null;
  if (state) setHeld(false);
}

function tick(now) {
  const dt = (now - last) / 1000;
  last = now;
  const open = state.held && !locked();
  for (const c of step(state.sim, dt, open)) {
    state.crossings += 1;
    state.ledger.record();
  }
  update(open);
  draw(open);
  frame = requestAnimationFrame(tick);
}

// ── 계기판 ──

const fmtT = (t) => (t === null ? '—' : `${Math.round(t)}°`);
const pct = (v, scale) => `${Math.max(0, Math.min(100, (v / scale) * 100))}%`;

function update() {
  const t = temps(state.sim);
  const room = roomEntropy(counts(state.sim));
  const diff = t.left !== null && t.right !== null ? t.left - t.right : 0;
  state.maxDiff = Math.max(state.maxDiff, diff);
  state.minRoom = Math.min(state.minRoom, room);

  $('temp-left').textContent = fmtT(t.left);
  $('temp-right').textContent = fmtT(t.right);
  $('temp-diff').textContent = `온도 차 ${diff >= 0 ? '+' : ''}${Math.round(diff)}°`;

  $('room-value').textContent = `${room.toFixed(1)} / 처음 ${state.ledger.start.toFixed(1)}`;
  $('room-fill').style.width = pct(room, MAX_ENTROPY);
  $('room-start').style.left = pct(state.ledger.start, MAX_ENTROPY);

  if (state.phase === 'sort' && !state.bannerShown && diff >= WIN_DIFF) {
    state.bannerShown = true;
    $('banner').hidden = false;
    $('hint').textContent = '왼쪽 방이 뜨거워졌다! 아래를 보자';
  }

  if (state.phase === 'reveal') updateLedger(room);
  syncDoorButton();
}

function updateLedger(room) {
  const { ledger } = state;
  if (ledger.stored !== state.shownBits) {
    state.shownBits = ledger.stored;
    const shown = Math.min(ledger.stored, 60);
    const cells = [];
    for (let i = 0; i < shown; i++) cells.push(Object.assign(document.createElement('span'), { className: 'bit' }));
    if (state.erasedOnce) {
      for (let i = ledger.stored; i < CAPACITY; i++) cells.push(Object.assign(document.createElement('span'), { className: 'bit bit--empty' }));
    }
    $('bits').replaceChildren(...cells);
    $('bits-value').textContent = state.erasedOnce ? `${ledger.stored} / ${CAPACITY}비트` : `${ledger.stored}비트`;
    if (state.erasedOnce && ledger.stored >= CAPACITY) {
      $('ledger-msg').textContent = '기억이 가득 찼다. 악마의 머리도 물리적인 장치라서 빈칸이 없으면 더 기록할 수 없다. 지워야 문을 다시 열 수 있다.';
    }
  }
  $('l-room-value').textContent = room.toFixed(1);
  $('l-room-fill').style.width = pct(room, SCALE);
  $('l-room-start').style.left = pct(ledger.start, SCALE);
  $('heat-value').textContent = ledger.heat.toFixed(1);
  $('heat-fill').style.width = pct(ledger.heat, SCALE);
  const total = ledger.total(room);
  $('total-value').textContent = `${total.toFixed(1)} / 처음 ${ledger.start.toFixed(1)}`;
  $('total-fill').style.width = pct(total, SCALE);
  $('total-start').style.left = pct(ledger.start, SCALE);
}

// ── 반전 ──

function reveal() {
  state.phase = 'reveal';
  $('banner').hidden = true;
  $('sort-footer').hidden = true;
  $('ledger').hidden = false;
  $('ledger-msg').textContent = `사실 악마는 문을 열 때마다 다가오는 입자를 보고 빠른지 느린지 판단해 기억해 두었다. 지금까지 쌓인 기록은 ${state.ledger.stored}비트. `
    + '악마의 머리도 물리적인 장치라서 기억할 수 있는 양에 한계가 있다. 계속 일하려면 이 기억을 지워야 한다.';
  state.shownBits = -1;
  update();
  $('ledger').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function erase() {
  const room = roomEntropy(counts(state.sim));
  const bits = state.ledger.stored;
  const released = state.ledger.erase(room);
  const first = !state.erasedOnce;
  state.erasedOnce = true;
  state.shownBits = -1;
  $('ledger-msg').textContent = `기억 ${bits}비트를 지우자 열 ${released.toFixed(1)}만큼이 주변으로 빠져나갔다. `
    + '방에서 줄인 엔트로피 이상이 열로 빠져나가서, 방과 버린 열을 합친 전체 엔트로피는 처음보다 줄지 않았다. '
    + (first ? `이제 기억 용량 ${CAPACITY}비트로 계속 분류해 봐도 좋다.` : '');
  $('to-result').hidden = false;
  update();
}

// ── 그리기 ──

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round((width / 2) * dpr);
}

function draw(open) {
  const s = canvas.width / W;
  // 좁은 화면에서는 그림만 키운다(물리 계산의 크기는 그대로). 데스크톱에서는 1
  const k = Math.max(1, 0.75 / (canvas.clientWidth / W));
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.clearRect(0, 0, W, H);

  // 벽
  const half = 3 * k;
  ctx.fillStyle = COLOR.ink;
  ctx.fillRect(WALL_X - half, 0, half * 2, DOOR_TOP);
  ctx.fillRect(WALL_X - half, DOOR_BOTTOM, half * 2, H - DOOR_BOTTOM);

  // 문
  if (open) {
    ctx.strokeStyle = COLOR.a;
    ctx.setLineDash([6 * k, 6 * k]);
    ctx.lineWidth = 2 * k;
    ctx.strokeRect(WALL_X - half, DOOR_TOP, half * 2, DOOR_BOTTOM - DOOR_TOP);
    ctx.setLineDash([]);
  } else {
    ctx.fillStyle = locked() ? COLOR.rule : COLOR.a;
    ctx.fillRect(WALL_X - half, DOOR_TOP, half * 2, DOOR_BOTTOM - DOOR_TOP);
  }

  // 악마 (문 바로 위, 중심 기준으로 k배)
  ctx.save();
  ctx.translate(WALL_X, DOOR_TOP - 20 * k);
  ctx.scale(k, k);
  ctx.fillStyle = COLOR.ink;
  ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLOR.ink; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-8, -7); ctx.lineTo(-11, -20);
  ctx.moveTo(8, -7); ctx.lineTo(11, -20);
  ctx.stroke();
  ctx.fillStyle = COLOR.white;
  ctx.beginPath(); ctx.arc(-4, -1, 2.2, 0, Math.PI * 2); ctx.arc(4, -1, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // 입자
  for (const p of state.sim.particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, R * k, 0, Math.PI * 2);
    if (p.fast) {
      ctx.fillStyle = COLOR.a; ctx.fill();
    } else {
      ctx.fillStyle = COLOR.white; ctx.fill();
      ctx.strokeStyle = COLOR.b; ctx.lineWidth = 2.5 * k; ctx.stroke();
    }
  }
}

// ── 결과 ──

function showResult() {
  const room = roomEntropy(counts(state.sim));
  const right = prediction === 'B';
  const tag = $('verdict-tag');
  tag.textContent = right ? '예측 적중' : '예측 빗나감';
  tag.style.color = right ? 'var(--b)' : 'var(--a)';
  $('verdict-text').textContent = right
    ? '당신은 "깰 수 없다"고 예측했다. 맞다. 숨은 대가는 악마의 기억에 있었다.'
    : '당신은 "깰 수 있다"고 예측했다. 실험 중에는 정말 그래 보였다. 이 착각을 풀기까지 물리학자들도 100년이 넘게 걸렸다.';
  $('f-bits').textContent = `${state.crossings}개`;
  $('f-diff').textContent = `${Math.round(state.maxDiff)}°`;
  $('f-room').textContent = `${state.ledger.start.toFixed(1)} → ${state.minRoom.toFixed(1)}`;
  $('f-total').textContent = `${state.ledger.start.toFixed(1)} → ${state.ledger.total(room).toFixed(1)}`;
  renderStats();
  show('result');
}

async function renderStats() {
  const run = ++statsRun;
  const status = $('stats-status');
  const list = $('stats');
  status.textContent = '기록 불러오는 중…';
  status.hidden = false;
  list.replaceChildren();

  try {
    // 동적으로 불러와서 Firebase CDN이 막혀도 나머지 결과는 그대로 보이게 한다
    const { vote, getCounts } = await import('../../js/firebase.js');
    await vote(VOTE_ID, prediction);
    const { [VOTE_ID]: { A, B } } = await getCounts([VOTE_ID]);
    if (run !== statsRun) return;
    const total = A + B;
    if (total === 0) { status.textContent = '아직 기록이 없어요'; return; }
    status.hidden = true;

    const pctA = Math.round((A / total) * 100);
    const share = { A: pctA, B: 100 - pctA };
    const label = { A: '깰 수 있다', B: '깰 수 없다' };
    const bar = document.createElement('div');
    bar.className = 'stat__bar';
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', `${label.A} ${share.A}%, ${label.B} ${share.B}%`);
    for (const side of ['A', 'B']) {
      if (share[side] === 0) continue;
      const mine = side === prediction;
      const seg = document.createElement('div');
      seg.className = 'stat__seg';
      seg.textContent = share[side] >= 25 ? `${label[side]} ${share[side]}%` : '';
      if (share[side] < 25) seg.style.padding = '0';
      seg.style.flex = `${share[side]} 1 0`;
      seg.style.background = mine ? `var(--${side.toLowerCase()})` : `var(--${side.toLowerCase()}-light)`;
      seg.style.color = mine ? 'var(--white)' : 'var(--ink)';
      bar.append(seg);
    }
    const legend = document.createElement('p');
    legend.className = 'stat__legend';
    legend.textContent = `${label.A} ${share.A}% · ${label.B} ${share.B}% · ${total}명 참여 · 나의 예측: ${label[prediction]}`;
    list.replaceChildren(bar, legend);
  } catch (err) {
    if (run !== statsRun) return;
    console.error(err);
    status.textContent = '다른 실험자들의 기록을 불러오지 못했어요.';
  }
}

function restart() {
  prediction = null;
  state = freshState();
  for (const btn of document.querySelectorAll('.choice')) btn.setAttribute('aria-pressed', 'false');
  for (const next of document.querySelectorAll('.next')) next.hidden = true;
  $('banner').hidden = true;
  $('ledger').hidden = true;
  $('to-result').hidden = true;
  $('sort-footer').hidden = false;
  $('hint').textContent = '문 근처에 빠른 입자가 오른쪽에서 다가올 때 열어 보자';
  show(1);
}

// ── 연결 ──

state = freshState();

for (const btn of document.querySelectorAll('[data-step="1"] .choice')) {
  btn.addEventListener('click', () => pick(btn.dataset.choice));
}
for (const btn of document.querySelectorAll('[data-go]')) {
  btn.addEventListener('click', () => (btn.dataset.go === 'result' ? showResult() : show(btn.dataset.go)));
}

const door = $('door');
door.addEventListener('pointerdown', (e) => {
  setHeld(true);
  try { door.setPointerCapture(e.pointerId); } catch { /* 캡처를 못 해도 pointerup으로 닫힌다 */ }
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) door.addEventListener(type, () => setHeld(false));
door.addEventListener('contextmenu', (e) => e.preventDefault()); // 길게 누르기 메뉴 방지

const experimentVisible = () => !document.querySelector('[data-step="2"]').hidden;
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || !experimentVisible()) return;
  if (e.target instanceof HTMLButtonElement && e.target !== door) return; // 다른 버튼의 스페이스 클릭은 그대로
  e.preventDefault();
  if (!e.repeat) setHeld(true);
});
document.addEventListener('keyup', (e) => {
  if (e.code === 'Space' && experimentVisible()) { e.preventDefault(); setHeld(false); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) setHeld(false); });
window.addEventListener('resize', () => { if (frame) resizeCanvas(); });

$('reveal').addEventListener('click', reveal);
$('skip').addEventListener('click', reveal);
$('erase').addEventListener('click', erase);
document.querySelector('[data-restart]').addEventListener('click', restart);

renderOtherExperiments($('other-experiments'), 'maxwell', '../../');

import { PLANKS, KEYS, boundary, voteKey, survival } from './line.js';
import { stance, STANCES } from './stance.js';
import { renderOtherExperiments } from '../../js/other-experiments.js';
import { percentages } from '../../js/percentages.js';

const LINE_ID = 'theseus_line';
const REBUILT_ID = 'theseus_rebuilt';
const SWAP_MS = 800;       // 판자 한 장 교체
const REST_MS = 1500;      // "아니다" 뒤 남은 판자를 모두 바꾸는 시간
const ASSEMBLE_MS = 150;   // 반전: 헌 판자 한 장씩 맞추는 간격

const ANSWERS = {
  A: { label: '계속 수리해 온 배', color: 'var(--b)' },
  B: { label: '헌 판자로 다시 만든 배', color: 'var(--a)' },
  C: { label: '둘 다 진짜이거나, 둘 다 아니다', color: 'var(--c)' },
};

const PLATE_NOTE = {
  A: '✓ 이름판은 계속 수리해 온 배에',
  B: '✓ 이름판은 헌 판자로 만든 배에',
  C: '✓ 이름판을 한 배에 정하지 않았다',
};

const $ = (id) => document.getElementById(id);
const sections = [...document.querySelectorAll('[data-step]')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const SVG_NS = 'http://www.w3.org/2000/svg';

let state;
let timers = [];
let statsRun = 0;

function freshState() {
  return { answers: [], replaced: 0, pile: 0, line: null, busy: false, rebuilt: null };
}

function show(step) {
  for (const s of sections) s.hidden = s.dataset.step !== String(step);
  window.scrollTo(0, 0);
  document.querySelector(`[data-step="${step}"] h1`)?.focus({ preventScroll: true });
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function svg(tag, attrs = {}, text) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

function later(fn, ms) {
  timers.push(setTimeout(fn, reduceMotion.matches ? 0 : ms));
}

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

// ── 배 그리기 ──
// 선체: 갑판 y 62, 바닥 y 118. 판자 1~9는 선미(x 20)부터 x 300까지 같은 폭, 판자 10은 이름판이 달린 뱃머리.

const DECK = 62;
const KEEL = 118;
const PLANK_W = 280 / 9;

function plankPoints(i) {
  if (i === PLANKS) return '300,62 380,52 330,118 300,118';
  const x0 = 20 + (i - 1) * PLANK_W;
  const x1 = x0 + PLANK_W;
  const bottomLeft = i === 1 ? 48 : x0; // 선미는 비스듬하다
  return `${x0},${DECK} ${x1},${DECK} ${x1},${KEEL} ${bottomLeft},${KEEL}`;
}

// 헌 판자 더미 (수리 화면에만)
const PILE = { x: 432, base: 104, step: 9, w: 52, h: 7 };

function waves(width) {
  let d = `M0 128`;
  for (let x = 0; x < width; x += 20) d += ` q 5 -5 10 0 q 5 5 10 0`;
  return d;
}

/** @param {('old'|'new'|'hidden')[]} planks */
function drawShip(root, planks, { pile = null } = {}) {
  const width = pile === null ? 400 : 530;
  root.setAttribute('viewBox', `0 0 ${width} 150`);
  root.replaceChildren(
    svg('path', { d: waves(width), fill: 'none', stroke: '#BFD0EA', 'stroke-width': 2 }),
    // 돛대와 돛
    svg('path', { d: 'M170 62 V8', stroke: '#1B1F2A', 'stroke-width': 3 }),
    svg('path', { d: 'M173 12 V54 H236 Z', fill: '#FFFFFF', stroke: '#1B1F2A', 'stroke-width': 1.5 }),
    ...planks.map((kind, k) => svg('polygon', {
      points: plankPoints(k + 1), 'data-i': k + 1,
      class: `plank plank--${kind === 'new' ? 'new' : 'old'}${kind === 'hidden' ? ' plank--hidden' : ''}`,
    })),
    // 이름판 (뱃머리 판자 위)
    svg('rect', { x: 306, y: 76, width: 44, height: 16, fill: '#FFFFFF', stroke: '#1B1F2A', 'stroke-width': 1, 'data-plate': '', class: planks[PLANKS - 1] === 'hidden' ? 'plank--hidden' : '' }),
    svg('text', { x: 328, y: 87.5, 'font-size': 10, 'text-anchor': 'middle', fill: '#1B1F2A', 'font-family': 'Noto Sans KR, sans-serif', 'data-plate': '', class: planks[PLANKS - 1] === 'hidden' ? 'plank--hidden' : '' }, '테세우스'),
  );
  if (pile !== null) {
    root.append(
      svg('rect', { x: 412, y: 112, width: 118, height: 10, fill: '#8A90A0' }),
      svg('g', { 'data-pile': '' }),
      svg('text', { x: 471, y: 145, 'font-size': 17, 'text-anchor': 'middle', fill: '#5B6170', 'font-family': 'IBM Plex Mono, Noto Sans KR, monospace' }, '헌 판자'), // 폰에서 그림이 약 0.6배로 줄어든다
    );
    renderPile(root, pile);
  }
}

function renderPile(root, n) {
  root.querySelector('[data-pile]').replaceChildren(...Array.from({ length: n }, (_, k) => svg('rect', {
    x: PILE.x, y: PILE.base - k * PILE.step, width: PILE.w, height: PILE.h, class: 'plank plank--old',
  })));
}

/** 판자 i를 떼어 더미로 보내고 새 판자를 끼운다 */
function swapPlank(root, i, ms) {
  const poly = root.querySelector(`[data-i="${i}"]`);
  if (!reduceMotion.matches) {
    const box = poly.getBBox();
    const flying = poly.cloneNode();
    flying.classList.add('flying');
    root.append(flying);
    // i번째로 떼어 낸 판자는 더미의 i번째 칸으로 (빠르게 연달아 바꿔도 칸이 겹치지 않게)
    const tx = PILE.x - box.x;
    const ty = PILE.base - (i - 1) * PILE.step - box.y;
    flying.animate([
      { transform: 'none' },
      { transform: `translate(${tx}px, ${ty}px) scale(${PILE.w / box.width}, ${PILE.h / box.height})` },
    ], { duration: ms, easing: 'ease-in-out' }).finished.then(() => flying.remove());
  }
  poly.classList.replace('plank--old', 'plank--new');
  later(() => { state.pile = Math.max(state.pile, i); renderPile(root, state.pile); }, ms);
}

// ── 2단계: 수리 ──

function setChoices(enabled) {
  for (const btn of document.querySelectorAll('[data-answer]')) btn.disabled = !enabled;
}

function updateCounter() {
  $('counter').replaceChildren('판자 ', el('strong', '', String(state.replaced)), ` / ${PLANKS} 교체`);
  const ship = $('repair-ship');
  ship.setAttribute('aria-label', `배의 판자 ${PLANKS}장 중 ${state.replaced}장이 새 판자로 바뀌었다. 떼어 낸 헌 판자 ${state.pile}장이 부두에 쌓여 있다.`);
}

function startRepair() {
  clearTimers();
  state = { ...freshState(), rebuilt: state?.rebuilt ?? null };
  drawShip($('repair-ship'), Array(PLANKS).fill('old'), { pile: 0 });
  $('ask').hidden = false;
  document.querySelector('[data-step="2"] .next').hidden = true;
  updateCounter();
  replaceNext();
}

function replaceNext() {
  const i = state.replaced + 1;
  state.busy = true;
  setChoices(false);
  $('status').textContent = `판자 ${i}번${i === PLANKS ? '(이름판이 달린 뱃머리)' : ''}을 떼어 내고 새 판자를 끼운다…`;
  swapPlank($('repair-ship'), i, SWAP_MS);
  later(() => {
    state.replaced = i;
    state.busy = false;
    updateCounter();
    $('status').textContent = `판자 ${i}장을 새것으로 바꿨다.`;
    setChoices(true);
  }, SWAP_MS);
}

function answer(yes) {
  if (state.busy || state.line !== null) return;
  state.answers.push(yes);
  const line = boundary(state.answers);
  if (line === null) { replaceNext(); return; }
  state.line = line;
  if (line === 'KEEP') { finishRepair(); return; }

  // 처음 "아니다": 더 묻지 않고 남은 판자를 빠르게 바꾼다
  setChoices(false);
  const rest = PLANKS - state.replaced;
  $('status').textContent = '다른 배라고 봤다. 나머지 판자도 마저 바꾼다.';
  if (rest === 0) { finishRepair(); return; }
  const each = REST_MS / rest;
  for (let k = 1; k <= rest; k++) {
    later(() => {
      swapPlank($('repair-ship'), state.replaced + 1, Math.min(each, 400));
      state.replaced += 1;
      updateCounter();
      if (state.replaced === PLANKS) later(finishRepair, Math.min(each, 400) + 100);
    }, (k - 1) * each);
  }
}

function finishRepair() {
  setChoices(false);
  $('ask').hidden = true;
  $('status').textContent = '판자 10장을 모두 바꿨다. 떼어 낸 헌 판자 10장이 부두에 쌓였다.';
  $('repair-done').textContent = state.line === 'KEEP'
    ? '✓ 끝까지 같은 배라고 봤다'
    : `✓ ${state.line}번째 판자에서 다른 배라고 봤다`;
  document.querySelector('[data-step="2"] .next').hidden = false;
}

// ── 3단계: 반전 ──

function showReveal() {
  drawShip($('ship-repaired'), Array(PLANKS).fill('new'));
  const rebuilt = $('ship-rebuilt');
  for (const ship of [$('ship-repaired'), rebuilt]) delete ship.dataset.name;
  drawShip(rebuilt, Array(PLANKS).fill('hidden'));
  // 헌 판자를 한 장씩 맞춘다(뱃머리와 이름판이 마지막)
  for (let i = 1; i <= PLANKS; i++) {
    later(() => {
      const nodes = [rebuilt.querySelector(`[data-i="${i}"]`), ...(i === PLANKS ? rebuilt.querySelectorAll('[data-plate]') : [])];
      for (const node of nodes) node.classList.replace('plank--hidden', 'plank--appear');
    }, i * ASSEMBLE_MS);
  }
  show(3);
}

function pickRebuilt(choice) {
  state.rebuilt = choice;
  for (const btn of document.querySelectorAll('#rebuilt-choices .choice')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.choice === choice));
  }
  // "테세우스"라는 이름을 어느 배에 붙였는지 그림에 남긴다
  for (const [key, ship] of [['A', $('ship-repaired')], ['B', $('ship-rebuilt')]]) {
    ship.dataset.name = choice === 'C' ? 'unsure' : choice === key ? 'named' : 'unnamed';
  }
  // 폰에서는 버튼으로 스크롤하면 그림이 화면 위로 지나가니 글로도 남긴다
  document.querySelector('[data-step="3"] .next .label').textContent = PLATE_NOTE[choice];
  reveal(document.querySelector('[data-step="3"] .next'));
}

// 새로 나타난 버튼이 화면 밖이면 보이게 스크롤한다
function reveal(node) {
  node.hidden = false;
  node.scrollIntoView({ block: 'nearest', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
}

// ── 결과 ──

function showResult() {
  const { line } = state;
  $('line-title').textContent = line === 'KEEP'
    ? '당신은 판자 10장을 다 바꿔도 끝까지 같은 배라고 봤다'
    : `당신은 ${line}번째 판자를 바꿨을 때 다른 배라고 봤다`;
  $('line-extra').textContent = line === PLANKS
    ? '이름판이 달린 뱃머리가 바뀌는 순간 판단이 바뀌었다.'
    : line === 'KEEP' ? '조금씩 바뀌는 동안 한 번도 "다른 배"라고 하지 않았다.' : '';

  // "다른 배"라고 답한 순간의 배: 1~경계선 판자는 새것, 나머지는 원래 것(끝까지면 전부 새것)
  $('strip').replaceChildren(...Array.from({ length: PLANKS }, (_, k) => {
    const n = k + 1;
    if (line === 'KEEP') return el('span', 'is-new');
    return el('span', [n <= line ? 'is-new' : '', n === line ? 'is-line' : ''].join(' ').trim());
  }));

  const mine = stance(state.rebuilt);
  $('my-answer').textContent = `나의 답 · ${ANSWERS[state.rebuilt].label}`;
  $('stances').replaceChildren(...STANCES.map((s) => {
    const isMine = s.key === mine.key;
    const card = el('div', isMine ? 'stance stance--mine' : 'stance');
    if (isMine) card.append(el('span', 'label', '나의 입장 ✓'));
    card.append(el('h3', '', s.name), el('p', '', s.line));
    return card;
  }));

  renderStats();
  show('result');
}

function lineChart(counts, mineKey) {
  const total = KEYS.reduce((sum, k) => sum + counts[k], 0);
  const surv = survival(counts);
  const X0 = 42;  // "100%" 라벨 자리
  const SLOT = 35;
  const TOP = 16;
  const BOTTOM = 176;
  const H = BOTTOM - TOP;
  // 숫자는 Plex Mono, 한글(끝까지)은 Plex Mono에 없어서 Noto Sans KR로 그려지게 한다
  const font = { 'font-family': "'IBM Plex Mono', 'Noto Sans KR', sans-serif", 'font-size': 14, fill: '#5B6170' };
  const root = svg('svg', { viewBox: '0 0 440 196', class: 'chart', role: 'img' });

  const parts = [
    svg('line', { x1: X0, y1: BOTTOM, x2: X0 + SLOT * KEYS.length, y2: BOTTOM, stroke: '#1B1F2A', 'stroke-width': 1 }),
    svg('line', { x1: X0, y1: TOP, x2: X0 + SLOT * KEYS.length, y2: TOP, stroke: '#CBD2DE', 'stroke-dasharray': '3 3' }),
    svg('text', { ...font, x: X0 - 6, y: TOP + 4, 'text-anchor': 'end' }, '100%'),
    svg('text', { ...font, x: X0 - 6, y: BOTTOM + 4, 'text-anchor': 'end' }, '0'),
  ];
  KEYS.forEach((key, j) => {
    const share = counts[key] / total;
    const h = share * H;
    const isMine = key === mineKey;
    parts.push(svg('rect', {
      x: X0 + j * SLOT + 5, y: BOTTOM - h, width: SLOT - 10, height: h,
      fill: isMine ? '#3F6B4F' : '#C9D9CE', stroke: isMine ? '#1B1F2A' : 'none',
    }));
    parts.push(svg('text', { ...font, x: X0 + j * SLOT + SLOT / 2, y: BOTTOM + 18, 'text-anchor': 'middle', fill: isMine ? '#1B1F2A' : '#5B6170', 'font-weight': isMine ? 600 : 400 },
      key === 'KEEP' ? '끝까지' : key.slice(1)));
  });
  // 생존 곡선: n장 바꾼 뒤(칸 n과 n+1 사이)에도 같은 배라고 본 비율
  const pts = surv.map((s, n) => `${X0 + n * SLOT},${BOTTOM - s * H}`).join(' ');
  parts.push(svg('polyline', { points: pts, fill: 'none', stroke: '#B4470F', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
  surv.forEach((s, n) => parts.push(svg('circle', { cx: X0 + n * SLOT, cy: BOTTOM - s * H, r: 3, fill: '#B4470F' })));

  root.append(...parts);
  const half = surv.findIndex((s) => s < 0.5);
  root.setAttribute('aria-label', `${total}명의 경계선 분포. `
    + (half === -1 ? '10장을 다 바꿔도 절반 이상이 같은 배라고 봤다.' : `${half}장째 교체에서 같은 배라고 보는 사람이 절반 아래로 떨어졌다.`));
  return root;
}

async function renderStats() {
  const run = ++statsRun;
  const lineStatus = $('line-status');
  const rebuiltStatus = $('rebuilt-status');
  for (const s of [lineStatus, rebuiltStatus]) { s.textContent = '기록 불러오는 중…'; s.hidden = false; }
  $('line-stats').replaceChildren();
  $('rebuilt-stats').replaceChildren();

  try {
    // 동적으로 불러와서 Firebase CDN이 막혀도 나머지 결과는 그대로 보이게 한다
    const { vote, getCounts } = await import('../../js/firebase.js');
    const mineKey = voteKey(state.line);
    await Promise.all([vote(LINE_ID, mineKey), vote(REBUILT_ID, state.rebuilt)]);
    const [{ [LINE_ID]: lineCounts }, { [REBUILT_ID]: tally }] = await Promise.all([
      getCounts([LINE_ID], KEYS),
      getCounts([REBUILT_ID], Object.keys(ANSWERS)),
    ]);
    if (run !== statsRun) return;

    const lineTotal = KEYS.reduce((sum, k) => sum + lineCounts[k], 0);
    if (lineTotal === 0) lineStatus.textContent = '아직 기록이 없어요';
    else {
      lineStatus.hidden = true;
      const legend = el('div', 'chart-legend');
      const item = (color, text, line) => {
        const span = el('span');
        const mark = el('i');
        mark.style.background = color;
        if (line) mark.style.height = '3px';
        span.append(mark, text);
        return span;
      };
      legend.append(
        item('#C9D9CE', '막대: 그 판자에서 처음 "다른 배"라고 한 사람'),
        item('#3F6B4F', '진한 막대: 나의 경계선'),
        item('#B4470F', '선: 그 판자까지 바꿔도 "같은 배"라고 본 사람', true),
      );
      $('line-stats').replaceChildren(lineChart(lineCounts, mineKey), legend, el('p', 'stat-total', `${lineTotal}명 참여`));
    }

    const keys = Object.keys(ANSWERS);
    const total = keys.reduce((sum, k) => sum + tally[k], 0);
    if (total === 0) { rebuiltStatus.textContent = '아직 기록이 없어요'; return; }
    rebuiltStatus.hidden = true;
    const pct = percentages(tally);
    const bar = el('div', 'bar');
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', keys.map((k) => `${ANSWERS[k].label} ${pct[k]}%`).join(', '));
    for (const k of keys) {
      if (tally[k] === 0) continue;
      const seg = el('div');
      seg.style.flex = `${tally[k]} 1 0`;
      seg.style.background = ANSWERS[k].color;
      bar.append(seg);
    }
    const legend = el('ul', 'legend');
    for (const k of keys) {
      const li = el('li');
      const swatch = el('span', 'legend__swatch');
      swatch.style.background = ANSWERS[k].color;
      li.append(swatch, el('span', '', `${k} · ${ANSWERS[k].label}`));
      if (k === state.rebuilt) li.append(el('span', 'legend__mine', '← 나'));
      li.append(el('span', 'legend__pct', `${pct[k]}%`));
      legend.append(li);
    }
    $('rebuilt-stats').replaceChildren(bar, legend, el('p', 'stat-total', `${total}명 참여`));
  } catch (err) {
    if (run !== statsRun) return;
    console.error(err);
    lineStatus.textContent = '다른 실험자들의 기록을 불러오지 못했어요.';
    rebuiltStatus.textContent = '다른 실험자들의 기록을 불러오지 못했어요.';
  }
}

function restart() {
  clearTimers();
  state = freshState();
  for (const btn of document.querySelectorAll('#rebuilt-choices .choice')) btn.setAttribute('aria-pressed', 'false');
  document.querySelector('[data-step="3"] .next').hidden = true;
  show(1);
}

// ── 연결 ──

state = freshState();
drawShip($('intro-ship'), Array(PLANKS).fill('old'));

for (const btn of document.querySelectorAll('[data-go]')) {
  btn.addEventListener('click', () => {
    const step = btn.dataset.go;
    if (step === '2') { show(2); startRepair(); } else if (step === '3') showReveal();
    else if (step === 'result') showResult();
  });
}
for (const btn of document.querySelectorAll('[data-answer]')) {
  btn.addEventListener('click', () => answer(btn.dataset.answer === 'yes'));
}
for (const btn of document.querySelectorAll('#rebuilt-choices .choice')) {
  btn.addEventListener('click', () => pickRebuilt(btn.dataset.choice));
}
$('restart-repair').addEventListener('click', startRepair);
document.querySelector('[data-restart]').addEventListener('click', restart);

renderOtherExperiments($('other-experiments'), 'theseus', '../../');

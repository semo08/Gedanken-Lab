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
  A: '✓ 테세우스라는 이름은 계속 수리해 온 배에',
  B: '✓ 테세우스라는 이름은 헌 판자로 만든 배에',
  C: '✓ 테세우스라는 이름을 한 배에 정하지 않았다',
};

const $ = (id) => document.getElementById(id);
const sections = [...document.querySelectorAll('[data-step]')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const SVG_NS = 'http://www.w3.org/2000/svg';
const HULL = 'M70 94 Q230 110 392 92 L386 132 L384 150 Q240 164 100 150 Q72 132 70 94 Z';

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
// 고대 그리스 갤리선 옆모습. 고물(왼쪽)은 위로 말려 올라가고, 이물(오른쪽) 물밑에 충각이 있다.
// 판자 1~9는 고물부터 같은 폭의 구획, 판자 10은 이름을 새긴 뱃머리. 구획은 선체 모양(#hull-clip)으로 잘린다.

const INK = '#3A2F28';
const STATIONS = [70, 100, 130, 160, 190, 220, 250, 280, 310, 340, 392];
const WATER = 141;
const topY = (x) => { const t = (x - 70) / 322; return (1 - t) ** 2 * 94 + 2 * t * (1 - t) * 110 + t ** 2 * 92; };

// 떼어 낸 판자가 쌓이는 자리 (돌 부두 위, 수리 화면에만)
const PILE = { x: 476, base: 117, step: 7.5, w: 80, h: 8 };

/** @param {('old'|'new'|'hidden')[]} planks */
function drawShip(root, planks, { pile = null, stations = false } = {}) {
  const width = pile === null ? 480 : 600;
  const hidden = (k) => (planks[k] === 'hidden' ? ' plank--hidden' : '');
  root.setAttribute('viewBox', `0 0 ${width} 196`);

  const hull = svg('g', { 'clip-path': 'url(#hull-clip)' });
  planks.forEach((kind, k) => {
    const x0 = k === 0 ? 0 : STATIONS[k];
    const x1 = k === PLANKS - 1 ? 480 : STATIONS[k + 1];
    hull.append(svg('rect', {
      x: x0, y: 80, width: x1 - x0, height: 90, 'data-i': k + 1,
      class: `plank plank--${kind === 'new' ? 'new' : 'old'}${hidden(k)}`,
    }));
  });
  // 판자 이음선(가로)과 구획선(세로)
  for (const o of [14, 28, 42, 56]) {
    hull.append(svg('path', { d: `M60 ${94 + o} Q230 ${110 + o} 400 ${92 + o}`, fill: 'none', stroke: INK, 'stroke-width': 0.6, opacity: 0.45 }));
  }
  for (const x of STATIONS.slice(1, -1)) hull.append(svg('path', { d: `M${x} 80 V170`, stroke: INK, 'stroke-width': 1.2 }));

  root.replaceChildren(
    // 돛대, 펼친 네모돛, 줄
    svg('path', { d: 'M215 16 L78 94 M215 16 L390 92 M168 78 L120 100 M262 78 L310 100', stroke: '#8A90A0', 'stroke-width': 0.8, fill: 'none' }),
    svg('path', { d: 'M215 104 V12', stroke: INK, 'stroke-width': 3 }),
    svg('path', { d: 'M164 27 Q215 22 266 27 L262 78 Q215 88 168 78 Z', fill: '#F4EFE3', stroke: INK, 'stroke-width': 1.4, 'stroke-linejoin': 'round' }),
    svg('path', { d: 'M189 25 Q187 55 189 81 M215 25 V83 M241 25 Q243 55 241 81', fill: 'none', stroke: INK, 'stroke-width': 0.7, opacity: 0.5 }),
    svg('path', { d: 'M156 26 Q215 20 274 26', stroke: INK, 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' }),
    hull,
    // 외곽선, 고물 장식, 이물 기둥, 충각, 노 구멍, 뱃머리의 눈
    svg('path', { d: HULL, fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }),
    svg('path', { d: 'M70 94 C58 80 50 64 58 54 C64 47 74 52 68 60', fill: 'none', stroke: INK, 'stroke-width': 2.5, 'stroke-linecap': 'round' }),
    svg('path', { d: 'M392 92 L398 80', stroke: INK, 'stroke-width': 2.5, 'stroke-linecap': 'round' }),
    svg('path', { d: 'M386 133 L432 141 L384 149 Z', fill: INK }),
    ...STATIONS.slice(1, 9).map((x) => svg('circle', { cx: x + 15, cy: topY(x + 15) + 9, r: 2, fill: INK })),
    svg('path', { d: 'M372 104 q7 -5 14 0 q-7 5 -14 0 Z', fill: '#FFFFFF', stroke: INK, 'stroke-width': 1 }),
    svg('circle', { cx: 379, cy: 104, r: 1.6, fill: INK }),
    // 뱃머리에 새긴 이름 (그리스어 '테세우스'). 그리스 문자가 있는 세리프체로 새긴 글씨처럼
    svg('text', { x: 365, y: 126, 'font-size': 10, 'text-anchor': 'middle', 'letter-spacing': 1, fill: INK, 'font-family': 'Georgia, Times New Roman, serif', 'data-plate': '', class: hidden(PLANKS - 1).trim() }, 'ΘΗΣΕΥΣ'),
  );

  if (pile !== null) {
    // 돌 부두: 마름돌 두 단. 아랫단은 물에 잠긴다
    const quay = svg('g', { stroke: INK, 'stroke-width': 1, fill: '#D9D3C7' });
    quay.append(
      svg('rect', { x: 450, y: 126, width: 150, height: 22 }),
      svg('rect', { x: 450, y: 148, width: 150, height: 30 }),
      svg('path', { d: 'M486 126 v22 M532 126 v22 M574 126 v22 M466 148 v30 M510 148 v30 M556 148 v30', fill: 'none' }),
      svg('path', { d: 'M450 126 H600', 'stroke-width': 2 }),
    );
    root.append(quay);
  }

  // 수면: 물에 잠긴 부분은 흐리게
  root.append(
    svg('rect', { x: 0, y: WATER, width, height: 196 - WATER, fill: '#FFFFFF', opacity: 0.55 }),
    svg('path', { d: `M10 ${WATER} H${width - 10}`, stroke: '#9FB6D9', 'stroke-width': 1.5 }),
    svg('path', { d: 'M40 150 h60 M150 150 h110 M300 150 h70 M80 159 h40 M200 159 h90 M330 159 h30', stroke: '#9FB6D9', 'stroke-width': 1, opacity: 0.8 }),
  );

  if (stations) {
    // 설계도처럼 구획 번호를 단다 (결과 화면의 판자 띠와 같은 번호)
    const bar = svg('g', { class: 'stations', 'font-family': 'IBM Plex Mono, Noto Sans KR, monospace', fill: '#5B6170', 'text-anchor': 'middle', 'aria-hidden': 'true' });
    bar.append(svg('path', { d: `M70 180 H392 ${STATIONS.map((x) => `M${x} 176 v8`).join(' ')}`, stroke: '#8A90A0', 'stroke-width': 0.8 }));
    STATIONS.slice(0, PLANKS).forEach((x, k) => bar.append(svg('text', { x: (x + STATIONS[k + 1]) / 2, y: 194 }, String(k + 1))));
    root.append(bar);
  }

  if (pile !== null) {
    root.append(svg('g', { 'data-pile': '' }));
    renderPile(root, pile);
  }
}

function renderPile(root, n) {
  root.querySelector('[data-pile]').replaceChildren(...Array.from({ length: n }, (_, k) => {
    const x = PILE.x + (k % 2 ? 6 : 0);
    const y = PILE.base - k * PILE.step;
    return svg('path', {
      d: `M${x} ${y + 3} Q${x + 40} ${y - 1} ${x + 80} ${y + 3} v5 Q${x + 40} ${y + 4} ${x} ${y + 8} Z`,
      class: 'plank plank--old', 'stroke-width': 1,
    });
  }));
}

/** 판자 i를 떼어 부두로 보내고 새 판자를 끼운다 */
function swapPlank(root, i, ms) {
  const rect = root.querySelector(`[data-i="${i}"]`);
  if (!reduceMotion.matches) {
    // 구획은 선체 모양으로 잘려 있으니, 잘린 조각째로 날려 보낸다
    const x0 = i === 1 ? 62 : STATIONS[i - 1];
    const x1 = i === PLANKS ? 400 : STATIONS[i];
    const flying = svg('g', { class: 'flying' });
    const piece = svg('g', { 'clip-path': 'url(#hull-clip)' });
    piece.append(rect.cloneNode());
    flying.append(piece);
    root.append(flying);
    const tx = PILE.x + ((i - 1) % 2 ? 6 : 0);
    const ty = PILE.base - (i - 1) * PILE.step; // i번째로 떼어 낸 판자는 i번째 칸으로
    const sx = PILE.w / (x1 - x0);
    const sy = PILE.h / 70;
    flying.animate([
      { transform: 'none' },
      { transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy}) translate(${-x0}px, -92px)` },
    ], { duration: ms, easing: 'ease-in-out' }).finished.then(() => flying.remove());
  }
  rect.classList.replace('plank--old', 'plank--new');
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
  drawShip($('repair-ship'), Array(PLANKS).fill('old'), { pile: 0, stations: true });
  $('ask').hidden = false;
  document.querySelector('[data-step="2"] .next').hidden = true;
  updateCounter();
  replaceNext();
}

function replaceNext() {
  const i = state.replaced + 1;
  state.busy = true;
  setChoices(false);
  $('status').textContent = `판자 ${i}번${i === PLANKS ? '(이름을 새긴 뱃머리)' : ''}을 떼어 내고 새 판자를 끼운다…`;
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
  // 헌 판자를 한 장씩 맞춘다(이름을 새긴 뱃머리가 마지막)
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
    ? '이름을 새긴 뱃머리가 바뀌는 순간 판단이 바뀌었다.'
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
drawShip($('intro-ship'), Array(PLANKS).fill('old'), { stations: true });

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

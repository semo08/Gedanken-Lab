import { trip, diagram, formatYears, formatAge } from './relativity.js';
import { renderOtherExperiments } from '../../js/other-experiments.js';
import { percentages } from '../../js/percentages.js';

const VOTE_ID = 'twin';
const START_AGE = 20;
const TRIP_MS = 4000;

const DESTINATIONS = [
  { key: 'proxima', name: '프록시마 센타우리', ly: 4.2, note: '태양에서 가장 가까운 별' },
  { key: 'sirius', name: '시리우스', ly: 8.6, note: '밤하늘에서 가장 밝은 별' },
  { key: 'trappist', name: '트라피스트-1', ly: 40, note: '지구 크기 행성 7개' },
  { key: 'betelgeuse', name: '베텔게우스', ly: 550, approx: true, note: '거리 추정치가 연구마다 다르다' },
];
const SPEEDS = [0.1, 0.3, 0.5, 0.8, 0.9, 0.95, 0.99, 0.999];

const ANSWERS = {
  A: { label: '지구에 남은 쪽', color: 'var(--b)' },
  B: { label: '우주에 다녀온 쪽', color: 'var(--a)' },
  C: { label: '똑같다', color: 'var(--rule)' },
};

const $ = (id) => document.getElementById(id);
const sections = [...document.querySelectorAll('[data-step]')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let prediction = null;
let dest = DESTINATIONS[0];
let speedIndex = 3;
let travelling = false;
let statsRun = 0;

const speed = () => SPEEDS[speedIndex];
const speedLabel = (v) => `광속의 ${+(v * 100).toFixed(1)}%`;
const distLabel = (d) => `${d.approx ? '약 ' : ''}${d.ly.toLocaleString('en-US')}광년`;

function show(step) {
  for (const s of sections) s.hidden = s.dataset.step !== String(step);
  window.scrollTo(0, 0);
  document.querySelector(`[data-step="${step}"] h1`).focus({ preventScroll: true });
  if (String(step) === '2') syncPlan(); // 다시 여행할 때 두 시계를 0으로 돌린다
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ── 1단계: 예측 ──

function pick(choice) {
  prediction = choice;
  for (const btn of document.querySelectorAll('[data-step="1"] .choice')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.choice === choice));
  }
  reveal(document.querySelector('[data-step="1"] .next'));
}

// 새로 나타난 버튼이 화면 밖이면 보이게 스크롤한다
function reveal(node) {
  node.hidden = false;
  node.scrollIntoView({ block: 'nearest', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
}

// ── 2단계: 여행 계획 ──

function renderDestinations() {
  $('dests').replaceChildren(...DESTINATIONS.map((d) => {
    const label = el('label', 'dest');
    const input = Object.assign(el('input'), { type: 'radio', name: 'dest', value: d.key, checked: d === dest });
    input.addEventListener('change', () => { dest = d; syncPlan(); });
    label.append(input, el('span', 'dest__name', d.name), el('span', 'dest__dist', distLabel(d)), el('span', 'dest__note', d.note));
    return label;
  }));
}

// 칸이 8개라 라벨은 일부만, 실제 칸 위치에 놓는다
function renderSpeedMarks() {
  const last = SPEEDS.length - 1;
  $('speed-marks').replaceChildren(...[0, 2, 4, 6, 7].map((i) => {
    const mark = el('span', '', `${+(SPEEDS[i] * 100).toFixed(1)}%`);
    mark.style.left = `${(i / last) * 100}%`;
    return mark;
  }));
}

function syncPlan() {
  const v = speed();
  $('speed-value').textContent = speedLabel(v);
  $('speed').setAttribute('aria-valuetext', speedLabel(v));
  $('star-name').textContent = dest.name;
  $('trip-summary').textContent = `${dest.name}까지 ${distLabel(dest)} · ${speedLabel(v)}로 왕복`;
  $('run-earth').textContent = '0년';
  $('run-ship').textContent = '0년';
}

function setTravelling(on) {
  travelling = on;
  for (const node of [$('launch'), $('speed'), $('back-to-1'), ...document.querySelectorAll('[name="dest"]')]) node.disabled = on;
}

function launch() {
  if (travelling) return;
  if (reduceMotion.matches) { showResult(); return; }

  setTravelling(true);
  // 폰에서는 출발 버튼이 아래에 있어 트랙이 화면 밖일 수 있다. 우주선과 두 시계가 보이게 한다
  $('clocks').scrollIntoView({ block: 'end', behavior: 'smooth' });
  const t = trip(dest.ly, speed());
  const ship = $('ship');
  const dx = $('track').clientWidth - ship.clientWidth - 112; // 양 끝 아이콘 자리를 뺀 거리
  const status = $('trip-status');
  status.textContent = '출발! 지구에서 멀어지는 중';
  const anim = ship.animate([
    { transform: 'translateX(0)', offset: 0 },
    { transform: `translateX(${dx}px)`, offset: 0.42 },
    { transform: `translateX(${dx}px) scaleX(-1)`, offset: 0.58 },
    { transform: 'translateX(0) scaleX(-1)', offset: 1 },
  ], { duration: TRIP_MS, easing: 'ease-in-out' });

  const timers = [
    setTimeout(() => { status.textContent = `${dest.name} 도착 · 방향을 바꾼다`; }, TRIP_MS * 0.42),
    setTimeout(() => { status.textContent = '지구로 돌아오는 중'; }, TRIP_MS * 0.58),
  ];
  // 두 시계가 같은 4초 동안 서로 다른 빠르기로 간다
  const begin = performance.now();
  const tickClocks = (now) => {
    const p = Math.min(1, (now - begin) / TRIP_MS);
    $('run-earth').textContent = formatYears(p * t.earthYears);
    $('run-ship').textContent = formatYears(p * t.shipYears);
    if (p < 1) requestAnimationFrame(tickClocks);
  };
  requestAnimationFrame(tickClocks);

  anim.finished.then(() => {
    timers.forEach(clearTimeout);
    status.textContent = '다시 만났다';
    // 멈춘 두 시계를 잠깐 보여 준 뒤 결과로 넘어간다
    setTimeout(() => {
      status.textContent = '';
      setTravelling(false);
      showResult();
    }, 900);
  });
}

// ── 결과 ──

function showResult() {
  const v = speed();
  const t = trip(dest.ly, v);
  const right = prediction === 'B';

  $('trip-line').textContent = `${dest.name}(${distLabel(dest)})까지 ${speedLabel(v)}로 왕복한 경우`;

  const tag = $('verdict-tag');
  tag.textContent = right ? '예측 적중' : '예측 빗나감';
  tag.style.color = right ? 'var(--b)' : 'var(--a)';
  $('verdict-text').textContent = {
    A: '당신은 지구에 남은 쪽이 더 젊을 거라고 예측했다. 반대였다. 움직임은 상대적이지만, 방향을 바꾼 쪽은 우주 쌍둥이뿐이었다.',
    B: '당신은 우주에 다녀온 쪽이 더 젊을 거라고 예측했다. 맞다. 빠르게 갔다가 방향을 바꿔 돌아온 쪽의 시계가 덜 갔다.',
    C: '당신은 둘이 똑같을 거라고 예측했다. 서로 상대가 느리다고 보는 건 맞지만, 다시 만나면 비기지 않는다. 방향을 바꾼 쪽은 한 명뿐이기 때문이다.',
  }[prediction];

  $('age-earth').textContent = formatAge(START_AGE + t.earthYears);
  $('clock-earth').textContent = `지구 시계로 ${formatYears(t.earthYears)}`;
  $('age-ship').textContent = formatAge(START_AGE + t.shipYears);
  $('clock-ship').textContent = `우주선 시계로 ${formatYears(t.shipYears)}`;
  $('age-diff').innerHTML = '';
  $('age-diff').append('다시 만났을 때 나이 차: ', el('strong', '', formatYears(t.diffYears)),
    ` (시간이 ${t.gamma.toFixed(2)}배 느리게 갔다)`);

  drawDiagram(v, t);
  renderStats();
  show('result');
}

const SVG_NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs, text) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, val] of Object.entries(attrs)) node.setAttribute(k, val);
  if (text !== undefined) node.textContent = text;
  return node;
}

function drawDiagram(v, t) {
  const W = 380;
  const H = 400;
  const g = diagram(dest.ly, v, W, H);
  const root = $('diagram');
  root.setAttribute('viewBox', `0 0 ${W} ${H}`);
  root.setAttribute('aria-label', `시공간 다이어그램. 지구 쌍둥이는 제자리에서 곧게 ${formatYears(t.earthYears)}를 지나고, `
    + `우주 쌍둥이는 ${dest.name}에서 꺾여 돌아오며 ${formatYears(t.shipYears)}를 지난다. 점선은 빛의 길이다.`);

  const pts = (list) => list.map((p) => `${p.x},${p.y}`).join(' ');
  const [start, turn, end] = g.ship;
  const font = { 'font-family': 'IBM Plex Mono, Noto Sans KR, monospace', 'font-size': 12 };
  // 빛의 길 라벨: 점선 위 y ≥ 300인 지점의 오른쪽 아래. 빠를 때 점선 끝이 '방향 전환'과 겹치지 않게 한다
  const [l0, l1] = g.light;
  const lightY = Math.max(l1.y, 300);
  const lightX = l0.x + (l0.y - lightY) * ((l1.x - l0.x) / (l0.y - l1.y));
  // 메모는 출발~꺾인 지점 구간의 바깥쪽(오른쪽 아래). 우주선 길은 늘 점선보다 왼쪽이라 오른쪽 끝에 붙이면 겹치지 않는다
  const noteY = (start.y + turn.y) / 2;

  root.replaceChildren(
    // 축
    svg('line', { x1: start.x, y1: start.y, x2: W - 8, y2: start.y, stroke: '#CBD2DE', 'stroke-width': 1 }),
    svg('text', { ...font, x: W - 8, y: start.y + 18, 'text-anchor': 'end', fill: '#5B6170' }, '거리 →'),
    svg('text', { ...font, x: start.x - 8, y: start.y + 4, 'text-anchor': 'end', fill: '#5B6170' }, '0년'),
    svg('text', { ...font, x: start.x - 8, y: end.y + 4, 'text-anchor': 'end', fill: '#5B6170' }, formatYears(t.earthYears)),
    svg('text', { ...font, x: start.x - 8, y: (start.y + end.y) / 2, 'text-anchor': 'end', fill: '#5B6170' }, '시간 ↑'),
    // 빛
    svg('line', { x1: g.light[0].x, y1: g.light[0].y, x2: g.light[1].x, y2: g.light[1].y, stroke: '#8A90A0', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }),
    // 경로
    svg('line', { x1: g.earth.start.x, y1: g.earth.start.y, x2: g.earth.end.x, y2: g.earth.end.y, stroke: '#1F4E9C', 'stroke-width': 3 }),
    svg('polyline', { points: pts(g.ship), fill: 'none', stroke: '#B4470F', 'stroke-width': 3, 'stroke-linejoin': 'round' }),
    // 시계 점
    ...g.earthTicks.map((p) => svg('circle', { cx: p.x, cy: p.y, r: 3.5, fill: '#1F4E9C' })),
    ...g.shipTicks.map((p) => svg('circle', { cx: p.x, cy: p.y, r: 3.5, fill: '#FFFFFF', stroke: '#B4470F', 'stroke-width': 2 })),
    // 꺾인 지점
    svg('text', { ...font, x: turn.x + 8, y: turn.y - 4, fill: '#B4470F' }, '방향 전환'),
    svg('text', { ...font, x: turn.x + 8, y: turn.y + 12, fill: '#B4470F' }, '(가속)'),
    svg('text', { ...font, x: start.x - 4, y: end.y - 10, fill: '#1B1F2A' }, '다시 만남'),
    svg('text', { ...font, x: lightX + 12, y: lightY + 8, fill: '#8A90A0' }, '빛의 길'),
    svg('text', { ...font, x: W - 8, y: noteY, 'text-anchor': 'end', fill: '#B4470F' }, '선은 더 길어 보여도'),
    svg('text', { ...font, x: W - 8, y: noteY + 18, 'text-anchor': 'end', fill: '#B4470F' }, '점(시간)은 더 적다'),
  );

  $('tick-note').textContent = `점 하나 = 각자의 시계로 ${g.tick}년`;
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
    const keys = Object.keys(ANSWERS);
    const { [VOTE_ID]: tally } = await getCounts([VOTE_ID], keys);
    if (run !== statsRun) return;

    const total = keys.reduce((sum, k) => sum + tally[k], 0);
    if (total === 0) { status.textContent = '아직 기록이 없어요'; return; }
    status.hidden = true;
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
      if (k === prediction) li.append(el('span', 'legend__mine', '← 나'));
      li.append(el('span', 'legend__pct', `${pct[k]}%`));
      legend.append(li);
    }

    list.replaceChildren(bar, legend, el('p', 'stat-total', `${total}명 참여`));
  } catch (err) {
    if (run !== statsRun) return;
    console.error(err);
    status.textContent = '다른 실험자들의 기록을 불러오지 못했어요.';
  }
}

function restart() {
  prediction = null;
  for (const btn of document.querySelectorAll('.choice')) btn.setAttribute('aria-pressed', 'false');
  for (const next of document.querySelectorAll('.next')) next.hidden = true;
  show(1);
}

// ── 연결 ──

for (const btn of document.querySelectorAll('[data-step="1"] .choice')) {
  btn.addEventListener('click', () => pick(btn.dataset.choice));
}
for (const btn of document.querySelectorAll('[data-go]')) {
  btn.addEventListener('click', () => show(btn.dataset.go));
}
$('speed').addEventListener('input', (e) => { speedIndex = Number(e.target.value); syncPlan(); });
$('launch').addEventListener('click', launch);
document.querySelector('[data-restart]').addEventListener('click', restart);

// 폰에서는 현장 기록을 접어 둔다(제목을 누르면 펼쳐진다)
if (matchMedia('(max-width: 480px)').matches) for (const d of document.querySelectorAll('details.case')) d.open = false;

renderDestinations();
renderSpeedMarks();
syncPlan();
renderOtherExperiments($('other-experiments'), 'twin', '../../');

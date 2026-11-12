import { stance, STANCES } from './stance.js';
import { renderOtherExperiments } from '../../js/other-experiments.js';
import { percentages } from '../../js/percentages.js';
import { BULK, tally, observationLine } from './observe.js';

const VOTE_ID = 'schrodinger';
const MIN_OPENS = 3;

const ANSWERS = {
  A: { label: '살아 있다', color: 'var(--a)', text: 'var(--white)' },
  B: { label: '죽었다', color: 'var(--a-light)', text: 'var(--ink)' },
  C: { label: '둘 다', color: 'var(--b)', text: 'var(--white)' },
  D: { label: '알 수 없다', color: 'var(--b-light)', text: 'var(--ink)' },
};

let answer = null;
let opens = []; // 'alive' | 'dead'
let handCount = null; // 한꺼번에 열기 전에 손으로 연 횟수. 아직 안 했으면 null
let busy = false; // 상자를 닫았다 여는 중이거나 한꺼번에 여는 중
let timer = null; // 다시 실험하면 진행 중인 열기를 취소한다
let statsRun = 0; // 다시 실험했을 때 이전 통계 요청의 결과를 버리기 위한 번호

const $ = (id) => document.getElementById(id);
const sections = [...document.querySelectorAll('[data-step]')];
const box = $('box');

function show(step) {
  for (const s of sections) s.hidden = s.dataset.step !== String(step);
  window.scrollTo(0, 0);
  document.querySelector(`[data-step="${step}"] h1`).focus({ preventScroll: true });
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// 폰에서는 새로 나타난 "다음" 버튼이 화면 밖일 수 있다
function reveal(next) {
  next.hidden = false;
  next.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ── 1단계: 답 고르기 ──

function pick(choice) {
  answer = choice;
  for (const btn of document.querySelectorAll('[data-step="1"] .choice')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.choice === choice));
  }
  reveal(document.querySelector('[data-step="1"] .next'));
}

// ── 2단계: 관측 ──

function setObserved(state) {
  box.dataset.state = state;
  const observed = $('observed');
  observed.className = `observed observed--${state}`;
  observed.textContent = {
    closed: '닫힌 상자 · 아직 아무도 모른다',
    alive: '살아 있다!',
    dead: '쓰러져 있다…',
  }[state];
  $('open-box').textContent = state === 'closed' && opens.length === 0 ? '상자를 연다' : '새 상자 열기';
}

function observe() {
  const result = Math.random() < 0.5 ? 'alive' : 'dead';
  opens.push(result);
  setObserved(result);
  renderTally();
}

// 열려 있으면 새 상자로 바꿔 "?"를 잠깐 보여 준 뒤 연다. 버튼은 하나만 누르면 된다
function openBox() {
  if (busy) return;
  if (box.dataset.state === 'closed') { observe(); return; }
  busy = true;
  setObserved('closed');
  $('box-number').textContent = `상자 #${opens.length + 1}`;
  timer = setTimeout(() => { busy = false; observe(); }, reducedMotion() ? 250 : 500);
}

// 손으로 몇 번 열어 본 다음, 100개를 빠르게 더 열어 비율이 반반으로 모이는 걸 보여 준다
function bulkOpen() {
  if (busy) return;
  busy = true;
  handCount = opens.length;
  $('bulk-open').hidden = true;
  $('open-box').focus(); // 누른 버튼이 사라지니 포커스를 옮긴다
  let left = BULK;
  const step = () => {
    const n = reducedMotion() ? left : Math.min(5, left);
    for (let i = 0; i < n; i++) opens.push(Math.random() < 0.5 ? 'alive' : 'dead');
    left -= n;
    renderTally();
    if (left > 0) timer = setTimeout(step, 40);
    else {
      busy = false;
      setObserved('closed');
      $('box-number').textContent = `상자 #${opens.length + 1}`;
      $('observed').textContent = `${BULK}개를 한꺼번에 열었다`;
    }
  };
  step();
}

function chips() {
  return opens.map((r) => el('span', `chip chip--${r}`));
}

function renderTally() {
  const { total, alive, dead, alivePct } = tally(opens);
  const chipBox = $('tally-chips');
  chipBox.classList.toggle('tally__chips--dense', total > 30);
  chipBox.replaceChildren(...chips());
  $('ratio').hidden = total === 0;
  $('ratio-fill').style.width = `${alivePct}%`;
  $('ratio').setAttribute('aria-label', `살아 있음 비율 ${alivePct}%`);
  const left = MIN_OPENS - total;
  $('tally-text').textContent = total === 0
    ? '아직 열어 본 상자가 없다 · 3번 이상 열어 보자'
    : `${total}번 열었다 · 살아 있음 ${alive}(${alivePct}%) · 쓰러짐 ${dead}`
      + (left > 0 ? ` · ${left}번 더 열어 보자` : '');
  $('bulk-open').hidden = total < MIN_OPENS || handCount !== null;
  const next = document.querySelector('[data-step="2"] .next');
  if (total >= MIN_OPENS && next.hidden) reveal(next);
}

// ── 결과 ──

function showResult() {
  renderStance();
  renderObservations();
  renderStats();
  show('result');
}

function renderStance() {
  const mine = stance(answer);
  $('stance-name').textContent = mine.name;
  $('stance-line').textContent = mine.line;
  $('my-answer').textContent = `나의 답 · ${ANSWERS[answer].label}`;
  $('stances').replaceChildren(...STANCES.map((s) => {
    const isMine = s.key === mine.key;
    const card = el('div', isMine ? 'stance stance--mine' : 'stance');
    const head = el('div', 'row');
    head.append(el('span', isMine ? 'label' : 'label label--muted', s.who));
    if (isMine) head.append(el('span', 'label', '나의 입장 ✓'));
    card.append(head, el('h3', '', s.name), el('p', '', s.line));
    return card;
  }));
}

function renderObservations() {
  const chipBox = $('result-chips');
  chipBox.classList.toggle('tally__chips--dense', opens.length > 30);
  chipBox.replaceChildren(...chips());
  $('result-tally').textContent = observationLine(opens, handCount ?? opens.length);
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
    await vote(VOTE_ID, answer);
    const keys = Object.keys(ANSWERS);
    const { [VOTE_ID]: tally } = await getCounts([VOTE_ID], keys);
    if (run !== statsRun) return;

    const total = keys.reduce((sum, k) => sum + tally[k], 0);
    if (total === 0) {
      status.textContent = '아직 기록이 없어요';
      return;
    }
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
      if (k === answer) li.append(el('span', 'legend__mine', '← 나'));
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
  answer = null;
  opens = [];
  handCount = null;
  busy = false;
  clearTimeout(timer);
  for (const btn of document.querySelectorAll('.choice')) btn.setAttribute('aria-pressed', 'false');
  for (const next of document.querySelectorAll('.next')) next.hidden = true;
  setObserved('closed');
  $('box-number').textContent = '상자 #1';
  renderTally();
  show(1);
}

// ── 연결 ──

for (const btn of document.querySelectorAll('[data-step="1"] .choice')) {
  btn.addEventListener('click', () => pick(btn.dataset.choice));
}

for (const btn of document.querySelectorAll('[data-go]')) {
  btn.addEventListener('click', () => (btn.dataset.go === 'result' ? showResult() : show(btn.dataset.go)));
}

$('open-box').addEventListener('click', openBox);
$('bulk-open').addEventListener('click', bulkOpen);
document.querySelector('[data-restart]').addEventListener('click', restart);

renderOtherExperiments($('other-experiments'), 'schrodinger', '../../');

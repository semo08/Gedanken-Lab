import { stance, STANCES } from './stance.js';
import { renderOtherExperiments } from '../../js/other-experiments.js';

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
let statsRun = 0; // 다시 실험했을 때 이전 통계 요청의 결과를 버리기 위한 번호

const $ = (id) => document.getElementById(id);
const sections = [...document.querySelectorAll('[data-step]')];
const box = $('box');

function show(step) {
  for (const s of sections) s.hidden = s.dataset.step !== String(step);
  window.scrollTo(0, 0);
  document.querySelector(`[data-step="${step}"] h1`).focus({ preventScroll: true });
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
  document.querySelector('[data-step="1"] .next').hidden = false;
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
  $('open-box').hidden = state !== 'closed';
  $('reset-box').hidden = state === 'closed';
}

function openBox() {
  const result = Math.random() < 0.5 ? 'alive' : 'dead';
  opens.push(result);
  setObserved(result);
  renderTally();
  $('reset-box').focus();
}

function resetBox() {
  setObserved('closed');
  $('box-number').textContent = `상자 #${opens.length + 1}`;
  $('open-box').focus();
}

function chips() {
  return opens.map((r) => el('span', `chip chip--${r}`));
}

function counts() {
  const alive = opens.filter((r) => r === 'alive').length;
  return { alive, dead: opens.length - alive };
}

function renderTally() {
  const { alive, dead } = counts();
  $('tally-chips').replaceChildren(...chips());
  const left = MIN_OPENS - opens.length;
  $('tally-text').textContent = `${opens.length}번 열었다 · 살아 있음 ${alive} · 쓰러짐 ${dead}`
    + (left > 0 ? ` · ${left}번 더 열어 보자` : '');
  document.querySelector('[data-step="2"] .next').hidden = opens.length < MIN_OPENS;
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
  const { alive, dead } = counts();
  $('result-chips').replaceChildren(...chips());
  $('result-tally').textContent = `${opens.length}번 열어서 살아 있음 ${alive}번, 쓰러짐 ${dead}번`;
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
    const pct = percentages(tally, keys, total);

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

// 반올림 합이 100이 되도록 가장 큰 나머지 순으로 1씩 더한다
function percentages(tally, keys, total) {
  const raw = keys.map((k) => ({ k, v: (tally[k] / total) * 100 }));
  const result = Object.fromEntries(raw.map(({ k, v }) => [k, Math.floor(v)]));
  let left = 100 - Object.values(result).reduce((a, b) => a + b, 0);
  for (const { k } of [...raw].sort((a, b) => (b.v % 1) - (a.v % 1))) {
    if (left-- <= 0) break;
    result[k] += 1;
  }
  return result;
}

function restart() {
  answer = null;
  opens = [];
  for (const btn of document.querySelectorAll('.choice')) btn.setAttribute('aria-pressed', 'false');
  for (const next of document.querySelectorAll('.next')) next.hidden = true;
  setObserved('closed');
  $('box-number').textContent = '상자 #1';
  renderTally();
  $('tally-text').textContent = '아직 열어 본 상자가 없다 · 3번 이상 열어 보자';
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
$('reset-box').addEventListener('click', resetBox);
document.querySelector('[data-restart]').addEventListener('click', restart);

renderOtherExperiments($('other-experiments'), 'schrodinger', '../../');

import { seat, isCorrect, score, layout } from './judge.js';
import { ROUNDS } from './rounds.js';
import { EXPERIMENTS } from '../../js/experiments.js';
import { renderOtherExperiments } from '../../js/other-experiments.js';

const TURING_ID = 'imitation_turing';
const roundId = (i) => `imitation_${i + 1}`; // A = 맞힘, B = 틀림
const MESSAGE_MS = 600;

const $ = (id) => document.getElementById(id);
const sections = [...document.querySelectorAll('[data-step]')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let state;
let timers = [];

function freshState() {
  return {
    round: 0,
    seats: ROUNDS.map(() => seat()), // 라운드마다 기계 자리를 무작위로
    picks: [],
    results: [],
    tallies: [],                     // 라운드별 다른 심판 기록 { A, B } 또는 null
    turing: null,
    run: 0,                          // 다시 실험했을 때 이전 요청의 결과를 버리기 위한 번호
  };
}

function show(step) {
  for (const s of sections) s.hidden = s.dataset.step !== step;
  window.scrollTo(0, 0);
  document.querySelector(`[data-step="${step}"] h1`)?.focus({ preventScroll: true });
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

async function firebase() {
  // 동적으로 불러와서 Firebase CDN이 막혀도 실험 진행은 막지 않는다
  return import('../../js/firebase.js');
}

// ── 라운드 ──

function message(kind, who, text) {
  const msg = el('div', `msg msg--${kind}`);
  msg.append(el('span', 'msg__who', who), el('p', 'msg__text', text));
  return msg;
}

function chatMessages(i) {
  return layout(ROUNDS[i], state.seats[i]).flatMap(({ q, X, Y }) => [
    message('judge', '심판(당신)', q),
    message('X', 'X', X),
    message('Y', 'Y', Y),
  ]);
}

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

function showAll(messages) {
  clearTimers();
  $('chat').replaceChildren(...messages);
  $('skip-chat').hidden = true;
  $('ask').hidden = false;
}

function startRound(i) {
  state.round = i;
  clearTimers();
  $('round-label').textContent = `EXP #05 · 라운드 ${i + 1} / ${ROUNDS.length}`;
  $('round-chips').replaceChildren(...ROUNDS.map((_, k) => el('span', k <= i ? 'is-done' : '')));
  $('round-title').textContent = `라운드 ${i + 1} · 대화를 읽고 기계를 찾아라`;
  for (const btn of document.querySelectorAll('.seat')) {
    btn.disabled = false;
    btn.setAttribute('aria-pressed', 'false');
  }
  $('reveal').hidden = true;
  $('ask').hidden = true;
  $('skip-chat').hidden = false;
  show('round');

  const messages = chatMessages(i);
  if (reduceMotion.matches) { showAll(messages); return; }
  $('chat').replaceChildren();
  messages.forEach((msg, k) => {
    timers.push(setTimeout(() => {
      msg.classList.add('is-new');
      $('chat').append(msg);
      if (k === messages.length - 1) showAll([...$('chat').children]);
    }, k * MESSAGE_MS));
  });
  $('skip-chat').onclick = () => showAll(messages);
}

function judge(pick) {
  const i = state.round;
  if (state.picks[i]) return;
  const machine = state.seats[i];
  const ok = isCorrect(machine, pick);
  state.picks[i] = pick;
  state.results[i] = ok;

  for (const btn of document.querySelectorAll('.seat')) {
    btn.disabled = true;
    btn.setAttribute('aria-pressed', String(btn.dataset.seat === pick));
  }
  const tag = $('round-verdict');
  tag.textContent = ok ? '정답' : '오답';
  tag.style.color = ok ? 'var(--b)' : 'var(--a)';
  const round = ROUNDS[i];
  $('reveal-who').textContent = `기계는 ${machine}였다 · ${round.era} ${round.label}`;
  $('reveal-hint').textContent = round.reveal;
  $('next-round').textContent = i < ROUNDS.length - 1 ? '다음 라운드 →' : '마지막 질문으로 →';
  $('reveal').hidden = false;
  $('reveal').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'nearest' });
  loadRoundStats(i, ok);
}

function accuracyBar(tally) {
  const total = tally.A + tally.B;
  const pct = Math.round((tally.A / total) * 100);
  const bar = el('div', 'stat__bar');
  bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', `정답률 ${pct}%`);
  if (pct > 0) {
    const seg = el('div', 'stat__seg', pct >= 15 ? `${pct}%` : '');
    seg.style.width = `${pct}%`;
    bar.append(seg);
  }
  return [bar, el('p', 'stat__legend', `정답 ${tally.A}명 · 오답 ${tally.B}명 · 정답률 ${pct}%`)];
}

async function loadRoundStats(i, ok) {
  const run = state.run;
  const box = $('round-stats');
  box.replaceChildren(el('p', 'stat-status', '기록 불러오는 중…'));
  try {
    const { vote, getCounts } = await firebase();
    await vote(roundId(i), ok ? 'A' : 'B');
    const { [roundId(i)]: tally } = await getCounts([roundId(i)]);
    if (run !== state.run) return;
    state.tallies[i] = tally;
    if (state.round === i) box.replaceChildren(...accuracyBar(tally));
  } catch (err) {
    if (run !== state.run) return;
    console.error(err);
    state.tallies[i] = null;
    if (state.round === i) box.replaceChildren(el('p', 'stat-status', '다른 심판들의 기록을 불러오지 못했어요.'));
  }
}

function nextRound() {
  if (state.round < ROUNDS.length - 1) startRound(state.round + 1);
  else show('turing');
}

// ── 튜링의 질문 ──

function pickTuring(choice) {
  state.turing = choice;
  for (const btn of document.querySelectorAll('[data-step="turing"] .choice')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.choice === choice));
  }
  document.querySelector('[data-step="turing"] .next').hidden = false;
}

// ── 결과 ──

const SCORE_LINE = {
  3: '세 라운드를 모두 맞혔다. 날카로운 심판이다. 하지만 실제 연구에서는 3라운드 같은 대화에서 많은 심판이 속았다.',
  2: '두 라운드를 맞혔다. 기계가 진화할수록 판정은 어려워졌다.',
  1: '한 라운드만 맞혔다. 최신 기계는 사람보다 더 사람처럼 대답하기도 한다.',
  0: '하나도 맞히지 못했다. 당신만 그런 게 아니다. 2025년 연구에서도 심판들은 기계를 사람으로 더 자주 골랐다.',
};

function showResult() {
  const { correct, total } = score(state.results);
  $('score-title').textContent = `${total}라운드 중 ${correct}개를 맞혔다`;
  $('score-line').textContent = SCORE_LINE[correct];

  $('score-chips').replaceChildren(...state.results.map((ok, i) => {
    const chip = el('span', `score-chip score-chip--${ok ? 'ok' : 'no'}`, ok ? '✓' : '✗');
    chip.setAttribute('aria-label', `라운드 ${i + 1} ${ok ? '정답' : '오답'}`);
    return chip;
  }));

  $('acc-list').replaceChildren(...ROUNDS.map((round, i) => {
    const row = el('div', 'acc');
    const head = el('div', 'acc__head');
    const title = el('span');
    title.append(el('strong', '', `라운드 ${i + 1}`), ` · ${round.era} ${round.label}`);
    const mine = el('span', 'acc__mine', `나: ${state.results[i] ? '정답 ✓' : '오답 ✗'}`);
    mine.style.color = state.results[i] ? 'var(--b)' : 'var(--a)';
    head.append(title, mine);
    row.append(head);
    const tally = state.tallies[i];
    if (tally && tally.A + tally.B > 0) row.append(...accuracyBar(tally));
    else row.append(el('p', 'stat-status', '다른 심판들의 기록을 불러오지 못했어요.'));
    return row;
  }));

  const room = EXPERIMENTS.find((e) => e.slug === 'chinese-room');
  const link = $('room-link');
  link.replaceChildren();
  if (room?.ready) {
    const a = el('a', '', `설의 반박을 EXP #${room.num} ${room.title}에서 직접 겪어 보자 →`);
    a.href = `../${room.slug}/`;
    link.append(a);
  }

  $('turing-mine').textContent = `나의 답 · ${state.turing === 'A' ? '그렇다' : '아니다'}`;
  loadTuringStats();
  show('result');
}

async function loadTuringStats() {
  const run = state.run;
  const box = $('turing-stats');
  box.replaceChildren(el('p', 'stat-status', '기록 불러오는 중…'));
  try {
    const { vote, getCounts } = await firebase();
    await vote(TURING_ID, state.turing);
    const { [TURING_ID]: { A, B } } = await getCounts([TURING_ID]);
    if (run !== state.run) return;
    const total = A + B;
    if (total === 0) { box.replaceChildren(el('p', 'stat-status', '아직 기록이 없어요')); return; }
    const pctA = Math.round((A / total) * 100);
    const bar = el('div', 'stat__bar');
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', `그렇다 ${pctA}%, 아니다 ${100 - pctA}%`);
    for (const [key, pct, color] of [['A', pctA, 'var(--a)'], ['B', 100 - pctA, 'var(--b)']]) {
      if (pct === 0) continue;
      const seg = el('div', 'stat__seg', pct >= 20 ? `${key === 'A' ? '그렇다' : '아니다'} ${pct}%` : '');
      seg.style.width = `${pct}%`;
      seg.style.background = color;
      bar.append(seg);
    }
    box.replaceChildren(bar, el('p', 'stat__legend', `그렇다 ${pctA}% · 아니다 ${100 - pctA}% · ${total}명 참여`));
  } catch (err) {
    if (run !== state.run) return;
    console.error(err);
    box.replaceChildren(el('p', 'stat-status', '다른 실험자들의 기록을 불러오지 못했어요.'));
  }
}

function restart() {
  clearTimers();
  const run = state.run + 1;
  state = freshState();
  state.run = run;
  for (const btn of document.querySelectorAll('[data-step="turing"] .choice')) btn.setAttribute('aria-pressed', 'false');
  document.querySelector('[data-step="turing"] .next').hidden = true;
  show('intro');
}

// ── 연결 ──

state = freshState();

$('start').addEventListener('click', () => startRound(0));
for (const btn of document.querySelectorAll('.seat')) btn.addEventListener('click', () => judge(btn.dataset.seat));
$('next-round').addEventListener('click', nextRound);
for (const btn of document.querySelectorAll('[data-step="turing"] .choice')) btn.addEventListener('click', () => pickTuring(btn.dataset.choice));
$('to-result').addEventListener('click', showResult);
document.querySelector('[data-restart]').addEventListener('click', restart);

renderOtherExperiments($('other-experiments'), 'imitation', '../../');

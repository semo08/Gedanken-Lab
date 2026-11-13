import { GLYPHS, glyph } from './glyphs.js';
import { NOTES, PAGES, PAGE_HINTS, expected, check } from './rules.js';
import { stance, STANCES } from './stance.js';
import { EXPERIMENTS } from '../../js/experiments.js';
import { renderOtherExperiments } from '../../js/other-experiments.js';
import { percentages } from '../../js/percentages.js';

const VOTE_ID = 'chinese_room';
const MAX_ANSWER = 4;      // 답 쪽지에 놓을 수 있는 기호 수
const HELP_AFTER = 3;      // 이만큼 틀리면 규칙서대로 채워 준다
const NEXT_NOTE_MS = 900;

const ANSWERS = {
  A: { label: '아무도 이해하지 못했다', color: 'var(--a)' },
  B: { label: '방 전체는 이해했다', color: 'var(--b)' },
  C: { label: '"이해"의 기준이 모호하다', color: 'var(--rule)' },
};

const $ = (id) => document.getElementById(id);
const sections = [...document.querySelectorAll('[data-step]')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let state;
let statsRun = 0;

function freshState() {
  return { note: 0, history: [], answer: [], wrong: 0, totalWrong: 0, busy: false, choice: null };
}

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

// 기호 SVG. 화면에는 모양만 있고 뜻은 숨긴다(번호로만 부른다)
const glyphNumber = (id) => GLYPHS.findIndex((g) => g.id === id) + 1;
function glyphSvg(id, size = '') {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  node.setAttribute('viewBox', '0 0 24 24');
  node.setAttribute('class', `glyph ${size}`);
  node.setAttribute('aria-hidden', 'true');
  node.innerHTML = glyph(id).svg; // glyphs.js의 고정 문자열
  return node;
}
function glyphRow(ids, size) {
  const row = el('span', 'glyphs');
  row.setAttribute('role', 'img');
  row.setAttribute('aria-label', ids.length ? ids.map((id) => `기호 ${glyphNumber(id)}`).join(', ') : '비어 있음');
  row.append(...ids.map((id) => glyphSvg(id, size)));
  return row;
}

// ── 방 안 ──

function renderRoom() {
  const { note } = state;
  const done = note >= NOTES.length;
  $('note-count').textContent = done ? '쪽지 5 / 5 완료' : `쪽지 ${note + 1} / ${NOTES.length}`;
  $('note-chips').replaceChildren(...NOTES.map((_, i) => el('span', i < note ? 'is-done' : '')));

  const incoming = done ? NOTES.at(-1).incoming : NOTES[note].incoming;
  $('incoming').replaceChildren(glyphRow(incoming, 'glyph--lg'));
  // 규칙서가 앞 쪽지와 다른 페이지로 넘어간 쪽지(3, 5)에서만 안내를 강조한다
  const pageChanged = !done && note > 0 && NOTES[note].page !== NOTES[note - 1].page;
  renderRules(done ? NOTES.at(-1).page : NOTES[note].page, pageChanged);
  renderAnswer();
  renderCards(done);
  renderLog();
}

function ruleRow(rule) {
  const row = el('div', 'book__rule');
  const say = (text) => el('span', '', text);
  switch (rule.when) {
    case 'exact': row.append(glyphRow(rule.pattern, 'glyph--sm'), say('이 오면')); break;
    case 'endsWith': row.append(say('맨 끝이'), glyphRow(rule.pattern, 'glyph--sm'), say('이면')); break;
    case 'prevEndsWith': row.append(say('내가 직전에 내보낸 쪽지의 맨 끝이'), glyphRow(rule.pattern, 'glyph--sm'), say('이면')); break;
    default: row.append(say('그 밖에는'));
  }
  row.append(el('span', 'book__arrow', '→'), glyphRow(rule.out, 'glyph--sm'));
  return row;
}

function renderRules(page, changed) {
  const hint = $('rule-hint');
  hint.textContent = PAGE_HINTS[page];
  hint.className = changed ? 'book__hint book__hint--changed' : 'book__hint';
  $('rules').replaceChildren(...PAGES[page].map(ruleRow));
}

function renderAnswer() {
  const locked = state.busy || state.note >= NOTES.length;
  const slots = state.answer.map((id, i) => {
    const slot = el('button', 'answer-slot answer-slot--filled');
    slot.type = 'button';
    slot.disabled = locked;
    slot.setAttribute('aria-label', `${i + 1}번째 칸: 기호 ${glyphNumber(id)}. 누르면 뺀다`);
    slot.append(glyphSvg(id, 'glyph--lg'));
    slot.addEventListener('click', () => { state.answer.splice(i, 1); renderAnswer(); });
    return slot;
  });
  if (state.answer.length < MAX_ANSWER && !locked) {
    const empty = el('span', 'answer-slot');
    empty.setAttribute('aria-hidden', 'true');
    slots.push(empty);
  }
  $('answer').replaceChildren(...slots);
  $('send').disabled = locked || state.answer.length === 0;
  $('clear').disabled = locked || state.answer.length === 0;
}

function renderCards(done) {
  $('cards').replaceChildren(...GLYPHS.map((g, i) => {
    const card = el('button', 'glyph-card');
    card.type = 'button';
    card.disabled = done || state.busy;
    card.setAttribute('aria-label', `기호 ${i + 1} 카드`);
    card.append(glyphSvg(g.id, 'glyph--lg'));
    card.addEventListener('click', () => {
      if (state.answer.length >= MAX_ANSWER) return;
      state.answer.push(g.id);
      renderAnswer();
    });
    return card;
  }));
}

function renderLog() {
  const items = [];
  state.history.forEach((sent, i) => {
    const inLi = el('li');
    inLi.append(el('span', '', `${i + 1} 들어옴`), glyphRow(NOTES[i].incoming, 'glyph--sm'));
    const outLi = el('li');
    outLi.append(el('span', '', `${i + 1} 내보냄`), glyphRow(sent, 'glyph--sm'));
    items.push(inLi, outLi);
  });
  if (!items.length) items.push(el('li', '', '아직 없다'));
  $('log').replaceChildren(...items);
}

function feedback(text, tone = '') {
  const node = $('feedback');
  node.textContent = text;
  node.className = `feedback ${tone ? `feedback--${tone}` : ''}`;
}

function send() {
  const { note, answer, history } = state;
  if (state.busy || !answer.length || note >= NOTES.length) return;

  if (!check(note, answer, history)) {
    state.wrong += 1;
    state.totalWrong += 1;
    const book = $('book');
    book.classList.remove('shake');
    void book.offsetWidth; // 애니메이션을 다시 시작하게 한다
    book.classList.add('shake');
    if (state.wrong >= HELP_AFTER) {
      state.answer = [...expected(note, history)];
      renderAnswer();
      feedback('규칙서대로라면 이렇게 된다. 그대로 내보내 보자.', 'no');
    } else {
      feedback(`규칙서와 다르다. 맞는 줄을 다시 찾아보자 (${state.wrong} / ${HELP_AFTER})`, 'no');
    }
    return;
  }

  history.push([...answer]);
  state.answer = [];
  state.wrong = 0;
  state.note += 1;
  const finished = state.note >= NOTES.length;
  feedback(finished ? '✓ 마지막 쪽지를 내보냈다. 더 들어오는 쪽지는 없다.' : '✓ 쪽지를 내보냈다. 밖에서 답장이 들어온다…', 'ok');

  if (finished) {
    renderRoom();
    $('send').hidden = true;
    $('clear').hidden = true;
    $('to-outside').hidden = false;
    $('to-outside').focus();
    return;
  }
  state.busy = true;
  renderRoom();
  setTimeout(() => {
    state.busy = false;
    renderRoom();
    // 폰에서는 카드를 고르느라 아래에 있다. 새 쪽지와 규칙서가 보이게 올려 준다
    $('incoming-slip').scrollIntoView({ block: 'nearest', behavior: smooth() });
  }, reduceMotion.matches ? 0 : NEXT_NOTE_MS);
}

// ── 방 밖 ──

// 반전: 화면에 들어온 줄부터 차례로 뜻이 나타나고, 다 나타나면 밖 사람의 말이 나온다
let readAt = 0;
let unread = 0;
const translator = new IntersectionObserver((entries) => {
  for (const { target, isIntersecting } of entries) {
    if (!isIntersecting) continue;
    translator.unobserve(target);
    const now = performance.now();
    readAt = Math.max(now, readAt + 350);
    setTimeout(() => {
      target.classList.add('is-read');
      unread -= 1;
      if (unread === 0) setTimeout(() => $('quote').classList.add('is-read'), 500);
    }, readAt - now);
  }
}, { threshold: 1 });

function renderTranscript() {
  translator.disconnect();
  $('quote').classList.remove('is-read');
  $('transcript').replaceChildren(...NOTES.map((note, i) => {
    const row = el('div', 'exchange');
    const outside = el('div', 'line line--out');
    outside.append(el('span', 'label label--muted', `밖에서 온 쪽지 ${i + 1}`), glyphRow(note.incoming, 'glyph--sm'), el('span', 'line__meaning', note.say));
    const room = el('div', 'line line--room');
    room.append(el('span', 'label label--muted', '당신이 내보낸 쪽지'), glyphRow(state.history[i] ?? [], 'glyph--sm'), el('span', 'line__meaning', note.reply));
    row.append(outside, room);
    return row;
  }));

  const lines = [...$('transcript').querySelectorAll('.line__meaning')];
  if (reduceMotion.matches) {
    for (const node of [...lines, $('quote')]) node.classList.add('is-read');
    return;
  }
  readAt = performance.now() + 400; // 화면이 바뀐 뒤 기호를 잠깐 보여 주고 시작한다
  unread = lines.length;
  for (const node of lines) translator.observe(node);
}

const smooth = () => (reduceMotion.matches ? 'auto' : 'smooth');

// 새로 나타난 버튼이 화면 밖이면 보이게 스크롤한다
function reveal(node) {
  node.hidden = false;
  node.scrollIntoView({ block: 'nearest', behavior: smooth() });
}

function pick(choice) {
  state.choice = choice;
  for (const btn of document.querySelectorAll('[data-step="3"] .choice')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.choice === choice));
  }
  reveal(document.querySelector('[data-step="3"] .next'));
}

// ── 결과 ──

function showResult() {
  const mine = stance(state.choice);
  $('stance-name').textContent = mine.name;
  $('stance-line').textContent = mine.line;
  $('my-answer').textContent = `나의 답 · ${ANSWERS[state.choice].label}`;
  $('stances').replaceChildren(...STANCES.map((s) => {
    const isMine = s.key === mine.key;
    const card = el('div', isMine ? 'stance stance--mine' : 'stance');
    const head = el('div', 'row');
    head.append(el('span', isMine ? 'label' : 'label label--muted', s.who));
    if (isMine) head.append(el('span', 'label', '나의 입장 ✓'));
    card.append(head, el('h3', '', s.name), el('p', '', s.line), el('p', 'stance__reply', s.reply));
    return card;
  }));

  $('f-notes').textContent = `${state.history.length}장`;
  $('f-wrong').textContent = `${state.totalWrong}번`;

  const imitation = EXPERIMENTS.find((e) => e.slug === 'imitation');
  const link = $('imitation-link');
  link.replaceChildren();
  if (imitation?.ready) {
    const a = el('a', '', `반대편, 튜링의 주장은 EXP #${imitation.num} ${imitation.title}에서 직접 겪어 볼 수 있다 →`);
    a.href = `../${imitation.slug}/`;
    link.append(a);
  } else {
    link.textContent = '반대편, 튜링의 주장을 직접 겪어 보는 EXP #05 이미테이션 게임은 준비 중이다.';
  }

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
    await vote(VOTE_ID, state.choice);
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
      if (k === state.choice) li.append(el('span', 'legend__mine', '← 나'));
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
  state = freshState();
  for (const btn of document.querySelectorAll('.choice')) btn.setAttribute('aria-pressed', 'false');
  for (const next of document.querySelectorAll('.next')) next.hidden = true;
  $('send').hidden = false;
  $('clear').hidden = false;
  $('to-outside').hidden = true;
  feedback('');
  renderRoom();
  show(1);
}

// ── 연결 ──

state = freshState();

for (const btn of document.querySelectorAll('[data-go]')) {
  btn.addEventListener('click', () => {
    const step = btn.dataset.go;
    if (step === 'result') showResult();
    else {
      if (step === '3') renderTranscript();
      show(step);
    }
  });
}
for (const btn of document.querySelectorAll('[data-step="3"] .choice')) {
  btn.addEventListener('click', () => pick(btn.dataset.choice));
}
$('send').addEventListener('click', send);
$('clear').addEventListener('click', () => { state.answer = []; renderAnswer(); });
document.querySelector('[data-restart]').addEventListener('click', restart);

renderRoom();
renderOtherExperiments($('other-experiments'), 'chinese-room', '../../');

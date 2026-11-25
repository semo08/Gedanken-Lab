import { verdict, reflection } from './verdict.js';
import { renderOtherExperiments } from '../../js/other-experiments.js';
import { renderDeepEntry } from '../../js/deep-entry.js';
import { percentages } from '../../js/percentages.js';
import { DEEP_KEYS, deepKey, crossRate, deepTally, isSameStance } from './deep.js';

const SCENES = [
  { step: 1, id: 'trolley_1', A: '당긴다', B: '둔다', pick: { A: '레버를 당긴다', B: '그대로 둔다' } },
  { step: 2, id: 'trolley_2', A: '민다', B: '밀지 않는다', pick: { A: '민다', B: '밀지 않는다' } },
  { step: 3, id: 'trolley_3', A: '피해 최소화', B: '탑승자 우선', pick: { A: '피해를 최소화한다', B: '탑승자를 우선한다' } },
];

const choices = { 1: null, 2: null, 3: null, 'deep-1': null, 'deep-2': null };
const sections = [...document.querySelectorAll('[data-step]')];
let statsRun = 0; // 다시 실험했을 때 이전 통계 요청의 결과를 버리기 위한 번호

function show(step) {
  for (const s of sections) s.hidden = s.dataset.step !== String(step);
  window.scrollTo(0, 0);
  document.querySelector(`[data-step="${step}"] h1`).focus({ preventScroll: true });
}

function pick(section, choice) {
  choices[section.dataset.step] = choice;
  section.dataset.picked = choice; // CSS가 고른 쪽 경로를 그리고 레버를 넘긴다
  for (const btn of section.querySelectorAll('.choice')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.choice === choice));
  }
  const next = section.querySelector('.next');
  next.hidden = false;
  // 폰에서는 선택지 아래가 화면 밖이라 "다음" 버튼이 나타난 걸 모를 수 있다
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  next.scrollIntoView({ block: 'nearest', behavior: smooth ? 'smooth' : 'auto' });
}

function restart() {
  for (const key of Object.keys(choices)) choices[key] = null;
  for (const btn of document.querySelectorAll('.choice')) btn.setAttribute('aria-pressed', 'false');
  for (const next of document.querySelectorAll('.next')) next.hidden = true;
  for (const section of sections) delete section.dataset.picked;
  show(1);
}

function showResult() {
  renderVerdict();
  renderStats();
  show('result');
}

function renderVerdict() {
  const v = verdict(choices);
  const type = document.getElementById('verdict-type');
  type.textContent = v.type;
  type.className = `type--${v.side}`;
  document.getElementById('verdict-line').textContent = v.line;
  document.getElementById('reflection-mine').textContent = reflection(choices);
  document.getElementById('gauge').setAttribute('aria-label',
    `공리주의와 의무론 사이에서 ${v.side === 'A' ? '공리주의' : '의무론'} 쪽에 가까움`);
  // 다음 프레임에 옮겨야 게이지가 가운데서 미끄러져 간다
  const marker = document.getElementById('gauge-marker');
  marker.style.left = '50%';
  requestAnimationFrame(() => requestAnimationFrame(() => { marker.style.left = `${v.gauge}%`; }));
}

async function renderStats() {
  const run = ++statsRun;
  const status = document.getElementById('stats-status');
  const list = document.getElementById('stats');
  status.textContent = '기록 불러오는 중…';
  status.hidden = false;
  list.replaceChildren();

  try {
    // 동적으로 불러와서 Firebase CDN이 막혀도 판정과 고찰은 그대로 보이게 한다
    const { vote, getCounts } = await import('../../js/firebase.js');
    await Promise.all(SCENES.map((s) => vote(s.id, choices[s.step])));
    const counts = await getCounts(SCENES.map((s) => s.id));
    if (run !== statsRun) return;
    status.hidden = true;
    list.replaceChildren(...SCENES.map((s) => statRow(s, choices[s.step], counts[s.id])));
  } catch (err) {
    if (run !== statsRun) return;
    console.error(err);
    status.textContent = '다른 실험자들의 기록을 불러오지 못했어요.';
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function statRow(scene, mine, { A, B }) {
  const row = el('div', 'stat');

  const head = el('div', 'stat__head');
  const title = el('span');
  title.append(el('strong', '', `장면 ${scene.step}`), ` · ${scene.pick[mine]}`);
  head.append(title, el('span', 'mine-badge', '나의 선택'));
  row.append(head);

  const total = A + B;
  if (total === 0) {
    row.append(el('p', 'stat__legend', '아직 기록이 없어요'));
    return row;
  }

  const pctA = Math.round((A / total) * 100);
  const pct = { A: pctA, B: 100 - pctA };

  const bar = el('div', 'stat__bar');
  bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', `${scene.A} ${pct.A}%, ${scene.B} ${pct.B}%. 나의 선택: ${scene[mine]}`);
  for (const side of ['A', 'B']) {
    if (pct[side] === 0) continue;
    const isMine = side === mine;
    // 좁은 칸에는 글자를 넣지 않는다. 숫자는 아래 범례에 항상 있다.
    const hasText = pct[side] >= 25;
    const seg = el('div', isMine ? 'stat__seg is-mine' : 'stat__seg', hasText ? `${scene[side]} ${pct[side]}%` : '');
    seg.style.flexGrow = String(pct[side]);
    seg.style.flexBasis = '0';
    if (!hasText) seg.style.padding = '0';
    seg.style.background = isMine ? `var(--${side.toLowerCase()})` : `var(--${side.toLowerCase()}-light)`;
    seg.style.color = isMine ? 'var(--white)' : 'var(--ink)';
    bar.append(seg);
  }
  row.append(bar);

  // 막대에 글자가 들어간 쪽은 다시 쓰지 않는다. 좁아서 비운 쪽만 여기에 적는다
  const hidden = ['A', 'B'].filter((side) => pct[side] > 0 && pct[side] < 25).map((side) => `${scene[side]} ${pct[side]}%`);
  row.append(el('p', 'stat__legend', [...hidden, `${total}명 참여`].join(' · ')));
  return row;
}

// ── 심화: 가족이라면 / 세 갈래 선로 ──

const DEEP = [
  { step: 1, id: 'trolley_deep_1', name: '가족일 때', said: { A: '당겼다', B: '당기지 않았다' } },
  { step: 2, id: 'trolley_deep_2', name: '세 갈래 선로', said: { A: '당기지 않았다', B: '왼쪽으로 당겼다', C: '오른쪽으로 당겼다(내가 희생)' } },
];
const SCENE1_SAID = { A: '당겼다', B: '당기지 않았다' };
const DEEP2_ANSWERS = {
  A: { label: '그대로 둔다', color: 'var(--a)' },
  B: { label: '왼쪽으로 당긴다', color: 'var(--b)' },
  C: { label: '오른쪽으로 당긴다', color: 'var(--c)' },
};
let deepRun = 0;

function showDeepResult() {
  const scene1 = choices[1];
  const rows = DEEP.map((d) => ({ d, mine: choices[`deep-${d.step}`] }));
  const changed = rows.filter(({ d, mine }) => !isSameStance(scene1, d.step, mine)).length;
  document.getElementById('deep-title').textContent = changed
    ? '누가 서 있느냐에 따라, 당신의 답이 달라졌다'
    : '누가 서 있든, 당신의 답은 장면 1과 같은 쪽이었다';
  document.getElementById('deep-compare').replaceChildren(...rows.map(({ d, mine }) => {
    const same = isSameStance(scene1, d.step, mine);
    const li = el('li', same ? '' : 'is-changed', `장면 1: ${SCENE1_SAID[scene1]} → ${d.name}: ${d.said[mine]}`);
    if (!same) li.append(el('span', 'compare__chip', '달라짐'));
    return li;
  }));
  renderDeepStats();
  show('deep-result');
}

function percent(rate) {
  return `${Math.round(rate * 100)}%`;
}

function crossLine(text, rate) {
  const p = el('p', 'cross');
  if (rate === null) p.append(text, ': 아직 기록이 없어요');
  else p.append(`${text} `, el('strong', '', percent(rate)));
  return p;
}

async function renderDeepStats() {
  const run = ++deepRun;
  const status = document.getElementById('deep-stats-status');
  const list = document.getElementById('deep-stats');
  status.textContent = '기록 불러오는 중…';
  status.hidden = false;
  list.replaceChildren();

  try {
    const { vote, getCounts } = await import('../../js/firebase.js');
    await Promise.all(DEEP.map((d) => vote(d.id, deepKey(choices[1], choices[`deep-${d.step}`]))));
    const [{ [DEEP[0].id]: c1 }, { [DEEP[1].id]: c2 }] = await Promise.all(
      DEEP.map((d) => getCounts([d.id], DEEP_KEYS[d.step])),
    );
    if (run !== deepRun) return;
    status.hidden = true;

    const mine = choices['deep-2'];
    const tally = deepTally(c2);
    const keys = Object.keys(DEEP2_ANSWERS);
    const total2 = keys.reduce((sum, k) => sum + (tally[k] ?? 0), 0);
    const parts = [
      el('h3', 'stat-head', '가족이 서 있을 때'),
      crossLine('장면 1에서 레버를 당긴 사람 중, 가족이 서 있을 때도 당긴 사람', crossRate(c1, 'A', 'A')),
      el('h3', 'stat-head', '세 갈래 선로'),
      crossLine('장면 1에서 레버를 당긴 사람 중, 자신을 희생하는 쪽을 고른 사람', crossRate(c2, 'A', 'C')),
    ];
    if (total2 > 0) {
      const pct = percentages(Object.fromEntries(keys.map((k) => [k, tally[k] ?? 0])));
      const bar = el('div', 'bar');
      bar.setAttribute('role', 'img');
      bar.setAttribute('aria-label', `${keys.map((k) => `${DEEP2_ANSWERS[k].label} ${pct[k]}%`).join(', ')}. 나의 선택: ${DEEP2_ANSWERS[mine].label}`);
      for (const k of keys) {
        if (!tally[k]) continue;
        const seg = el('div', k === mine ? 'is-mine' : '');
        seg.style.flex = `${tally[k]} 1 0`;
        seg.style.background = DEEP2_ANSWERS[k].color;
        bar.append(seg);
      }
      const legend = el('ul', 'legend');
      for (const k of keys) {
        const li = el('li', k === mine ? 'is-mine-row' : '');
        const swatch = el('span', 'legend__swatch');
        swatch.style.background = DEEP2_ANSWERS[k].color;
        li.append(swatch, el('span', '', `${k} · ${DEEP2_ANSWERS[k].label}`));
        if (k === mine) li.append(el('span', 'mine-badge', '나'));
        li.append(el('span', 'legend__pct', `${pct[k]}%`));
        legend.append(li);
      }
      parts.push(bar, legend, el('p', 'stat__legend', `${total2}명 참여`));
    }
    list.replaceChildren(...parts);
  } catch (err) {
    if (run !== deepRun) return;
    console.error(err);
    status.textContent = '다른 실험자들의 기록을 불러오지 못했어요.';
  }
}

for (const section of sections) {
  for (const btn of section.querySelectorAll('.choice')) {
    btn.addEventListener('click', () => pick(section, btn.dataset.choice));
  }
}

const GO = {
  result: showResult,
  'result-back': () => show('result'), // 심화에서 돌아갈 때는 결과를 다시 계산하지 않는다
  'deep-result': showDeepResult,
};
for (const btn of document.querySelectorAll('[data-go]')) {
  btn.addEventListener('click', () => (GO[btn.dataset.go] ?? (() => show(btn.dataset.go)))());
}

document.querySelector('[data-restart]').addEventListener('click', restart);

renderOtherExperiments(document.getElementById('other-experiments'), 'trolley', '../../');
renderOtherExperiments(document.getElementById('deep-other-experiments'), 'trolley', '../../');
renderDeepEntry(document.getElementById('deep-entry'), 'trolley');

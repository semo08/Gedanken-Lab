import { EXPERIMENTS } from './experiments.js';

const FIELD_COLOR = { 윤리: 'var(--a)', 물리: 'var(--b)' };

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function card(exp, rootPath) {
  const node = exp.ready ? el('a', 'exp') : el('div', 'exp exp--soon');
  if (exp.ready) node.href = `${rootPath}experiments/${exp.slug}/`;

  const head = el('div', 'row');
  head.append(
    el('span', exp.ready ? 'label' : 'label label--muted', `EXPERIMENT #${exp.num}`),
    el('span', 'exp__tag', exp.field),
  );
  head.lastChild.style.color = exp.ready ? FIELD_COLOR[exp.field] : 'var(--muted)';

  node.append(head, el('h2', '', exp.title), el('p', '', exp.blurb));
  node.append(exp.ready ? el('span', 'exp__cta', '실험 시작 →') : el('span', 'label label--muted', '[ 준비 중 ]'));
  return node;
}

/** 현재 실험을 뺀 나머지 실험 카드를 container에 그린다. rootPath는 사이트 루트까지의 상대 경로. */
export function renderOtherExperiments(container, currentSlug, rootPath) {
  container.replaceChildren(
    ...EXPERIMENTS.filter((exp) => exp.slug !== currentSlug).map((exp) => card(exp, rootPath)),
  );
}

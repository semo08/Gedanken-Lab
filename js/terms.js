// 용어 말풍선. 본문의 <button class="term" data-term="키">를 누르면 js/glossary.js의 설명을 말풍선으로 띄운다.
// 페이지에서 이 모듈을 불러오기만 하면 된다(문서 전체에 이벤트 위임).
import { GLOSSARY } from './glossary.js';

const POP_ID = 'term-pop';
const GAP = 10;        // 용어와 말풍선 사이
const EDGE = 16;       // 화면 양옆 여백
const TOP_SAFE = 56;   // 위쪽에 붙은 상단 바(약 48px) 아래만 쓴다

let pop = null;
let current = null;

function ensurePop() {
  if (pop) return pop;
  pop = document.createElement('div');
  pop.id = POP_ID;
  pop.className = 'term-pop';
  pop.setAttribute('role', 'note');
  pop.hidden = true;
  pop.append(document.createElement('strong'), document.createElement('p'));
  document.body.append(pop);
  return pop;
}

function place(button) {
  const rect = button.getBoundingClientRect();
  const width = Math.min(320, window.innerWidth - EDGE * 2);
  pop.style.width = `${width}px`;

  const center = rect.left + rect.width / 2;
  const left = Math.min(Math.max(center - width / 2, EDGE), window.innerWidth - EDGE - width);
  const height = pop.offsetHeight;
  const below = rect.top - height - GAP < TOP_SAFE; // 위에 자리가 없으면 아래로
  const top = below ? rect.bottom + GAP : rect.top - height - GAP;

  pop.style.left = `${left + window.scrollX}px`;
  pop.style.top = `${top + window.scrollY}px`;
  // 용어가 화면 끝에 있어도 꼬리는 말풍선 모서리 안쪽에 둔다
  pop.style.setProperty('--arrow-x', `${Math.min(Math.max(center - left, 14), width - 14)}px`);
  pop.classList.toggle('term-pop--below', below);
}

function open(button) {
  const entry = GLOSSARY[button.dataset.term];
  if (!entry) {
    console.warn(`용어 사전에 없는 키: ${button.dataset.term}`);
    return;
  }
  if (current && current !== button) current.setAttribute('aria-expanded', 'false');
  ensurePop();
  pop.querySelector('strong').textContent = entry.term;
  pop.querySelector('p').textContent = entry.text;
  pop.hidden = false;
  place(button);
  button.setAttribute('aria-expanded', 'true');
  current = button;
}

function close({ returnFocus = false } = {}) {
  if (!current) return;
  current.setAttribute('aria-expanded', 'false');
  if (returnFocus) current.focus();
  current = null;
  pop.hidden = true;
}

for (const button of document.querySelectorAll('.term[data-term]')) {
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', POP_ID);
}

document.addEventListener('click', (e) => {
  const button = e.target.closest('.term[data-term]');
  if (button) {
    if (button === current) close();
    else open(button);
  } else if (current && !pop.contains(e.target)) {
    close();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && current) close({ returnFocus: true });
});

window.addEventListener('resize', () => { if (current) place(current); });

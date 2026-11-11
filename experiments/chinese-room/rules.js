// 방 안의 규칙서와 쪽지 5장. DOM 없이 동작하는 순수 모듈이다.
// 규칙 종류(when):
//   exact      들어온 쪽지가 pattern과 똑같으면
//   endsWith   들어온 쪽지의 맨 끝 기호가 pattern[0]이면
//   prevEndsWith  직전에 내보낸 쪽지의 맨 끝 기호가 pattern[0]이면
//   else       위 규칙이 하나도 맞지 않으면
// 규칙은 위에서부터 차례로 보고, 처음 맞는 줄을 따른다.

export const PAGES = {
  // 쪽지 1~2: 단순 대응
  simple: [
    { when: 'exact', pattern: ['g01'], out: ['g01', 'g02'] },
    { when: 'exact', pattern: ['g03', 'g04'], out: ['g05', 'g06', 'g07'] },
  ],
  // 쪽지 3~4: 맨 끝 기호에 따라
  condition: [
    { when: 'endsWith', pattern: ['g06'], out: ['g09', 'g04'] },
    { when: 'endsWith', pattern: ['g10'], out: ['g08', 'g10'] },
    { when: 'else', out: ['g04'] },
  ],
  // 쪽지 5: 앞서 내보낸 쪽지에 따라 (대화를 기억하는 것처럼 보이게)
  memory: [
    { when: 'prevEndsWith', pattern: ['g10'], out: ['g12'] },
    { when: 'else', out: ['g01'] },
  ],
};

// 규칙서 페이지마다 라벨 아래에 보여 줄 안내 한 줄. 페이지가 바뀌는 쪽지(3, 5)에서 강조한다
export const PAGE_HINTS = {
  simple: '들어온 쪽지 전체가 왼쪽 모양과 똑같은 줄을 찾는다.',
  condition: '이번 규칙서는 쪽지의 맨 끝 기호만 본다.',
  memory: '이번 규칙서는 내가 직전에 내보낸 쪽지를 본다.',
};

// say/reply는 반전 화면에서 보여 줄 자연스러운 번역
export const NOTES = [
  { incoming: ['g01'], page: 'simple', say: '안녕?', reply: '안녕, 반가워.' },
  { incoming: ['g03', 'g04'], page: 'simple', say: '기분 어때?', reply: '비가 와서 나른해. 너는?' },
  { incoming: ['g08', 'g06'], page: 'condition', say: '나도 나른해.', reply: '차 한잔 어때?' },
  { incoming: ['g09', 'g10'], page: 'condition', say: '차 좋지!', reply: '나도 좋아.' },
  { incoming: ['g11'], page: 'memory', say: '고마워!', reply: '천만에.' },
];

const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

function matches(rule, incoming, history) {
  switch (rule.when) {
    case 'exact': return same(incoming, rule.pattern);
    case 'endsWith': return incoming.at(-1) === rule.pattern[0];
    case 'prevEndsWith': return history.at(-1)?.at(-1) === rule.pattern[0];
    case 'else': return true;
    default: return false;
  }
}

/** 이 규칙서대로라면 내보내야 할 기호들. history = 지금까지 내보낸 쪽지들 */
export function expected(noteIndex, history) {
  const note = NOTES[noteIndex];
  return PAGES[note.page].find((rule) => matches(rule, note.incoming, history)).out;
}

export function check(noteIndex, answer, history) {
  return same(answer, expected(noteIndex, history));
}

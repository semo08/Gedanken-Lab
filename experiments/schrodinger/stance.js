// "상자를 열기 전, 고양이는?"에 대한 답(A~D)을 양자역학 해석의 입장으로 바꾼다.
// 어느 해석이 정답인지는 아직 논쟁 중이다. 결과 화면도 정답처럼 말하지 않는다.

// 결과 화면에 나란히 보여 줄 순서
export const STANCES = [
  {
    key: 'realism',
    name: '실재론 · 숨은 변수',
    who: '아인슈타인, 봄',
    line: '고양이 상태는 이미 정해져 있다. 우리가 모를 뿐이다.',
  },
  {
    key: 'copenhagen',
    name: '코펜하겐 해석',
    who: '보어, 하이젠베르크',
    line: '관측 전에는 "실제로 어떤 상태인가"라는 질문 자체에 답이 없다.',
  },
  {
    key: 'many-worlds',
    name: '다세계 해석',
    who: '에버렛',
    line: '붕괴는 없다. 두 결과가 각각 다른 세계에서 모두 일어난다.',
  },
];

const KEY_BY_ANSWER = { A: 'realism', B: 'realism', C: 'many-worlds', D: 'copenhagen' };

export function stance(answer) {
  return STANCES.find((s) => s.key === KEY_BY_ANSWER[answer]);
}

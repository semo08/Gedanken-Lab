// "이 방은 이 언어를 이해한 걸까?"에 대한 답(A~C)을 입장으로 바꾼다.
// 설(1980)은 논문에서 시스템 반론과 다른 마음 반론을 직접 소개하고 재반박했다. reply가 그 재반박이다.
// 결론은 아직 나지 않았다. 결과 화면도 정답처럼 말하지 않는다.

export const STANCES = [
  {
    key: 'searle',
    name: '설의 입장',
    who: '존 설',
    line: '기호를 규칙대로 옮겼을 뿐, 뜻은 어디에도 없었다.',
    reply: '설: 프로그램은 기호의 모양(문법)만 다룬다. 모양을 아무리 잘 옮겨도 뜻(의미)은 생기지 않는다.',
  },
  {
    key: 'systems',
    name: '시스템 반론',
    who: '여러 철학자',
    line: '뉴런 하나가 한국어를 모르듯, 이해는 부품이 아니라 전체에 있다.',
    reply: '설: 그럼 방 안 사람이 규칙서를 통째로 외워서 방이 사라지면? 시스템 전체가 그의 머릿속에 있지만, 그는 여전히 이 언어를 모른다.',
  },
  {
    key: 'other-minds',
    name: '다른 마음 반론',
    who: '여러 철학자',
    line: '다른 사람이 이해하는지도 우리는 행동으로만 안다. 기계에게만 더 엄격할 이유가 있을까?',
    reply: '설: 문제는 남이 이해하는지 우리가 어떻게 아느냐가 아니라, 이해가 무엇이냐다. 기호 조작만으로는 그게 생기지 않는다.',
  },
];

const KEY_BY_ANSWER = { A: 'searle', B: 'systems', C: 'other-minds' };

export function stance(answer) {
  return STANCES.find((s) => s.key === KEY_BY_ANSWER[answer]);
}

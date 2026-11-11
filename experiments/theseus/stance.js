// "진짜 테세우스의 배는 어느 쪽일까?"에 대한 답(A~C)을 입장으로 바꾼다.
// 어느 쪽이 정답인지는 정해져 있지 않다. 결과 화면도 정답처럼 말하지 않는다.

export const STANCES = [
  {
    key: 'continuity',
    name: '연속성 입장',
    line: '조금씩 바뀌어도 끊기지 않고 이어져 왔다면 같은 배다.',
  },
  {
    key: 'material',
    name: '재료 입장',
    line: '배를 이루는 원래 재료가 있는 곳에 진짜 배가 있다.',
  },
  {
    key: 'convention',
    name: '규약 입장',
    line: '"같은 배"는 세상에 있는 사실이 아니라 우리가 정하는 이름일 뿐이다.',
  },
];

const KEY_BY_ANSWER = { A: 'continuity', B: 'material', C: 'convention' };

export function stance(answer) {
  return STANCES.find((s) => s.key === KEY_BY_ANSWER[answer]);
}

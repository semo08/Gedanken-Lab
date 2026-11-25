// 트롤리 심화의 교차 집계. DOM 없이 동작하는 순수 모듈이다.
// 개인 정보 없이 "장면 1과 비교"를 보여 주려고, 장면 1 답과 심화 답을 합친 키(AA, AB, …)로 저장한다.

export const DEEP_KEYS = {
  1: ['AA', 'AB', 'BA', 'BB'],
  2: ['AA', 'AB', 'AC', 'BA', 'BB', 'BC'],
};

/** 저장 키: 앞 글자 = 장면 1 답, 뒤 글자 = 심화 답 */
export function deepKey(scene1, deepAnswer) {
  return `${scene1}${deepAnswer}`;
}

/** 장면 1에서 scene1Answer를 고른 사람 중 심화에서 deepAnswer를 고른 비율(0~1). 0명이면 null */
export function crossRate(counts, scene1Answer, deepAnswer) {
  const group = Object.entries(counts).filter(([key]) => key[0] === scene1Answer);
  const total = group.reduce((sum, [, n]) => sum + n, 0);
  if (total === 0) return null;
  return (counts[deepKey(scene1Answer, deepAnswer)] ?? 0) / total;
}

/** 장면 1 답과 상관없이 심화 답별로 합친다. { A: n, B: n, … } */
export function deepTally(counts) {
  const tally = {};
  for (const [key, n] of Object.entries(counts)) tally[key[1]] = (tally[key[1]] ?? 0) + n;
  return tally;
}

/**
 * 심화 답이 장면 1과 같은 방향인지. 장면 1의 A는 "레버를 당겼다".
 * 심화 1은 A가 당긴다, 심화 2는 B(왼쪽)와 C(오른쪽)가 당긴다.
 */
export function isSameStance(scene1, step, deepAnswer) {
  const pulled = step === 1 ? deepAnswer === 'A' : deepAnswer !== 'A';
  return pulled === (scene1 === 'A');
}

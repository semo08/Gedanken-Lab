// 테세우스의 배: 경계선 계산. DOM 없이 동작하는 순수 모듈이다.
// 경계선 = 판자를 바꿀 때마다 "아직 테세우스의 배일까?"에 처음 "아니다"라고 답한 판자 번호.

export const PLANKS = 10;
export const KEYS = [...Array.from({ length: PLANKS }, (_, i) => `P${i + 1}`), 'KEEP'];

/**
 * @param {boolean[]} answers 판자를 바꿀 때마다의 답(true = 그렇다)
 * @returns {number | 'KEEP' | null} 처음 "아니다"가 나온 판자 번호(1부터), 10장 내내 "그렇다"면 'KEEP', 아직 덜 끝났으면 null
 */
export function boundary(answers) {
  const first = answers.indexOf(false);
  if (first !== -1) return first + 1;
  return answers.length >= PLANKS ? 'KEEP' : null;
}

export function voteKey(b) {
  return b === 'KEEP' ? 'KEEP' : `P${b}`;
}

/**
 * 생존 곡선: n장(0~10) 바꾼 뒤에도 "같은 배"라고 본 사람의 비율(0~1).
 * n장째까지 같은 배였던 사람 = 경계선이 n보다 뒤(P(n+1)~P10, KEEP)인 사람.
 * @returns {number[]} 길이 11, 아무도 없으면 빈 배열
 */
export function survival(counts) {
  const total = KEYS.reduce((sum, k) => sum + (counts[k] ?? 0), 0);
  if (total === 0) return [];
  return Array.from({ length: PLANKS + 1 }, (_, n) => {
    const stillSame = KEYS.slice(n).reduce((sum, k) => sum + (counts[k] ?? 0), 0);
    return stillSame / total;
  });
}

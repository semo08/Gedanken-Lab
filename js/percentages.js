/**
 * 표 수를 퍼센트로 바꾼다. 반올림한 합이 정확히 100이 되도록 나머지가 큰 순서로 1씩 더한다.
 * @param {Record<string, number>} tally  예: { A: 3, B: 1, C: 0 }
 * @returns {Record<string, number>}       예: { A: 75, B: 25, C: 0 }. 총합이 0이면 모두 0
 */
export function percentages(tally) {
  const keys = Object.keys(tally);
  const total = keys.reduce((sum, k) => sum + tally[k], 0);
  if (total === 0) return Object.fromEntries(keys.map((k) => [k, 0]));

  const raw = keys.map((k) => ({ k, v: (tally[k] / total) * 100 }));
  const result = Object.fromEntries(raw.map(({ k, v }) => [k, Math.floor(v)]));
  let left = 100 - Object.values(result).reduce((a, b) => a + b, 0);
  for (const { k } of [...raw].sort((a, b) => (b.v % 1) - (a.v % 1))) {
    if (left-- <= 0) break;
    result[k] += 1;
  }
  return result;
}

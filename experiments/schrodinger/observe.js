// 관측 기록(열어 본 결과 목록)을 비율과 결과 화면 문장으로 바꾼다.
// 손으로 연 횟수가 적으면 반반에서 크게 벗어날 수 있다는 점을 숨기지 않는다.

export const BULK = 100;

/** opens: 'alive' | 'dead' 목록 → { total, alive, dead, alivePct } */
export function tally(opens) {
  const alive = opens.filter((r) => r === 'alive').length;
  const total = opens.length;
  return { total, alive, dead: total - alive, alivePct: total ? Math.round((alive / total) * 100) : 0 };
}

/** handCount: 한꺼번에 열기 전에 손으로 연 횟수. 한꺼번에 열지 않았으면 opens.length와 같다 */
export function observationLine(opens, handCount = opens.length) {
  const all = tally(opens);
  if (handCount < all.total) {
    const hand = tally(opens.slice(0, handCount));
    return `손으로 연 ${hand.total}번은 살아 있음 ${hand.alivePct}%였다. ${all.total - hand.total}개를 더 열자 전체 ${all.total}번 중 살아 있음 ${all.alivePct}%가 됐다.`;
  }
  const line = `${all.total}번 열어서 살아 있음 ${all.alive}번, 쓰러짐 ${all.dead}번(살아 있음 ${all.alivePct}%).`;
  return all.total < 20 ? `${line} 열어 본 횟수가 적으면 반반에서 꽤 벗어날 수 있다.` : line;
}

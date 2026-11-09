// 엔트로피 장부. 화면의 막대는 개념도이고, 단위는 비트다.
// 핵심 규칙(란다우어 원리): 기억을 지울 때 나오는 열은 지운 비트 수 이상이고,
// 그동안 분류로 줄인 방의 엔트로피 이상이다. 그래서 지운 뒤에는 항상 방 + 버린 열 ≥ 처음.

function binaryEntropy(p) {
  if (p <= 0 || p >= 1) return 0;
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

/** 빠른/느린 입자가 두 방에 섞인 정도. 반반이면 입자 수만큼(최대), 완전히 갈리면 0. */
export function roomEntropy({ fastLeft, nFast, slowLeft, nSlow }) {
  const part = (left, n) => (n ? n * binaryEntropy(left / n) : 0);
  return part(fastLeft, nFast) + part(slowLeft, nSlow);
}

export function createLedger(startEntropy) {
  let stored = 0;          // 악마가 기억하고 있는 기록(비트)
  let heat = 0;            // 지우면서 버린 열(누적)
  let ref = startEntropy;  // 마지막으로 지웠을 때의 방 엔트로피

  return {
    get stored() { return stored; },
    get heat() { return heat; },
    get start() { return startEntropy; },
    /** 입자 하나를 보고 판단할 때마다 1비트 */
    record() { stored += 1; },
    /** @returns 이번에 버린 열 */
    erase(roomNow) {
      const released = Math.max(stored, ref - roomNow);
      heat += released;
      stored = 0;
      ref = roomNow;
      return released;
    },
    total(roomNow) { return roomNow + heat; },
  };
}

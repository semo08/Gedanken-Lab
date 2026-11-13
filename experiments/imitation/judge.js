// 이미테이션 게임 판정. DOM 없이 동작하는 순수 모듈이다.

/** 기계가 앉을 자리. 라운드마다 무작위로 정해야 정답률이 의미가 있다 */
export function seat(random = Math.random) {
  return random() < 0.5 ? 'X' : 'Y';
}

export function isCorrect(machineSeat, pick) {
  return machineSeat === pick;
}

/** @param {boolean[]} results 라운드별 정답 여부 */
export function score(results) {
  return { correct: results.filter(Boolean).length, total: results.length };
}

/** 기계 답에서 단서 부분을 찾아 [앞, 단서, 뒤]로 나눈다. 단서가 없거나 문장에 없으면 null */
export function splitTell(text, tell) {
  const at = tell ? text.indexOf(tell) : -1;
  return at < 0 ? null : [text.slice(0, at), tell, text.slice(at + tell.length)];
}

/** 대화 각본을 X, Y 자리로 배치한다 */
export function layout(round, machineSeat) {
  return round.turns.map(({ q, human, machine }) => (
    machineSeat === 'X' ? { q, X: machine, Y: human } : { q, X: human, Y: machine }
  ));
}

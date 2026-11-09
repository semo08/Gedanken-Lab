// 장면 1·2·3의 선택(A = 공리주의 쪽, B = 의무론 쪽)을 결과 유형으로 바꾼다.
// 검증된 척도가 아니라 생각할 거리를 주는 연출이다. 근거는 docs/superpowers/specs 참고.

const REVERSE = { type: '역발상 실험자', line: '레버는 두고, 육교에선 밀었다. 대부분과 반대 방향으로 갈렸다.' };

const TYPES = {
  AAA: { type: '철저한 공리주의자', line: '누구의 손이든, 5명은 1명보다 무겁다.' },
  ABA: { type: '조건부 공리주의자', line: '결과가 같아도, 내 손으로 직접 해치는 건 망설였다.' },
  AAB: { type: '현실적 공리주의자', line: '직접 판단할 땐 숫자를 따랐지만, 규칙을 정할 땐 탑승자 편에 섰다.' },
  BAA: REVERSE,
  ABB: { type: '선을 긋는 사람', line: '레버까지는 당겼다. 그 이상의 개입에는 선을 그었다.' },
  BBA: { type: '규칙의 설계자', line: '직접 개입은 거부했지만, 규칙을 정할 땐 다수를 구했다.' },
  BAB: REVERSE,
  BBB: { type: '원칙주의자', line: '결과가 어떻든, 지켜야 할 선이 있다.' },
};

// A 개수 → 게이지 위치 (0 = 공리주의 끝, 100 = 의무론 끝)
const GAUGE_BY_A_COUNT = [90, 65, 35, 10];

export function verdict(choices) {
  const combo = `${choices[1]}${choices[2]}${choices[3]}`;
  const aCount = [...combo].filter((c) => c === 'A').length;
  const gauge = GAUGE_BY_A_COUNT[aCount];
  return { ...TYPES[combo], gauge, side: gauge < 50 ? 'A' : 'B' };
}

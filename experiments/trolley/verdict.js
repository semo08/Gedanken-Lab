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

// 고찰 첫머리: 장면 1·2를 어떻게 이어 답했는지, 장면 3은 연구 결과와 나란히 놓는다
const SAME_NUMBERS = {
  AA: '당신은 레버도 당기고 육교에서도 밀었다. 숫자가 같으니 답도 같았다.',
  AB: '당신은 레버는 당겼지만 육교에서는 밀지 않았다. 숫자는 같았는데 답이 갈렸다.',
  BA: '당신은 레버는 두고 육교에서는 밀었다. 대부분의 사람과 반대로 갈린 드문 답이다.',
  BB: '당신은 레버도 당기지 않고 육교에서도 밀지 않았다. 숫자보다 직접 개입하지 않는 쪽을 골랐다.',
};
const CAR_RULE = {
  A: '자율주행차에는 피해를 줄이는 규칙을 넣었다. 2016년 연구에서 사람들은 이런 차가 옳다고 하면서도, 직접 타고 싶은 건 탑승자를 지키는 차라고 답했다.',
  B: '자율주행차에는 탑승자를 지키는 규칙을 넣었다. 2016년 연구에서도 사람들은 피해를 줄이는 차가 옳다고 하면서, 직접 타고 싶은 건 이런 차라고 답했다.',
};

export function reflection(choices) {
  return `${SAME_NUMBERS[`${choices[1]}${choices[2]}`]} ${CAR_RULE[choices[3]]}`;
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verdict } from '../experiments/trolley/verdict.js';

const cases = [
  ['AAA', '철저한 공리주의자', '누구의 손이든, 5명은 1명보다 무겁다.', 10, 'A'],
  ['ABA', '조건부 공리주의자', '결과가 같아도, 내 손으로 직접 해치는 건 망설였다.', 35, 'A'],
  ['AAB', '현실적 공리주의자', '직접 판단할 땐 숫자를 따랐지만, 규칙을 정할 땐 탑승자 편에 섰다.', 35, 'A'],
  ['BAA', '역발상 실험자', '레버는 두고, 육교에선 밀었다. 대부분과 반대 방향으로 갈렸다.', 35, 'A'],
  ['ABB', '선을 긋는 사람', '레버까지는 당겼다. 그 이상의 개입에는 선을 그었다.', 65, 'B'],
  ['BBA', '규칙의 설계자', '직접 개입은 거부했지만, 규칙을 정할 땐 다수를 구했다.', 65, 'B'],
  ['BAB', '역발상 실험자', '레버는 두고, 육교에선 밀었다. 대부분과 반대 방향으로 갈렸다.', 65, 'B'],
  ['BBB', '원칙주의자', '결과가 어떻든, 지켜야 할 선이 있다.', 90, 'B'],
];

for (const [combo, type, line, gauge, side] of cases) {
  test(`${combo} → ${type}`, () => {
    const choices = { 1: combo[0], 2: combo[1], 3: combo[2] };
    assert.deepEqual(verdict(choices), { type, line, gauge, side });
  });
}

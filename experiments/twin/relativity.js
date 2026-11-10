// 쌍둥이 역설 계산. DOM 없이 동작하는 순수 모듈이다.
// 단순화: 일정한 속도로 갔다가 별에서 순간적으로 방향을 바꿔 돌아온다. 가속 시간과 중력은 무시한다.
// 단위: 거리는 광년, 시간은 년, 속도는 광속 대비 비율(0 < v < 1). 그래서 빛의 속도는 1이다.

export function gamma(v) {
  return 1 / Math.sqrt(1 - v * v);
}

/** 왕복 여행. earthYears = 지구 시계, shipYears = 우주선 시계 */
export function trip(distanceLy, v) {
  const g = gamma(v);
  const earthYears = (2 * distanceLy) / v;
  const shipYears = earthYears / g;
  return { earthYears, shipYears, diffYears: earthYears - shipYears, gamma: g };
}

const TICKS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

/** 다이어그램 점 간격: 지구 쪽 점(0년 제외)이 20개 이하가 되는 가장 작은 값 */
export function tickYears(earthYears) {
  return TICKS.find((t) => Math.floor(earthYears / t) <= 20) ?? TICKS.at(-1);
}

const PAD = { left: 64, right: 16, top: 28, bottom: 28 };

/**
 * 시공간 다이어그램 좌표(SVG, y는 아래로). 세로 = 지구에서 본 시간(아래 → 위), 가로 = 지구에서의 거리.
 * 가로·세로를 같은 눈금(1광년 = 1년)으로 그려서 빛의 경로가 45°가 된다.
 * v < 1이라 별까지의 거리는 항상 왕복 시간의 절반보다 짧아서, 세로에 맞추면 가로도 들어간다.
 */
export function diagram(distanceLy, v, width, height) {
  const { earthYears, gamma: g } = trip(distanceLy, v);
  const half = earthYears / 2;
  const scale = (height - PAD.top - PAD.bottom) / earthYears;
  const x0 = PAD.left;
  const y0 = height - PAD.bottom;
  const at = (x, t) => ({ x: x0 + x * scale, y: y0 - t * scale });

  const tick = tickYears(earthYears);
  const eps = 1e-9;
  const earthTicks = [];
  for (let k = 0; k * tick <= earthYears + eps; k++) earthTicks.push(at(0, k * tick));

  // 우주선 시계로 tick년마다 점. 그 순간의 지구 시간은 고유 시간 × γ
  const shipTicks = [];
  for (let k = 0; k * tick * g <= earthYears + eps; k++) {
    const t = k * tick * g;
    const x = t <= half ? v * t : distanceLy - v * (t - half);
    shipTicks.push(at(x, t));
  }

  return {
    scale,
    tick,
    earth: { start: at(0, 0), end: at(0, earthYears) },
    ship: [at(0, 0), at(distanceLy, half), at(0, earthYears)],
    light: [at(0, 0), at(distanceLy, distanceLy)], // 같은 순간 출발한 빛이 별에 닿는 경로
    earthTicks,
    shipTicks,
  };
}

/** 1년 미만은 개월, 100년 미만은 소수 한 자리, 그 이상은 정수와 쉼표 */
export function formatYears(years) {
  if (years < 1) return `${Math.round(years * 12)}개월`;
  if (years < 100) return `${years.toFixed(1)}년`;
  return `${Math.round(years).toLocaleString('en-US')}년`;
}

export function formatAge(age) {
  // 1,000살 미만은 소수 한 자리까지: 104.0살과 103.6살이 둘 다 104살로 보이면 차이가 사라진다
  return age < 1000 ? `${age.toFixed(1)}살` : `${Math.round(age).toLocaleString('en-US')}살`;
}

import { EXPERIMENTS } from './experiments.js';

// 결과 화면 끝의 심화 진입 카드(.deep-entry)에 제목과 소개를 채운다. 문구는 레지스트리의 deep에서 온다.
export function renderDeepEntry(card, slug) {
  const { deep } = EXPERIMENTS.find((e) => e.slug === slug);
  card.querySelector('.deep-entry__title').textContent = deep.title;
  card.querySelector('.deep-entry__teaser').textContent = deep.teaser;
}

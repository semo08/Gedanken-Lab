import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { GLOSSARY } from '../js/glossary.js';

// 모든 실험 페이지에서 data-term 값을 모은다
const root = new URL('../experiments/', import.meta.url);
const used = new Map(); // 키 → 쓰인 페이지들
for (const dir of readdirSync(root)) {
  const html = readFileSync(new URL(`${dir}/index.html`, root), 'utf8');
  for (const [, key] of html.matchAll(/data-term="([^"]+)"/g)) {
    used.set(key, [...(used.get(key) ?? []), dir]);
  }
}

test('페이지에 쓴 용어는 모두 사전에 있다', () => {
  for (const [key, pages] of used) assert.ok(GLOSSARY[key], `${key} (${pages.join(', ')})가 사전에 없다`);
});

test('사전의 용어는 모두 어딘가에서 쓰인다', () => {
  for (const key of Object.keys(GLOSSARY)) assert.ok(used.has(key), `${key}가 어느 페이지에도 없다`);
});

test('사전 항목마다 이름과 설명이 있다', () => {
  for (const [key, entry] of Object.entries(GLOSSARY)) {
    assert.ok(entry.term && entry.text, key);
    assert.ok(entry.text.length <= 120, `${key} 설명이 너무 길다 (${entry.text.length}자)`);
  }
});

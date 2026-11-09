# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Gedanken Lab is a web app where users experience famous thought experiments themselves: ethics experiments (choose, then compare your choice with other people's) and physics experiments (interact to understand the principle). `docs/PLAN.md` is the source of truth for scope, screen flow, per-experiment content, design tokens, and development stages. Read it before starting a new experiment or stage. User-facing text and the docs are in Korean.

Current state: stages 1–3 are done (main page, trolley, Schrödinger's cat, Firestore vote ratios). Stage 4 (Maxwell's demon, Canvas simulation) is next. Per-feature design specs and plans live in `docs/superpowers/specs/` and `docs/superpowers/plans/`.

## Running

No build step and no dependencies. `package.json` exists only for `"type": "module"` (so Node treats `.js` as ESM) and two scripts:

- `npm start` (`npx serve .`) — serve the repo root. Pages use `type="module"`, so `file://` won't work.
- `npm test` (`node --test "tests/*.test.mjs"`) — unit tests for pure logic. Run one file with `node --test tests/verdict.test.mjs`.

Only DOM-free, Firebase-free modules (like `experiments/trolley/verdict.js`) are unit-tested. UI and Firestore behavior are checked in a real browser.

## Architecture

- Plain HTML, CSS, and vanilla JS ES modules. Don't introduce frameworks or bundlers.
- `css/base.css` holds the shared design tokens (CSS variables) and components (`.site-bar`, `.card`, `.choice`, `.btn`, `.progress`, `.label`, `.exp` experiment cards). Page-specific styles go in a `<style>` block in that page.
- Every page starts with the static `<header class="site-bar">` markup (logo → main; experiment pages also get `← 메인`). It is copied into each HTML on purpose so it renders without JS.
- `js/experiments.js` is the experiment registry (`num`, `slug`, `title`, `field`, `blurb`, `ready`). `js/other-experiments.js` renders the "다른 실험 해보기" cards on result screens from it. When adding an experiment, add it there and flip `ready`; the main page cards in `index.html` are hand-written (each has its own illustration) and must be updated separately.
- Each experiment lives in `experiments/<name>/` as one `index.html` whose steps are `<section data-step="…">` elements; the experiment's JS shows one at a time. Keep scoring/verdict logic in a separate pure module so it can be tested in Node.
- `js/firebase.js` is the only place that touches Firestore (SDK 13.2.0 from the gstatic CDN). It exports `vote(id, choice)` (skips if `localStorage` key `gedanken:vote:<id>` exists) and `getCounts(ids)`. Experiments load it with a dynamic `import()` so a Firebase/CDN failure only breaks the stats card, not the rest of the result.
- Firestore: collection `votes`, one doc per question (`trolley_1`..`trolley_3` with `A`/`B`, `schrodinger` with `A`..`D`). `getCounts(ids, keys)` takes the key list (default `['A', 'B']`).

## Firestore rules

`firestore.rules` is a copy of the rules published in the Firebase console (project `thought-lab-f6471`); editing the file does not deploy it, so the user must paste it into the console. The rules whitelist doc IDs (the `doc in [...]` list) and per-doc keys (`keysFor()`), and only allow +1 increments. A new question needs its doc ID added there, plus a `keysFor` entry if it uses keys other than `A`/`B`; until the console is updated its votes fail with `permission-denied` (the stats card shows an error, the rest of the result still renders).

## Design conventions

Lab-notebook look: grid-paper background, monospace `EXPERIMENT #01`-style labels. Fonts are IBM Plex Mono (labels) and Noto Sans KR (body). Colors: choice A orange `#B4470F`, choice B blue `#1F4E9C`, ink `#1B1F2A`, paper `#F7F6F0`. Layouts must work at 390px width with no horizontal scroll. Design mockup: https://claude.ai/artifact/HFKGWhCJsFTkhrdGtofZay

## Notes

- When an experiment's status or a development stage changes, update the experiment table in `README.md` and the checklist in `docs/PLAN.md`.

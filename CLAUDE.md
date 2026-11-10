# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Gedanken Lab is a web app where users experience famous thought experiments themselves: ethics experiments (choose, then compare your choice with other people's) and physics experiments (interact to understand the principle). `docs/PLAN.md` is the source of truth for scope, screen flow, per-experiment content, design tokens, and development stages. Read it before starting a new experiment or stage. User-facing text and the docs are in Korean.

Current state: experiments #01–#04 are built (trolley, Schrödinger's cat, Maxwell's demon, twin paradox) and the site is live on GitHub Pages. Stages 7–8 (#05 imitation game, #06 Chinese room) have design specs but no code yet; stage 5 polish is ongoing. Per-feature design specs and plans live in `docs/superpowers/specs/` and `docs/superpowers/plans/`.

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
- Firestore: collection `votes`, one doc per question (`trolley_1`..`trolley_3`, `maxwell` with `A`/`B`; `twin` with `A`..`C`; `schrodinger` with `A`..`D`). `getCounts(ids, keys)` takes the key list (default `['A', 'B']`). `js/percentages.js` turns a tally into percentages that sum to 100; use it for any stats bar with more than two choices.

## Firestore rules

`firestore.rules` is a copy of the rules published in the Firebase console (project `thought-lab-f6471`); editing the file does not deploy it, so the user must paste it into the console. The rules whitelist doc IDs (the `doc in [...]` list) and per-doc keys (`keysFor()`), and only allow +1 increments. The doc IDs for the planned #05/#06 experiments (`imitation_1`..`3`, `imitation_turing`, `chinese_room`) are already in the list. A new question needs its doc ID added there, plus a `keysFor` entry if it uses keys other than `A`/`B`; until the console is updated its votes fail with `permission-denied` (the stats card shows an error, the rest of the result still renders).

## Design conventions

Lab-notebook look: grid-paper background, monospace `EXPERIMENT #01`-style labels. Fonts are IBM Plex Mono (labels) and Noto Sans KR (body). Colors: choice A orange `#B4470F`, choice B blue `#1F4E9C`, ink `#1B1F2A`, paper `#F7F6F0`. Layouts must work at 390px width with no horizontal scroll. Design mockup: https://claude.ai/artifact/HFKGWhCJsFTkhrdGtofZay

## Notes

- When an experiment's status or a development stage changes, update the experiment table in `README.md` and the checklist in `docs/PLAN.md`.
- The repo is public. Keep the Firebase config only in `js/firebase.js`; don't copy it into docs or specs. The web API key is restricted in Google Cloud (HTTP referrers + Cloud Firestore API only), so a new deploy domain must be added to the key's allowed referrers or Firestore calls will fail.
- Maxwell's demon: `experiments/maxwell/sim.js` (particle physics in fixed 800×400 logical units, particles only bounce off walls so speeds never change) and `entropy.js` (room entropy + erase ledger) are pure and unit-tested; `maxwell.js` only draws and wires input. The entropy bars are a concept diagram: erasing always releases ≥ the entropy reduced since the last erase, so room + heat never drops below the start. The win threshold (`WIN_DIFF`) was tuned by simulating an ideal demon in Node; re-check playability if you change particle speeds, counts, or the door size.

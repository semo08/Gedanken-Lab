# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Gedanken Lab is a web app where users experience famous thought experiments themselves: ethics experiments (choose, then compare your choice with other people's) and physics experiments (interact to understand the principle). `docs/PLAN.md` is the source of truth for scope, screen flow, per-experiment content, design tokens, and development stages. Read it before starting a new experiment or stage. User-facing text and the docs are in Korean.

Current state: only the planning docs exist. No application code has been written yet. Stage 1 (main page, the three trolley scenes, and the result screen without stats) is next.

## Running

There is no build step, package manager, linter, or test suite. Because scripts use `type="module"`, the app must be served over HTTP, not opened as `file://`:

- `npx serve .` from the repo root, or
- VS Code Live Server on `index.html`

## Intended architecture (from README/PLAN)

- Stack: plain HTML, CSS, and vanilla JS ES modules. Don't introduce frameworks or bundlers.
- `index.html` is the experiment list. Each experiment lives in its own folder under `experiments/<name>/` (e.g. `experiments/trolley/`).
- Every experiment follows the same flow: intro → experience (choice or interaction) → result (explanation plus other people's vote ratios).
- `js/firebase.js` is the single shared module for Firebase config and the vote functions. Experiments import from it rather than talking to Firestore directly.
- Firestore (SDK loaded from CDN): collection `votes`, one doc per question (`trolley_1`..`trolley_3`, `schrodinger`, `maxwell`), with fields as choice keys (`A`, `B`, ...) holding counts. Vote with `setDoc(doc(db, "votes", id), { [choice]: increment(1) }, { merge: true })`. Duplicate-vote prevention is `localStorage`-based for now.
- Animations use CSS transitions. The Maxwell's Demon simulation uses Canvas plus `requestAnimationFrame`.

## Design conventions

A lab-notebook look: grid-paper background, monospace `EXPERIMENT #01`-style labels. Fonts are IBM Plex Mono (labels) and Noto Sans KR (body). Colors: choice A orange `#B4470F`, choice B blue `#1F4E9C`, ink `#1B1F2A`, paper `#F7F6F0`. Design mockup: https://claude.ai/artifact/HFKGWhCJsFTkhrdGtofZay

## Notes

- When an experiment's status or a development stage changes, update the experiment table in `README.md` and the checklist in `docs/PLAN.md`.

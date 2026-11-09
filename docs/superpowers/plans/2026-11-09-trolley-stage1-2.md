# 1+2단계 구현 계획 (메인 + 트롤리 + 선택 비율)

**Goal:** 메인 페이지와 트롤리 딜레마 3장면, 결과 화면, Firestore 선택 비율을 만든다.

**Architecture:** 정적 HTML + vanilla JS ES 모듈. 트롤리 실험은 한 페이지에서 `<section>`을 바꿔 보여 주고, 판정은 순수 함수(`verdict.js`), Firestore 접근은 `js/firebase.js`로 모은다.

**Tech Stack:** HTML, CSS, JS(ES2022 모듈), Firebase JS SDK 13.2.0(gstatic CDN), Node 24 `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-09-trolley-stage1-2-design.md`
**시각 기준:** 디자인 시안의 Main/Scene1~3/Result 마크업을 그대로 옮긴다.

---

### Task 1: PLAN.md 이동

- [ ] `git mv PLAN.md docs/PLAN.md`
- [ ] 확인: README의 `docs/PLAN.md` 링크가 맞는 경로를 가리킨다. CLAUDE.md의 경로 안내를 고친다.
- [ ] 커밋

### Task 2: 판정 로직 (TDD)

**Files:** `experiments/trolley/verdict.js`, `tests/verdict.test.mjs`

- [ ] 8가지 조합 각각의 `type`, `line`, `gauge`, `side`를 확인하는 테스트를 쓴다(스펙 5절 표가 기대값).
- [ ] `node --test tests/` → 모듈 없음으로 실패 확인
- [ ] `verdict(choices)` 구현: 조합 키 `'ABA'` → 표 조회, `gauge`는 A 개수로 계산, `side`는 `gauge < 50 ? 'A' : 'B'`
- [ ] `node --test tests/` → 8개 통과 확인
- [ ] 커밋

### Task 3: 공통 스타일

**Files:** `css/base.css`

- [ ] CSS 변수(색, 폰트), `body` 모눈 배경, `.label`(Plex Mono 라벨), `.card`(흰 바탕 2px 테두리), `.choice`(선택 카드 + `.is-a`/`.is-b` 선택 상태), `.btn`(주 버튼), `.progress`, `.container`
- [ ] 390px에서 선택 카드가 세로로 쌓이도록 `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))` 유지, 좁은 화면 padding 축소

### Task 4: 메인 페이지

**Files:** `index.html`

- [ ] 시안 Main 마크업을 `base.css` 클래스로 옮긴다. EXP #01 카드 → `experiments/trolley/`, #02·#03은 링크 없는 "준비 중" 카드
- [ ] `npx serve .`로 열어 시안과 비교, 390px 가로 스크롤 없음 확인
- [ ] 커밋 (Task 3과 함께)

### Task 5: Firebase 모듈 + 규칙 사본

**Files:** `js/firebase.js`, `firestore.rules`

- [ ] `initializeApp` + `getFirestore` (13.2.0 CDN), `vote(id, choice)`, `getCounts(ids)` (스펙 2절 API)
- [ ] `localStorage` 접근은 try/catch로 감싼다
- [ ] `firestore.rules`에 스펙 2절 규칙을 저장
- [ ] 커밋

### Task 6: 트롤리 실험 페이지

**Files:** `experiments/trolley/index.html`, `experiments/trolley/trolley.js`

- [ ] 장면 1~3 `<section>`: 시안 SVG/문구 그대로, 선택 버튼 `data-scene`/`data-choice`, "다음" 영역은 선택 전 `hidden`
- [ ] 결과 `<section>`: 판정, 게이지(+ 안내 문구), 비교 데이터 카드, 고찰, 참고 문헌, 버튼 2개
- [ ] `trolley.js`: `choices` 상태, `show(step)`(스크롤 맨 위, 진행 바, 제목 포커스), 선택/다음/이전/다시하기 핸들러, `renderVerdict()`, `renderStats()`(로딩 → `Promise.all(vote)` → `getCounts` → 막대 / 0건 / 실패 문구)
- [ ] 커밋

### Task 7: 브라우저 검증

- [ ] `npx serve .` + Playwright로 메인 → 장면 1~3 → 결과 진행, 이전 장면 선택 유지 확인
- [ ] 결과 판정이 고른 조합과 맞는지, 비교 막대가 채워지는지 확인
- [ ] 다시 실험 후 결과에서 카운트가 늘지 않는지 확인(중복 방지)
- [ ] 390px 너비 스크린샷, 가로 스크롤 없음 확인
- [ ] 콘솔 에러 없음 확인
- [ ] 규칙 거부 테스트(`{A:100}`, `{A:-1}`, `votes/hacked`, `C` 키)는 규칙 게시 후 브라우저 콘솔에서 확인

### Task 8: 문서 갱신

- [ ] README 실험 표: 트롤리 상태 갱신. PLAN.md 개발 단계 1·2 체크
- [ ] 커밋

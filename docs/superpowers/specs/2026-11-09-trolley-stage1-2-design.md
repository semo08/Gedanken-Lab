# 설계: 1+2단계 (메인 + 트롤리 딜레마 + 선택 비율)

- 날짜: 2026-11-09
- 범위: PLAN.md 개발 단계 1단계(메인, 트롤리 3장면, 결과 화면)와 2단계(Firebase 선택 비율)
- 시각 기준: [디자인 시안](https://claude.ai/artifact/HFKGWhCJsFTkhrdGtofZay)의 Main, Scene1~3, Result 화면. 레이아웃, 문구, SVG 일러스트는 시안을 그대로 옮긴다.

## 1. 파일 구조

```
gedanken-lab/
├─ index.html                  # 메인 (실험 목록)
├─ css/
│  └─ base.css                 # 색 토큰, 모눈 배경, 폰트, 공통 컴포넌트
├─ js/
│  └─ firebase.js              # Firebase 초기화 + vote() + getCounts()
├─ experiments/
│  └─ trolley/
│     ├─ index.html            # 장면 1~3 + 결과 (<section> 4개)
│     ├─ trolley.js            # 화면 전환, 선택 상태, 결과 렌더링
│     └─ verdict.js            # 선택 → 판정 (순수 함수)
├─ tests/
│  └─ verdict.test.mjs         # node --test
├─ firestore.rules             # 콘솔에 게시한 규칙과 동일한 사본
└─ docs/
   └─ PLAN.md                  # 루트에서 이동 (README 링크와 맞춤)
```

- 프레임워크와 번들러 없이 HTML, CSS, vanilla JS ES 모듈만 쓴다.
- `base.css`는 모든 실험이 공유한다. 실험별 CSS는 필요할 때만 실험 폴더에 둔다.
- 실험 코드는 Firestore를 직접 다루지 않고 `js/firebase.js`의 함수만 쓴다.

## 2. Firebase

- SDK는 CDN의 ES 모듈로 불러온다: `https://www.gstatic.com/firebasejs/<버전>/firebase-app.js`, `.../firebase-firestore.js`. PLAN.md의 13.2.0이 실제로 있는지 구현 때 확인하고, 없으면 최신 안정 버전을 쓴다.
- config(프로젝트 `thought-lab-f6471`)는 `js/firebase.js`에만 둔다. 웹 config는 클라이언트에 공개되는 값이고, 데이터 보호는 보안 규칙이, 키 남용 방지는 Google Cloud 콘솔의 API 키 제한(웹사이트 리퍼러 + Cloud Firestore API만 허용)이 맡는다. Analytics는 초기화하지 않는다.

### API

- `vote(id, choice)` → `Promise<void>`
  - `localStorage`의 `gedanken:vote:<id>`에 값이 있으면 아무것도 하지 않는다.
  - 없으면 `setDoc(doc(db, "votes", id), { [choice]: increment(1) }, { merge: true })`를 실행하고, 성공하면 `localStorage`에 `choice`를 저장한다.
  - `localStorage`를 쓸 수 없으면(예외 발생) 중복 방지 없이 투표한다.
  - Firestore 오류는 호출한 쪽으로 그대로 던진다.
- `getCounts(ids)` → `Promise<{ [id]: { A: number, B: number } }>`
  - 문서가 없거나 키가 없으면 0으로 채운다.

### 데이터

컬렉션 `votes`, 문서 `trolley_1`, `trolley_2`, `trolley_3`, 필드 `A`, `B`(정수 카운트).

### 보안 규칙 (`firestore.rules`)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /votes/{doc} {
      allow read: if true;

      // 첫 투표: 정해진 문서만, A 또는 B 하나가 1인 상태로 생성
      allow create: if doc in ['trolley_1', 'trolley_2', 'trolley_3']
        && request.resource.data.keys().hasOnly(['A', 'B'])
        && request.resource.data.size() == 1
        && request.resource.data.get('A', 0) + request.resource.data.get('B', 0) == 1;

      // 이후 투표: 키 하나만, 합계가 정확히 1 증가, 줄어드는 값 없음
      allow update: if request.resource.data.keys().hasOnly(['A', 'B'])
        && request.resource.data.diff(resource.data).affectedKeys().size() == 1
        && request.resource.data.get('A', 0) + request.resource.data.get('B', 0)
           == resource.data.get('A', 0) + resource.data.get('B', 0) + 1
        && request.resource.data.get('A', 0) >= resource.data.get('A', 0)
        && request.resource.data.get('B', 0) >= resource.data.get('B', 0);
    }
  }
}
```

삭제는 허용하지 않는다. 새 실험을 추가할 때 문서 ID 목록과 키 목록을 늘린다.

## 3. 트롤리 실험 흐름 (`experiments/trolley/index.html`)

```
장면 1 ──선택──▶ [다음 장면] ──▶ 장면 2 ──▶ 장면 3 ──▶ [실험 결과 보기] ──▶ 결과
   ◀──── [← 이전 장면] (이전 선택이 표시된 채로 돌아감) ────┘
```

- 한 번에 `<section>` 하나만 보인다. 상태는 `choices = { 1: null, 2: null, 3: null }` 하나다.
- 선택 카드는 진짜 `<button>`이다. 고르면 시안처럼 강조되고(A: 주황 그림자, B: 파랑 그림자), "다음 장면" 영역이 나타난다. 다음으로 넘어가기 전에는 선택을 바꿀 수 있다.
- 장면이 바뀌면 맨 위로 스크롤하고, 상단 진행 바를 갱신하고, 새 장면의 제목으로 포커스를 옮긴다.
- 장면 1의 "← 실험 목록"은 메인으로, 장면 2·3의 "← 이전 장면"은 이전 장면으로 간다.
- 결과 화면의 "다시 실험하기"는 선택을 비우고 장면 1로 돌아간다. "다른 실험 하러 가기"는 메인으로 간다.
- 새로고침하면 처음부터 다시 한다.

## 4. 결과 화면

순서는 시안과 같다: 판정 → 게이지 → 비교 데이터 → 고찰 → 참고 문헌 → 버튼.

1. **판정과 게이지**는 `verdict(choices)`로 즉시 그린다. 네트워크를 기다리지 않는다.
   - 유형 이름의 색: `side`가 `'A'`면 주황 `#B4470F`, `'B'`면 파랑 `#1F4E9C`.
   - 게이지는 위치 표시만 하고 퍼센트 숫자는 보여 주지 않는다.
   - 게이지 아래에 안내 문구를 넣는다: "3개 장면으로 본 경향일 뿐, 심리 검사가 아니에요."
2. **비교 데이터**는 "기록 불러오는 중…"으로 시작한다.
   - `vote()` 3개를 `Promise.all`로 보낸 뒤 `getCounts()`로 비율을 채운다. 내 표도 포함된 비율이다.
   - 장면마다 막대 하나: A/B 퍼센트(정수 반올림), 총 참여 수("N명 참여"), 내 선택 쪽에 "나의 선택 ✓".
   - 기록이 0건인 장면은 막대 대신 "아직 기록이 없어요".
   - 투표나 읽기가 실패하면 카드 내용을 "다른 실험자들의 기록을 불러오지 못했어요"로 바꾼다. 나머지 결과는 그대로다.
3. **고찰**은 시안 문구를 모든 결과에 그대로 쓴다.
4. **참고 문헌** (고찰 카드 아래, 작은 글씨):
   - Philippa Foot, "The Problem of Abortion and the Doctrine of the Double Effect" (1967)
   - Judith Jarvis Thomson, "The Trolley Problem" (1985)
   - Bonnefon, Shariff & Rahwan, "The social dilemma of autonomous vehicles", *Science* (2016)
   - Kahane et al., "Beyond sacrificial harm: A two-dimensional model of utilitarian psychology", *Psychological Review* (2018)
   - Awad et al., "Universals and variations in moral decisions made in 42 countries by 70,000 participants", *PNAS* (2020)

## 5. 판정 규칙 (`verdict.js`)

```js
verdict({ 1: 'A', 2: 'B', 3: 'A' })
// → { type: '조건부 공리주의자', line: '결과가 같아도, 내 손으로 직접 해치는 건 망설였다.', gauge: 35, side: 'A' }
```

- `gauge`(0 = 공리주의 끝, 100 = 의무론 끝)는 A 개수로 정한다: 3개 → 10, 2개 → 35, 1개 → 65, 0개 → 90.
- `side`는 `gauge < 50`이면 `'A'`, 아니면 `'B'`.

| 조합 (장면 1·2·3) | 유형 | 한 줄 해설 | gauge |
|---|---|---|---|
| A·A·A | 철저한 공리주의자 | 누구의 손이든, 5명은 1명보다 무겁다. | 10 |
| A·B·A | 조건부 공리주의자 | 결과가 같아도, 내 손으로 직접 해치는 건 망설였다. | 35 |
| A·A·B | 현실적 공리주의자 | 직접 판단할 땐 숫자를 따랐지만, 규칙을 정할 땐 탑승자 편에 섰다. | 35 |
| B·A·A | 역발상 실험자 | 레버는 두고, 육교에선 밀었다. 대부분과 반대 방향으로 갈렸다. | 35 |
| A·B·B | 선을 긋는 사람 | 레버까지는 당겼다. 그 이상의 개입에는 선을 그었다. | 65 |
| B·B·A | 규칙의 설계자 | 직접 개입은 거부했지만, 규칙을 정할 땐 다수를 구했다. | 65 |
| B·A·B | 역발상 실험자 | 레버는 두고, 육교에선 밀었다. 대부분과 반대 방향으로 갈렸다. | 65 |
| B·B·B | 원칙주의자 | 결과가 어떻든, 지켜야 할 선이 있다. | 90 |

이 유형표는 검증된 척도가 아니라 생각할 거리를 주는 연출이다. "대부분과 반대"는 레버보다 육교에서 희생을 훨씬 꺼린다는, 반복해서 확인된 경향(Awad 외 2020 등)에 기댄 표현이다.

## 6. 메인 (`index.html`)

- 시안 Main 그대로: 헤더, 실험 카드 3개.
- EXP #01 카드는 `experiments/trolley/`로 가는 링크다. #02, #03은 "준비 중" 상태로 링크 없이 둔다.

## 7. 디자인 공통

- 폰트: Google Fonts의 IBM Plex Mono(400, 600), Noto Sans KR(400, 500, 700).
- 색: 선택 A `#B4470F`, 선택 B `#1F4E9C`, 잉크 `#1B1F2A`, 종이 `#F7F6F0`, 보조 글자 `#5B6170`. 모두 `base.css`의 CSS 변수로 정의한다.
- 모눈 배경: 24px 격자, `rgba(31,78,156,0.08)` 선.
- 390px 너비에서 가로 스크롤이 없어야 한다. 선택 카드는 좁은 화면에서 세로로 쌓인다.

## 8. 검증

1. `npm test` (`node --test "tests/*.test.mjs"`) — 8가지 조합의 `type`, `gauge`, `side`를 확인한다.
2. `npx serve .`로 띄우고 브라우저로 메인 → 장면 1~3 → 결과까지 진행한다.
   - 이전 장면으로 돌아갔을 때 선택이 남아 있는지
   - 판정과 비교 막대가 맞게 나오는지
   - Firestore의 `votes/trolley_1~3`가 1씩 올랐는지
   - 다시 실험해도 숫자가 오르지 않는지
   - 390px 너비에서 가로 스크롤이 없는지
3. 규칙 게시 후 브라우저 콘솔에서 `{ A: 100 }`, `{ A: -1 }`, `votes/hacked` 생성, `C` 키 추가를 시도해 모두 `permission-denied`인지 확인한다.

검증 과정에서 실제 Firestore에 표 3개가 들어간다. 필요하면 콘솔에서 지운다.

## 9. 범위 밖

슈뢰딩거의 고양이, 맥스웰의 악마, 배포, 결과 이미지 공유, 영어 버전.

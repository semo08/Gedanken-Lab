# 🧪 Gedanken Lab

> *Experience famous thought experiments yourself.*

**Gedanken**은 독일어로 "생각"이라는 뜻이다. 아인슈타인이 사고실험을 *Gedankenexperiment*라고 부른 데서 이름을 따왔다.

## 실험 목록

| # | 실험 | 분야 | 방식 | 상태 |
|---|---|---|---|---|
| 01 | 트롤리 딜레마 | 윤리 | 선택형 | ✅ 완료 |
| 02 | 슈뢰딩거의 고양이 | 물리 | 입장 + 체험 | 📝 예정 |
| 03 | 맥스웰의 악마 | 물리 | 시뮬레이션 | 📝 예정 |

## 기술 스택

- HTML, CSS, Vanilla JavaScript
- Canvas API (시뮬레이션)
- Firebase Firestore (선택 비율 저장)

## 폴더 구조

```
gedanken-lab/
├─ index.html        # 메인 (실험 목록)
├─ css/
├─ js/
│  └─ firebase.js    # Firebase 설정, 투표 함수
├─ experiments/
│  └─ trolley/       # EXP #01
└─ docs/
   └─ PLAN.md        # 기획서
```

## 실행 방법

별도의 빌드 없이 바로 실행할 수 있다. 단, `type="module"` 스크립트는 파일을 더블클릭해서 열면 동작하지 않으므로 로컬 서버로 실행해야 한다.

- VS Code **Live Server** 확장으로 `index.html` 열기
- 또는 터미널에서 `npx serve .`

판정 로직 테스트: `npm test`

## 문서

- [기획서 (PLAN.md)](docs/PLAN.md)
- [디자인 시안](https://claude.ai/artifact/HFKGWhCJsFTkhrdGtofZay)
- 아이디어 원본: `semo08/ideas#1`

## 영감

조엘 레비, 『사고실험』

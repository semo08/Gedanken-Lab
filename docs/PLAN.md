# 🧪 Gedanken Lab 기획서

> **Gedanken** = 독일어로 "생각". 아인슈타인이 사고실험을 *Gedankenexperiment*라고 부른 데서 따왔다.

## English Summary

**Gedanken Lab** is a web app where users experience famous thought experiments themselves.
- **Ethics experiments** (Trolley Problem): reflect on your own choices and compare them with others.
- **Physics experiments** (Schrödinger's Cat, Maxwell's Demon): understand the principles through interaction.

Built with vanilla JavaScript, Canvas, and Firebase Firestore, with a lab notebook design.

---

## 1. 개요

| 항목 | 내용 |
|---|---|
| 서비스명 | Gedanken Lab |
| 한 줄 소개 | 머릿속에서만 하던 실험, 직접 해보자. |
| 형태 | 웹 앱 (PC, 모바일 브라우저) |
| 영감 | 조엘 레비, 『사고실험』 |

## 2. 목표

- **윤리 실험** → 선택을 통해 **나는 어떤 사람인지 돌아보기**
- **물리 실험** → 직접 조작하며 **원리 이해하기**
- 다른 사람들의 선택 비율을 보여줘서 내 선택과 비교하기

## 3. 화면 흐름

```
메인 (실험 목록)
 └─ 실험 소개 → 체험 (선택 / 조작) → 결과 (해설 + 다른 사람 비율)
```

디자인 시안: [트롤리 실험 디자인](https://claude.ai/artifact/HFKGWhCJsFTkhrdGtofZay)

## 4. 실험 상세

### EXP #01. 트롤리 딜레마 (윤리 · 선택형)

| 장면 | 상황 | 선택 A | 선택 B |
|---|---|---|---|
| 1. 레버 | 레버를 당기면 1명, 두면 5명 희생 | 당긴다 | 그대로 둔다 |
| 2. 육교 | 덩치 큰 사람을 밀면 5명을 구함 | 민다 | 밀지 않는다 |
| 3. 자율주행 | 탑승자 1명 vs 보행자 5명, 미리 규칙 정하기 | 피해 최소화 | 탑승자 우선 |

**결과 화면**
- 3개 선택으로 **공리주의 ↔ 의무론** 성향 게이지 표시
- 장면별 다른 사람 선택 비율
- 고찰: "장면 1과 2는 숫자가 같은데 왜 답이 달라질까?" (필리파 풋, 주디스 자비스 톰슨)

### EXP #02. 슈뢰딩거의 고양이 (물리 · 입장 + 이해)

1. 상황 설명: 상자 안 고양이, 50% 확률로 붕괴하는 방사성 원자
2. 질문: "상자를 열기 전 고양이는?" → 살아있다 / 죽었다 / 둘 다 / 알 수 없다
3. 체험: 상자 열기 버튼 → 열 때마다 랜덤 결과 (관측하면 하나로 정해짐)
4. 결과: 중첩, 코펜하겐 해석 vs 다세계 해석 설명 + 입장 비율

### EXP #03. 맥스웰의 악마 (물리 · 시뮬레이션)

1. 사전 질문: "악마가 열역학 2법칙을 깰 수 있을까?"
2. 두 방에 빠른 입자(🔴)와 느린 입자(🔵)가 섞여 움직임
3. 체험: 사용자가 악마가 되어 문을 클릭해 열고 닫으며 입자 분류
4. 한쪽이 뜨거워짐 → "2법칙을 깼다?!"
5. 반전: 악마도 입자를 관찰하고 기억해야 함 → 정보를 지울 때 엔트로피 발생

## 5. 디자인

- 실험 노트 컨셉: 모눈종이 배경, 고정폭 폰트, `EXPERIMENT #01` 라벨
- 폰트: IBM Plex Mono (라벨), Noto Sans KR (본문)
- 색: 선택 A = 주황 `#B4470F`, 선택 B = 파랑 `#1F4E9C`, 잉크 `#1B1F2A`, 종이 `#F7F6F0`

## 6. 기술 스택

| 구분 | 사용 기술 | 용도 |
|---|---|---|
| 화면 | HTML, CSS, Vanilla JS | 전체 UI |
| 애니메이션 | CSS transition / animation | 레버, 상자 등 |
| 시뮬레이션 | Canvas + requestAnimationFrame | 맥스웰의 악마 입자 |
| 데이터 | Firebase Firestore (SDK 13.2.0, CDN) | 선택 비율 저장 |
| 배포 | GitHub Pages 또는 Firebase Hosting | 미정 |

## 7. 데이터 구조

```
votes (컬렉션)
 ├─ trolley_1        → { A: 0, B: 0 }
 ├─ trolley_2        → { A: 0, B: 0 }
 ├─ trolley_3        → { A: 0, B: 0 }
 ├─ schrodinger      → { A: 0, B: 0, C: 0, D: 0 }   // 추후 규칙 수정 필요
 └─ maxwell          → { A: 0, B: 0 }
```

- 투표: `setDoc(doc(db, "votes", id), { [choice]: increment(1) }, { merge: true })`
- 중복 투표 방지: 처음엔 `localStorage`로 간단히 처리

## 8. 개발 단계

- [x] **1단계** 메인 + 트롤리 3장면 + 결과 화면 (통계 없이)
- [x] **2단계** Firebase 연결해서 선택 비율 기능
- [ ] **3단계** 슈뢰딩거의 고양이
- [ ] **4단계** 맥스웰의 악마 (Canvas)
- [ ] **5단계** 디자인 다듬기 + 배포

## 9. 나중에 하고 싶은 것

- 사고실험 추가 (중국어 방, 테세우스의 배 등)
- 결과 화면 공유하기 (이미지 저장)
- 영어 버전

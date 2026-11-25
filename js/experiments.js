// 실험 목록. 새 실험을 추가하면 여기에 한 줄 넣는다(결과 화면의 "다른 실험"에 반영된다).
// 메인 페이지 카드는 실험별 일러스트가 있어서 index.html에 따로 있다.
// deep: 결과 화면 끝의 심화 장면 진입 카드 문구(js/deep-entry.js). 심화가 없는 실험은 비워 둔다.
export const EXPERIMENTS = [
  { num: '01', slug: 'trolley', title: '트롤리 딜레마', field: '윤리', blurb: '5명과 1명. 레버를 당길 것인가? 세 가지 장면에서 당신의 선택을 기록한다.', ready: true,
    deep: { title: '선로 위에 내가 아는 사람이 있다면?', teaser: '숫자는 같다. 달라진 건 누가 서 있느냐뿐이다.' } },
  { num: '02', slug: 'schrodinger', title: '슈뢰딩거의 고양이', field: '물리', blurb: '상자를 열기 전, 고양이는 살아 있을까? 직접 상자를 열어 관측해 본다.', ready: true },
  { num: '03', slug: 'maxwell', title: '맥스웰의 악마', field: '물리', blurb: '작은 악마가 되어 문을 여닫으며 입자를 분류한다. 열역학 2법칙을 깰 수 있을까?', ready: true },
  { num: '04', slug: 'twin', title: '쌍둥이 역설', field: '물리', blurb: '쌍둥이 중 한 명이 빛에 가까운 속도로 먼 별에 다녀온다. 다시 만났을 때 누가 더 젊을까?', ready: true,
    deep: { title: '방향을 바꾸지 않아도 나이 차가 날까?', teaser: '직진만 해도 제자리로 돌아오는 우주에서, 가속이라는 답이 사라진다.' } },
  { num: '05', slug: 'imitation', title: '이미테이션 게임', field: '컴퓨터', blurb: '대화만 보고 기계를 맞힐 수 있을까? 심판이 되어 3라운드를 판정한다.', ready: true },
  { num: '06', slug: 'chinese-room', title: '중국어 방', field: '컴퓨터', blurb: '모르는 글자로 된 쪽지에 규칙서만 보고 답한다. 밖에서 유창해 보였다면, 이 방은 이해한 걸까?', ready: true },
  { num: '07', slug: 'theseus', title: '테세우스의 배', field: '철학', blurb: '판자를 한 장씩 새것으로 바꾼다. 언제부터 다른 배일까? 떼어 낸 헌 판자로 다시 만든 배는?', ready: true },
];

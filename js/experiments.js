// 실험 목록. 새 실험을 추가하면 여기에 한 줄 넣는다(결과 화면의 "다른 실험"에 반영된다).
// 메인 페이지 카드는 실험별 일러스트가 있어서 index.html에 따로 있다.
export const EXPERIMENTS = [
  { num: '01', slug: 'trolley', title: '트롤리 딜레마', field: '윤리', blurb: '5명과 1명. 레버를 당길 것인가? 세 가지 장면에서 당신의 선택을 기록한다.', ready: true },
  { num: '02', slug: 'schrodinger', title: '슈뢰딩거의 고양이', field: '물리', blurb: '상자를 열기 전, 고양이는 살아 있을까? 직접 상자를 열어 관측해 본다.', ready: true },
  { num: '03', slug: 'maxwell', title: '맥스웰의 악마', field: '물리', blurb: '작은 악마가 되어 문을 여닫으며 입자를 분류한다. 열역학 2법칙을 깰 수 있을까?', ready: true },
];

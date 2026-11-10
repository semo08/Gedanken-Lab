// 가상 문자 12개. 한글 자모, 한자, 알파벳과 닮지 않도록 원·삼각형·점·호를 섞어 만들었다.
// svg는 24×24 칸 안의 SVG 조각이고(선 색은 currentColor), meaning은 반전 화면의 번역에만 쓴다.
// 단순화: 기호 하나 = 단어(구) 하나.

export const GLYPHS = [
  { id: 'g01', meaning: '안녕', svg: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/>' },
  { id: 'g02', meaning: '반가워', svg: '<path d="M4 20 L12 7 L20 20 Z"/><circle cx="12" cy="3.5" r="1.6" fill="currentColor" stroke="none"/>' },
  { id: 'g03', meaning: '기분', svg: '<path d="M5 6 Q12 19 19 6"/><path d="M4 20 H20"/>' },
  { id: 'g04', meaning: '어때', svg: '<path d="M12 3 L21 12 L12 21 L3 12 Z"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>' },
  { id: 'g05', meaning: '비가 와서', svg: '<path d="M6 3 Q15 12 6 21"/><circle cx="15" cy="6" r="1.6" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.6" fill="currentColor" stroke="none"/>' },
  { id: 'g06', meaning: '나른해', svg: '<path d="M12 12 m-2 0 a2 2 0 1 1 4 0 a4 4 0 1 1 -8 0 a6 6 0 1 1 12 0"/>' },
  { id: 'g07', meaning: '너는?', svg: '<path d="M4 16 A8 8 0 0 1 20 16"/><path d="M8 16 A4 4 0 0 1 16 16"/><path d="M12 16 V21"/>' },
  { id: 'g08', meaning: '나도', svg: '<path d="M4 15 L9 7 L15 17 L20 9"/><circle cx="4" cy="15" r="1.8" fill="currentColor" stroke="none"/><circle cx="20" cy="9" r="1.8" fill="currentColor" stroke="none"/>' },
  { id: 'g09', meaning: '차 한잔', svg: '<path d="M6 9 A6 6 0 0 0 18 9"/><path d="M12 15 V21"/><path d="M6 4 H18"/>' },
  { id: 'g10', meaning: '좋아', svg: '<circle cx="8" cy="8.5" r="3.5"/><circle cx="16" cy="15.5" r="3.5"/><path d="M10.5 11 L13.5 13"/>' },
  { id: 'g11', meaning: '고마워', svg: '<path d="M3 12 H21"/><path d="M8 12 Q8 4 15 5"/><path d="M16 12 Q16 20 9 19"/>' },
  { id: 'g12', meaning: '천만에', svg: '<path d="M5 5 H19 L12 17 Z"/><circle cx="12" cy="21" r="1.6" fill="currentColor" stroke="none"/>' },
];

export const glyph = (id) => GLYPHS.find((g) => g.id === id);

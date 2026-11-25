// 입장 카드의 "이 입장의 논리" 펼치기. 입장 카드가 있는 실험(슈뢰딩거, 중국어 방, 테세우스)이 같이 쓴다.
// why: 이 입장이 왜 말이 되는지, against: 반대쪽에서 하는 말, reply: 중국어 방의 설 재반박(against 대신)

let count = 0;

function para(text, label) {
  const p = document.createElement('p');
  if (label) {
    const strong = document.createElement('strong');
    strong.className = 'stance-why__label';
    strong.textContent = label;
    p.append(strong, ' ');
  }
  p.append(text);
  return p;
}

/** 카드 끝에 붙일 [버튼, 펼쳐지는 본문]을 돌려준다. 기본은 접혀 있다 */
export function stanceWhy({ why, against, reply }) {
  const id = `stance-why-${++count}`;
  const body = document.createElement('div');
  body.className = 'stance-why__body';
  body.id = id;
  body.hidden = true;
  body.append(para(why));
  if (against) body.append(para(against, '반대쪽에서는:'));
  if (reply) body.append(para(reply));

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'stance-why';
  btn.setAttribute('aria-controls', id);
  const render = () => {
    btn.setAttribute('aria-expanded', String(!body.hidden));
    btn.textContent = body.hidden ? '이 입장의 논리 ▾' : '접기 ▴';
  };
  btn.addEventListener('click', () => {
    body.hidden = !body.hidden;
    render();
  });
  render();
  return [btn, body];
}

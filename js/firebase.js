// Firestore 접근은 이 파일에서만 한다. 실험 코드는 vote()와 getCounts()만 쓴다.
// 웹 config는 공개 값이고, 쓰기 제한은 firestore.rules가 맡는다.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js';
import {
  getFirestore, doc, getDoc, setDoc, increment,
} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCYIObhrbmtlN7SSe_aHS_dQGvhCDaSSQY',
  authDomain: 'thought-lab-f6471.firebaseapp.com',
  projectId: 'thought-lab-f6471',
  storageBucket: 'thought-lab-f6471.firebasestorage.app',
  messagingSenderId: '752855277616',
  appId: '1:752855277616:web:d0caba5d57287a64c34df5',
  measurementId: 'G-CHX9YV4FGH',
};

const db = getFirestore(initializeApp(firebaseConfig));

const storageKey = (id) => `gedanken:vote:${id}`;

// localStorage를 못 쓰는 환경(일부 시크릿 모드)에서는 중복 방지 없이 동작한다.
function readVote(id) {
  try { return localStorage.getItem(storageKey(id)); } catch { return null; }
}

function rememberVote(id, choice) {
  try { localStorage.setItem(storageKey(id), choice); } catch { /* 무시 */ }
}

/** 이미 투표한 질문이면 아무것도 하지 않는다. Firestore 오류는 호출한 쪽으로 던진다. */
export async function vote(id, choice) {
  if (readVote(id)) return;
  await setDoc(doc(db, 'votes', id), { [choice]: increment(1) }, { merge: true });
  rememberVote(id, choice);
}

/** @returns {Promise<Record<string, Record<string, number>>>} 문서나 키가 없으면 0 */
export async function getCounts(ids, keys = ['A', 'B']) {
  const snaps = await Promise.all(ids.map((id) => getDoc(doc(db, 'votes', id))));
  return Object.fromEntries(snaps.map((snap, i) => {
    const data = snap.exists() ? snap.data() : {};
    return [ids[i], Object.fromEntries(keys.map((k) => [k, data[k] ?? 0]))];
  }));
}

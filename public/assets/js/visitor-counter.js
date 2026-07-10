/* ============================================
   Cabo Verde Fans — visitor counter (Firestore)
   stats/visitors { count: number }
   同一セッション中は二重カウントしない
   ============================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, increment }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCMLOfdr3m9TpKfA9BNIA-Es5c6kpOX1h8",
  authDomain: "caboverde-fans.firebaseapp.com",
  projectId: "caboverde-fans",
  storageBucket: "caboverde-fans.firebasestorage.app",
  messagingSenderId: "330308320427",
  appId: "1:330308320427:web:aa717e53774a889ffd8bee",
  measurementId: "G-H0MB7ED744"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const counterRef = doc(db, "stats", "visitors");

function alreadyCounted() {
  try {
    return sessionStorage.getItem("cvf_counted") === "1";
  } catch (e) {
    return true; // プライベートモード等でstorage不可なら加算しない
  }
}

function markCounted() {
  try { sessionStorage.setItem("cvf_counted", "1"); } catch (e) { /* noop */ }
}

async function runCounter() {
  const el = document.getElementById("visitor-counter");
  if (!el) return;
  try {
    if (!alreadyCounted()) {
      await updateDoc(counterRef, { count: increment(1) });
      markCounted();
    }
    const snap = await getDoc(counterRef);
    if (snap.exists() && typeof snap.data().count === "number") {
      const numEl = el.querySelector("[data-count]");
      numEl.textContent = snap.data().count.toLocaleString();
      el.hidden = false;
    }
  } catch (e) {
    /* 失敗時はバッジ非表示のまま(サイト表示に影響させない) */
  }
}

runCounter();

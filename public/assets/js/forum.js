/* ============================================
   Cabo Verde Fans — forum (Firebase Auth + Firestore)
   collection: forum_posts { uid, name, text, created }
   collection: banned { <uid>: {} }  ← 違反者はConsoleでuidを追加
   ============================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, limit, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const lang = document.documentElement.lang === "en" ? "en" : "ja";
const T = {
  ja: {
    guest: "投稿するにはGoogleアカウントでログインしてください(閲覧は誰でも可能です)。",
    hello: "さん としてログイン中",
    login: "Googleでログイン",
    logout: "ログアウト",
    post: "投稿する",
    placeholder: "カーボベルデについて話しましょう…(最大1000文字)",
    empty: "まだ投稿がありません。最初のひとことをどうぞ!",
    posted: "投稿しました!",
    err_banned: "このアカウントは利用ルール違反のため投稿が制限されています。",
    err_generic: "投稿に失敗しました。時間をおいて再度お試しください。",
    err_login: "ログインに失敗しました。",
    anon: "名無しさん",
  },
  en: {
    guest: "Sign in with Google to post (anyone can read).",
    hello: "Signed in as",
    login: "Sign in with Google",
    logout: "Sign out",
    post: "Post",
    placeholder: "Talk about Cabo Verde… (max 1000 chars)",
    empty: "No posts yet. Be the first to say olá!",
    posted: "Posted!",
    err_banned: "This account has been restricted from posting due to a rules violation.",
    err_generic: "Failed to post. Please try again later.",
    err_login: "Sign-in failed.",
    anon: "Anonymous",
  },
}[lang];

const authBox = document.getElementById("forum-auth");
const formBox = document.getElementById("forum-form");
const textarea = document.getElementById("forum-text");
const postBtn = document.getElementById("forum-post");
const countEl = document.getElementById("forum-count");
const listEl = document.getElementById("forum-list");
const msgEl = document.getElementById("forum-msg");

let currentUser = null;

function renderAuth(user) {
  currentUser = user;
  if (user) {
    authBox.innerHTML =
      '<div class="who"><strong>' + escapeHtml(user.displayName || T.anon) + "</strong> " +
      (lang === "ja" ? T.hello : "— " + T.hello) + "</div>" +
      '<button class="btn-sm ghost" id="btn-logout">' + T.logout + "</button>";
    document.getElementById("btn-logout").onclick = () => signOut(auth);
    formBox.hidden = false;
  } else {
    authBox.innerHTML =
      '<div class="who">' + T.guest + "</div>" +
      '<button class="btn-sm google" id="btn-login">' + T.login + "</button>";
    document.getElementById("btn-login").onclick = () =>
      signInWithPopup(auth, provider).catch(() => showMsg(T.err_login, true));
    formBox.hidden = true;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function showMsg(text, isError) {
  msgEl.textContent = text;
  msgEl.style.color = isError ? "#d6362f" : "#2f8f5b";
  setTimeout(() => { msgEl.textContent = ""; }, 5000);
}

function fmtDate(ts) {
  if (!ts || !ts.toDate) return "";
  const d = ts.toDate();
  const pad = n => String(n).padStart(2, "0");
  return d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate()) +
    " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

onAuthStateChanged(auth, renderAuth);

if (textarea) {
  textarea.addEventListener("input", () => {
    countEl.textContent = textarea.value.length + " / 1000";
  });
}

if (postBtn) {
  postBtn.addEventListener("click", async () => {
    const text = textarea.value.trim();
    if (!currentUser || !text) return;
    if (text.length > 1000) return;
    postBtn.disabled = true;
    try {
      await addDoc(collection(db, "forum_posts"), {
        uid: currentUser.uid,
        name: currentUser.displayName || T.anon,
        text: text,
        created: serverTimestamp(),
      });
      textarea.value = "";
      countEl.textContent = "0 / 1000";
      showMsg(T.posted, false);
    } catch (e) {
      const denied = e && (e.code === "permission-denied");
      showMsg(denied ? T.err_banned : T.err_generic, true);
    } finally {
      postBtn.disabled = false;
    }
  });
}

// 最新50件をリアルタイム表示
const q = query(collection(db, "forum_posts"), orderBy("created", "desc"), limit(50));
onSnapshot(q, snap => {
  if (snap.empty) {
    listEl.innerHTML = '<div class="forum-empty">' + T.empty + "</div>";
    return;
  }
  listEl.innerHTML = snap.docs.map(doc => {
    const p = doc.data();
    return '<div class="forum-item">' +
      '<div class="fhead"><span class="fname">' + escapeHtml(p.name) + "</span>" +
      '<span class="fdate">' + fmtDate(p.created) + "</span></div>" +
      '<div class="ftext">' + escapeHtml(p.text) + "</div></div>";
  }).join("");
}, () => {
  listEl.innerHTML = '<div class="forum-empty">…</div>';
});

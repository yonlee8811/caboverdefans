/* ============================================
   Cabo Verde Fans — forum (Firebase Auth + Firestore)
   forum_posts { uid, name, text, created }
   forum_users/{uid} { handle }  ← ハンドルネーム
   banned/{uid}                  ← 違反者ブロック
   ============================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, limit, onSnapshot, doc, getDoc, setDoc
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

const dl = document.documentElement.lang;
const lang = dl === "en" ? "en" : dl === "zh" ? "zh" : "ja";
// 言語別に完全分離されたフォーラム(日本語: forum_posts_ja / 英語: forum_posts_en / 中国語: forum_posts_zh)
const POSTS_COLLECTION = lang === "en" ? "forum_posts_en" : lang === "zh" ? "forum_posts_zh" : "forum_posts_ja";
const T = {
  ja: {
    guest: "投稿するにはGoogleアカウントでログインしてください(閲覧は誰でも可能です)。本名は表示されません。",
    hello: "として参加中",
    login: "Googleでログイン",
    logout: "ログアウト",
    post: "投稿する",
    empty: "まだ投稿がありません。最初のひとことをどうぞ!",
    posted: "投稿しました!",
    err_banned: "このアカウントは利用ルール違反のため投稿が制限されています。",
    err_generic: "投稿に失敗しました。時間をおいて再度お試しください。",
    err_login: "ログインに失敗しました。",
    handle_setup: "フォーラムで表示するハンドルネームを設定してください(本名は表示されません):",
    handle_ph: "ハンドルネーム(2〜20文字)",
    handle_save: "決定",
    handle_change: "名前変更",
    handle_saved: "ハンドルネームを設定しました!",
    handle_invalid: "2〜20文字で入力してください。",
    handle_err: "保存に失敗しました。もう一度お試しください。",
  },
  en: {
    guest: "Sign in with Google to post (anyone can read). Your real name will not be shown.",
    hello: "posting as",
    login: "Sign in with Google",
    logout: "Sign out",
    post: "Post",
    empty: "No posts yet. Be the first to say olá!",
    posted: "Posted!",
    err_banned: "This account has been restricted from posting due to a rules violation.",
    err_generic: "Failed to post. Please try again later.",
    err_login: "Sign-in failed.",
    handle_setup: "Choose a handle to display on the forum (your real name will not be shown):",
    handle_ph: "Handle (2–20 characters)",
    handle_save: "Save",
    handle_change: "Change name",
    handle_saved: "Handle saved!",
    handle_invalid: "Please enter 2–20 characters.",
    handle_err: "Could not save. Please try again.",
  },
  zh: {
    guest: "发帖请使用Google账号登录(任何人都可以浏览)。您的真实姓名不会被显示。",
    hello: "正在参与讨论",
    login: "使用Google登录",
    logout: "退出登录",
    post: "发布",
    empty: "还没有帖子。来发第一条吧!",
    posted: "已发布!",
    err_banned: "该账号因违反社区规则,发帖功能已被限制。",
    err_generic: "发布失败,请稍后再试。",
    err_login: "登录失败。",
    handle_setup: "请设置论坛显示的昵称(不会显示真实姓名):",
    handle_ph: "昵称(2〜20个字符)",
    handle_save: "确定",
    handle_change: "修改昵称",
    handle_saved: "昵称已保存!",
    handle_invalid: "请输入2〜20个字符。",
    handle_err: "保存失败,请重试。",
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
let currentHandle = null;

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

function renderGuest() {
  authBox.innerHTML =
    '<div class="who">' + T.guest + "</div>" +
    '<button class="btn-sm google" id="btn-login">' + T.login + "</button>";
  document.getElementById("btn-login").onclick = () =>
    signInWithPopup(auth, provider).catch(() => showMsg(T.err_login, true));
  formBox.hidden = true;
}

function renderHandleSetup(prefill) {
  authBox.innerHTML =
    '<div class="who" style="flex-basis:100%;">' + T.handle_setup + "</div>" +
    '<input type="text" id="handle-input" maxlength="20" placeholder="' + T.handle_ph + '"' +
    ' value="' + escapeHtml(prefill || "") + '"' +
    ' style="flex:1; min-width:180px; border:2px solid #e8ddc6; border-radius:999px; padding:8px 16px; font-family:inherit; font-size:0.9rem;">' +
    '<button class="btn-sm google" id="handle-save">' + T.handle_save + "</button>" +
    '<button class="btn-sm ghost" id="btn-logout">' + T.logout + "</button>";
  formBox.hidden = true;
  document.getElementById("btn-logout").onclick = () => signOut(auth);
  document.getElementById("handle-save").onclick = async () => {
    const v = document.getElementById("handle-input").value.trim();
    if (v.length < 2 || v.length > 20) { showMsg(T.handle_invalid, true); return; }
    try {
      await setDoc(doc(db, "forum_users", currentUser.uid), { handle: v });
      currentHandle = v;
      showMsg(T.handle_saved, false);
      renderMember();
    } catch (e) {
      showMsg(T.handle_err, true);
    }
  };
}

function renderMember() {
  authBox.innerHTML =
    '<div class="who"><strong>' + escapeHtml(currentHandle) + "</strong> " + T.hello + "</div>" +
    '<button class="btn-sm ghost" id="handle-edit">' + T.handle_change + "</button>" +
    '<button class="btn-sm ghost" id="btn-logout">' + T.logout + "</button>";
  document.getElementById("btn-logout").onclick = () => signOut(auth);
  document.getElementById("handle-edit").onclick = () => renderHandleSetup(currentHandle);
  formBox.hidden = false;
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  currentHandle = null;
  if (!user) { renderGuest(); return; }
  try {
    const snap = await getDoc(doc(db, "forum_users", user.uid));
    if (snap.exists() && snap.data().handle) {
      currentHandle = snap.data().handle;
      renderMember();
    } else {
      renderHandleSetup("");
    }
  } catch (e) {
    renderHandleSetup("");
  }
});

if (textarea) {
  textarea.addEventListener("input", () => {
    countEl.textContent = textarea.value.length + " / 1000";
  });
}

if (postBtn) {
  postBtn.addEventListener("click", async () => {
    const text = textarea.value.trim();
    if (!currentUser || !currentHandle || !text) return;
    if (text.length > 1000) return;
    postBtn.disabled = true;
    try {
      await addDoc(collection(db, POSTS_COLLECTION), {
        uid: currentUser.uid,
        name: currentHandle,
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

const q = query(collection(db, POSTS_COLLECTION), orderBy("created", "desc"), limit(50));
onSnapshot(q, snap => {
  if (snap.empty) {
    listEl.innerHTML = '<div class="forum-empty">' + T.empty + "</div>";
    return;
  }
  listEl.innerHTML = snap.docs.map(d => {
    const p = d.data();
    return '<div class="forum-item">' +
      '<div class="fhead"><span class="fname">' + escapeHtml(p.name) + "</span>" +
      '<span class="fdate">' + fmtDate(p.created) + "</span></div>" +
      '<div class="ftext">' + escapeHtml(p.text) + "</div></div>";
  }).join("");
}, () => {
  listEl.innerHTML = '<div class="forum-empty">…</div>';
});

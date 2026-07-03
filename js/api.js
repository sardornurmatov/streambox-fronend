/* ============================================================
   api.js — backend bilan bog'lanish (backend HECH QANDAY o'zgartirilmaydi)

   G'OYA:
   Backend deyarli hamma joyda JWT token talab qiladi (faqat /auth/**
   va fayl ochish/yuklash ochiq). Foydalanuvchiga login formani
   ko'rsatmasdan videolarni ko'rsatish uchun, sahifa ochilganda
   frontend orqa fonda ko'rinmas holda oldindan tayyorlangan
   "mehmon" (guest) hisobi bilan avtomatik kirib oladi va shu
   tokendan foydalanadi. Bu haqiqiy login emas — shaxsiy amallar
   (layk, obuna, izoh, video yuklash) uchun baribir haqiqiy
   login/register talab qilinadi.

   MUHIM — BIR MARTALIK SOZLASH:
   Pastdagi GUEST_CREDENTIALS uchun bazada tayyor, tasdiqlangan
   (status = ACTIVE) hisob bo'lishi kerak. Buni backend kodiga
   tegmasdan, oddiy ro'yxatdan o'tish orqali o'zingiz yaratasiz:
     1) register.html orqali istalgan email bilan ro'yxatdan o'ting
        (masalan: guest.streambox@gmail.com kabi o'zingiz nazorat
        qiladigan email)
     2) Emailingizga kelgan 6 xonali kodni verify.html'da tasdiqlang
     3) Shu email/parolni pastga yozing
============================================================ */

const API_BASE = "http://localhost:8081/api/v1";

const GUEST_CREDENTIALS = {
  email: "guest.streambox@example.com", // <-- shu yerga o'zingiz yaratgan demo hisobning emailini yozing
  password: "guest12345",                // <-- va parolini
};

/* ---------------- Haqiqiy (real) foydalanuvchi sessiyasi ---------------- */
function getToken() {
  return localStorage.getItem("token");
}
function isLoggedIn() {
  return !!getToken();
}
function setSession(profile) {
  localStorage.setItem("token", profile.jwt);
  localStorage.setItem("profile", JSON.stringify(profile));
}
function getProfile() {
  const raw = localStorage.getItem("profile");
  return raw ? JSON.parse(raw) : null;
}
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("profile");
  window.location.reload();
}

/** Login talab qiladigan amal bosilganda chaqiriladi */
function goToLogin() {
  sessionStorage.setItem("postLoginRedirect", window.location.href);
  window.location.href = "index.html";
}
function consumePostLoginRedirect() {
  const url = sessionStorage.getItem("postLoginRedirect");
  sessionStorage.removeItem("postLoginRedirect");
  return url;
}

/* ---------------- Ko'rinmas mehmon (guest) sessiyasi ---------------- */
let guestTokenPromise = null;

async function getGuestToken() {
  const cached = sessionStorage.getItem("guestToken");
  if (cached) return cached;

  if (!guestTokenPromise) {
    guestTokenPromise = fetch(API_BASE + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(GUEST_CREDENTIALS),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data || !data.jwt) throw new Error("guest login failed");
        sessionStorage.setItem("guestToken", data.jwt);
        return data.jwt;
      })
      .catch((err) => {
        console.error("Mehmon sessiyasi ochilmadi. GUEST_CREDENTIALS to'g'riligini tekshiring.", err);
        return null;
      });
  }
  return guestTokenPromise;
}

/**
 * Backendga so'rov yuboradi.
 * @param {string} path
 * @param {object} options - { method, body, mode }
 *   mode "public" (standart) — ko'rish uchun: real login bo'lsa o'shani, bo'lmasa mehmon tokenini ishlatadi
 *   mode "user"   — shaxsiy amal: real login shart, bo'lmasa login sahifasiga yo'naltiradi
 *   mode "none"   — token umuman kerak emas (auth/register/login/verify)
 */
async function apiRequest(path, { method = "GET", body = null, mode = "public" } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (mode === "user") {
    if (!getToken()) {
      goToLogin();
      throw new Error("Bu amal uchun tizimga kirish kerak");
    }
    headers["Authorization"] = "Bearer " + getToken();
  } else if (mode === "public") {
    const token = getToken() || (await getGuestToken());
    if (token) headers["Authorization"] = "Bearer " + token;
  }
  // mode === "none" -> Authorization header qo'shilmaydi

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const message = (data && data.message) ? data.message : (typeof data === "string" ? data : "Xatolik yuz berdi");
    throw new Error(message);
  }
  return data;
}

/** Fayl (video, rasm) yuklaydi. Har doim haqiqiy login talab qiladi. Natija: AttachDTO ({id, ...}) */
async function uploadFile(file) {
  if (!getToken()) {
    goToLogin();
    throw new Error("Fayl yuklash uchun tizimga kirish kerak");
  }
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(API_BASE + "/attach/upload", {
    method: "POST",
    headers: { Authorization: "Bearer " + getToken() },
    body: form,
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const message = (data && data.message) ? data.message : "Fayl yuklashda xatolik";
    throw new Error(message);
  }
  return data;
}

/** Fayl (video/rasm) manzilini yasab beradi */
function attachUrl(fileId) {
  if (!fileId) return "img/placeholder.svg";
  return `${API_BASE}/attach/open/${fileId}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} kun oldin`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} oy oldin`;
  return `${Math.floor(months / 12)} yil oldin`;
}

function formatDuration(sec) {
  if (!sec && sec !== 0) return "";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function formatCount(n) {
  if (n === null || n === undefined) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "mln";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "ming";
  return String(n);
}

/* ============================================================
   auth.js — Login / Register / Verify sahifalari mantig'i
   Backend endpointlari:
     POST /auth/login        { email, password }        -> ProfileResponseDTO (jwt bor)
     POST /auth/register     { name, surname, email, password }
     POST /auth/verify       { email, code }
     POST /auth/resend-code?email=...
============================================================ */

const formMsg = document.getElementById("formMsg");

function showMsg(text, type = "error") {
  if (!formMsg) return;
  formMsg.textContent = text;
  formMsg.className = "form-msg " + type;
}

function setLoading(btn, loading, label) {
  btn.disabled = loading;
  btn.textContent = loading ? "Kuting..." : label;
}

/* ---------------- LOGIN ---------------- */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("submitBtn");
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    setLoading(btn, true, "Kirish");
    try {
      const profile = await apiRequest("/auth/login", {
        method: "POST",
        mode: "none",
        body: { email, password },
      });
      setSession(profile);
      const returnUrl = consumePostLoginRedirect();
      window.location.href = returnUrl || "home.html";
    } catch (err) {
      showMsg(err.message || "Email yoki parol noto'g'ri");
      setLoading(btn, false, "Kirish");
    }
  });
}

/* ---------------- REGISTER ---------------- */
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("submitBtn");
    const name = document.getElementById("name").value.trim();
    const surname = document.getElementById("surname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    setLoading(btn, true, "Ro'yxatdan o'tish");
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        mode: "none",
        body: { name, surname, email, password },
      });
      sessionStorage.setItem("pendingEmail", email);
      window.location.href = "verify.html";
    } catch (err) {
      showMsg(err.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
      setLoading(btn, false, "Ro'yxatdan o'tish");
    }
  });
}

/* ---------------- VERIFY ---------------- */
const verifyForm = document.getElementById("verifyForm");
if (verifyForm) {
  const email = sessionStorage.getItem("pendingEmail");
  const emailHint = document.getElementById("emailHint");
  if (email && emailHint) emailHint.textContent = `${email} manziliga yuborilgan kodni kiriting`;

  const digits = Array.from(document.querySelectorAll(".code-digit"));
  digits.forEach((input, i) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^0-9]/g, "");
      if (input.value && i < digits.length - 1) digits[i + 1].focus();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && i > 0) digits[i - 1].focus();
    });
  });

  verifyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("submitBtn");
    const code = digits.map((d) => d.value).join("");

    if (code.length !== 6) {
      showMsg("Iltimos, 6 xonali kodni to'liq kiriting");
      return;
    }
    if (!email) {
      showMsg("Email topilmadi, iltimos qaytadan ro'yxatdan o'ting");
      return;
    }

    setLoading(btn, true, "Tasdiqlash");
    try {
      await apiRequest("/auth/verify", {
        method: "POST",
        mode: "none",
        body: { email, code },
      });
      showMsg("Muvaffaqiyatli tasdiqlandi! Endi kirishingiz mumkin.", "success");
      setTimeout(() => (window.location.href = "index.html"), 1200);
    } catch (err) {
      showMsg(err.message || "Kod noto'g'ri yoki muddati o'tgan");
      setLoading(btn, false, "Tasdiqlash");
    }
  });

  const resendLink = document.getElementById("resendLink");
  if (resendLink) {
    resendLink.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!email) return;
      try {
        await apiRequest(`/auth/resend-code?email=${encodeURIComponent(email)}`, {
          method: "POST",
          mode: "none",
        });
        showMsg("Kod qayta yuborildi", "success");
      } catch (err) {
        showMsg(err.message || "Kodni qayta yuborib bo'lmadi");
      }
    });
  }
}

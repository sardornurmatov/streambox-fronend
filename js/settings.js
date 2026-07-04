/* ============================================================
   settings.js
   PUT  /profile/update/detail        { name, surname }
   PUT  /profile/update/photo         { attachId }
   POST /profile/update/email         { email }            -> kod yuboradi
   PUT  /profile/update/email-verify  { email, code }       -> tasdiqlaydi
   PUT  /profile/update/password      { oldPassword, newPassword }
   Hammasi LOGIN SHART.
============================================================ */

if (!isLoggedIn()) goToLogin();

const profile = getProfile();
document.getElementById("firstName").value = profile.name || "";
document.getElementById("lastName").value = profile.surname || "";

/* ---------------- Profil rasmi ---------------- */
let uploadedPhotoId = null;
const photoDrop = document.getElementById("photoDrop");
const photoInput = document.getElementById("photoInput");
photoDrop.addEventListener("click", () => photoInput.click());
photoInput.addEventListener("change", async () => {
  const file = photoInput.files[0];
  if (!file) return;
  const label = photoDrop.querySelector("span");
  label.textContent = "Yuklanmoqda...";
  try {
    const attach = await uploadFile(file);
    uploadedPhotoId = attach.id;
    photoDrop.classList.add("has-file");
    label.textContent = file.name;
    await apiRequest("/profile/update/photo", { method: "PUT", mode: "user", body: { attachId: attach.id } });
  } catch (err) {
    label.textContent = "Xatolik: " + err.message;
  }
});

/* ---------------- Ism / Familiya ---------------- */
document.getElementById("saveDetailBtn").addEventListener("click", async () => {
  const msg = document.getElementById("detailMsg");
  const name = document.getElementById("firstName").value.trim();
  const surname = document.getElementById("lastName").value.trim();
  try {
    await apiRequest("/profile/update/detail", { method: "PUT", mode: "user", body: { name, surname } });
    const updated = getProfile();
    updated.name = name;
    updated.surname = surname;
    localStorage.setItem("profile", JSON.stringify(updated));
    msg.className = "form-msg success";
    msg.textContent = "Saqlandi";
    renderAuthUI();
  } catch (err) {
    msg.className = "form-msg error";
    msg.textContent = err.message || "Xatolik yuz berdi";
  }
});

/* ---------------- Email almashtirish ---------------- */
document.getElementById("requestEmailBtn").addEventListener("click", async () => {
  const msg = document.getElementById("emailMsg");
  const email = document.getElementById("newEmail").value.trim();
  if (!email) return;
  try {
    await apiRequest("/profile/update/email", { method: "POST", mode: "user", body: { email } });
    document.getElementById("emailStep2").style.display = "block";
    msg.className = "form-msg success";
    msg.textContent = "Kod yuborildi, emailingizni tekshiring";
  } catch (err) {
    msg.className = "form-msg error";
    msg.textContent = err.message || "Xatolik yuz berdi";
  }
});

document.getElementById("confirmEmailBtn").addEventListener("click", async () => {
  const msg = document.getElementById("emailMsg");
  const email = document.getElementById("newEmail").value.trim();
  const code = document.getElementById("emailCode").value.trim();
  try {
    await apiRequest("/profile/update/email-verify", { method: "PUT", mode: "user", body: { email, code } });
    msg.className = "form-msg success";
    msg.textContent = "Email muvaffaqiyatli almashtirildi";
  } catch (err) {
    msg.className = "form-msg error";
    msg.textContent = err.message || "Xatolik yuz berdi";
  }
});

/* ---------------- Parol ---------------- */
document.getElementById("savePasswordBtn").addEventListener("click", async () => {
  const msg = document.getElementById("passwordMsg");
  const oldPassword = document.getElementById("oldPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  try {
    await apiRequest("/profile/update/password", { method: "PUT", mode: "user", body: { oldPassword, newPassword } });
    msg.className = "form-msg success";
    msg.textContent = "Parol yangilandi";
    document.getElementById("oldPassword").value = "";
    document.getElementById("newPassword").value = "";
  } catch (err) {
    msg.className = "form-msg error";
    msg.textContent = err.message || "Xatolik yuz berdi";
  }
});

renderAuthUI();

/* ============================================================
   create-channel.js
   POST /channel/create { name, description, photoId }  -> LOGIN SHART
============================================================ */
 
if (!isLoggedIn()) goToLogin();
 
const formMsg = document.getElementById("formMsg");
const photoDrop = document.getElementById("photoDrop");
const photoInput = document.getElementById("photoInput");
let uploadedPhotoId = null;
 
photoDrop.addEventListener("click", () => photoInput.click());
photoInput.addEventListener("change", async () => {
  const file = photoInput.files[0];
  if (!file) return;
  photoDrop.querySelector("span").textContent = "Yuklanmoqda...";
  try {
    const attach = await uploadFile(file);
    uploadedPhotoId = attach.id;
    photoDrop.classList.add("has-file");
    photoDrop.querySelector("span").textContent = file.name;
  } catch (err) {
    photoDrop.querySelector("span").textContent = "Xatolik, qayta urinib ko'ring";
  }
});
 
document.getElementById("channelForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("submitBtn");
  const name = document.getElementById("channelName").value.trim();
  const description = document.getElementById("channelDescription").value.trim();
 
  if (!uploadedPhotoId) {
    formMsg.textContent = "Iltimos, kanal uchun profil rasmini yuklang";
    formMsg.className = "form-msg error";
    return;
  }
 
  btn.disabled = true;
  try {
    const channel = await apiRequest("/channel/create", {
      method: "POST",
      mode: "user",
      body: { name, description, photoId: uploadedPhotoId },
    });
    window.location.href = `channel.html?id=${channel.id}`;
  } catch (err) {
    formMsg.textContent = err.message || "Kanal yaratishda xatolik";
    formMsg.className = "form-msg error";
    btn.disabled = false;
  }
});
 
renderAuthUI();
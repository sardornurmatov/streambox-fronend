/* ============================================================
   upload.js
   GET  /channel/get/list/owner       -> mening kanallarim
   GET  /category                     -> kategoriyalar
   POST /attach/upload (x2)           -> preview va video fayllar
   POST /video/create                 -> LOGIN SHART
============================================================ */

if (!isLoggedIn()) goToLogin();

const formMsg = document.getElementById("formMsg");
const noChannelMsg = document.getElementById("noChannelMsg");
const uploadForm = document.getElementById("uploadForm");
const channelPickerField = document.getElementById("channelPickerField");
const channelSelect = document.getElementById("channelSelect");
const categorySelect = document.getElementById("categorySelect");

let uploadedPreviewId = null;
let uploadedVideoId = null;

function wireFileDrop(dropId, inputId, onUploaded) {
  const drop = document.getElementById(dropId);
  const input = document.getElementById(inputId);
  drop.addEventListener("click", () => input.click());
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;
    const label = drop.querySelector("span");
    label.textContent = "Yuklanmoqda...";
    try {
      const attach = await uploadFile(file);
      onUploaded(attach.id);
      drop.classList.add("has-file");
      label.textContent = file.name;
    } catch (err) {
      label.textContent = "Xatolik: " + err.message;
    }
  });
}

wireFileDrop("previewDrop", "previewInput", (id) => (uploadedPreviewId = id));
wireFileDrop("videoDrop", "videoInput", (id) => (uploadedVideoId = id));

async function init() {
  renderAuthUI();

  try {
    const channels = await apiRequest("/channel/get/list/owner", { mode: "user" });
    if (!channels || channels.length === 0) {
      noChannelMsg.style.display = "block";
      uploadForm.style.display = "none";
      return;
    }
    if (channels.length > 1) {
      channelPickerField.style.display = "block";
      channelSelect.innerHTML = channels.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
    } else {
      channelSelect.innerHTML = `<option value="${channels[0].id}">${escapeHtml(channels[0].name)}</option>`;
    }
  } catch (err) {
    formMsg.textContent = "Kanallar yuklanmadi: " + err.message;
    formMsg.className = "form-msg error";
  }

  try {
    const categories = await apiRequest("/category", { mode: "public" });
    categorySelect.innerHTML = categories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
  } catch (err) {
    categorySelect.innerHTML = `<option value="">—</option>`;
  }
}

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("submitBtn");

  if (!uploadedPreviewId || !uploadedVideoId) {
    formMsg.textContent = "Iltimos, muqova rasmi va video faylni yuklang";
    formMsg.className = "form-msg error";
    return;
  }

  btn.disabled = true;
  try {
    const video = await apiRequest("/video/create", {
      method: "POST",
      mode: "user",
      body: {
        title: document.getElementById("videoTitle").value.trim(),
        description: document.getElementById("videoDescription").value.trim(),
        previewAttachId: uploadedPreviewId,
        attachId: uploadedVideoId,
        categoryId: Number(categorySelect.value),
        channelId: channelSelect.value,
        type: "VIDEO",
        status: "PUBLIC",
      },
    });
    window.location.href = `video.html?id=${video.id}`;
  } catch (err) {
    formMsg.textContent = err.message || "Video yuklashda xatolik";
    formMsg.className = "form-msg error";
    btn.disabled = false;
  }
});

init();

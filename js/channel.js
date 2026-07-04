/* ============================================================
   channel.js — Kanal sahifasi
   Endpointlar:
     GET /channel/get/by/id/{id}            -> login shart emas (whitelist)
     GET /video/get/channel-videos/{id}     -> login shart emas (bizning patch)
     POST /subscription/create              -> LOGIN SHART
============================================================ */

const channelWrap = document.getElementById("channelWrap");
const params = new URLSearchParams(window.location.search);
const channelId = params.get("id");

let currentChannel = null;
let editPhotoId = null;
let editBannerId = null;

function wireFileDrop(dropId, inputId, onUploaded) {
  const drop = document.getElementById(dropId);
  const input = document.getElementById(inputId);
  if (!drop || !input) return;
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

function openEditPanel() {
  if (!currentChannel) return;
  document.getElementById("channelWrap").style.display = "none";
  const panel = document.getElementById("editChannelPanel");
  panel.style.display = "block";
  document.getElementById("editName").value = currentChannel.name || "";
  document.getElementById("editDescription").value = currentChannel.description || "";
  editPhotoId = null;
  editBannerId = null;
}

function closeEditPanel() {
  document.getElementById("channelWrap").style.display = "block";
  document.getElementById("editChannelPanel").style.display = "none";
}

wireFileDrop("editPhotoDrop", "editPhotoInput", (id) => (editPhotoId = id));
wireFileDrop("editBannerDrop", "editBannerInput", (id) => (editBannerId = id));

document.getElementById("cancelEditBtn").addEventListener("click", closeEditPanel);

document.getElementById("saveChannelBtn").addEventListener("click", async () => {
  const msg = document.getElementById("editFormMsg");
  try {
    await apiRequest("/channel/update", {
      method: "PUT",
      mode: "user",
      body: {
        id: currentChannel.id,
        name: document.getElementById("editName").value.trim(),
        description: document.getElementById("editDescription").value.trim(),
        photoId: editPhotoId,
        bannerId: editBannerId,
      },
    });
    closeEditPanel();
    render();
  } catch (err) {
    msg.className = "form-msg error";
    msg.textContent = err.message || "Saqlashda xatolik";
  }
});

function renderVideoCard(v) {
  const thumb = attachUrl(v.preview && v.preview.id);
  return `
    <div class="video-card" onclick="window.location.href='video.html?id=${v.id}'">
      <div class="thumb-wrap">
        <img src="${thumb}" alt="${escapeHtml(v.title)}" onerror="this.src='img/placeholder.svg'">
        <div class="scan"></div>
        <div class="play-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div class="duration-badge">${formatDuration(v.duration)}</div>
      </div>
      <div class="video-meta">
        <div class="video-info">
          <h3>${escapeHtml(v.title)}</h3>
          <p class="stats">${formatCount(v.viewCount)} ${t("views")} · ${timeAgo(v.publishedDate)}</p>
        </div>
      </div>
    </div>
  `;
}

async function deleteChannel() {
  if (!confirm("Kanalni o'chirmoqchimisiz? Bu amalni orqaga qaytarib bo'lmaydi.")) return;
  try {
    await apiRequest(`/channel/${channelId}`, { method: "DELETE", mode: "user" });
    alert("Kanal o'chirildi");
    window.location.href = "home.html";
  } catch (err) {
    alert("Xatolik: " + err.message);
  }
}

async function subscribe() {
  if (!isLoggedIn()) { goToLogin(); return; }
  try {
    await apiRequest("/subscription/create", { method: "POST", mode: "user", body: { channelId, type: "ALL" } });
    render();
  } catch (err) {
    alert("Xatolik: " + err.message);
  }
}

async function render() {
  if (!channelId) {
    channelWrap.innerHTML = `<div class="empty-state">Kanal ID topilmadi.</div>`;
    return;
  }
  try {
    const ch = await apiRequest(`/channel/get/by/id/${channelId}`, { mode: "public" });
    currentChannel = ch;
    document.title = `${ch.name} — StreamBox`;
    document.getElementById("pageTitle").textContent = document.title;

    const profile = getProfile();
    const isOwner = profile && profile.id === ch.profileId;
    const bannerImg = ch.bannerId ? attachUrl(ch.bannerId) : null;
    const photoImg = ch.photoId ? attachUrl(ch.photoId) : "img/placeholder.svg";

    let videosHtml = `<div class="loading-state" data-i18n="loading">${t("loading")}</div>`;
    channelWrap.innerHTML = `
      <div class="channel-banner">${bannerImg ? `<img src="${bannerImg}" onerror="this.style.display='none'">` : ""}</div>
      <div class="channel-header">
        <img class="channel-avatar" src="${photoImg}" onerror="this.src='img/placeholder.svg'">
        <div>
          <h1>${escapeHtml(ch.name)}</h1>
          <p class="sub">${escapeHtml(ch.description || "")}</p>
        </div>
        <div class="actions">
          ${isOwner
            ? `<button class="btn-ghost" id="editChannelBtn">Tahrirlash</button>
               <button class="btn-ghost" onclick="window.location.href='upload.html'">+ ${t("upload_title")}</button>
               <button class="btn-ghost" id="deleteChannelBtn" style="color:var(--danger);border-color:var(--danger);">O'chirish</button>`
            : `<button class="btn-subscribe" id="subscribeBtn">${t("subscribe")}</button>`}
        </div>
      </div>
      <div class="channel-tabs">
        <span class="channel-tab active" data-i18n="videos">${t("videos")}</span>
      </div>
      <div class="video-grid" id="channelVideoGrid" style="padding:0;">${videosHtml}</div>
    `;

    if (isOwner) {
      document.getElementById("editChannelBtn").addEventListener("click", openEditPanel);
      document.getElementById("deleteChannelBtn").addEventListener("click", deleteChannel);
    } else {
      document.getElementById("subscribeBtn").addEventListener("click", subscribe);
    }

    const grid = document.getElementById("channelVideoGrid");
    try {
      const page = await apiRequest(`/video/get/channel-videos/${channelId}?page=1&size=24`, { mode: "public" });
      const items = page && page.content ? page.content : (Array.isArray(page) ? page : []);
      grid.innerHTML = items.length === 0
        ? `<div class="empty-state">Bu kanalda hali video yo'q.</div>`
        : items.map(renderVideoCard).join("");
    } catch (err) {
      grid.innerHTML = `<div class="empty-state">Videolarni yuklab bo'lmadi.</div>`;
    }
  } catch (err) {
    channelWrap.innerHTML = `<div class="empty-state">Xatolik: ${escapeHtml(err.message)}</div>`;
  }
}

(function init() {
  renderAuthUI();
  render();
})();

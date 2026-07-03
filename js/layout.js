/* ============================================================
   layout.js — barcha ilova sahifalarida (home, video, channel,
   upload, subscriptions) umumiy: top bar auth holati, "Kirish"
   talab qiladigan tugmalar va bildirishnomalar oynachasi.
   Har bir sahifa: renderAuthUI() ni chaqirsa kifoya.
============================================================ */

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

function renderAuthUI() {
  const rightAuthSlot = document.getElementById("rightAuthSlot");
  const authNavGroup = document.getElementById("authNavGroup");
  const profile = getProfile();

  if (rightAuthSlot) {
    if (profile) {
      rightAuthSlot.innerHTML = `<button class="avatar-btn" id="avatarBtn" title="${escapeHtml(profile.name || "")}">${(profile.name || "?").charAt(0).toUpperCase()}</button>`;
      document.getElementById("avatarBtn").addEventListener("click", (e) => {
        e.stopPropagation();
        toggleAccountMenu(profile);
      });
    } else {
      rightAuthSlot.innerHTML = `
        <button class="btn-login" id="loginBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
          Kirish
        </button>`;
      document.getElementById("loginBtn").addEventListener("click", goToLogin);
    }
  }

  if (authNavGroup) {
    authNavGroup.innerHTML = profile
      ? `<a href="#" class="nav-item" id="logoutBtn">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
           Chiqish
         </a>`
      : `<a href="index.html" class="nav-item">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
           Kirish
         </a>`;
    if (profile) {
      document.getElementById("logoutBtn").addEventListener("click", (e) => { e.preventDefault(); logout(); });
    }
  }

  upgradeCreateButton();
  wireUploadButton();
  wireMyChannelItem();
  wireSubsNavItem();
  wireBell();
  renderSidebarSubscriptions();
}

/** Yuklash tugmasini ikonkadan "+ Yaratish" pill tugmasiga aylantiradi (YouTube'dagidek) */
function upgradeCreateButton() {
  const btn = document.getElementById("uploadBtn");
  if (!btn || btn.dataset.upgraded) return;
  btn.dataset.upgraded = "1";
  btn.className = "btn-create";
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
    <span data-i18n="upload_title">Yaratish</span>`;
  applyI18n();
}

/** Chap paneldagi "Obunalar" ostiga haqiqiy obuna bo'lingan kanallarni chiqaradi */
async function renderSidebarSubscriptions() {
  const mount = document.getElementById("sidebarSubscriptions");
  if (!mount) return;

  if (!isLoggedIn()) {
    mount.innerHTML = `<div class="sidebar-sub-empty">Kanallarni ko'rish uchun tizimga kiring</div>`;
    return;
  }

  try {
    const list = await apiRequest("/subscription/get/list", { mode: "user" });
    if (!list || list.length === 0) {
      mount.innerHTML = `<div class="sidebar-sub-empty">Hali hech kimga obuna bo'lmagansiz</div>`;
      return;
    }
    mount.innerHTML = list.slice(0, 8).map((s) => {
      const ch = s.channel || {};
      const photo = ch.photoUrl ? attachUrl(ch.photoUrl) : "img/placeholder.svg";
      return `
        <a href="channel.html?id=${ch.id}" class="sidebar-sub-item">
          <img src="${photo}" onerror="this.src='img/placeholder.svg'">
          <span>${escapeHtml(ch.name)}</span>
        </a>`;
    }).join("");
  } catch (err) {
    mount.innerHTML = "";
  }

/* ---------------- Hisob menyusi (avatar bosilganda) ---------------- */
function toggleAccountMenu(profile) {
  let menu = document.getElementById("accountMenu");
  if (menu) { menu.remove(); return; }

  const avatarBtn = document.getElementById("avatarBtn");
  menu = document.createElement("div");
  menu.id = "accountMenu";
  menu.className = "notif-panel account-menu";
  menu.innerHTML = `
    <div class="account-menu-head">
      <div class="channel-avatar" style="display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;background:linear-gradient(135deg, var(--accent), var(--gold));color:#1a0000;">${(profile.name || "?").charAt(0).toUpperCase()}</div>
      <div>
        <p class="account-menu-name">${escapeHtml((profile.name || "") + " " + (profile.surname || ""))}</p>
        <p class="account-menu-email">${escapeHtml(profile.username || profile.email || "")}</p>
      </div>
    </div>
    <div class="account-menu-divider"></div>
    <a href="#" class="account-menu-item" id="accountMenuChannel">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
      Mening kanalim
    </a>
    <a href="#" class="account-menu-item" id="accountMenuLogout">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
      Chiqish
    </a>
  `;
  avatarBtn.parentElement.style.position = "relative";
  avatarBtn.parentElement.appendChild(menu);

  document.getElementById("accountMenuLogout").addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });
  document.getElementById("accountMenuChannel").addEventListener("click", (e) => {
    e.preventDefault();
    menu.remove();
    goToMyChannel();
  });

  document.addEventListener("click", function closeMenu(e) {
    if (!menu.contains(e.target) && e.target.id !== "avatarBtn") {
      menu.remove();
      document.removeEventListener("click", closeMenu);
    }
  });
}

async function goToMyChannel() {
  try {
    const channels = await apiRequest("/channel/get/list/owner", { mode: "user" });
    window.location.href = (channels && channels.length > 0) ? `channel.html?id=${channels[0].id}` : "create-channel.html";
  } catch (err) {
    alert("Xatolik: " + err.message);
  }
}

function wireUploadButton() {
  const btn = document.getElementById("uploadBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (!isLoggedIn()) { goToLogin(); return; }
    window.location.href = "upload.html";
  });
}

function wireSubsNavItem() {
  const el = document.getElementById("subsNavItem");
  if (!el) return;
  el.addEventListener("click", (e) => {
    e.preventDefault();
    if (!isLoggedIn()) { goToLogin(); return; }
    window.location.href = "subscriptions.html";
  });
}

/** "Mening kanalim" bosilganda: kanali bo'lsa channel.html'ga, bo'lmasa yaratish sahifasiga */
function wireMyChannelItem() {
  const el = document.getElementById("myChannelItem");
  if (!el) return;
  el.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) { goToLogin(); return; }
    try {
      const channels = await apiRequest("/channel/get/list/owner", { mode: "user" });
      if (channels && channels.length > 0) {
        window.location.href = `channel.html?id=${channels[0].id}`;
      } else {
        window.location.href = "create-channel.html";
      }
    } catch (err) {
      alert("Xatolik: " + err.message);
    }
  });
}

/* ---------------- Bildirishnomalar ---------------- */
function wireBell() {
  const bellBtn = document.getElementById("bellBtn");
  if (!bellBtn) return;

  bellBtn.addEventListener("click", async () => {
    if (!isLoggedIn()) { goToLogin(); return; }

    let panel = document.getElementById("notifPanel");
    if (panel) { panel.remove(); return; }

    panel = document.createElement("div");
    panel.id = "notifPanel";
    panel.className = "notif-panel";
    panel.innerHTML = `<div class="loading-state" style="padding:24px;">Yuklanmoqda...</div>`;
    bellBtn.appendChild(panel);

    try {
      const profile = getProfile();
      const page = await apiRequest("/notification/filter?page=1&size=15", {
        method: "POST",
        mode: "user",
        body: { profileId: profile.id, isProfileReceived: true },
      });
      const items = (page && page.content) ? page.content : [];
      panel.innerHTML = items.length === 0
        ? `<div class="notif-empty">Hozircha bildirishnoma yo'q</div>`
        : items.map((n) => `
            <div class="notif-item">
              <p class="notif-text">${escapeHtml(n.message || n.text || "Yangi bildirishnoma")}</p>
              <p class="notif-time">${timeAgo(n.createdDate)}</p>
            </div>`).join("");
    } catch (err) {
      panel.innerHTML = `<div class="notif-empty">Yuklab bo'lmadi: ${escapeHtml(err.message)}</div>`;
    }
  });

  document.addEventListener("click", (e) => {
    const panel = document.getElementById("notifPanel");
    if (panel && !bellBtn.contains(e.target)) panel.remove();
  });
}

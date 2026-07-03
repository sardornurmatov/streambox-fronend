/* ============================================================
   subscriptions.js
   GET /subscription/get/list  -> LOGIN SHART
============================================================ */

if (!isLoggedIn()) goToLogin();

const channelGrid = document.getElementById("channelGrid");

async function render() {
  try {
    const list = await apiRequest("/subscription/get/list", { mode: "user" });
    if (!list || list.length === 0) {
      channelGrid.innerHTML = `<div class="empty-state">Hali hech kimga obuna bo'lmagansiz.</div>`;
      return;
    }
    channelGrid.innerHTML = list.map((s) => {
      const ch = s.channel || {};
      const photo = ch.photoUrl ? attachUrl(ch.photoUrl) : "img/placeholder.svg";
      return `
        <a class="channel-card" href="channel.html?id=${ch.id}">
          <img class="channel-avatar" src="${photo}" onerror="this.src='img/placeholder.svg'">
          <h4>${escapeHtml(ch.name)}</h4>
        </a>
      `;
    }).join("");
  } catch (err) {
    channelGrid.innerHTML = `<div class="empty-state">Xatolik: ${escapeHtml(err.message)}</div>`;
  }
}

renderAuthUI();
render();

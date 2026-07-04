/* ============================================================
   liked-videos.js
   GET /video-like/my  -> LOGIN SHART
============================================================ */

if (!isLoggedIn()) goToLogin();

const likedGrid = document.getElementById("likedGrid");

function renderCard(item) {
  const v = item.video || {};
  const thumb = item.previewAttach && item.previewAttach.url ? item.previewAttach.url : "img/placeholder.svg";
  return `
    <div class="video-card" onclick="window.location.href='video.html?id=${v.id}'">
      <div class="thumb-wrap">
        <img src="${thumb}" alt="${escapeHtml(v.name)}" onerror="this.src='img/placeholder.svg'">
        <div class="scan"></div>
        <div class="play-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div class="duration-badge">${formatDuration(v.duration)}</div>
      </div>
      <div class="video-meta">
        <div class="video-info">
          <h3>${escapeHtml(v.name)}</h3>
          <p class="channel-name">${escapeHtml(v.channel ? v.channel.name : "")}</p>
        </div>
      </div>
    </div>
  `;
}

async function render() {
  try {
    const list = await apiRequest("/video-like/my", { mode: "user" });
    if (!list || list.length === 0) {
      likedGrid.innerHTML = `<div class="empty-state">Hali hech qanday videoni yoqtirmadingiz.</div>`;
      return;
    }
    likedGrid.innerHTML = list.map(renderCard).join("");
  } catch (err) {
    likedGrid.innerHTML = `<div class="empty-state">Hali hech qanday videoni yoqtirmadingiz.</div>`;
  }
}

renderAuthUI();
render();

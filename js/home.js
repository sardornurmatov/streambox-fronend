/* ============================================================
   home.js — Bosh sahifa: kategoriyalar + video tarmog'i
   (login/auth UI mantig'i js/layout.js'da)
============================================================ */

const videoGrid = document.getElementById("videoGrid");
const categoriesRow = document.getElementById("categoriesRow");
const sidebarCategories = document.getElementById("sidebarCategories");
const searchInput = document.getElementById("searchInput");

let activeCategoryId = null;
let firstCategoryId = null;
let searchTimer = null;

document.getElementById("youToggle").addEventListener("click", () => {
  document.querySelectorAll(".sidebar-toggle ~ .nav-item.disabled").forEach((el) => {
    el.style.display = el.style.display === "none" ? "flex" : "none";
  });
});

function renderVideoCard(v) {
  const thumb = attachUrl(v.preview && v.preview.id);
  const channelPhoto = v.channel && v.channel.photoUrl ? attachUrl(v.channel.photoUrl) : "img/placeholder.svg";
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
        <img class="channel-avatar" src="${channelPhoto}" onerror="this.src='img/placeholder.svg'">
        <div class="video-info">
          <h3>${escapeHtml(v.title)}</h3>
          <p class="channel-name">${escapeHtml(v.channel ? v.channel.name : "")}</p>
          <p class="stats">${formatCount(v.viewCount)} ko'rish · ${timeAgo(v.publishedDate)}</p>
        </div>
      </div>
    </div>
  `;
}

async function loadCategories() {
  try {
    const categories = await apiRequest("/category", { mode: "public" });
    categoriesRow.innerHTML = `<button class="chip active" data-id="">Barchasi</button>` +
      categories.map((c) => `<button class="chip" data-id="${c.id}">${escapeHtml(c.name)}</button>`).join("");

    sidebarCategories.innerHTML = categories.slice(0, 6).map((c) =>
      `<a href="#" class="nav-item cat-side" data-id="${c.id}">${escapeHtml(c.name)}</a>`
    ).join("");

    categoriesRow.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        categoriesRow.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        activeCategoryId = chip.dataset.id || null;
        searchInput.value = "";
        loadVideos();
      });
    });

    sidebarCategories.querySelectorAll(".cat-side").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const chip = categoriesRow.querySelector(`.chip[data-id="${item.dataset.id}"]`);
        if (chip) chip.click();
      });
    });

    if (categories.length > 0) firstCategoryId = categories[0].id;
  } catch (err) {
    categoriesRow.innerHTML = "";
  }
}

async function loadVideos() {
  videoGrid.innerHTML = `<div class="loading-state">Yuklanmoqda...</div>`;
  try {
    const searchTerm = searchInput.value.trim();
    let page;

    if (searchTerm) {
      page = await apiRequest(`/video/search?page=1&size=24`, {
        method: "POST",
        mode: "public",
        body: { search: searchTerm },
      });
    } else {
      const categoryId = activeCategoryId || firstCategoryId;
      if (!categoryId) {
        videoGrid.innerHTML = `<div class="empty-state">Hali kategoriya yaratilmagan. Admin panelidan kategoriya qo'shing.</div>`;
        return;
      }
      page = await apiRequest(`/video/by-category-id/${categoryId}?page=1&size=24`, { mode: "public" });
    }

    const items = page && page.content ? page.content : [];
    if (items.length === 0) {
      videoGrid.innerHTML = `<div class="empty-state">Hech qanday video topilmadi.</div>`;
      return;
    }
    videoGrid.innerHTML = items.map(renderVideoCard).join("");
  } catch (err) {
    videoGrid.innerHTML = `<div class="empty-state">Xatolik: ${escapeHtml(err.message)}</div>`;
  }
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadVideos, 400);
});

(async function init() {
  renderAuthUI();
  await loadCategories();
  await loadVideos();
})();

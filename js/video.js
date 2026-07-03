/* ============================================================
   video.js — Watch sahifasi
   Endpointlar:
     GET  /video/get/by-id/{id}                  -> login shart emas
     PUT  /video/increase/view-count/{id}         -> login shart emas
     POST /video-like   { videoId, emotion }      -> LOGIN SHART
     POST /subscription/create { channelId,type}  -> LOGIN SHART
     POST /comment { videoId, content }           -> LOGIN SHART

   ESLATMA: backendda "shu videoning barcha izohlarini olish" uchun
   ochiq endpoint yo'q (faqat /comment/my — o'zingiznikini ko'rasiz).
   Shu sababli bu sahifada yozilgan izohlar shu SESSIYA davomida
   ro'yxatda ko'rsatiladi. Sahifa qayta ochilganda avvalgi
   izohlarni to'liq qayta yuklab bo'lmaydi — buni backendga bitta
   "GET /comment/by-video/{videoId}" endpoint qo'shilgandagina
   to'liq hal qilish mumkin.
============================================================ */

const watchWrap = document.getElementById("watchWrap");
const params = new URLSearchParams(window.location.search);
const videoId = params.get("id");
const sessionComments = [];

async function increaseView() {
  try { await apiRequest(`/video/increase/view-count/${videoId}`, { method: "PUT", mode: "public" }); }
  catch (err) { /* jimgina o'tkazib yuboramiz */ }
}

async function toggleLike(emotion) {
  if (!isLoggedIn()) { goToLogin(); return; }
  try {
    await apiRequest("/video-like", { method: "POST", mode: "user", body: { videoId, emotion } });
    await render();
  } catch (err) {
    alert("Xatolik: " + err.message);
  }
}

async function subscribe(channelId) {
  if (!isLoggedIn()) { goToLogin(); return; }
  try {
    await apiRequest("/subscription/create", { method: "POST", mode: "user", body: { channelId, type: "ALL" } });
    await render();
  } catch (err) {
    alert("Xatolik: " + err.message);
  }
}

async function postComment() {
  if (!isLoggedIn()) { goToLogin(); return; }
  const input = document.getElementById("commentInput");
  const content = input.value.trim();
  if (!content) return;

  const btn = document.getElementById("commentSubmitBtn");
  btn.disabled = true;
  try {
    const saved = await apiRequest("/comment", { method: "POST", mode: "user", body: { videoId, content } });
    sessionComments.unshift(saved);
    input.value = "";
    renderComments();
  } catch (err) {
    alert("Izoh yuborilmadi: " + err.message);
  } finally {
    btn.disabled = false;
  }
}

function renderComments() {
  const list = document.getElementById("commentsList");
  const countEl = document.getElementById("commentsCount");
  if (!list) return;
  countEl.textContent = sessionComments.length;
  list.innerHTML = sessionComments.length === 0
    ? `<p class="comments-empty">${t("no_comments")}</p>`
    : sessionComments.map((c) => `
        <div class="comment-item">
          <div class="channel-avatar" style="display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;background:var(--surface-hover);">${escapeHtml((getProfile() && getProfile().name || "?").charAt(0).toUpperCase())}</div>
          <div>
            <p class="comment-meta">${escapeHtml(getProfile() ? getProfile().name : "Siz")} · ${timeAgo(c.createdDate)}</p>
            <p class="comment-text">${escapeHtml(c.content)}</p>
          </div>
        </div>
      `).join("");
}

async function render() {
  if (!videoId) {
    watchWrap.innerHTML = `<div class="empty-state">Video ID topilmadi.</div>`;
    return;
  }
  try {
    const v = await apiRequest(`/video/get/by-id/${videoId}`, { mode: "public" });
    const like = v.likeInfo || { likeCount: 0, dislikeCount: 0, isUserLiked: false, isUserDisliked: false };
    const channelPhoto = v.channel && v.channel.photoUrl ? attachUrl(v.channel.photoUrl) : "img/placeholder.svg";

    const pageTitle = `${v.title} — StreamBox`;
    const shortDesc = (v.description || "StreamBox'da video tomosha qiling.").slice(0, 155);
    document.title = pageTitle;
    document.getElementById("pageTitle").textContent = pageTitle;
    document.getElementById("metaDescription").setAttribute("content", shortDesc);
    document.getElementById("ogTitle").setAttribute("content", pageTitle);
    document.getElementById("ogDescription").setAttribute("content", shortDesc);

    watchWrap.innerHTML = `
      <div class="player">
        <video controls poster="${attachUrl(v.preview && v.preview.id)}">
          <source src="${attachUrl(v.video && v.video.id)}" type="video/mp4">
        </video>
      </div>

      <h1 class="watch-title">${escapeHtml(v.title)}</h1>

      <div class="watch-subrow">
        <a class="watch-channel" href="channel.html?id=${v.channel ? v.channel.id : ""}">
          <img class="channel-avatar" src="${channelPhoto}" onerror="this.src='img/placeholder.svg'">
          <div><p class="name">${escapeHtml(v.channel ? v.channel.name : "")}</p></div>
        </a>

        <div style="display:flex; gap:10px; align-items:center;">
          <button class="btn-ghost" id="likeBtn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="${like.isUserLiked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M7 10v12M15 5.88 14 10h6.31a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 18 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
            ${formatCount(like.likeCount)}
          </button>
          <button class="btn-ghost" id="dislikeBtn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="${like.isUserDisliked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" style="transform:scaleY(-1)"><path d="M7 10v12M15 5.88 14 10h6.31a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 18 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
            ${formatCount(like.dislikeCount)}
          </button>
          <button class="btn-subscribe" id="subscribeBtn">${t("subscribe")}</button>
        </div>
      </div>

      <div class="watch-desc">
        <p class="stats-line">${formatCount(v.viewCount)} ${t("watched")}</p>
        <p>${escapeHtml(v.description)}</p>
        <div class="tag-row">
          ${(v.tagList || []).map((t) => `<span class="tag-pill">#${escapeHtml(t.name)}</span>`).join("")}
        </div>
      </div>

      <div class="comments-section">
        <h3><span id="commentsCount">0</span> ${t("comments")}</h3>
        <div class="comment-input-row">
          <div class="channel-avatar" style="display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;background:var(--surface-hover);">${(getProfile() && getProfile().name || "?").charAt(0).toUpperCase()}</div>
          <div style="flex:1;">
            <input type="text" id="commentInput" placeholder="${t('write_comment')}" onkeydown="if(event.key==='Enter'){document.getElementById('commentSubmitBtn').click()}">
          </div>
          <button class="btn-subscribe" id="commentSubmitBtn">${t("send")}</button>
        </div>
        <div id="commentsList"></div>
      </div>
    `;

    document.getElementById("likeBtn").addEventListener("click", () => toggleLike("LIKE"));
    document.getElementById("dislikeBtn").addEventListener("click", () => toggleLike("DISLIKE"));
    document.getElementById("subscribeBtn").addEventListener("click", () => subscribe(v.channel.id));
    document.getElementById("commentSubmitBtn").addEventListener("click", postComment);
    renderComments();
  } catch (err) {
    watchWrap.innerHTML = `<div class="empty-state">Xatolik: ${escapeHtml(err.message)}</div>`;
  }
}

(async function init() {
  renderAuthUI();
  await increaseView();
  await render();
})();

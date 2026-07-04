/* ============================================================
   admin-categories.js
   GET    /category            -> hammaga ochiq
   POST   /category { name }   -> faqat ROLE_ADMIN
   DELETE /category/{id}       -> faqat ROLE_ADMIN
============================================================ */

if (!isLoggedIn()) goToLogin();

const accessDenied = document.getElementById("accessDenied");
const adminArea = document.getElementById("adminArea");
const formMsg = document.getElementById("formMsg");
const categoryList = document.getElementById("categoryList");

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

async function loadCategories() {
  categoryList.innerHTML = `<div class="loading-state">Yuklanmoqda...</div>`;
  try {
    const categories = await apiRequest("/category", { mode: "public" });
    if (!categories || categories.length === 0) {
      categoryList.innerHTML = `<p style="color:var(--text-dim);font-size:13.5px;">Hali kategoriya yo'q.</p>`;
      return;
    }
    categoryList.innerHTML = categories.map((c) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
        <span>${escapeHtml(c.name)}</span>
        <button class="btn-ghost" data-id="${c.id}" style="padding:6px 12px;font-size:12.5px;">O'chirish</button>
      </div>
    `).join("");

    categoryList.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Bu kategoriyani o'chirmoqchimisiz?")) return;
        try {
          await apiRequest(`/category/${btn.dataset.id}`, { method: "DELETE", mode: "user" });
          loadCategories();
        } catch (err) {
          alert("Xatolik: " + err.message);
        }
      });
    });
  } catch (err) {
    categoryList.innerHTML = `<p style="color:var(--danger);font-size:13.5px;">Xatolik: ${escapeHtml(err.message)}</p>`;
  }
}

document.getElementById("categoryForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("categoryName");
  const name = input.value.trim();
  if (!name) return;

  try {
    await apiRequest("/category", { method: "POST", mode: "user", body: { name } });
    input.value = "";
    formMsg.className = "form-msg";
    loadCategories();
  } catch (err) {
    formMsg.textContent = err.message.includes("403") || err.message.toLowerCase().includes("denied")
      ? "Sizda kategoriya qo'shish huquqi yo'q (ADMIN rol kerak)."
      : ("Xatolik: " + err.message);
    formMsg.className = "form-msg error";
  }
});

(function init() {
  renderAuthUI();
  const profile = getProfile();
  const isAdmin = profile && profile.role === "ROLE_ADMIN";

  if (!isAdmin) {
    accessDenied.style.display = "block";
    adminArea.style.display = "none";
    return;
  }
  accessDenied.style.display = "none";
  adminArea.style.display = "block";
  loadCategories();
})();

/* ============================================================
   i18n.js — Til almashtirish tizimi (uz / ru / en)
   Ishlatilishi: HTML elementga data-i18n="key" qo'ying,
   matn shu lug'atdagi qiymat bilan almashtiriladi.
   Placeholder uchun: data-i18n-placeholder="key"
   Til tanlovi localStorage'da saqlanadi.
============================================================ */

const I18N = {
  uz: {
    search_placeholder: "Qidirish",
    login: "Kirish",
    logout: "Chiqish",
    home: "Bosh sahifa",
    shorts: "Shorts",
    subscriptions: "Obunalar",
    you: "Siz",
    my_channel: "Mening kanalim",
    history: "Tarix",
    playlists: "Pleylistlar",
    watch_later: "Keyinroq ko'rish",
    liked_videos: "Yoqtirilgan videolar",
    categories: "Kategoriyalar",
    all: "Barchasi",
    subscribe: "Obuna bo'lish",
    subscribed: "Obuna bo'lingan",
    comments: "izoh",
    write_comment: "Izoh qoldiring...",
    send: "Yuborish",
    no_comments: "Hali izoh yo'q. Birinchi bo'lib fikringizni yozing!",
    views: "ko'rish",
    watched: "marta ko'rilgan",
    welcome_back: "Xush kelibsiz",
    login_subtitle: "Hisobingizga kirish uchun ma'lumotlarni kiriting",
    email: "Email",
    password: "Parol",
    no_account: "Hisobingiz yo'qmi?",
    register: "Ro'yxatdan o'tish",
    have_account: "Hisobingiz bormi?",
    create_account: "Hisob yaratish",
    register_subtitle: "Ma'lumotlaringizni to'ldiring",
    first_name: "Ism",
    last_name: "Familiya",
    back_home: "Bosh sahifaga qaytish",
    upload_title: "Video yuklash",
    channel_name: "Kanal nomi",
    channel_description: "Kanal haqida",
    create_channel: "Kanal yaratish",
    video_title_label: "Video sarlavhasi",
    description: "Tavsif",
    category: "Kategoriya",
    choose_file: "Faylni tanlang yoki shu yerga tashlang",
    preview_image: "Muqova rasmi",
    video_file: "Video fayl",
    publish: "Nashr qilish",
    my_subscriptions: "Mening obunalarim",
    videos: "videolar",
    about: "Haqida",
    notifications: "Bildirishnomalar",
    no_notifications: "Hozircha bildirishnoma yo'q",
    loading: "Yuklanmoqda...",
  },
  ru: {
    search_placeholder: "Поиск",
    login: "Войти",
    logout: "Выйти",
    home: "Главная",
    shorts: "Shorts",
    subscriptions: "Подписки",
    you: "Вы",
    my_channel: "Мой канал",
    history: "История",
    playlists: "Плейлисты",
    watch_later: "Посмотреть позже",
    liked_videos: "Понравившиеся видео",
    categories: "Категории",
    all: "Все",
    subscribe: "Подписаться",
    subscribed: "Вы подписаны",
    comments: "комментариев",
    write_comment: "Оставьте комментарий...",
    send: "Отправить",
    no_comments: "Комментариев пока нет. Будьте первым!",
    views: "просмотров",
    watched: "просмотров",
    welcome_back: "С возвращением",
    login_subtitle: "Введите данные для входа в аккаунт",
    email: "Email",
    password: "Пароль",
    no_account: "Нет аккаунта?",
    register: "Зарегистрироваться",
    have_account: "Уже есть аккаунт?",
    create_account: "Создать аккаунт",
    register_subtitle: "Заполните свои данные",
    first_name: "Имя",
    last_name: "Фамилия",
    back_home: "Вернуться на главную",
    upload_title: "Загрузить видео",
    channel_name: "Название канала",
    channel_description: "О канале",
    create_channel: "Создать канал",
    video_title_label: "Название видео",
    description: "Описание",
    category: "Категория",
    choose_file: "Выберите файл или перетащите сюда",
    preview_image: "Обложка",
    video_file: "Видеофайл",
    publish: "Опубликовать",
    my_subscriptions: "Мои подписки",
    videos: "видео",
    about: "О канале",
    notifications: "Уведомления",
    no_notifications: "Пока нет уведомлений",
    loading: "Загрузка...",
  },
  en: {
    search_placeholder: "Search",
    login: "Sign in",
    logout: "Sign out",
    home: "Home",
    shorts: "Shorts",
    subscriptions: "Subscriptions",
    you: "You",
    my_channel: "My channel",
    history: "History",
    playlists: "Playlists",
    watch_later: "Watch later",
    liked_videos: "Liked videos",
    categories: "Categories",
    all: "All",
    subscribe: "Subscribe",
    subscribed: "Subscribed",
    comments: "comments",
    write_comment: "Add a comment...",
    send: "Send",
    no_comments: "No comments yet. Be the first to share your thoughts!",
    views: "views",
    watched: "views",
    welcome_back: "Welcome back",
    login_subtitle: "Enter your details to sign in",
    email: "Email",
    password: "Password",
    no_account: "Don't have an account?",
    register: "Sign up",
    have_account: "Already have an account?",
    create_account: "Create account",
    register_subtitle: "Fill in your details",
    first_name: "First name",
    last_name: "Last name",
    back_home: "Back to home",
    upload_title: "Upload video",
    channel_name: "Channel name",
    channel_description: "About channel",
    create_channel: "Create channel",
    video_title_label: "Video title",
    description: "Description",
    category: "Category",
    choose_file: "Choose a file or drop it here",
    preview_image: "Thumbnail",
    video_file: "Video file",
    publish: "Publish",
    my_subscriptions: "My subscriptions",
    videos: "videos",
    about: "About",
    notifications: "Notifications",
    no_notifications: "No notifications yet",
    loading: "Loading...",
  },
};

function getLang() {
  return localStorage.getItem("lang") || "uz";
}

function setLang(lang) {
  localStorage.setItem("lang", lang);
  applyI18n();
  renderLangSwitcher();
}

function t(key) {
  const dict = I18N[getLang()] || I18N.uz;
  return dict[key] || I18N.uz[key] || key;
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
  document.documentElement.lang = getLang();
}

const LANG_LABELS = { uz: "O'zbek", ru: "Русский", en: "English" };

function renderLangSwitcher() {
  const mount = document.getElementById("langSwitchMount");
  if (!mount) return;
  const current = getLang();

  mount.innerHTML = `
    <div class="lang-switch">
      <button class="lang-btn" id="langBtn">${current} ▾</button>
    </div>`;

  document.getElementById("langBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    let menu = document.getElementById("langMenu");
    if (menu) { menu.remove(); return; }
    menu = document.createElement("div");
    menu.id = "langMenu";
    menu.className = "lang-menu";
    menu.innerHTML = Object.keys(LANG_LABELS).map((code) =>
      `<button class="lang-option ${code === current ? "active" : ""}" data-lang="${code}">${LANG_LABELS[code]}</button>`
    ).join("");
    mount.querySelector(".lang-switch").appendChild(menu);

    menu.querySelectorAll(".lang-option").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.dataset.lang));
    });
  });

  document.addEventListener("click", () => {
    const menu = document.getElementById("langMenu");
    if (menu) menu.remove();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyI18n();
  renderLangSwitcher();
});

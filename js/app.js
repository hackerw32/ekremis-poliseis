// Κεντρικός hub: launcher, routing και κοινό περιβάλλον για όλες τις εφαρμογές.
import { init as initDb, getState, subscribe, stop as stopDb } from "./core/db.js";
import { appSettings } from "./config.js";
import { debounce } from "./utils.js";
import { renderHome } from "./home.js";
import { onAuthChange, authAvailable, displayName, signOutUser } from "./core/auth.js";
import { renderAuth } from "./auth-view.js";
import * as ekremis from "./ekremis-app.js";
import * as tameio from "./tameio/app.js";
import * as texnikos from "./texnikos/app.js";

const APPS = [ekremis, tameio, texnikos];
const MODULES = Object.fromEntries(APPS.map((a) => [a.meta.id, a]));

const COMING_SOON = [
  { icon: "📢", title: "Αγγελίες (xe.gr)", tagline: "Διαχείριση αγγελιών, κλήσεων και προβολής" },
  { icon: "✉️", title: "Email / Προσφορές", tagline: "Αυτόματες προτάσεις ακινήτων σε ενδιαφερόμενους" },
  { icon: "📄", title: "Έντυπα & Εντολές", tagline: "Γεννήτρια εντύπων, εντολών και συμβολαίων" },
];

const LS_UI = "hub_ui_v1";
const ui = { theme: "light", query: "" };
try {
  Object.assign(ui, JSON.parse(localStorage.getItem(LS_UI) || "{}"));
} catch {}

let current = { appId: "home", sub: "" };
let currentUser = null;
const main = () => document.getElementById("main");

function persistUi() {
  try {
    localStorage.setItem(LS_UI, JSON.stringify({ theme: ui.theme }));
  } catch {}
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", ui.theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", ui.theme === "dark" ? "#0d1117" : "#1f6feb");
}

function parseRoute() {
  const h = (location.hash || "").replace(/^#\/?/, "");
  const [appId, ...rest] = h.split("/");
  if (!appId || appId === "home") return { appId: "home", sub: "" };
  const mod = MODULES[appId];
  if (!mod) return { appId: "home", sub: "" };
  return { appId, sub: rest.join("/") || mod.meta.defaultRoute };
}

function activeModule() {
  return MODULES[current.appId] || null;
}

function ctx() {
  return {
    ui,
    currency: appSettings.currency,
    refresh: render,
    go: (hash) => (location.hash = hash),
  };
}

function syncInfo() {
  const s = getState();
  if (!s.ready) return { text: "Φόρτωση…", cls: "" };
  if (s.error) return { text: "Σφάλμα συγχρονισμού", cls: "error" };
  if (s.mode === "firebase") return { text: "Συγχρονισμένο (Firebase)", cls: "online" };
  return { text: "Τοπική αποθήκευση", cls: "offline" };
}

function navItemHTML(appId, item, isHome) {
  const href = isHome ? "#/home" : `#/${appId}/${item.route}`;
  const active = current.appId === appId && (isHome || current.sub === item.route);
  const badge = item && item.badge ? `<span class="badge ${item.badgeWarn ? "warn" : ""}">${item.badge}</span>` : "";
  return `<a class="nav-item ${active ? "active" : ""}" href="${href}">
    <span class="ni">${item.icon}</span><span class="nav-label">${item.label}</span>${badge}
  </a>`;
}

function renderNav() {
  const sidebar = document.getElementById("app-nav");
  const bottom = document.getElementById("bottom-nav");
  const appNav = activeModule() ? activeModule().nav() : [];

  const homeItem = { route: "home", label: "Αρχική", icon: "🏠" };
  sidebar.innerHTML = [navItemHTML("home", homeItem, true), ...appNav.map((it) => navItemHTML(current.appId, it, false))].join("");

  const bn = [homeItem, ...appNav].slice(0, 4);
  bottom.innerHTML = bn
    .map((it, i) => {
      const isHome = i === 0;
      const href = isHome ? "#/home" : `#/${current.appId}/${it.route}`;
      const active = isHome ? current.appId === "home" : current.sub === it.route;
      return `<a class="bn-item ${active ? "active" : ""}" href="${href}"><span>${it.icon}</span><em>${it.label}</em></a>`;
    })
    .join("");
}

function updateHeader() {
  const mod = activeModule();
  const brandName = document.getElementById("brand-name");
  const brandSub = document.getElementById("brand-sub");
  const search = document.querySelector(".search-wrap");
  const addBtn = document.getElementById("btn-add");

  if (current.appId === "home") {
    brandName.textContent = appSettings.agencyName || "Γραφείο";
    brandSub.textContent = "Κεντρικό μενού";
    search.style.display = "none";
    addBtn.style.display = "none";
  } else {
    brandName.textContent = mod.meta.title;
    brandSub.textContent = "Αρχική";
    search.style.display = "";
    addBtn.style.display = "";
    addBtn.querySelector(".only-desktop").textContent = " " + (mod.meta.primaryLabel || "Νέο");
  }
}

function render() {
  current = parseRoute();
  const sync = syncInfo();
  const wrap = document.getElementById("sidebar-sync");
  if (wrap) {
    wrap.className = "sync-status " + sync.cls;
    wrap.innerHTML = `<span class="dot"></span><span>${sync.text}</span>`;
  }

  if (current.appId === "home") {
    renderHome(main(), APPS, {
      agency: appSettings.agencyName,
      syncText: sync.text,
      syncClass: sync.cls,
      comingSoon: COMING_SOON,
      user: currentUser ? displayName(currentUser) : "",
      onLogout: () => signOutUser(),
    });
  } else {
    const mod = activeModule();
    mod.render(main(), current.sub, ctx());
    if (mod.onStoreChange && typeof mod.onStoreChange === "function") {
      // called again from subscribe
    }
  }
  renderNav();
  updateHeader();
}

// ------------------------------- Events ------------------------------------
function bindEvents() {
  document.getElementById("btn-theme").addEventListener("click", () => {
    ui.theme = ui.theme === "dark" ? "light" : "dark";
    applyTheme();
    persistUi();
    render();
  });

  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOutUser().catch((e) => console.warn(e));
    });
  }

  document.getElementById("btn-add").addEventListener("click", () => {
    const mod = activeModule();
    if (mod && mod.onPrimary) mod.onPrimary(ctx());
  });

  const search = document.getElementById("global-search");
  search.addEventListener("input", debounce(() => {
    ui.query = search.value;
    if (current.appId === "home") return;
    render();
  }, 200));

  const menu = document.getElementById("btn-menu");
  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("scrim");
  const closeMenu = () => {
    sidebar.classList.remove("open");
    scrim.classList.remove("show");
  };
  menu.addEventListener("click", () => {
    sidebar.classList.add("open");
    scrim.classList.add("show");
  });
  scrim.addEventListener("click", closeMenu);

  window.addEventListener("hashchange", () => {
    if (ui.query) {
      ui.query = "";
      search.value = "";
    }
    closeMenu();
    render();
  });

  main().addEventListener("click", async (e) => {
    if (e.target.closest('[data-hub-action="logout"]')) {
      signOutUser().catch((err) => console.warn(err));
      return;
    }
    const themeBtn = e.target.closest("[data-theme-set]");
    if (themeBtn) {
      ui.theme = themeBtn.dataset.themeSet;
      applyTheme();
      persistUi();
      render();
      return;
    }
    const mod = activeModule();
    if (mod) {
      const handled = await mod.onClick(e, ctx());
      if (handled) return;
    }
    const soon = e.target.closest(".app-card.soon");
    if (soon) e.preventDefault();
  });
  main().addEventListener("change", (e) => {
    const mod = activeModule();
    if (mod && mod.onChange) mod.onChange(e, ctx());
  });
  main().addEventListener("keydown", (e) => {
    const mod = activeModule();
    if (mod && mod.onKeydown) mod.onKeydown(e, ctx());
  });
}

// ------------------------------- Boot --------------------------------------
function updateUserBox() {
  const box = document.getElementById("user-box");
  const name = document.getElementById("user-name");
  if (!box) return;
  box.hidden = !currentUser;
  if (name && currentUser) name.textContent = displayName(currentUser);
}

async function startApp(uid, user) {
  currentUser = user || null;
  updateUserBox();
  await initDb(uid);
}

function stopApp() {
  currentUser = null;
  stopDb();
  updateUserBox();
}

async function boot() {
  applyTheme();
  bindEvents();
  document.getElementById("brand-name").textContent = appSettings.agencyName || "Γραφείο";
  document.getElementById("brand-sub").textContent = "Κεντρικό μενού";

  subscribe(() => {
    const s = getState();
    if (!s.ready) return;
    document.getElementById("loading")?.remove();
    render();
    const mod = activeModule();
    if (mod && mod.onStoreChange) mod.onStoreChange();
    const wrap = document.getElementById("sidebar-sync");
    const sync = syncInfo();
    if (wrap) {
      wrap.className = "sync-status " + sync.cls;
      wrap.innerHTML = `<span class="dot"></span><span>${sync.text}</span>`;
    }
  });

  if (!location.hash) location.hash = "#/home";

  const authRoot = document.getElementById("auth-root");

  if (!authAvailable()) {
    // Χωρίς Firebase: τοπική λειτουργία χωρίς σύνδεση.
    await startApp("local", null);
    return;
  }

  onAuthChange(async (user) => {
    if (!user) {
      stopApp();
      renderAuth(authRoot);
      return;
    }
    authRoot.classList.remove("open");
    authRoot.innerHTML = "";
    await startApp(user.uid, user);
  });
}

boot();

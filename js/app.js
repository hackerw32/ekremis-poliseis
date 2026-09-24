import * as store from "./store.js";
import { subscribe, initStore } from "./store.js";
import { openDrawer, closeDrawer, confirmDialog } from "./modal.js";
import { toast } from "./toast.js";
import { viewDashboard } from "./view-dashboard.js";
import { viewProperties } from "./view-properties.js";
import { viewTasks } from "./view-tasks.js";
import { viewSettings } from "./view-settings.js";
import { propertyDetailBody } from "./view-detail.js";
import { propertyFormBody, bindForm, readPropertyForm } from "./view-form.js";
import { appSettings } from "./config.js";
import { allTasks, propertyUrgency } from "./insights.js";
import { debounce, download, escapeHtml } from "./utils.js";

const LS_UI = "ekremis_ui_v1";

const ui = {
  route: "dashboard",
  query: "",
  status: "all",
  flag: "all",
  sort: "urgency",
  showDone: false,
  theme: "light",
};

try {
  Object.assign(ui, JSON.parse(localStorage.getItem(LS_UI) || "{}"));
} catch {}

function persistUi() {
  localStorage.setItem(LS_UI, JSON.stringify({ theme: ui.theme, sort: ui.sort, showDone: ui.showDone }));
}

const ctxGetter = () => ({ state: store.getState(), ui, currency: appSettings.currency, readOnly: false });

const VIEWS = {
  dashboard: viewDashboard,
  properties: viewProperties,
  tasks: viewTasks,
  settings: viewSettings,
};

const main = () => document.getElementById("main");

function parseRoute() {
  const h = (location.hash || "").replace(/^#\/?/, "");
  const name = h.split("?")[0] || "dashboard";
  return VIEWS[name] ? name : "dashboard";
}

function render() {
  ui.route = parseRoute();
  const view = VIEWS[ui.route];
  main().innerHTML = view(ctxGetter());
  document.querySelectorAll(".nav-item, .bn-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.route === ui.route);
  });
  updateChrome();
}

function updateChrome() {
  const state = store.getState();
  const tasks = allTasks(state.properties).filter((t) => !t.done);
  const np = document.getElementById("nav-count-props");
  const nt = document.getElementById("nav-count-tasks");
  if (np) np.textContent = state.properties.length;
  if (nt) nt.textContent = tasks.length;

  const wrap = document.getElementById("sync-status");
  const text = document.getElementById("sync-text");
  if (!wrap || !text) return;
  wrap.className = "sync-status";
  if (!state.ready) {
    text.textContent = "Φόρτωση…";
  } else if (state.error) {
    wrap.classList.add("error");
    text.textContent = "Σφάλμα συγχρονισμού";
  } else if (state.mode === "firebase") {
    wrap.classList.add("online");
    text.textContent = "Συγχρονισμένο (Firebase)";
  } else {
    wrap.classList.add("offline");
    text.textContent = "Τοπική αποθήκευση";
  }
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", ui.theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", ui.theme === "dark" ? "#0d1117" : "#1f6feb");
}

// ------------------------------- Drawers -----------------------------------
let openDetailId = null;

function mountDetail(root, id) {
  const p = store.getProperty(id);
  if (!p) return;
  const header = root.querySelector(".drawer-head h2");
  if (header) header.textContent = `${p.code ? p.code + " — " : ""}${p.title || "Υπόθεση"}`;
  const body = root.querySelector(".drawer-body");
  if (body) body.innerHTML = propertyDetailBody(p, ctxGetter());

  root.querySelectorAll("[data-detail-toggle-task]").forEach((btn) => {
    btn.addEventListener("click", () => toggleArrayItem(p.id, "tasks", Number(btn.dataset.detailToggleTask), "done"));
  });
  root.querySelectorAll("[data-detail-toggle-debt]").forEach((btn) => {
    btn.addEventListener("click", () => toggleArrayItem(p.id, "debts", Number(btn.dataset.detailToggleDebt), "settled"));
  });
}

function openDetail(id) {
  const p = store.getProperty(id);
  if (!p) return;
  openDetailId = id;
  openDrawer({
    className: "detail-drawer",
    title: `${p.code ? p.code + " — " : ""}${p.title || "Υπόθεση"}`,
    body: propertyDetailBody(p, ctxGetter()),
    footer: `
      <button class="btn" data-detail-close>Κλείσιμο</button>
      <span class="spacer"></span>
      <button class="btn danger" data-detail-delete>🗑️</button>
      <button class="btn primary" data-detail-edit>✏️ Επεξεργασία</button>`,
    onMount(root) {
      root.querySelector("[data-detail-close]").addEventListener("click", closeDrawer);
      root.querySelector("[data-detail-edit]").onclick = () => openForm(p.id);
      root.querySelector("[data-detail-delete]").onclick = async () => {
        openDetailId = null;
        const ok = await confirmDialog(`Να διαγραφεί οριστικά η υπόθεση «${p.title || p.code}»;`);
        if (!ok) {
          openDetailId = p.id;
          return;
        }
        await store.deleteProperty(p.id);
        toast("Η υπόθεση διαγράφηκε", "ok");
      };
      mountDetail(root, p.id);
    },
  });
}

async function toggleArrayItem(propId, group, index, key) {
  const p = store.getProperty(propId);
  if (!p || !Array.isArray(p[group]) || !p[group][index]) return;
  const arr = p[group].map((item, i) => (i === index ? { ...item, [key]: !item[key] } : item));
  await store.updateProperty(propId, { [group]: arr });
}

function openForm(id) {
  openDetailId = null;
  const isEdit = Boolean(id);
  const p = isEdit ? store.getProperty(id) : store.emptyProperty();
  if (!p) return;
  openDrawer({
    title: isEdit ? "Επεξεργασία υπόθεσης" : "Νέα υπόθεση",
    body: propertyFormBody(p),
    footer: `
      <button class="btn" data-form-cancel>Άκυρο</button>
      <span class="spacer"></span>
      <button class="btn primary" data-form-save>💾 Αποθήκευση</button>`,
    onMount(root) {
      bindForm(root);
      root.querySelector("[data-form-cancel]").addEventListener("click", closeDrawer);
      root.querySelector("[data-form-save]").addEventListener("click", async () => {
        const data = readPropertyForm(root);
        if (!data.title && !data.code) {
          toast("Συμπλήρωσε τουλάχιστον κωδικό ή τίτλο", "err");
          return;
        }
        try {
          if (isEdit) {
            await store.updateProperty(id, data);
            toast("Αποθηκεύτηκε", "ok");
            closeDrawer();
            openDetail(id);
          } else {
            const newId = await store.addProperty(data);
            toast("Η υπόθεση προστέθηκε", "ok");
            closeDrawer();
            openDetail(newId);
          }
        } catch (e) {
          toast("Σφάλμα αποθήκευσης: " + e.message, "err");
        }
      });
    },
  });
}

// ------------------------------- Actions -----------------------------------
function importFile(replace) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : parsed.properties;
      if (!Array.isArray(list)) throw new Error("Μη έγκυρο αρχείο");
      if (replace) {
        const ok = await confirmDialog("Να αντικατασταθούν όλες οι υποθέσεις με αυτές του αρχείου;", { confirmText: "Αντικατάσταση" });
        if (!ok) return;
      }
      const n = await store.importProperties(list, { replace });
      toast(`${n} υποθέσεις εισήχθησαν`, "ok");
    } catch (e) {
      toast("Αποτυχία εισαγωγής: " + e.message, "err");
    }
  };
  input.click();
}

async function handleAction(action) {
  switch (action) {
    case "add":
      openForm(null);
      break;
    case "export":
      download(`ekkremis-poliseis-${new Date().toISOString().slice(0, 10)}.json`, store.exportJSON());
      toast("Έγινε εξαγωγή", "ok");
      break;
    case "import-add":
      importFile(false);
      break;
    case "import-replace":
      importFile(true);
      break;
    case "reset-seed": {
      const ok = await confirmDialog("Επαναφορά αρχικών δεδομένων; Οι τρέχουσες αλλαγές θα χαθούν.", { confirmText: "Επαναφορά" });
      if (ok) {
        await store.resetToSeed();
        toast("Έγινε επαναφορά", "ok");
      }
      break;
    }
    case "clear-all": {
      const ok = await confirmDialog("Διαγραφή ΟΛΩΝ των υποθέσεων; Δεν αναιρείται.", { confirmText: "Διαγραφή" });
      if (ok) {
        await store.clearAll();
        toast("Διαγράφηκαν όλα", "ok");
      }
      break;
    }
  }
}

// ------------------------------- Events ------------------------------------
function bindGlobalEvents() {
  document.getElementById("btn-add").addEventListener("click", () => openForm(null));
  document.getElementById("btn-theme").addEventListener("click", () => {
    ui.theme = ui.theme === "dark" ? "light" : "dark";
    applyTheme();
    persistUi();
    if (ui.route === "settings") render();
  });

  const search = document.getElementById("global-search");
  search.addEventListener("input", debounce(() => {
    ui.query = search.value;
    if (ui.route !== "properties") {
      location.hash = "#/properties";
    } else {
      render();
    }
  }, 220));

  const menu = document.getElementById("btn-menu");
  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("scrim");
  menu.addEventListener("click", () => {
    sidebar.classList.add("open");
    scrim.classList.add("show");
  });
  const closeMenu = () => {
    sidebar.classList.remove("open");
    scrim.classList.remove("show");
  };
  scrim.addEventListener("click", closeMenu);

  window.addEventListener("hashchange", () => {
    closeMenu();
    render();
  });

  document.getElementById("main").addEventListener("click", onMainClick);
  document.getElementById("main").addEventListener("change", onMainChange);
  document.getElementById("main").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.classList.contains("card")) {
      openDetail(e.target.dataset.open);
    }
  });
}

function onMainClick(e) {
  const actionBtn = e.target.closest("[data-action]");
  if (actionBtn) {
    handleAction(actionBtn.dataset.action);
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
  const statusChip = e.target.closest("[data-filter-status]");
  if (statusChip) {
    ui.status = statusChip.dataset.filterStatus;
    render();
    return;
  }
  const flagChip = e.target.closest("[data-filter-flag]");
  if (flagChip) {
    ui.flag = flagChip.dataset.filterFlag;
    render();
    return;
  }
  if (e.target.closest("[data-toggle-done]")) return;
  const toggle = e.target.closest("[data-toggle-task]");
  if (toggle) {
    const row = toggle.closest("[data-task-prop]");
    if (row) toggleArrayItem(row.dataset.taskProp, "tasks", Number(row.dataset.taskIndex), "done");
    return;
  }
  const openEl = e.target.closest("[data-open]");
  if (openEl) {
    e.preventDefault();
    openDetail(openEl.dataset.open);
  }
}

function onMainChange(e) {
  if (e.target.matches("[data-sort]")) {
    ui.sort = e.target.value;
    persistUi();
    render();
  } else if (e.target.matches("[data-toggle-done]")) {
    ui.showDone = e.target.checked;
    persistUi();
    render();
  }
}

// ------------------------------- Boot --------------------------------------
async function boot() {
  applyTheme();
  bindGlobalEvents();
  document.getElementById("brand-name").textContent = "Εκκρεμείς Πωλήσεις";
  document.getElementById("brand-sub").textContent = appSettings.agencyName;

  subscribe(() => {
    if (!store.getState().ready) return;
    document.getElementById("loading")?.remove();
    render();
    const modalRoot = document.getElementById("modal-root");
    if (openDetailId && modalRoot && modalRoot.classList.contains("open") && modalRoot.querySelector(".detail-drawer")) {
      mountDetail(modalRoot, openDetailId);
    }
  });

  await initStore();
}

boot();

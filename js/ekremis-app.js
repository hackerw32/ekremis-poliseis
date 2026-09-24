// Εφαρμογή «Εκκρεμείς Πωλήσεις» ως module του hub.
import * as store from "./store.js";
import { openDrawer, closeDrawer, confirmDialog } from "./modal.js";
import { toast } from "./toast.js";
import { viewDashboard } from "./view-dashboard.js";
import { viewProperties } from "./view-properties.js";
import { viewTasks } from "./view-tasks.js";
import { viewSettings } from "./view-settings.js";
import { propertyDetailBody } from "./view-detail.js";
import { propertyFormBody, bindForm, readPropertyForm } from "./view-form.js";
import { appSettings } from "./config.js";
import { allTasks } from "./insights.js";
import { download } from "./utils.js";

export const meta = {
  id: "ekremis",
  title: "Εκκρεμείς Πωλήσεις",
  icon: "🏠",
  tagline: "Παρακολούθηση εκκρεμών πωλήσεων, επαφών και οφειλών",
  color: "primary",
  defaultRoute: "dashboard",
  primaryLabel: "Νέα υπόθεση",
};

const LS_UI = "ekremis_ui_v2";
const ui = { status: "all", flag: "all", sort: "urgency", showDone: false };
try {
  Object.assign(ui, JSON.parse(localStorage.getItem(LS_UI) || "{}"));
} catch {}

function persistUi() {
  try {
    localStorage.setItem(LS_UI, JSON.stringify({ sort: ui.sort, showDone: ui.showDone }));
  } catch {}
}

const VIEWS = {
  dashboard: viewDashboard,
  properties: viewProperties,
  tasks: viewTasks,
  settings: viewSettings,
};

function ctxState(c) {
  return { state: store.getState(), ui: { ...ui, query: c.ui.query, theme: c.ui.theme }, currency: appSettings.currency, readOnly: false };
}

export function nav() {
  const s = store.getState();
  const tasks = s.ready ? allTasks(s.properties).filter((t) => !t.done).length : 0;
  return [
    { route: "dashboard", label: "Dashboard", icon: "📊" },
    { route: "properties", label: "Υποθέσεις", icon: "🏠", badge: s.ready ? s.properties.length : 0 },
    { route: "tasks", label: "Εκκρεμότητες", icon: "✅", badge: tasks, badgeWarn: true },
    { route: "settings", label: "Ρυθμίσεις", icon: "⚙️" },
  ];
}

export function render(container, subroute, ctx) {
  const view = VIEWS[subroute] || VIEWS.dashboard;
  container.innerHTML = view(ctxState(ctx));
}

// ------------------------------- Drawers -----------------------------------
let openDetailId = null;

function mountDetail(root, id, ctx) {
  const p = store.getProperty(id);
  if (!p) return;
  const header = root.querySelector(".drawer-head h2");
  if (header) header.textContent = `${p.code ? p.code + " — " : ""}${p.title || "Υπόθεση"}`;
  const body = root.querySelector(".drawer-body");
  if (body) body.innerHTML = propertyDetailBody(p, ctxState(ctx));

  root.querySelectorAll("[data-detail-toggle-task]").forEach((btn) => {
    btn.addEventListener("click", () => toggleArrayItem(p.id, "tasks", Number(btn.dataset.detailToggleTask), "done"));
  });
  root.querySelectorAll("[data-detail-toggle-debt]").forEach((btn) => {
    btn.addEventListener("click", () => toggleArrayItem(p.id, "debts", Number(btn.dataset.detailToggleDebt), "settled"));
  });
}

function openDetail(id, ctx) {
  const p = store.getProperty(id);
  if (!p) return;
  openDetailId = id;
  openDrawer({
    className: "detail-drawer",
    title: `${p.code ? p.code + " — " : ""}${p.title || "Υπόθεση"}`,
    body: propertyDetailBody(p, ctxState(ctx)),
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
      mountDetail(root, p.id, ctx);
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
            openDetail(id, { ui: { query: "" } });
          } else {
            const newId = await store.addProperty(data);
            toast("Η υπόθεση προστέθηκε", "ok");
            closeDrawer();
            openDetail(newId, { ui: { query: "" } });
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

export function onPrimary(ctx) {
  openForm(null);
}

export function onClick(e, ctx) {
  const actionBtn = e.target.closest("[data-action]");
  if (actionBtn) {
    handleAction(actionBtn.dataset.action);
    return true;
  }
  const statusChip = e.target.closest("[data-filter-status]");
  if (statusChip) {
    ui.status = statusChip.dataset.filterStatus;
    ctx.refresh();
    return true;
  }
  const flagChip = e.target.closest("[data-filter-flag]");
  if (flagChip) {
    ui.flag = flagChip.dataset.filterFlag;
    ctx.refresh();
    return true;
  }
  if (e.target.closest("[data-toggle-done]")) return true;
  const toggle = e.target.closest("[data-toggle-task]");
  if (toggle) {
    const row = toggle.closest("[data-task-prop]");
    if (row) toggleArrayItem(row.dataset.taskProp, "tasks", Number(row.dataset.taskIndex), "done");
    return true;
  }
  const openEl = e.target.closest("[data-open]");
  if (openEl) {
    e.preventDefault();
    openDetail(openEl.dataset.open, ctx);
    return true;
  }
  return false;
}

export function onChange(e, ctx) {
  if (e.target.matches("[data-sort]")) {
    ui.sort = e.target.value;
    persistUi();
    ctx.refresh();
    return true;
  }
  if (e.target.matches("[data-toggle-done]")) {
    ui.showDone = e.target.checked;
    persistUi();
    ctx.refresh();
    return true;
  }
  return false;
}

export function onKeydown(e, ctx) {
  if (e.key === "Enter" && e.target.classList.contains("card")) {
    openDetail(e.target.dataset.open, ctx);
    return true;
  }
  return false;
}

export function onStoreChange() {
  const modalRoot = document.getElementById("modal-root");
  if (openDetailId && modalRoot && modalRoot.classList.contains("open") && modalRoot.querySelector(".detail-drawer")) {
    mountDetail(modalRoot, openDetailId, { ui: { query: "" } });
  }
}

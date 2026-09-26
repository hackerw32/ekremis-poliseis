import * as store from "./store.js";
import { viewDashboard } from "./view-dashboard.js";
import { viewTransactions } from "./view-transactions.js";
import { viewJobs } from "./view-jobs.js";
import { viewPeople } from "./view-people.js";
import { viewReports } from "./view-reports.js";
import { viewSettings } from "./view-settings.js";
import { openClientForm, openPartnerForm, openJobForm, openTransactionForm, openJobDetail, openPersonHistory } from "./forms.js";
import { openIncomeWizard } from "./income-wizard.js";
import { getOffice, saveOffice } from "./office.js";
import { filterTransactions } from "./insights.js";
import { openDrawer, closeDrawer, confirmDialog } from "../modal.js";
import { toast } from "../toast.js";
import { download, formatCurrency, escapeHtml, todayISO } from "../utils.js";

export const meta = {
  id: "tameio",
  title: "Οικονομικά",
  icon: "💰",
  tagline: "Έσοδα, έξοδα, υποθέσεις (Α/Π) και υπόλοιπα πελατών/συνεργατών",
  color: "success",
  defaultRoute: "dashboard",
  primaryLabel: "Νέα κίνηση",
};

const LS_UI = "tameio_ui_v1";
const ui = { type: "", dateFrom: "", dateTo: "", jobStatus: "", peopleTab: "clients" };
try {
  Object.assign(ui, JSON.parse(localStorage.getItem(LS_UI) || "{}"));
} catch {}
function persistUi() {
  try {
    localStorage.setItem(LS_UI, JSON.stringify({ jobStatus: ui.jobStatus, peopleTab: ui.peopleTab }));
  } catch {}
}

const VIEWS = {
  dashboard: viewDashboard,
  transactions: viewTransactions,
  jobs: viewJobs,
  people: viewPeople,
  reports: viewReports,
  settings: viewSettings,
};

function ctxState(c) {
  return { ui: { query: c.ui.query }, tameio: ui, currency: getOffice().currency === "EUR" ? "EUR" : getOffice().currency || "EUR" };
}

export function nav() {
  const s = { income: 0, expense: 0 };
  store.transactions().forEach((t) => {
    const a = Number(t.amount) || 0;
    if (t.txn_type === "Έσοδο") s.income += a;
    else s.expense += a;
  });
  return [
    { route: "dashboard", label: "Σύνοψη", icon: "📊" },
    { route: "transactions", label: "Συναλλαγές", icon: "🧾", badge: store.transactions().length },
    { route: "jobs", label: "Υποθέσεις", icon: "📁", badge: store.jobs().length },
    { route: "reports", label: "Αναφορές", icon: "📈" },
    { route: "settings", label: "Ρυθμίσεις", icon: "⚙️" },
  ];
}

export function render(container, subroute, ctx) {
  const view = VIEWS[subroute] || VIEWS.dashboard;
  container.innerHTML = view(ctxState(ctx));
}

export function onPrimary() {
  chooseTxn();
}

// ------------------------------ actions ------------------------------------
function chooseTxn() {
  openDrawer({
    title: "Νέα κίνηση",
    body: `<div class="pill-row" style="gap:10px">
      <button class="btn block" data-pick="Έσοδο" style="padding:22px;font-size:16px">📥 Είσπραξη (Έσοδο)</button>
      <button class="btn block" data-pick="Έξοδο" style="padding:22px;font-size:16px">📤 Πληρωμή (Έξοδο)</button>
    </div>`,
    onMount(root) {
      root.querySelectorAll("[data-pick]").forEach((b) =>
        b.addEventListener("click", () => {
          closeDrawer();
          if (b.dataset.pick === "Έσοδο") openIncomeWizard();
          else openTransactionForm({ type: "Έξοδο" });
        })
      );
    },
  });
}

function importFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.style.display = "none";
  document.body.appendChild(input);
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const ok = await confirmDialog("Να αντικατασταθούν τα δεδομένα του ταμείου με αυτά του αρχείου;", { confirmText: "Αντικατάσταση" });
      if (!ok) return;
      await store.importJSON(parsed);
      toast("Έγινε εισαγωγή", "ok");
    } catch (e) {
      toast("Αποτυχία: " + e.message, "err");
    } finally {
      input.remove();
    }
  };
  input.click();
}

function reportCSV() {
  const list = filterTransactions({ type: ui.type, dateFrom: ui.dateFrom, dateTo: ui.dateTo });
  const head = ["Ημ/νία", "Τύπος", "Κατηγορία", "Ποσό", "Τρόπος", "Απόδειξη", "Πελάτης", "Συνεργάτης", "Υπόθεση", "Περιγραφή"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = list.map((t) =>
    [t.txn_date, t.txn_type, t.category, t.amount, t.payment_method, t.receipt_issued ? "Ναι" : "Όχι", t.client_name, t.partner_name, t.job_label, t.description]
      .map(esc)
      .join(";")
  );
  const csv = "\uFEFF" + [head.join(";"), ...lines].join("\r\n");
  download(`tameio-${todayISO()}.csv`, csv);
  toast("Έγινε εξαγωγή CSV", "ok");
}

function reportPrint() {
  const o = getOffice();
  const list = filterTransactions({ type: ui.type, dateFrom: ui.dateFrom, dateTo: ui.dateTo });
  const income = list.filter((t) => t.txn_type === "Έσοδο").reduce((a, t) => a + (Number(t.amount) || 0), 0);
  const expense = list.filter((t) => t.txn_type === "Έξοδο").reduce((a, t) => a + (Number(t.amount) || 0), 0);
  const rows = list.map((t) => `<tr><td>${t.txn_date || ""}</td><td>${t.txn_type}</td><td>${t.category || ""}</td><td>${t.description || ""}</td><td>${t.partner_name || t.client_name || ""}</td><td style="text-align:right">${formatCurrency(t.amount)}</td></tr>`).join("");
  const w = window.open("", "_blank");
  if (!w) return toast("Επίτρεψε τα pop-ups", "err");
  w.document.write(`<!doctype html><html lang="el"><head><meta charset="utf-8"><title>Αναφορά ταμείου</title>
    <style>
      body{font-family:Arial,sans-serif;color:#1a1a1a;padding:28px}
      h1{font-size:18px;margin:0} h2{font-size:13px;font-weight:400;color:#555;margin:4px 0 16px}
      table{width:100%;border-collapse:collapse;font-size:12px} th,td{border:1px solid #ccc;padding:5px 6px;text-align:left}
      th{background:#f0e9d8} tfoot td{font-weight:bold;background:#faf6ec}
      .meta{font-size:11px;color:#666;margin-bottom:10px}
      @media print{@page{size:A4;margin:14mm}}
    </style></head><body>
    <h1>${escapeHtml(o.name)}</h1>
    <h2>${escapeHtml(o.owner)} · ${escapeHtml(o.address)} · ${escapeHtml(o.phone)}</h2>
    <div class="meta">Αναφορά κινήσεων ${ui.dateFrom ? "από " + ui.dateFrom + " " : ""}${ui.dateTo ? "έως " + ui.dateTo : ""} · ${new Date().toLocaleDateString("el-GR")}</div>
    <table><thead><tr><th>Ημ/νία</th><th>Τύπος</th><th>Κατηγορία</th><th>Περιγραφή</th><th>Σχετίζεται</th><th style="text-align:right">Ποσό</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6">Καμία κίνηση</td></tr>'}</tbody>
    <tfoot><tr><td colspan="5">Σύνολο εσόδων</td><td style="text-align:right">${formatCurrency(income)}</td></tr>
    <tr><td colspan="5">Σύνολο εξόδων</td><td style="text-align:right">${formatCurrency(expense)}</td></tr>
    <tr><td colspan="5">Υπόλοιπο</td><td style="text-align:right">${formatCurrency(income - expense)}</td></tr></tfoot></table>
    </body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 350);
}

async function handleAction(action, el) {
  switch (action) {
    case "add-txn-income": openIncomeWizard(); break;
    case "add-txn-expense": openTransactionForm({ type: "Έξοδο" }); break;
    case "add-job": openJobForm(null); break;
    case "add-client": openClientForm(null); break;
    case "add-partner": openPartnerForm(null); break;
    case "tab-clients": ui.peopleTab = "clients"; persistUi(); return "refresh";
    case "tab-partners": ui.peopleTab = "partners"; persistUi(); return "refresh";
    case "job-income": openTransactionForm({ type: "Έσοδο", jobId: el.dataset.id }); break;
    case "job-expense": openTransactionForm({ type: "Έξοδο", jobId: el.dataset.id }); break;
    case "txn-clear-filters": ui.type = ""; ui.dateFrom = ""; ui.dateTo = ""; return "refresh";
    case "save-office": {
      const data = {};
      document.querySelectorAll("[data-office]").forEach((i) => (data[i.dataset.office] = i.value.trim()));
      saveOffice(data);
      toast("Τα στοιχεία αποθηκεύτηκαν", "ok");
      return "refresh";
    }
    case "export":
      download(`tameio-backup-${todayISO()}.json`, store.exportJSON());
      toast("Έγινε εξαγωγή", "ok");
      break;
    case "import": importFile(); break;
    case "clear-all": {
      const ok = await confirmDialog("Διαγραφή όλων των δεδομένων του ταμείου; Δεν αναιρείται.", { confirmText: "Διαγραφή" });
      if (ok) {
        await store.clearAll();
        toast("Διαγράφηκαν όλα", "ok");
      }
      break;
    }
    case "report-csv": reportCSV(); break;
    case "report-print": reportPrint(); break;
  }
  return null;
}

export async function onClick(e, ctx) {
  const actionEl = e.target.closest("[data-tameio-action]");
  if (actionEl) {
    const res = await handleAction(actionEl.dataset.tameioAction, actionEl);
    if (res === "refresh") ctx.refresh();
    return true;
  }

  const txnOpen = e.target.closest('[data-tameio="txn"]');
  if (txnOpen) {
    const t = store.transactions().find((x) => x.id === txnOpen.dataset.id);
    if (t) openTransactionForm({ txn: t });
    return true;
  }
  const txnDel = e.target.closest('[data-tameio="txn-del"]');
  if (txnDel) {
    const ok = await confirmDialog("Να διαγραφεί η κίνηση;");
    if (ok) {
      await store.removeTransaction(txnDel.dataset.id);
      toast("Διαγράφηκε", "ok");
    }
    return true;
  }
  const jobEl = e.target.closest('[data-tameio="job"]');
  if (jobEl) {
    const j = store.jobs().find((x) => x.id === jobEl.dataset.id);
    if (j) openJobDetail(j);
    return true;
  }
  const personEl = e.target.closest('[data-tameio="person"]');
  if (personEl) {
    openPersonHistory(personEl.dataset.kind, personEl.dataset.id);
    return true;
  }
  const personEdit = e.target.closest('[data-tameio="person-edit"]');
  if (personEdit) {
    const isP = personEdit.dataset.kind === "partners";
    const p = (isP ? store.partners() : store.clients()).find((x) => x.id === personEdit.dataset.id);
    if (p) (isP ? openPartnerForm : openClientForm)(p);
    return true;
  }
  const personDel = e.target.closest('[data-tameio="person-del"]');
  if (personDel) {
    const isP = personDel.dataset.kind === "partners";
    const ok = await confirmDialog("Να διαγραφεί η εγγραφή;");
    if (ok) {
      // eslint-disable-next-line no-unused-expressions
      isP ? await store.removePartner(personDel.dataset.id) : await store.removeClient(personDel.dataset.id);
      toast("Διαγράφηκε", "ok");
    }
    return true;
  }
  return false;
}

export function onChange(e, ctx) {
  const f = e.target.closest("[data-tameio-filter]");
  if (f) {
    ui[f.dataset.tameioFilter] = f.value;
    if (f.dataset.tameioFilter === "jobStatus") persistUi();
    ctx.refresh();
    return true;
  }
  return false;
}

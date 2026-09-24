import * as store from "./store.js";
import { viewLeads } from "./view-list.js";
import { viewImport } from "./view-import.js";
import { openLeadForm, openLeadDetail } from "./forms.js";
import { parseLeads, dedupeLeads } from "./parse.js";
import { confirmDialog } from "../modal.js";
import { toast } from "../toast.js";
import { download, todayISO } from "../utils.js";

export const meta = {
  id: "leads",
  title: "Ενδιαφερόμενοι",
  icon: "🎯",
  tagline: "Leads από Google Forms, έξυπνο ταίριασμα με ακίνητα και email πρότασης",
  color: "warn",
  defaultRoute: "list",
  primaryLabel: "Νέος ενδιαφερόμενος",
};

const ui = { search_type: "", status: "", pending: [], sheetUrl: "", message: "" };

export function nav() {
  return [
    { route: "list", label: "Ενδιαφερόμενοι", icon: "🎯", badge: store.listLeads().length },
    { route: "import", label: "Εισαγωγή", icon: "📥" },
  ];
}

export function render(container, subroute, ctx) {
  const c = { ui: { query: ctx.ui.query }, leads: ui, currency: ctx.currency };
  container.innerHTML = subroute === "import" ? viewImport(c) : viewLeads(c);
}

export function onPrimary() {
  openLeadForm(null);
}

function refresh() {
  document.dispatchEvent(new CustomEvent("hub:refresh"));
}

function finishParse(text) {
  const leads = dedupeLeads(parseLeads(text));
  ui.pending = leads;
  ui.message = leads.length ? `Αναλύθηκαν ${leads.length} εγγραφές (χωρίς διπλότυπα).` : "Δεν βρέθηκαν έγκυρες εγγραφές.";
  refresh();
}

async function loadXLSX() {
  if (window.XLSX) return window.XLSX;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    s.onload = res;
    s.onerror = () => rej(new Error("αποτυχία φόρτωσης Excel library"));
    document.head.appendChild(s);
  });
  return window.XLSX;
}

function pickFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".csv,.xlsx,.xls,text/csv";
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      let text;
      if (/\.xlsx?$/i.test(file.name)) {
        const XLSX = await loadXLSX();
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        text = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
      } else {
        text = await file.text();
      }
      finishParse(text);
    } catch (e) {
      toast("Αποτυχία ανάγνωσης: " + e.message, "err");
    }
  };
  input.click();
}

async function fetchSheet() {
  const el = document.querySelector("[data-lead-sheet]");
  const raw = el ? el.value.trim() : "";
  ui.sheetUrl = raw;
  if (!raw) return toast("Βάλε το link του φύλλου", "err");
  let url = raw;
  if (!/output=csv|tqx=out:csv/.test(raw)) {
    const m = raw.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const id = m ? m[1] : raw;
    if (!/^[a-zA-Z0-9-_]{20,}$/.test(id)) return toast("Μη έγκυρο link/ID φύλλου", "err");
    url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    finishParse(await res.text());
  } catch (e) {
    ui.message = "Αποτυχία λήψης από Google Sheet. Κατέβασε το φύλλο ως CSV/Excel και ανέβασέ το εδώ. (" + e.message + ")";
    refresh();
    toast("Αποτυχία λήψης — δοκίμασε ανέβασμα αρχείου", "err");
  }
}

async function handleAction(action, el) {
  switch (action) {
    case "add":
      openLeadForm(null);
      break;
    case "pick-file":
      pickFile();
      break;
    case "fetch-sheet":
      await fetchSheet();
      break;
    case "parse-paste": {
      const ta = document.querySelector("[data-lead-paste]");
      if (!ta || !ta.value.trim()) return toast("Επικόλλησε πρώτα κείμενο", "err");
      finishParse(ta.value);
      break;
    }
    case "import-add": {
      const n = await store.importLeads(ui.pending, { replace: false });
      ui.pending = [];
      ui.message = `Προστέθηκαν ${n} νέοι ενδιαφερόμενοι (τα διπλότυπα παραλείφθηκαν).`;
      toast(`Προστέθηκαν ${n}`, "ok");
      refresh();
      break;
    }
    case "import-replace": {
      const ok = await confirmDialog("Να αντικατασταθούν ΟΛΟΙ οι ενδιαφερόμενοι με αυτούς του αρχείου;", { confirmText: "Αντικατάσταση" });
      if (!ok) break;
      const n = await store.importLeads(ui.pending, { replace: true });
      ui.pending = [];
      ui.message = `Αντικαταστάθηκαν με ${n} εγγραφές.`;
      refresh();
      break;
    }
    case "import-cancel":
      ui.pending = [];
      ui.message = "";
      refresh();
      break;
    case "export":
      download(`endiaferomenoi-${todayISO()}.json`, store.leadsJSON());
      toast("Έγινε εξαγωγή", "ok");
      break;
    case "clear": {
      const ok = await confirmDialog("Διαγραφή όλων των ενδιαφερομένων;", { confirmText: "Διαγραφή" });
      if (ok) {
        await store.clearLeads();
        toast("Διαγράφηκαν όλα", "ok");
      }
      break;
    }
  }
}

export async function onClick(e, ctx) {
  const actionEl = e.target.closest("[data-lead-action]");
  if (actionEl) {
    await handleAction(actionEl.dataset.leadAction, actionEl);
    return true;
  }
  const filter = e.target.closest("[data-lead-filter]");
  if (filter && filter.tagName !== "SELECT") {
    ui[filter.dataset.leadFilter] = filter.dataset.value ?? "";
    ctx.refresh();
    return true;
  }
  const open = e.target.closest('[data-lead="open"]');
  if (open) {
    const l = store.getLead(open.dataset.id);
    if (l) openLeadDetail(l);
    return true;
  }
  return false;
}

export function onChange(e, ctx) {
  const filter = e.target.closest("select[data-lead-filter]");
  if (filter) {
    ui[filter.dataset.leadFilter] = filter.value;
    ctx.refresh();
    return true;
  }
  return false;
}

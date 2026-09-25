import * as store from "./store.js";
import { viewListings } from "./view-list.js";
import { viewSettings } from "./view-settings.js";
import { openListingForm, openListingDetail } from "./forms.js";
import { parseCSV } from "../leads/parse.js";
import { confirmDialog } from "../modal.js";
import { toast } from "../toast.js";
import { download, todayISO, deburr } from "../utils.js";

export const meta = {
  id: "aggelies",
  title: "Αγγελίες",
  icon: "📢",
  tagline: "Διαθέσιμα ακίνητα (xe.gr) — η πηγή για το ταίριασμα με ενδιαφερόμενους",
  color: "purple",
  defaultRoute: "list",
  primaryLabel: "Νέα αγγελία",
};

const ui = { status: "", type: "", message: "" };

export function nav() {
  return [
    { route: "list", label: "Αγγελίες", icon: "📢", badge: store.listListings().length },
    { route: "settings", label: "Δεδομένα", icon: "⚙️" },
  ];
}

export function render(container, subroute, ctx) {
  const c = { ui: { query: ctx.ui.query }, aggelies: ui, currency: ctx.currency };
  container.innerHTML = subroute === "settings" ? viewSettings(c) : viewListings(c);
}

export function onPrimary() {
  openListingForm(null);
}

const STATUS_IN = {
  "διαθεσιμο": "available", "διαθέσιμο": "available", "available": "available",
  "σε αναμονη": "pending", "pending": "pending", "αναμονή": "pending",
  "πωληθηκε": "sold", "πωλήθηκε": "sold", "sold": "sold",
  "δεν απαντα": "not_sure", "not_sure": "not_sure",
};

function mapStatus(v) {
  const k = deburr(v || "").trim();
  return STATUS_IN[k] || "available";
}

function mapListingsCSV(text) {
  const rows = parseCSV(text);
  if (!rows.length) return [];
  const header = rows[0].map((h) => deburr(h));
  const rules = {
    code: ["κωδικ", "code"],
    type: ["τυπος", "type", "ειδος"],
    sqm: ["τμ", "τετραγ", "εμβαδ", "sqm"],
    price: ["τιμη", "price", "ζητουμεν"],
    address: ["διευθυν", "περιοχ", "address", "τοποθεσια"],
    phone: ["τηλεφ", "phone"],
    status: ["καταστα", "status"],
    notes: ["σημειω", "notes"],
  };
  const idx = {};
  header.forEach((h, i) => {
    for (const k in rules) {
      if (idx[k] === undefined && rules[k].some((w) => h.includes(w))) idx[k] = i;
    }
  });
  let start = 1;
  if (Object.keys(idx).length < 3) {
    Object.assign(idx, { code: 0, type: 1, sqm: 2, price: 3, address: 4, phone: 5, status: 6, notes: 7 });
    start = 0;
  }
  const out = [];
  for (let i = start; i < rows.length; i++) {
    const r = rows[i];
    const at = (k) => (idx[k] !== undefined ? String(r[idx[k]] ?? "").trim() : "");
    if (!at("code") && !at("address") && !at("price")) continue;
    out.push({
      code: at("code"),
      type: at("type") || "Άλλο",
      sqm: at("sqm"),
      price: at("price"),
      address: at("address"),
      phone: at("phone"),
      status: mapStatus(at("status")),
      notes: at("notes"),
    });
  }
  return out;
}

function parseListingsText(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const j = JSON.parse(trimmed);
    const arr = Array.isArray(j) ? j : j.listings;
    if (Array.isArray(arr)) return arr;
  }
  return mapListingsCSV(text);
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

function pickFile(replace = false) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,.csv,.xlsx,.xls";
  input.style.display = "none";
  document.body.appendChild(input);
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      let records;
      if (/\.xlsx?$/i.test(file.name)) {
        const XLSX = await loadXLSX();
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
        records = mapListingsCSV(XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]));
      } else {
        records = parseListingsText(await file.text());
      }
      const n = await store.importListings(records, { replace });
      ui.message = replace
        ? `Αντικαταστάθηκαν όλες οι αγγελίες με ${n} εγγραφές.`
        : `Εισήχθησαν ${n} νέες αγγελίες (τα διπλότυπα παραλείφθηκαν).`;
      toast(replace ? `Αντικαταστάθηκαν ${n}` : `Εισήχθησαν ${n}`, "ok");
      document.dispatchEvent(new CustomEvent("hub:refresh"));
    } catch (e) {
      toast("Αποτυχία εισαγωγής: " + e.message, "err");
    } finally {
      input.remove();
    }
  };
  input.click();
}

async function handleAction(action) {
  switch (action) {
    case "add":
      openListingForm(null);
      break;
    case "pick-file":
      pickFile(false);
      break;
    case "pick-file-replace":
      pickFile(true);
      break;
    case "export":
      download(`aggelies-${todayISO()}.json`, store.listingsJSON());
      toast("Έγινε εξαγωγή", "ok");
      break;
    case "clear": {
      const ok = await confirmDialog("Διαγραφή όλων των αγγελιών;", { confirmText: "Διαγραφή" });
      if (ok) {
        await store.clearListings();
        toast("Διαγράφηκαν όλα", "ok");
      }
      break;
    }
  }
}

export async function onClick(e, ctx) {
  const actionEl = e.target.closest("[data-agg-action]");
  if (actionEl) {
    await handleAction(actionEl.dataset.aggAction);
    return true;
  }
  const filter = e.target.closest("[data-agg-filter]");
  if (filter && filter.tagName !== "SELECT") {
    ui[filter.dataset.aggFilter] = filter.dataset.value ?? "";
    ctx.refresh();
    return true;
  }
  const open = e.target.closest('[data-agg="open"]');
  if (open) {
    const l = store.getListing(open.dataset.id);
    if (l) openListingDetail(l);
    return true;
  }
  return false;
}

export function onChange(e, ctx) {
  const sel = e.target.closest("select[data-agg-filter]");
  if (sel) {
    ui[sel.dataset.aggFilter] = sel.value;
    ctx.refresh();
    return true;
  }
  return false;
}

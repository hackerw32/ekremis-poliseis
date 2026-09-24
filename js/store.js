// Wrapper ειδικά για την εφαρμογή «Εκκρεμείς Πωλήσεις», πάνω στο κοινό db layer.
import * as db from "./core/db.js";
import { SEED_PROPERTIES } from "./seed-data.js";

const COL = "properties";

export function emptyProperty() {
  return {
    code: "",
    title: "",
    type: "πώληση",
    status: "Ενεργό",
    price: null,
    depositAmount: null,
    depositDate: "",
    depositNote: "",
    availability: "",
    seller: "",
    sellerPhone: "",
    sellerEmail: "",
    buyer: "",
    buyerPhone: "",
    buyerEmail: "",
    contacts: [],
    debts: [],
    tasks: [],
    interested: [],
    notes: "",
  };
}

export function normalizeProperty(p) {
  const out = { ...emptyProperty(), ...(p || {}) };
  out.contacts = Array.isArray(out.contacts) ? out.contacts : [];
  out.debts = Array.isArray(out.debts) ? out.debts : [];
  out.tasks = Array.isArray(out.tasks) ? out.tasks : [];
  out.interested = Array.isArray(out.interested) ? out.interested : [];
  return out;
}

export function getState() {
  const s = db.getState();
  return {
    ready: s.ready,
    mode: s.mode,
    error: s.error,
    properties: db.list(COL).map(normalizeProperty),
  };
}

export function subscribe(fn) {
  return db.subscribe(() => fn(getState()));
}

export function initStore() {
  return db.init();
}

export function getProperty(id) {
  const p = db.get(COL, id);
  return p ? normalizeProperty(p) : null;
}

export function addProperty(data) {
  return db.add(COL, normalizeProperty(data));
}

export function updateProperty(id, patch) {
  return db.update(COL, id, patch);
}

export function deleteProperty(id) {
  return db.remove(COL, id);
}

export async function importProperties(list, { replace = false } = {}) {
  const mapped = (list || []).map((p) => normalizeProperty(p));
  if (replace) {
    await db.replaceAll(COL, mapped);
    return mapped.length;
  }
  for (const p of mapped) {
    // eslint-disable-next-line no-await-in-loop
    await db.add(COL, p);
  }
  return mapped.length;
}

export function resetToSeed() {
  return db.replaceAll(COL, SEED_PROPERTIES);
}

export function clearAll() {
  return db.clear(COL);
}

export function exportJSON() {
  return JSON.stringify(getState().properties, null, 2);
}

export { addProperty as add, updateProperty as update, deleteProperty as remove };

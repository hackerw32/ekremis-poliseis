import * as db from "../core/db.js";

const COL = "listings";

export const STATUS = {
  available: "Διαθέσιμο",
  pending: "Σε αναμονή",
  sold: "Πωλήθηκε",
  not_sure: "Δεν απαντά",
};

export const TYPES = [
  "Οικόπεδο",
  "Αγροτεμάχιο",
  "Μονοκατοικία",
  "Μεζονέτα",
  "Διαμέρισμα",
  "Ακίνητο",
  "Επαγγελματικός χώρος",
  "Άλλο",
];

export function statusLabel(s) {
  return STATUS[s] || s || "";
}

function toNum(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, ""));
  return isFinite(n) ? n : null;
}

export function emptyListing() {
  return {
    code: "",
    type: "Οικόπεδο",
    sqm: null,
    price: null,
    address: "",
    phone: "",
    status: "available",
    notes: "",
    extraPhones: [],
    calls: [],
    decision: "",
    maps: "",
    isNew: false,
    source: "xe.gr",
  };
}

export function normalize(l) {
  const out = { ...emptyListing(), ...(l || {}) };
  if (!Array.isArray(out.extraPhones)) out.extraPhones = [];
  if (!Array.isArray(out.calls)) out.calls = [];
  return out;
}

export function fromLegacy(r) {
  return normalize({
    code: String(r.code || ""),
    type: r.type || "Άλλο",
    sqm: toNum(r.sqm != null ? r.sqm : r.area),
    price: toNum(r.price),
    address: r.address || "",
    phone: r.phone || "",
    status: r.status || "available",
    notes: r.notes || "",
    extraPhones: r.extraPhones || [],
    calls: r.calls || [],
    decision: r.decision || "",
    maps: r.maps || "",
    isNew: Boolean(r.isNew),
    source: r.source || "xe.gr",
  });
}

export function listListings() {
  return db.list(COL).map(normalize);
}

export function getListing(id) {
  const l = db.get(COL, id);
  return l ? normalize(l) : null;
}

export function addListing(d) {
  return db.add(COL, normalize(d));
}
export function updateListing(id, d) {
  return db.update(COL, id, d);
}
export function removeListing(id) {
  return db.remove(COL, id);
}
export function clearListings() {
  return db.clear(COL);
}
export function listingsJSON() {
  return JSON.stringify(listListings(), null, 2);
}

export async function importListings(records, { replace = false } = {}) {
  const mapped = (records || []).map(fromLegacy);
  if (replace) {
    await db.replaceAll(COL, mapped);
    return mapped.length;
  }
  const seen = new Set(listListings().map((l) => String(l.code || "")));
  const fresh = [];
  for (const l of mapped) {
    const key = String(l.code || "");
    if (key && seen.has(key)) continue;
    seen.add(key);
    fresh.push(l);
  }
  await db.addMany(COL, fresh);
  return fresh.length;
}

export function stats() {
  const list = listListings();
  const byStatus = {};
  list.forEach((l) => (byStatus[l.status] = (byStatus[l.status] || 0) + 1));
  return { total: list.length, byStatus };
}

// Ενοποιημένος «κατάλογος» για ταίριασμα με ενδιαφερόμενους
export function catalog(properties) {
  const out = [];
  listListings().forEach((l) => {
    if (l.status === "sold") return;
    const title = [l.type, l.sqm ? `${l.sqm} τ.μ.` : "", l.address].filter(Boolean).join(" · ");
    out.push({
      id: l.id,
      source: "listing",
      code: l.code,
      title,
      type: l.type,
      price: l.price,
      sqm: l.sqm,
      address: l.address,
      notes: l.notes,
      status: statusLabel(l.status),
      phone: l.phone,
    });
  });
  (properties || []).forEach((p) => {
    if (["Ολοκληρώθηκε", "Ακυρώθηκε"].includes(p.status)) return;
    out.push({
      id: p.id,
      source: "property",
      code: p.code,
      title: p.title,
      type: p.type,
      price: p.price,
      sqm: null,
      address: "",
      notes: p.notes,
      status: p.status,
      phone: p.buyerPhone || p.sellerPhone || "",
    });
  });
  return out;
}

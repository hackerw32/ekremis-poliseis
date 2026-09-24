import * as db from "../core/db.js";
import { todayISO } from "../utils.js";

const COL = "texnikos_docs";

export function emptyDoc() {
  return {
    protocol: "",
    doc_date: todayISO(),
    talk_date: "",
    recipient_prefix: "Κον",
    recipient: "",
    doc_type: "ΤΕΧΝΙΚΟΣ ΕΛΕΓΧΟΣ ΟΙΚΟΠΕΔΟΥ",
    property_location: "",
    municipality: "ΣΑΛΑΜΙΝΟΣ",
    intro: "",
    ownership: "",
    control: "",
    notes: "",
    area_contract: "",
    area_property: "",
    tolerance: "",
    works_intro: "ΕΡΓΑΣΙΑΙ ΜΗΧΑΝΙΚΟΥ ΚΑΙ ΕΚΔΟΣΗ ΕΓΡΑΦΩΝ",
    works: [],
    fee: "",
    fee_note: "ΕΥΡΩ ΕΚΤΟΣ ΦΠΑ",
    installments: "",
    bank_name: "",
    bank_iban: "",
    closing: "",
  };
}

export function normalize(doc) {
  const out = { ...emptyDoc(), ...(doc || {}) };
  if (!Array.isArray(out.works)) out.works = [];
  return out;
}

export function listDocs() {
  return db.list(COL)
    .map(normalize)
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
}

export function getDoc(id) {
  const d = db.get(COL, id);
  return d ? normalize(d) : null;
}

export function addDoc(data) {
  return db.add(COL, normalize(data));
}
export function updateDoc(id, data) {
  return db.update(COL, id, normalize(data));
}
export function removeDoc(id) {
  return db.remove(COL, id);
}
export function clearDocs() {
  return db.clear(COL);
}

export function docsJSON() {
  return JSON.stringify(db.list(COL), null, 2);
}

export function label(doc) {
  return [doc.protocol, doc.recipient].filter(Boolean).join(" · ") || "Χωρίς τίτλο";
}

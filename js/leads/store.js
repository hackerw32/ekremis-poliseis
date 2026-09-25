import * as db from "../core/db.js";

const COL = "leads";

export function emptyLead() {
  return {
    created: "",
    name: "",
    phone: "",
    email: "",
    consent: "",
    wants: "",
    search_type: "",
    property_type: "",
    area: "Σαλαμίνα",
    price_min: null,
    price_max: null,
    price_text: "",
    sqm_min: null,
    sqm_max: null,
    sqm_text: "",
    status: "Νέο",
    source: "Χειροκίνητη",
    notes: "",
    proposal_sent: false,
    proposal_sent_at: "",
    proposal_count: 0,
    last_contact: "",
  };
}

export function normalize(l) {
  return { ...emptyLead(), ...(l || {}) };
}

export function listLeads() {
  return db.list(COL).map(normalize);
}

export function getLead(id) {
  const l = db.get(COL, id);
  return l ? normalize(l) : null;
}

export function addLead(data) {
  return db.add(COL, normalize(data));
}
export function updateLead(id, data) {
  return db.update(COL, id, data);
}
export function removeLead(id) {
  return db.remove(COL, id);
}
export function clearLeads() {
  return db.clear(COL);
}

export function leadsJSON() {
  return JSON.stringify(listLeads(), null, 2);
}

function dedupeKey(l) {
  return `${(l.phone || "").replace(/\D/g, "")}|${(l.email || "").toLowerCase()}|${(l.wants || "").toLowerCase()}`;
}

export function leadKey(l) {
  return dedupeKey(l);
}

export async function markProposals(ids, fields) {
  for (const id of ids) {
    // eslint-disable-next-line no-await-in-loop
    await db.update(COL, id, fields);
  }
}

export async function importLeads(leads, { replace = false } = {}) {
  if (replace) {
    await db.replaceAll(COL, leads);
    return leads.length;
  }
  const existing = new Set(listLeads().map(dedupeKey));
  const fresh = [];
  for (const l of leads) {
    const key = dedupeKey(l);
    if (existing.has(key)) continue;
    existing.add(key);
    fresh.push(normalize(l));
  }
  await db.addMany(COL, fresh);
  return fresh.length;
}

export function statusCounts() {
  const counts = {};
  listLeads().forEach((l) => {
    counts[l.status] = (counts[l.status] || 0) + 1;
  });
  return counts;
}

export const LEAD_STATUSES = ["Νέο", "Σε επικοινωνία", "Ταιριάστηκε", "Ολοκληρώθηκε", "Ακυρώθηκε"];

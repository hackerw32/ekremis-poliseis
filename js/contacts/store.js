// Ενοποίηση στοιχείων πελάτη/συνεργάτη από όλες τις εφαρμογές.
import * as db from "../core/db.js";
import * as tameio from "../tameio/store.js";
import { deburr } from "../utils.js";

export const KIND = { client: "client", partner: "partner" };

export function listPeople(kind) {
  return kind === "partner" ? tameio.partners() : tameio.clients();
}

export function getPerson(kind, id) {
  const list = db.list(kind === "partner" ? tameio.C.partners : tameio.C.clients);
  return list.find((p) => p.id === id) || null;
}

export function addPerson(kind, data) {
  return kind === "partner" ? tameio.addPartner(data) : tameio.addClient(data);
}
export function updatePerson(kind, id, data) {
  return kind === "partner" ? tameio.updatePartner(id, data) : tameio.updateClient(id, data);
}
export function removePerson(kind, id) {
  return kind === "partner" ? tameio.removePartner(id) : tameio.removeClient(id);
}

function personKeys(person) {
  return {
    name: deburr(person.name || ""),
    phone: String(person.phone || "").replace(/\D/g, ""),
    email: String(person.email || "").toLowerCase(),
  };
}

export function ledger(kind, id) {
  const txns = tameio
    .transactions()
    .filter((t) => (kind === "partner" ? t.partner_id : t.client_id) === id)
    .map((t) => ({ ...t, job_label: tameio.jobLabel(t.job_id) }));

  const jobs = tameio
    .jobsWithMetrics()
    .filter((j) => (kind === "partner" ? j.partner_id : j.client_id) === id)
    .map((j) => ({ ...j, pending: kind === "partner" ? j.partner_pending : j.client_pending }));

  const direction = kind === "partner" ? "Έξοδο" : "Έσοδο";
  const total = txns.filter((t) => t.txn_type === direction).reduce((a, t) => a + (Number(t.amount) || 0), 0);
  const owed = jobs.reduce((a, j) => a + (j.pending || 0), 0);
  return { txns, jobs, total, owed };
}

export function allObligations(kind) {
  return tameio
    .jobsWithMetrics()
    .map((j) => ({ ...j, pending: kind === "partner" ? j.partner_pending : j.client_pending }))
    .filter((j) => j.pending > 0.004);
}

export function totalObligations(kind) {
  return allObligations(kind).reduce((a, j) => a + j.pending, 0);
}

export function obligationsFor(kind, id) {
  return allObligations(kind).filter((j) => (kind === "partner" ? j.partner_id : j.client_id) === id);
}

// Συσχέτιση με ενδιαφερόμενους (leads)
export function relatedLeads(person) {
  const k = personKeys(person);
  return db.list("leads").filter((l) => {
    if (k.phone && String(l.phone || "").replace(/\D/g, "") === k.phone) return true;
    if (k.email && String(l.email || "").toLowerCase() === k.email) return true;
    if (k.name && deburr(l.name || "").includes(k.name)) return true;
    return false;
  });
}

// Συσχέτιση με υποθέσεις πωλήσεων (από επαφές/ρόλους)
export function relatedProperties(person) {
  const k = personKeys(person);
  return db.list("properties").filter((p) => {
    const hay = deburr([
      p.seller, p.buyer, p.sellerPhone, p.buyerPhone,
      (p.contacts || []).map((c) => `${c.name} ${c.phone} ${c.role}`).join(" "),
      (p.interested || []).map((c) => `${c.name} ${c.phone}`).join(" "),
    ].filter(Boolean).join(" "));
    return (k.name && k.name.length > 2 && hay.includes(k.name)) || (k.phone && hay.replace(/\D/g, "").includes(k.phone));
  });
}

export function personHaystack(person) {
  return deburr(`${person.name} ${person.phone} ${person.tax_id || ""} ${person.email || ""} ${person.address || ""} ${person.specialty || ""} ${person.notes || ""}`);
}

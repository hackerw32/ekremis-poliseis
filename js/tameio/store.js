import * as db from "../core/db.js";
import { sum } from "../utils.js";

export const C = {
  clients: "tameio_clients",
  partners: "tameio_partners",
  jobs: "tameio_jobs",
  transactions: "tameio_transactions",
};

export function clients() {
  return db.list(C.clients).slice().sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "el"));
}
export function partners() {
  return db.list(C.partners).slice().sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "el"));
}
export function jobs() {
  return db.list(C.jobs).slice().sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}
export function transactions() {
  return db.list(C.transactions).slice().sort((a, b) => {
    const d = String(b.txn_date || "").localeCompare(String(a.txn_date || ""));
    if (d !== 0) return d;
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
}

export function clientName(id) {
  const c = db.get(C.clients, id);
  return c ? c.name : "";
}
export function partnerName(id) {
  const p = db.get(C.partners, id);
  return p ? p.name : "";
}
export function jobLabel(id) {
  const j = db.get(C.jobs, id);
  if (!j) return "";
  return [j.protocol_number, j.title].filter(Boolean).join(" · ");
}

// CRUD
export const addClient = (d) => db.add(C.clients, d);
export const updateClient = (id, d) => db.update(C.clients, id, d);
export const removeClient = (id) => db.remove(C.clients, id);

export const addPartner = (d) => db.add(C.partners, d);
export const updatePartner = (id, d) => db.update(C.partners, id, d);
export const removePartner = (id) => db.remove(C.partners, id);

export const addJob = (d) => db.add(C.jobs, d);
export const updateJob = (id, d) => db.update(C.jobs, id, d);
export const removeJob = (id) => db.remove(C.jobs, id);

export const addTransaction = (d) => db.add(C.transactions, d);
export const updateTransaction = (id, d) => db.update(C.transactions, id, d);
export const removeTransaction = (id) => db.remove(C.transactions, id);

export function clientTxnCount(id) {
  return db.list(C.transactions).filter((t) => t.client_id === id).length;
}
export function partnerTxnCount(id) {
  return db.list(C.transactions).filter((t) => t.partner_id === id).length;
}
export function jobTxnCount(id) {
  return db.list(C.transactions).filter((t) => t.job_id === id);
}

export function jobMetrics(jobId, txnList) {
  const list = txnList || db.list(C.transactions);
  let received = 0;
  let paidOut = 0;
  let partnerPaid = 0;
  list.forEach((t) => {
    if (t.job_id !== jobId) return;
    const amt = Number(t.amount) || 0;
    if (t.txn_type === "Έσοδο") received += amt;
    else {
      paidOut += amt;
      if (t.partner_id) partnerPaid += amt;
    }
  });
  return { received, paidOut, partnerPaid };
}

export function jobsWithMetrics() {
  const txnList = db.list(C.transactions);
  return jobs().map((j) => {
    const m = jobMetrics(j.id, txnList);
    const agreed = Number(j.agreed_fee) || 0;
    const partnerFee = Number(j.partner_fee) || 0;
    return {
      ...j,
      client_name: clientName(j.client_id),
      partner_name: partnerName(j.partner_id),
      received: m.received,
      paid_out: m.paidOut,
      partner_paid: m.partnerPaid,
      client_pending: Math.max(0, agreed - m.received),
      partner_pending: Math.max(0, partnerFee - m.partnerPaid),
    };
  });
}

export function exportJSON() {
  return JSON.stringify(
    {
      clients: db.list(C.clients),
      partners: db.list(C.partners),
      jobs: db.list(C.jobs),
      transactions: db.list(C.transactions),
    },
    null,
    2
  );
}

export async function importJSON(obj) {
  if (Array.isArray(obj.clients)) await db.replaceAll(C.clients, obj.clients);
  if (Array.isArray(obj.partners)) await db.replaceAll(C.partners, obj.partners);
  if (Array.isArray(obj.jobs)) await db.replaceAll(C.jobs, obj.jobs);
  if (Array.isArray(obj.transactions)) await db.replaceAll(C.transactions, obj.transactions);
}

export async function clearAll() {
  await db.clear(C.transactions);
  await db.clear(C.jobs);
  await db.clear(C.partners);
  await db.clear(C.clients);
}

export { sum };

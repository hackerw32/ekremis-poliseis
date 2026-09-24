import * as store from "./store.js";
import { C } from "./store.js";
import * as db from "../core/db.js";
import { deburr, parseDate } from "../utils.js";

export function totals(dateFrom = "", dateTo = "") {
  let income = 0;
  let expense = 0;
  let count = 0;
  store.transactions().forEach((t) => {
    if (dateFrom && String(t.txn_date || "") < dateFrom) return;
    if (dateTo && String(t.txn_date || "") > dateTo) return;
    count += 1;
    const amt = Number(t.amount) || 0;
    if (t.txn_type === "Έσοδο") income += amt;
    else expense += amt;
  });
  return { income, expense, balance: income - expense, count };
}

export function recentTransactions(limit = 12) {
  return store.transactions().slice(0, limit).map(expand);
}

function expand(t) {
  return {
    ...t,
    client_name: store.clientName(t.client_id),
    partner_name: store.partnerName(t.partner_id),
    job_label: store.jobLabel(t.job_id),
  };
}

export function pendingToPartners() {
  return store.jobsWithMetrics().filter((j) => j.partner_pending > 0.004);
}

export function pendingFromClients() {
  return store.jobsWithMetrics().filter((j) => j.client_pending > 0.004);
}

export function pendingTotals() {
  const toPartners = pendingToPartners();
  const fromClients = pendingFromClients();
  return {
    to_partners: toPartners.reduce((a, j) => a + j.partner_pending, 0),
    from_clients: fromClients.reduce((a, j) => a + j.client_pending, 0),
    partner_jobs: toPartners.length,
    client_jobs: fromClients.length,
  };
}

export function partyBalances() {
  const txns = db.list(C.transactions);
  const clients = store.clients().map((c) => {
    const list = txns.filter((t) => t.client_id === c.id);
    return {
      id: c.id,
      name: c.name,
      total_in: list.filter((t) => t.txn_type === "Έσοδο").reduce((a, t) => a + (Number(t.amount) || 0), 0),
      txn_count: list.length,
    };
  }).sort((a, b) => b.total_in - a.total_in);

  const partners = store.partners().map((p) => {
    const list = txns.filter((t) => t.partner_id === p.id);
    return {
      id: p.id,
      name: p.name,
      specialty: p.specialty,
      total_out: list.filter((t) => t.txn_type === "Έξοδο").reduce((a, t) => a + (Number(t.amount) || 0), 0),
      txn_count: list.length,
    };
  }).sort((a, b) => b.total_out - a.total_out);

  return { clients, partners };
}

export function monthlySeries(months = 6) {
  const today = new Date();
  const wanted = [];
  let y = today.getFullYear();
  let m = today.getMonth() + 1;
  for (let i = 0; i < months; i++) {
    wanted.push(`${y}-${String(m).padStart(2, "0")}`);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  wanted.reverse();

  const map = {};
  wanted.forEach((k) => (map[k] = { month: k, income: 0, expense: 0 }));
  db.list(C.transactions).forEach((t) => {
    const key = String(t.txn_date || "").slice(0, 7);
    if (!map[key]) return;
    const amt = Number(t.amount) || 0;
    if (t.txn_type === "Έσοδο") map[key].income += amt;
    else map[key].expense += amt;
  });
  return wanted.map((k) => map[k]);
}

export function filterTransactions({ query = "", type = "", dateFrom = "", dateTo = "" }) {
  const q = deburr(query).trim();
  return store.transactions().map(expand).filter((t) => {
    if (type && t.txn_type !== type) return false;
    if (dateFrom && String(t.txn_date || "") < dateFrom) return false;
    if (dateTo && String(t.txn_date || "") > dateTo) return false;
    if (q) {
      const hay = deburr(`${t.description} ${t.notes} ${t.category} ${t.payment_method} ${t.client_name} ${t.partner_name} ${t.job_label} ${t.txn_date} ${t.amount}`);
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function filterJobs({ query = "", status = "" }) {
  const q = deburr(query).trim();
  return store.jobsWithMetrics().filter((j) => {
    if (status && j.status !== status) return false;
    if (q) {
      const hay = deburr(`${j.protocol_number} ${j.title} ${j.owner} ${j.location} ${j.client_name} ${j.partner_name}`);
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function filterPeople(kind, query = "") {
  const q = deburr(query).trim();
  const list = kind === "partner" ? store.partners() : store.clients();
  if (!q) return list;
  return list.filter((p) =>
    deburr(`${p.name} ${p.phone} ${p.tax_id} ${p.address || ""} ${p.specialty || ""}`).includes(q)
  );
}

export function partyHistory(kind, id) {
  const key = kind === "partner" ? "partner_id" : "client_id";
  return store.transactions().filter((t) => t[key] === id).map(expand);
}

export { parseDate };

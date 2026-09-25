// Γρήγορος διακανονισμός υποχρεώσεων με ένα κλικ.
import * as store from "./store.js";
import { confirmDialog } from "../modal.js";
import { toast } from "../toast.js";
import { formatCurrency, todayISO } from "../utils.js";

export async function settlePartner(job) {
  const pending = Number(job.partner_pending) || 0;
  if (pending <= 0.004) return false;
  const name = job.partner_name || "τον συνεργάτη";
  const label = job.protocol_number ? `υπόθεση ${job.protocol_number}` : (job.title || "υπόθεση");
  const ok = await confirmDialog(
    `Καταχώρηση πληρωμής ${formatCurrency(pending)} στον/στην ${name} για την ${label};`,
    { confirmText: "Πληρώθηκε", danger: false }
  );
  if (!ok) return false;
  await store.addTransaction({
    txn_date: todayISO(),
    txn_type: "Έξοδο",
    amount: pending,
    job_id: job.id,
    partner_id: job.partner_id || null,
    client_id: null,
    category: "Αμοιβή συνεργάτη",
    payment_method: "",
    receipt_issued: false,
    description: `Αμοιβή συνεργάτη — ${job.protocol_number || job.title || ""}`.trim(),
    notes: "",
  });
  toast(`Πληρώθηκε ${formatCurrency(pending)} — έκλεισε η εκκρεμότητα`, "ok");
  return true;
}

export async function settleClient(job) {
  const pending = Number(job.client_pending) || 0;
  if (pending <= 0.004) return false;
  const name = job.client_name || "τον πελάτη";
  const label = job.protocol_number ? `υπόθεση ${job.protocol_number}` : (job.title || "υπόθεση");
  const ok = await confirmDialog(
    `Καταχώρηση είσπραξης ${formatCurrency(pending)} από ${name} για την ${label};`,
    { confirmText: "Εισπράχθηκε", danger: false }
  );
  if (!ok) return false;
  await store.addTransaction({
    txn_date: todayISO(),
    txn_type: "Έσοδο",
    amount: pending,
    job_id: job.id,
    client_id: job.client_id || null,
    partner_id: null,
    category: "Αμοιβή τεχνικού ελέγχου",
    payment_method: "",
    receipt_issued: false,
    description: `Είσπραξη — ${job.protocol_number || job.title || ""}`.trim(),
    notes: "",
  });
  toast(`Εισπράχθηκε ${formatCurrency(pending)} — έκλεισε η εκκρεμότητα`, "ok");
  return true;
}

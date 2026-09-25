import { filterJobs } from "./insights.js";
import { JOB_STATUSES } from "./constants.js";
import { formatCurrency, formatDate, escapeHtml } from "../utils.js";

function statusCls(s) {
  return { "Εκκρεμεί": "st-anamoni", "Σε εξέλιξη": "st-ekkremotita", "Ολοκληρώθηκε": "st-ok", "Ακυρώθηκε": "st-akyro" }[s] || "st-akyro";
}

export function viewJobs(ctx) {
  const cur = ctx.currency;
  const f = ctx.tameio;
  const list = filterJobs({ query: ctx.ui.query, status: f.jobStatus });

  const cards = list.length
    ? list.map((j) => `
        <article class="card" data-tameio="job" data-id="${escapeHtml(j.id)}" style="cursor:pointer">
          <div class="card-top">
            <div style="min-width:0">
              <span class="card-code">${escapeHtml(j.protocol_number || "—")}</span>
              <h3 class="card-title">${escapeHtml(j.title || j.owner || "Υπόθεση")}</h3>
            </div>
            <span class="pill ${statusCls(j.status)}">${escapeHtml(j.status || "—")}</span>
          </div>
          <div class="card-meta">
            ${j.owner ? `<div class="row"><span class="k">Ιδιοκτήτης</span><span class="v">${escapeHtml(j.owner)}</span></div>` : ""}
            ${j.location ? `<div class="row"><span class="k">Τοποθεσία</span><span class="v">${escapeHtml(j.location)}</span></div>` : ""}
            ${j.client_name ? `<div class="row"><span class="k">Πελάτης</span><span class="v">${escapeHtml(j.client_name)}</span></div>` : ""}
            ${j.partner_name ? `<div class="row"><span class="k">Συνεργάτης</span><span class="v">${escapeHtml(j.partner_name)}</span></div>` : ""}
          </div>
          <div class="tags">
            <span class="tag-mini">Παίρνουμε ${formatCurrency(j.agreed_fee, cur)}</span>
            <span class="tag-mini">Δίνουμε ${formatCurrency(j.partner_fee, cur)}</span>
            <span class="tag-mini" style="background:var(--success-soft);color:var(--success)">Καθαρό ${formatCurrency((Number(j.agreed_fee) || 0) - (Number(j.partner_fee) || 0), cur)}</span>
            ${j.client_pending > 0.004 ? `<span class="tag-mini" style="background:var(--purple-soft);color:var(--purple)">Να εισπράξουμε: ${formatCurrency(j.client_pending, cur)}</span>` : ""}
            ${j.partner_pending > 0.004 ? `<span class="tag-mini" style="background:var(--danger-soft);color:var(--danger)">Να πληρώσουμε: ${formatCurrency(j.partner_pending, cur)}</span>` : ""}
          </div>
          <div class="card-foot">
            <div class="pill-row">
              <button class="mini-btn" data-tameio-action="job-income" data-id="${escapeHtml(j.id)}">＋ Είσπραξη</button>
              <button class="mini-btn" data-tameio-action="job-expense" data-id="${escapeHtml(j.id)}">＋ Πληρωμή</button>
            </div>
            ${j.opened_date ? `<span class="text-muted" style="font-size:12px">${escapeHtml(formatDate(j.opened_date))}</span>` : ""}
          </div>
        </article>`).join("")
    : `<div class="empty" style="grid-column:1/-1"><span class="big">📁</span>Δεν βρέθηκαν υποθέσεις</div>`;

  return `
    <div class="view-head">
      <div><h1>Υποθέσεις (Α/Π)</h1><p>${list.length} υποθέσεις</p></div>
      <button class="btn primary" data-tameio-action="add-job">＋ Νέα υπόθεση</button>
    </div>
    <div class="toolbar">
      <select class="select" data-tameio-filter="jobStatus">
        <option value="" ${!f.jobStatus ? "selected" : ""}>Όλες οι καταστάσεις</option>
        ${JOB_STATUSES.map((s) => `<option value="${escapeHtml(s)}" ${f.jobStatus === s ? "selected" : ""}>${escapeHtml(s)}</option>`).join("")}
      </select>
    </div>
    <div class="cards">${cards}</div>
  `;
}

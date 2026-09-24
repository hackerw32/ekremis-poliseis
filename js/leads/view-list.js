import * as store from "./store.js";
import { LEAD_STATUSES } from "./store.js";
import { SEARCH_TYPES } from "./parse.js";
import { matchLead } from "./match.js";
import * as db from "../core/db.js";
import { deburr, formatCurrency, escapeHtml } from "../utils.js";

function summary(l, cur) {
  const bits = [];
  if (l.search_type) bits.push(l.search_type);
  if (l.property_type) bits.push(l.property_type);
  if (l.area) bits.push(l.area);
  if (l.price_max) bits.push("έως " + formatCurrency(l.price_max, cur));
  if (l.sqm_max) bits.push(`${l.sqm_min || ""}${l.sqm_max !== l.sqm_min ? "-" + l.sqm_max : ""} τ.μ.`);
  return bits.join(" · ");
}

function statusPill(s) {
  const map = { "Νέο": "st-anamoni", "Σε επικοινωνία": "st-ekkremotita", "Ταιριάστηκε": "st-ok", "Ολοκληρώθηκε": "st-ok", "Ακυρώθηκε": "st-akyro" };
  return `<span class="pill ${map[s] || "st-akyro"}">${escapeHtml(s || "—")}</span>`;
}

export function viewLeads(ctx) {
  const cur = ctx.currency;
  const q = deburr(ctx.ui.query).trim();
  const f = ctx.leads;
  const props = db.list("properties");

  let list = store.listLeads();
  if (f.search_type) list = list.filter((l) => l.search_type === f.search_type);
  if (f.status) list = list.filter((l) => l.status === f.status);
  if (q) {
    list = list.filter((l) =>
      deburr(`${l.name} ${l.phone} ${l.email} ${l.wants} ${l.property_type} ${l.area} ${l.notes}`).includes(q)
    );
  }
  list = list.slice().sort((a, b) => String(b.created || b.updatedAt || "").localeCompare(String(a.created || a.updatedAt || "")));

  const rows = list.length
    ? list.map((l) => {
        const m = matchLead(l, props, { minScore: 30, limit: 999 });
        const badge = m.length ? `<span class="tag-mini" style="background:var(--success-soft);color:var(--success)">🎯 ${m.length}</span>` : "";
        return `
          <div class="trow">
            <span class="t-badge out">👤</span>
            <div class="t-main" data-lead="open" data-id="${escapeHtml(l.id)}" style="cursor:pointer">
              <div class="t-title">${escapeHtml(l.name || "Χωρίς όνομα")} ${badge}</div>
              <div class="t-sub">
                ${l.phone ? escapeHtml(l.phone) + " · " : ""}${escapeHtml(summary(l, cur))}
              </div>
            </div>
            ${statusPill(l.status)}
          </div>`;
      }).join("")
    : `<div class="empty"><span class="big">🎯</span>Δεν βρέθηκαν ενδιαφερόμενοι</div>`;

  const counts = store.statusCounts();
  const total = store.listLeads().length;

  return `
    <div class="view-head">
      <div><h1>Ενδιαφερόμενοι</h1><p>${list.length} από ${total} · ${counts["Νέο"] || 0} νέοι</p></div>
      <div class="pill-row">
        <a class="btn" href="#/leads/import">📥 Εισαγωγή</a>
        <button class="btn primary" data-lead-action="add">＋ Νέος</button>
      </div>
    </div>
    <div class="toolbar">
      <button class="chip ${!f.search_type ? "active" : ""}" data-lead-filter="search_type" data-value="">Όλοι</button>
      ${SEARCH_TYPES.map((s) => `<button class="chip ${f.search_type === s ? "active" : ""}" data-lead-filter="search_type" data-value="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join("")}
      <span class="spacer"></span>
      <select class="select" data-lead-filter="status">
        <option value="">Όλες οι καταστάσεις</option>
        ${LEAD_STATUSES.map((s) => `<option value="${escapeHtml(s)}" ${f.status === s ? "selected" : ""}>${escapeHtml(s)}</option>`).join("")}
      </select>
    </div>
    <div class="tlist">${rows}</div>
  `;
}

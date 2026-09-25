import * as store from "./store.js";
import { LEAD_STATUSES } from "./store.js";
import { SEARCH_TYPES } from "./parse.js";
import { matchLead } from "./match.js";
import * as db from "../core/db.js";
import { catalog } from "../aggelies/store.js";
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
  const props = catalog(db.list("properties"));
  const selected = new Set(f.selected || []);

  let list = store.listLeads();
  if (f.search_type) list = list.filter((l) => l.search_type === f.search_type);
  if (f.status) list = list.filter((l) => l.status === f.status);
  if (f.proposal === "sent") list = list.filter((l) => l.proposal_sent);
  if (f.proposal === "not") list = list.filter((l) => !l.proposal_sent);
  if (q) {
    list = list.filter((l) =>
      deburr(`${l.name} ${l.phone} ${l.email} ${l.wants} ${l.property_type} ${l.area} ${l.notes}`).includes(q)
    );
  }
  list = list.slice().sort((a, b) => String(b.created || b.updatedAt || "").localeCompare(String(a.created || a.updatedAt || "")));

  const rows = list.length
    ? list.map((l) => {
        const m = matchLead(l, props, { minScore: 30, limit: 999 });
        const badges = [];
        if (m.length) badges.push(`<span class="tag-mini" style="background:var(--success-soft);color:var(--success)">🎯 ${m.length}</span>`);
        if (l.proposal_sent) badges.push(`<span class="tag-mini" style="background:var(--primary-soft);color:var(--primary)">✉️ στάλθηκε</span>`);
        return `
          <div class="trow">
            <input type="checkbox" class="lead-check" data-lead-select="${escapeHtml(l.id)}" ${selected.has(l.id) ? "checked" : ""} title="Επιλογή" />
            <span class="t-badge out">👤</span>
            <div class="t-main" data-lead="open" data-id="${escapeHtml(l.id)}" style="cursor:pointer">
              <div class="t-title">${escapeHtml(l.name || "Χωρίς όνομα")} ${badges.join(" ")}</div>
              <div class="t-sub">${escapeHtml(l.phone || "")}${l.phone ? " · " : ""}${escapeHtml(summary(l, cur))}</div>
            </div>
            ${statusPill(l.status)}
          </div>`;
      }).join("")
    : `<div class="empty"><span class="big">🎯</span>Δεν βρέθηκαν ενδιαφερόμενοι</div>`;

  const counts = store.statusCounts();
  const total = store.listLeads().length;
  const sel = [...selected];

  const newBanner = f.newCount
    ? `<div class="bulkbar" style="background:var(--warn-soft);border-color:color-mix(in srgb,var(--warn) 35%, var(--border))">
        🔔 <b>${f.newCount}</b> νέα αιτήματα από τη φόρμα!
        <span class="spacer"></span>
        <button class="btn sm primary" data-lead-action="import-new">⬆️ Εισαγωγή</button>
        <button class="btn sm" data-lead-action="dismiss-new">Αγνόηση</button>
      </div>`
    : "";

  const bulkBar = sel.length
    ? `<div class="bulkbar">
        <b>${sel.length}</b> επιλεγμένα
        <span class="spacer"></span>
        <button class="btn sm" data-lead-action="bulk-proposal">✉️ Στάλθηκε πρόταση</button>
        <button class="btn sm" data-lead-action="bulk-served">✅ Εξυπηρετήθηκαν</button>
        <button class="btn sm" data-lead-action="bulk-new">↩️ Νέο</button>
        <button class="btn sm danger" data-lead-action="bulk-delete">🗑️</button>
        <button class="btn sm" data-lead-action="bulk-clear">✖</button>
      </div>`
    : "";

  return `
    <div class="view-head">
      <div><h1>Ενδιαφερόμενοι</h1><p>${list.length} από ${total} · ${counts["Νέο"] || 0} νέοι · ${store.listLeads().filter((l) => !l.proposal_sent).length} χωρίς πρόταση</p></div>
      <div class="pill-row">
        <a class="btn" href="#/leads/import">📥 Εισαγωγή</a>
        <button class="btn primary" data-lead-action="add">＋ Νέος</button>
      </div>
    </div>
    ${newBanner}
    ${bulkBar}
    <div class="toolbar">
      <button class="chip ${!f.search_type ? "active" : ""}" data-lead-filter="search_type" data-value="">Όλοι</button>
      ${SEARCH_TYPES.map((s) => `<button class="chip ${f.search_type === s ? "active" : ""}" data-lead-filter="search_type" data-value="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join("")}
      <span class="spacer"></span>
      <select class="select" data-lead-filter="proposal">
        <option value="">Όλες οι προτάσεις</option>
        <option value="not" ${f.proposal === "not" ? "selected" : ""}>Χωρίς πρόταση</option>
        <option value="sent" ${f.proposal === "sent" ? "selected" : ""}>Στάλθηκε πρόταση</option>
      </select>
      <select class="select" data-lead-filter="status">
        <option value="">Όλες οι καταστάσεις</option>
        ${LEAD_STATUSES.map((s) => `<option value="${escapeHtml(s)}" ${f.status === s ? "selected" : ""}>${escapeHtml(s)}</option>`).join("")}
      </select>
    </div>
    <div class="tlist">${rows}</div>
  `;
}

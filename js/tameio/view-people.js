import { filterPeople, partyBalances } from "./insights.js";
import { formatCurrency, escapeHtml } from "../utils.js";

export function viewPeople(ctx) {
  const cur = ctx.currency;
  const tab = ctx.tameio.peopleTab || "clients";
  const balances = partyBalances();

  const list = filterPeople(tab === "partners" ? "partner" : "client", ctx.ui.query);
  const totalsMap = {};
  (tab === "partners" ? balances.partners : balances.clients).forEach((b) => {
    totalsMap[b.id] = b;
  });

  const rows = list.length
    ? list.map((p) => {
        const b = totalsMap[p.id] || {};
        const total = tab === "partners" ? b.total_out : b.total_in;
        return `
          <div class="trow">
            <span class="t-badge ${tab === "partners" ? "out" : "in"}">${tab === "partners" ? "👷" : "👤"}</span>
            <div class="t-main" data-tameio="person" data-kind="${tab}" data-id="${escapeHtml(p.id)}" style="cursor:pointer">
              <div class="t-title">${escapeHtml(p.name)}</div>
              <div class="t-sub">
                ${p.specialty ? escapeHtml(p.specialty) + " · " : ""}
                ${p.phone ? escapeHtml(p.phone) + " · " : ""}
                ${p.tax_id ? "ΑΦΜ " + escapeHtml(p.tax_id) : ""}
              </div>
            </div>
            <span class="t-amt">${formatCurrency(total || 0, cur)}</span>
            <span class="text-muted" style="font-size:12px">${b.txn_count || 0} κιν.</span>
            <button class="mini-btn" data-tameio="person-edit" data-kind="${tab}" data-id="${escapeHtml(p.id)}" title="Επεξεργασία">✏️</button>
            <button class="mini-btn danger" data-tameio="person-del" data-kind="${tab}" data-id="${escapeHtml(p.id)}" title="Διαγραφή">🗑️</button>
          </div>`;
      }).join("")
    : `<div class="empty"><span class="big">👥</span>Δεν βρέθηκαν εγγραφές</div>`;

  return `
    <div class="view-head">
      <div><h1>Πελάτες & Συνεργάτες</h1><p>${list.length} εγγραφές</p></div>
      <button class="btn primary" data-tameio-action="${tab === "partners" ? "add-partner" : "add-client"}">＋ ${tab === "partners" ? "Νέος συνεργάτης" : "Νέος πελάτης"}</button>
    </div>
    <div class="toolbar">
      <button class="chip ${tab === "clients" ? "active" : ""}" data-tameio-action="tab-clients">👤 Πελάτες</button>
      <button class="chip ${tab === "partners" ? "active" : ""}" data-tameio-action="tab-partners">👷 Συνεργάτες</button>
    </div>
    <div class="tlist">${rows}</div>
  `;
}

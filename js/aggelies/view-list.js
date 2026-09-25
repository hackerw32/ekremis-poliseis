import { listListings, statusLabel, STATUS, TYPES } from "./store.js";
import { deburr, formatCurrency, escapeHtml } from "../utils.js";

function statusCls(s) {
  return { available: "st-ok", pending: "st-anamoni", sold: "st-akyro", not_sure: "st-ekkremotita" }[s] || "st-akyro";
}

export function viewListings(ctx) {
  const cur = ctx.currency;
  const q = deburr(ctx.ui.query).trim();
  const f = ctx.aggelies;

  let list = listListings();
  if (f.status) list = list.filter((l) => l.status === f.status);
  if (f.type) list = list.filter((l) => l.type === f.type);
  if (q) list = list.filter((l) => deburr(`${l.code} ${l.type} ${l.address} ${l.phone} ${l.notes}`).includes(q));
  list = list.slice().sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

  const rows = list.length
    ? list.map((l) => {
        const ppm = l.price && l.sqm ? Math.round(l.price / l.sqm) : null;
        return `
          <div class="trow">
            <span class="card-code">${escapeHtml(l.code || "—")}</span>
            <div class="t-main" data-agg="open" data-id="${escapeHtml(l.id)}" style="cursor:pointer">
              <div class="t-title">${escapeHtml(l.type || "")}${l.sqm ? " · " + l.sqm + " τ.μ." : ""}</div>
              <div class="t-sub">${escapeHtml(l.address || "")}${l.phone ? " · " + escapeHtml(l.phone) : ""}</div>
            </div>
            <span class="t-amt">${Number(l.price) ? formatCurrency(l.price, cur) : "—"}</span>
            ${ppm ? `<span class="text-muted" style="font-size:12px">${ppm.toLocaleString("el-GR")} €/τμ</span>` : "<span></span>"}
            <span class="pill ${statusCls(l.status)}">${escapeHtml(statusLabel(l.status))}</span>
          </div>`;
      }).join("")
    : `<div class="empty"><span class="big">📢</span>Δεν υπάρχουν αγγελίες</div>`;

  const all = listListings();
  const byStatus = {};
  all.forEach((l) => (byStatus[l.status] = (byStatus[l.status] || 0) + 1));

  return `
    <div class="view-head">
      <div><h1>Αγγελίες</h1><p>${list.length} από ${all.length} · ${byStatus.available || 0} διαθέσιμα · ${byStatus.sold || 0} πωλημένα</p></div>
      <div class="pill-row">
        <a class="btn" href="#/aggelies/settings">⚙️ Εισαγωγή/Δεδομένα</a>
        <button class="btn primary" data-agg-action="add">＋ Νέα αγγελία</button>
      </div>
    </div>
    <div class="toolbar">
      <button class="chip ${!f.status ? "active" : ""}" data-agg-filter="status" data-value="">Όλες</button>
      ${Object.keys(STATUS).map((s) => `<button class="chip ${f.status === s ? "active" : ""}" data-agg-filter="status" data-value="${s}">${escapeHtml(STATUS[s])}</button>`).join("")}
      <span class="spacer"></span>
      <select class="select" data-agg-filter="type">
        <option value="">Όλοι οι τύποι</option>
        ${TYPES.map((t) => `<option value="${escapeHtml(t)}" ${f.type === t ? "selected" : ""}>${escapeHtml(t)}</option>`).join("")}
      </select>
    </div>
    <div class="tlist">${rows}</div>
  `;
}

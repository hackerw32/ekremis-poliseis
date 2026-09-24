import { listDocs, label } from "./store.js";
import { formatDate, escapeHtml, deburr } from "../utils.js";

export function viewList(ctx) {
  const q = deburr(ctx.ui.query).trim();
  const all = listDocs();
  const docs = q
    ? all.filter((d) => deburr(`${d.protocol} ${d.recipient} ${d.doc_type} ${d.property_location}`).includes(q))
    : all;

  const rows = docs.length
    ? docs.map((d) => `
        <div class="trow">
          <span class="t-badge out">📄</span>
          <div class="t-main" data-tex="doc" data-id="${escapeHtml(d.id)}" style="cursor:pointer">
            <div class="t-title">${escapeHtml(d.doc_type || "Έγγραφο")}</div>
            <div class="t-sub">
              ${d.protocol ? "Α/Π " + escapeHtml(d.protocol) + " · " : ""}
              ${d.recipient ? escapeHtml(d.recipient) + " · " : ""}
              ${d.property_location ? escapeHtml(d.property_location) + " · " : ""}
              ${d.doc_date ? escapeHtml(formatDate(d.doc_date)) : escapeHtml(formatDate(d.updatedAt))}
            </div>
          </div>
          <button class="mini-btn" data-tex="doc-print" data-id="${escapeHtml(d.id)}" title="Εκτύπωση">🖨️</button>
          <button class="mini-btn danger" data-tex="doc-del" data-id="${escapeHtml(d.id)}" title="Διαγραφή">🗑️</button>
        </div>`).join("")
    : `<div class="empty"><span class="big">📄</span>Δεν υπάρχουν αποθηκευμένα έγγραφα</div>`;

  return `
    <div class="view-head">
      <div><h1>Τεχνικός Έλεγχος — Έγγραφα</h1><p>${docs.length} έγγραφα</p></div>
      <button class="btn primary" data-tex-action="new">＋ Νέος τεχνικός έλεγχος</button>
    </div>
    <div class="tlist">${rows}</div>
  `;
}

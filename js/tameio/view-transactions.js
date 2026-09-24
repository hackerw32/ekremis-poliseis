import { filterTransactions, totals } from "./insights.js";
import { formatCurrency, formatDate, escapeHtml } from "../utils.js";

export function viewTransactions(ctx) {
  const cur = ctx.currency;
  const f = ctx.tameio;
  const list = filterTransactions({ query: ctx.ui.query, type: f.type, dateFrom: f.dateFrom, dateTo: f.dateTo });
  const t = totals(f.dateFrom, f.dateTo);

  const rows = list.length
    ? list.map((x) => `
        <div class="trow">
          <span class="t-badge ${x.txn_type === "Έσοδο" ? "in" : "out"}">${x.txn_type === "Έσοδο" ? "＋" : "－"}</span>
          <div class="t-main" data-tameio="txn" data-id="${escapeHtml(x.id)}" style="cursor:pointer">
            <div class="t-title">${escapeHtml(x.description || x.category || x.txn_type)}</div>
            <div class="t-sub">
              ${escapeHtml(formatDate(x.txn_date))}
              ${x.category ? " · " + escapeHtml(x.category) : ""}
              ${x.payment_method ? " · " + escapeHtml(x.payment_method) : ""}
              ${x.receipt_issued ? " · 🧾 απόδειξη" : ""}
              ${x.client_name ? " · 👤 " + escapeHtml(x.client_name) : ""}
              ${x.partner_name ? " · 👷 " + escapeHtml(x.partner_name) : ""}
              ${x.job_label ? " · 📁 " + escapeHtml(x.job_label) : ""}
            </div>
          </div>
          <span class="t-amt ${x.txn_type === "Έσοδο" ? "pos" : "neg"}">${formatCurrency(x.amount, cur)}</span>
          <button class="mini-btn" data-tameio="txn" data-id="${escapeHtml(x.id)}" title="Επεξεργασία">✏️</button>
          <button class="mini-btn danger" data-tameio="txn-del" data-id="${escapeHtml(x.id)}" title="Διαγραφή">🗑️</button>
        </div>`).join("")
    : `<div class="empty"><span class="big">🧾</span>Δεν βρέθηκαν κινήσεις</div>`;

  return `
    <div class="view-head">
      <div><h1>Συναλλαγές</h1><p>${list.length} κινήσεις · Έσοδα ${formatCurrency(t.income, cur)} · Έξοδα ${formatCurrency(t.expense, cur)} · Υπόλοιπο ${formatCurrency(t.balance, cur)}</p></div>
      <div class="pill-row">
        <button class="btn" data-tameio-action="add-txn-income">＋ Είσπραξη</button>
        <button class="btn primary" data-tameio-action="add-txn-expense">＋ Πληρωμή</button>
      </div>
    </div>

    <div class="toolbar">
      <select class="select" data-tameio-filter="type">
        <option value="" ${!f.type ? "selected" : ""}>Όλοι οι τύποι</option>
        <option value="Έσοδο" ${f.type === "Έσοδο" ? "selected" : ""}>Έσοδα</option>
        <option value="Έξοδο" ${f.type === "Έξοδο" ? "selected" : ""}>Έξοδα</option>
      </select>
      <input class="input" type="date" data-tameio-filter="dateFrom" value="${escapeHtml(f.dateFrom)}" style="width:auto" />
      <span class="text-muted">έως</span>
      <input class="input" type="date" data-tameio-filter="dateTo" value="${escapeHtml(f.dateTo)}" style="width:auto" />
      <span class="spacer"></span>
      <button class="chip" data-tameio-action="txn-clear-filters">Καθαρισμός</button>
    </div>

    <div class="tlist">${rows}</div>
  `;
}

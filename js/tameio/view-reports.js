import { totals, filterTransactions, partyBalances } from "./insights.js";
import { formatCurrency, formatDate, escapeHtml } from "../utils.js";

export function viewReports(ctx) {
  const cur = ctx.currency;
  const f = ctx.tameio;
  const t = totals(f.dateFrom, f.dateTo);
  const txns = filterTransactions({ type: f.type, dateFrom: f.dateFrom, dateTo: f.dateTo });
  const balances = partyBalances();
  const incomeByClient = {};
  const expenseByPartner = {};
  txns.forEach((x) => {
    const amt = Number(x.amount) || 0;
    if (x.txn_type === "Έσοδο" && x.client_name) incomeByClient[x.client_name] = (incomeByClient[x.client_name] || 0) + amt;
    if (x.txn_type === "Έξοδο" && x.partner_name) expenseByPartner[x.partner_name] = (expenseByPartner[x.partner_name] || 0) + amt;
  });

  const table = (obj) => {
    const entries = Object.entries(obj).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return '<div class="text-muted" style="padding:8px 0">—</div>';
    return entries.map(([name, val]) => `
      <div class="debt"><span class="d-label">${escapeHtml(name)}</span><span class="d-amt">${formatCurrency(val, cur)}</span></div>`).join("");
  };

  const rows = txns.map((x) => `
    <tr>
      <td>${escapeHtml(formatDate(x.txn_date))}</td>
      <td>${escapeHtml(x.txn_type)}</td>
      <td>${escapeHtml(x.category || "")}</td>
      <td>${escapeHtml(x.description || "")}</td>
      <td>${escapeHtml(x.client_name || x.partner_name || x.job_label || "")}</td>
      <td class="num">${formatCurrency(x.amount, cur)}</td>
    </tr>`).join("");

  return `
    <div class="view-head">
      <div><h1>Αναφορές</h1><p>Σύνολα και ανάλυση ανά περίοδο</p></div>
      <div class="pill-row">
        <button class="btn" data-tameio-action="report-csv">⬇️ Excel (CSV)</button>
        <button class="btn primary" data-tameio-action="report-print">🖨️ Εκτύπωση / PDF</button>
      </div>
    </div>

    <div class="toolbar">
      <input class="input" type="date" data-tameio-filter="dateFrom" value="${escapeHtml(f.dateFrom)}" style="width:auto" />
      <span class="text-muted">έως</span>
      <input class="input" type="date" data-tameio-filter="dateTo" value="${escapeHtml(f.dateTo)}" style="width:auto" />
      <select class="select" data-tameio-filter="type">
        <option value="" ${!f.type ? "selected" : ""}>Όλοι οι τύποι</option>
        <option value="Έσοδο" ${f.type === "Έσοδο" ? "selected" : ""}>Έσοδα</option>
        <option value="Έξοδο" ${f.type === "Έξοδο" ? "selected" : ""}>Έξοδα</option>
      </select>
      <button class="chip" data-tameio-action="txn-clear-filters">Καθαρισμός</button>
    </div>

    <div class="stat-grid">
      <div class="stat accent-success"><div class="st-label">Έσοδα</div><div class="st-value">${formatCurrency(t.income, cur)}</div></div>
      <div class="stat accent-warn"><div class="st-label">Έξοδα</div><div class="st-value">${formatCurrency(t.expense, cur)}</div></div>
      <div class="stat accent-primary"><div class="st-label">Υπόλοιπο</div><div class="st-value">${formatCurrency(t.balance, cur)}</div></div>
      <div class="stat"><div class="st-label">Κινήσεις</div><div class="st-value">${t.count}</div></div>
    </div>

    <div class="grid-2">
      <section class="panel"><div class="panel-head"><h2>👤 Έσοδα ανά πελάτη</h2></div><div class="panel-body" style="padding-top:4px;padding-bottom:4px">${table(incomeByClient)}</div></section>
      <section class="panel"><div class="panel-head"><h2>👷 Έξοδα ανά συνεργάτη</h2></div><div class="panel-body" style="padding-top:4px;padding-bottom:4px">${table(expenseByPartner)}</div></section>
    </div>

    <section class="panel">
      <div class="panel-head"><h2>📋 Κινήσεις περιόδου</h2><span class="muted">${txns.length}</span></div>
      <div class="panel-body" style="overflow-x:auto">
        <table class="table">
          <thead><tr><th>Ημ/νία</th><th>Τύπος</th><th>Κατηγορία</th><th>Περιγραφή</th><th>Σχετίζεται</th><th class="num">Ποσό</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="6" class="text-muted">Καμία κίνηση</td></tr>'}</tbody>
        </table>
      </div>
    </section>
  `;
}

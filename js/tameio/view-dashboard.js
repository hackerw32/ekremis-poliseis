import { totals, recentTransactions, pendingToPartners, pendingFromClients, pendingTotals, monthlySeries } from "./insights.js";
import { formatCurrency, formatDate, escapeHtml } from "../utils.js";

function stat(label, value, sub, icon, accent, currency) {
  const val = currency ? formatCurrency(value, currency) : value;
  return `<div class="stat ${accent ? "accent-" + accent : ""}">
    <span class="st-ico">${icon}</span>
    <div class="st-label">${escapeHtml(label)}</div>
    <div class="st-value">${escapeHtml(String(val))}</div>
    ${sub ? `<div class="st-sub">${escapeHtml(sub)}</div>` : ""}
  </div>`;
}

export function viewDashboard(ctx) {
  const cur = ctx.currency;
  const t = totals();
  const pending = pendingTotals();
  const recent = recentTransactions(8);
  const toPartners = pendingToPartners().slice(0, 6);
  const fromClients = pendingFromClients().slice(0, 6);
  const series = monthlySeries(6);
  const maxV = Math.max(1, ...series.flatMap((s) => [s.income, s.expense]));

  const recentHtml = recent.length
    ? recent.map((x) => `
        <div class="trow" data-tameio="txn" data-id="${escapeHtml(x.id)}">
          <span class="t-badge ${x.txn_type === "Έσοδο" ? "in" : "out"}">${x.txn_type === "Έσοδο" ? "＋" : "－"}</span>
          <div class="t-main">
            <div class="t-title">${escapeHtml(x.description || x.category || x.txn_type)}</div>
            <div class="t-sub">${escapeHtml(formatDate(x.txn_date))}${x.client_name ? " · " + escapeHtml(x.client_name) : ""}${x.partner_name ? " · " + escapeHtml(x.partner_name) : ""}${x.job_label ? " · " + escapeHtml(x.job_label) : ""}</div>
          </div>
          <span class="t-amt ${x.txn_type === "Έσοδο" ? "pos" : "neg"}">${formatCurrency(x.amount, cur)}</span>
        </div>`).join("")
    : `<div class="empty" style="border:none;padding:26px">Καμία κίνηση ακόμη</div>`;

  const pendingRow = (j, kind) => `
    <div class="debt" data-tameio="job" data-id="${escapeHtml(j.id)}" style="cursor:pointer">
      <span class="card-code">${escapeHtml(j.protocol_number || "—")}</span>
      <span style="font-weight:600">${escapeHtml(j.title || j.owner || "")}</span>
      <span class="d-amt">${formatCurrency(kind === "partner" ? j.partner_pending : j.client_pending, cur)}</span>
    </div>`;

  return `
    <div class="view-head">
      <div><h1>Οικονομικά</h1><p>Εικόνα του ταμείου και των εκκρεμών ποσών</p></div>
      <div class="pill-row">
        <button class="btn" data-tameio-action="add-txn-income">＋ Είσπραξη</button>
        <button class="btn primary" data-tameio-action="add-txn-expense">＋ Πληρωμή</button>
      </div>
    </div>

    <div class="stat-grid">
      ${stat("Υπόλοιπο ταμείου", t.balance, "", "🏦", t.balance >= 0 ? "success" : "danger", cur)}
      ${stat("Έσοδα (σύνολο)", t.income, "", "📥", "info", cur)}
      ${stat("Έξοδα (σύνολο)", t.expense, "", "📤", "warn", cur)}
      ${stat("Οφείλονται σε συνεργάτες", pending.to_partners, pending.partner_jobs + " υποθέσεις", "👷", "danger", cur)}
      ${stat("Οφείλονται από πελάτες", pending.from_clients, pending.client_jobs + " υποθέσεις", "💳", "purple", cur)}
      ${stat("Κινήσεις", t.count, "καταχωρήσεις", "🧾", "primary")}
    </div>

    <div class="grid-2">
      <section class="panel">
        <div class="panel-head"><h2>📈 Τελευταίοι 6 μήνες</h2>
          <span class="muted"><span class="legend in"></span>Έσοδα <span class="legend out"></span>Έξοδα</span>
        </div>
        <div class="panel-body">
          <div class="chart">
            ${series.map((s) => `
              <div class="chart-col">
                <div class="chart-bars">
                  <div class="chart-bar in" style="height:${Math.round((s.income / maxV) * 100)}%" title="${formatCurrency(s.income, cur)}"></div>
                  <div class="chart-bar out" style="height:${Math.round((s.expense / maxV) * 100)}%" title="${formatCurrency(s.expense, cur)}"></div>
                </div>
                <span class="chart-label">${escapeHtml(s.month.slice(5))}/${escapeHtml(s.month.slice(2, 4))}</span>
              </div>`).join("")}
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head"><h2>🧾 Πρόσφατες κινήσεις</h2>
          <a class="muted t-link" href="#/tameio/transactions">Όλες →</a>
        </div>
        <div class="panel-body" style="padding-top:4px;padding-bottom:4px">${recentHtml}</div>
      </section>
    </div>

    <div class="grid-2">
      <section class="panel">
        <div class="panel-head"><h2>👷 Οφείλονται σε συνεργάτες</h2></div>
        <div class="panel-body" style="padding-top:4px;padding-bottom:4px">${toPartners.length ? toPartners.map((j) => pendingRow(j, "partner")).join("") : '<div class="text-muted" style="padding:14px">Καθόλου εκκρεμότητες</div>'}</div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>💳 Οφείλονται από πελάτες</h2></div>
        <div class="panel-body" style="padding-top:4px;padding-bottom:4px">${fromClients.length ? fromClients.map((j) => pendingRow(j, "client")).join("") : '<div class="text-muted" style="padding:14px">Καθόλου εκκρεμότητες</div>'}</div>
      </section>
    </div>
  `;
}

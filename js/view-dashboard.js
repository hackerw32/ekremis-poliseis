import { computeStats, statusBreakdown, allTasks, groupTasks, debtSummary, recentProperties } from "./insights.js";
import { miniStatCard, taskRow } from "./cards.js";
import { formatCurrency, escapeHtml, formatDateTime } from "./utils.js";

export function viewDashboard(ctx) {
  const { state, ui } = ctx;
  const props = state.properties;
  const stats = computeStats(props);
  const breakdown = statusBreakdown(props);
  const debts = debtSummary(props);
  const groups = groupTasks(allTasks(props));
  const upcoming = [...groups.overdue, ...groups.soon, ...groups.later].slice(0, 8);
  const recent = recentProperties(props, 5);
  const maxCount = Math.max(1, ...breakdown.map((b) => b.count));

  const cards = [
    { label: "Σύνολο υποθέσεων", value: stats.total, icon: "🏠", accent: "primary" },
    { label: "Ενεργές", value: stats.active, icon: "📈", accent: "success" },
    { label: "Σε εκκρεμότητα", value: stats.withTasks, sub: `${stats.withDebts} με οφειλές`, icon: "⏳", accent: "warn" },
    { label: "Αξία ενεργών", value: stats.totalValue, icon: "💰", accent: "purple", currency: ctx.currency },
    { label: "Προκαταβολές", value: stats.deposits, icon: "🧾", accent: "info", currency: ctx.currency },
    { label: "Ανοιχτές οφειλές", value: stats.openDebts, icon: "💸", accent: "danger", currency: ctx.currency },
  ];

  const taskHtml = upcoming.length
    ? `<div class="task-list">${upcoming.map((t) => taskRow(t, { currency: ctx.currency })).join("")}</div>`
    : `<div class="empty" style="border:none;padding:30px"><span class="big">🎉</span>Δεν υπάρχουν εκκρεμείς εργασίες</div>`;

  const debtHtml = debts.open.length
    ? debts.open.map((d) => `
        <div class="debt">
          <span class="d-label">${escapeHtml(d.label || "Οφειλή")}</span>
          <a class="t-link" data-open="${escapeHtml(d.propId)}" style="font-size:12px">${escapeHtml(d.propCode || d.propTitle || "")}</a>
          <span class="d-amt">${formatCurrency(d.amount, ctx.currency)}</span>
        </div>`).join("")
    : `<div class="empty" style="border:none;padding:24px">Καμία ανοιχτή οφειλή</div>`;

  const recentHtml = recent.length
    ? recent.map((p) => `
        <div class="debt" style="cursor:pointer" data-open="${escapeHtml(p.id)}">
          <span class="card-code">${escapeHtml(p.code || "—")}</span>
          <span style="font-weight:600">${escapeHtml(p.title || "Χωρίς τίτλο")}</span>
          <span class="d-amt text-muted" style="font-weight:500;font-size:12px">${escapeHtml(formatDateTime(p.updatedAt))}</span>
        </div>`).join("")
    : `<div class="empty" style="border:none;padding:24px">Καμία ενημέρωση ακόμη</div>`;

  return `
    <div class="view-head">
      <div>
        <h1>Dashboard</h1>
        <p>Επισκόπηση των εκκρεμών πωλήσεων σε πραγματικό χρόνο</p>
      </div>
      <button class="btn primary" data-action="add">+ Νέα υπόθεση</button>
    </div>

    <div class="stat-grid">${cards.map(miniStatCard).join("")}</div>

    <div class="grid-2">
      <section class="panel">
        <div class="panel-head">
          <h2>⏳ Εκκρεμότητες που πλησιάζουν</h2>
          <a class="muted t-link" href="#/tasks">Όλες →</a>
        </div>
        ${taskHtml}
      </section>

      <div>
        <section class="panel">
          <div class="panel-head"><h2>📊 Κατάσταση υποθέσεων</h2></div>
          <div class="panel-body">
            <div class="bars">
              ${breakdown.map((b) => `
                <div class="bar-row">
                  <span>${escapeHtml(b.status)}</span>
                  <div class="bar-track"><div class="bar-fill" style="width:${Math.round((b.count / maxCount) * 100)}%"></div></div>
                  <span class="bar-count">${b.count}</span>
                </div>`).join("")}
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>💸 Οφειλές</h2>
            <span class="muted">${formatCurrency(debts.total, ctx.currency)}</span>
          </div>
          <div class="panel-body" style="padding-top:4px;padding-bottom:4px">${debtHtml}</div>
        </section>
      </div>
    </div>

    <section class="panel">
      <div class="panel-head"><h2>🕒 Πρόσφατες ενημερώσεις</h2></div>
      <div class="panel-body" style="padding-top:4px;padding-bottom:4px">${recentHtml}</div>
    </section>
  `;
}

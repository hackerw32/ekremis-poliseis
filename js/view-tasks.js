import { allTasks, groupTasks, debtSummary } from "./insights.js";
import { taskRow } from "./cards.js";
import { formatCurrency, escapeHtml } from "./utils.js";

const GROUP_LABELS = {
  overdue: "🔴 Εκπρόθεσμες",
  soon: "🟠 Επόμενες 7 ημέρες",
  later: "🔵 Αργότερα",
  nodate: "⚪ Χωρίς ημερομηνία",
  done: "✅ Ολοκληρωμένες",
};

export function viewTasks(ctx) {
  const { state, ui } = ctx;
  const tasks = allTasks(state.properties);
  const groups = groupTasks(tasks);
  const debts = debtSummary(state.properties);
  const openCount = tasks.filter((t) => !t.done).length;

  const renderGroup = (key) => {
    const list = groups[key];
    if (!list.length) return "";
    if (key === "done" && !ui.showDone) {
      return `<div class="task-group-title">${escapeHtml(GROUP_LABELS[key])} (${list.length}) — κρυμμένες</div>`;
    }
    return `
      <div class="task-group-title">${escapeHtml(GROUP_LABELS[key])} (${list.length})</div>
      <div class="task-list">${list.map((t) => taskRow(t, { currency: ctx.currency })).join("")}</div>`;
  };

  const tasksHtml = openCount || groups.done.length
    ? ["overdue", "soon", "later", "nodate", "done"].map(renderGroup).join("")
    : `<div class="empty"><span class="big">🎉</span>Δεν υπάρχουν εκκρεμότητες</div>`;

  const debtHtml = debts.open.length
    ? debts.open.map((d) => `
        <div class="debt">
          <span class="d-label">${escapeHtml(d.label || "Οφειλή")}</span>
          <a class="t-link" data-open="${escapeHtml(d.propId)}" style="font-size:12px">${escapeHtml(d.propCode || d.propTitle || "")}</a>
          <span class="d-amt">${formatCurrency(d.amount, ctx.currency)}</span>
        </div>`).join("")
    : `<div class="empty" style="border:none;padding:24px">Καμία ανοιχτή οφειλή</div>`;

  return `
    <div class="view-head">
      <div>
        <h1>Εκκρεμότητες</h1>
        <p>${openCount} ανοιχτές εργασίες · ${debts.open.length} οφειλές</p>
      </div>
      <label class="chip ${ui.showDone ? "active" : ""}" style="cursor:pointer">
        <input type="checkbox" data-toggle-done ${ui.showDone ? "checked" : ""} style="margin:0" /> Εμφάνιση ολοκληρωμένων
      </label>
    </div>

    <div class="grid-2">
      <section class="panel">${tasksHtml}</section>
      <section class="panel">
        <div class="panel-head">
          <h2>💸 Οφειλές</h2>
          <span class="muted">${formatCurrency(debts.total, ctx.currency)}</span>
        </div>
        <div class="panel-body" style="padding-top:4px;padding-bottom:4px">${debtHtml}</div>
      </section>
    </div>
  `;
}

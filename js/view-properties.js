import { filterAndSort, propertyUrgency } from "./insights.js";
import { propertyCard } from "./cards.js";
import { STATUSES, escapeHtml } from "./utils.js";

export function viewProperties(ctx) {
  const { state, ui } = ctx;
  const filtered = filterAndSort(state.properties, ui);

  const statusChips = [
    { id: "all", label: "Όλες" },
    ...STATUSES.map((s) => ({ id: s.id, label: s.id })),
  ];

  const flagChips = [
    { id: "all", label: "Όλες οι σημάνσεις" },
    { id: "tasks", label: "✅ Με εκκρεμότητες" },
    { id: "debts", label: "💸 Με οφειλές" },
    { id: "value", label: "💰 Με τιμή" },
  ];

  const cardsHtml = filtered.length
    ? filtered.map((p) => propertyCard(p, ctx.currency)).join("")
    : `<div class="empty" style="grid-column:1/-1"><span class="big">🔍</span>Δεν βρέθηκαν υποθέσεις με τα τρέχοντα φίλτρα</div>`;

  return `
    <div class="view-head">
      <div>
        <h1>Υποθέσεις</h1>
        <p>${filtered.length} από ${state.properties.length} υποθέσεις</p>
      </div>
      <button class="btn primary" data-action="add">+ Νέα υπόθεση</button>
    </div>

    <div class="toolbar">
      ${statusChips.map((c) => `
        <button class="chip ${ui.status === c.id ? "active" : ""}" data-filter-status="${escapeHtml(c.id)}">${escapeHtml(c.label)}</button>
      `).join("")}
      <span class="spacer"></span>
      <select class="select" data-sort>
        <option value="urgency" ${ui.sort === "urgency" ? "selected" : ""}>Ταξινόμηση: Προτεραιότητα</option>
        <option value="code" ${ui.sort === "code" ? "selected" : ""}>Κωδικός</option>
        <option value="price" ${ui.sort === "price" ? "selected" : ""}>Τιμή (φθίνουσα)</option>
        <option value="title" ${ui.sort === "title" ? "selected" : ""}>Τίτλος (Α-Ω)</option>
      </select>
    </div>

    <div class="toolbar">
      ${flagChips.map((c) => `
        <button class="chip ${ui.flag === c.id ? "active" : ""}" data-filter-flag="${escapeHtml(c.id)}">${escapeHtml(c.label)}</button>
      `).join("")}
    </div>

    <div class="cards">${cardsHtml}</div>
  `;
}

export { propertyUrgency };

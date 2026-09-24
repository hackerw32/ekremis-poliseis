import {
  escapeHtml,
  formatCurrency,
  statusClass,
  dueInfo,
  formatNumber,
  sum,
} from "./utils.js";

export function primaryContactLine(p) {
  const buyer = p.buyer || "";
  const phone = p.buyerPhone || "";
  if (buyer || phone) return { label: "Αγοραστής", value: buyer || "—", phone };
  const seller = p.seller || "";
  if (seller) return { label: "Πωλητής", value: seller, phone: p.sellerPhone || "" };
  return null;
}

export function propertyCard(p, currency = "EUR") {
  const openTasks = (p.tasks || []).filter((t) => !t.done).length;
  const openDebts = (p.debts || []).filter((d) => !d.settled);
  const debtTotal = sum(openDebts, (d) => d.amount);
  const contact = primaryContactLine(p);

  const tags = [];
  if (openTasks) tags.push(`<span class="tag-mini">✅ ${openTasks} εκκρεμότητες</span>`);
  if (openDebts.length) tags.push(`<span class="tag-mini">💸 ${formatCurrency(debtTotal, currency)} οφειλές</span>`);
  if (p.availability) tags.push(`<span class="tag-mini">📅 ${escapeHtml(p.availability)}</span>`);
  if ((p.interested || []).length) tags.push(`<span class="tag-mini">👥 ${p.interested.length} ενδιαφερόμενοι</span>`);

  const priceHtml = Number(p.price) > 0
    ? `<span class="price">${formatCurrency(p.price, currency)}</span>`
    : `<span class="price muted">Χωρίς τιμή</span>`;

  return `
    <article class="card" data-open="${escapeHtml(p.id)}" tabindex="0">
      <div class="card-top">
        <div style="min-width:0">
          ${p.code ? `<span class="card-code">${escapeHtml(p.code)}</span>` : `<span class="card-code">—</span>`}
          <h3 class="card-title">${escapeHtml(p.title || "Χωρίς τίτλο")}</h3>
        </div>
        <span class="pill ${statusClass(p.status)}">${escapeHtml(p.status || "—")}</span>
      </div>
      <div class="card-meta">
        ${p.seller ? `<div class="row"><span class="k">Πωλητής</span><span class="v">${escapeHtml(p.seller)}</span></div>` : ""}
        ${contact ? `<div class="row"><span class="k">${contact.label}</span><span class="v">${escapeHtml(contact.value)}${contact.phone ? " · " + escapeHtml(contact.phone) : ""}</span></div>` : ""}
        ${p.type ? `<div class="row"><span class="k">Τύπος</span><span class="v">${escapeHtml(p.type)}</span></div>` : ""}
      </div>
      ${tags.length ? `<div class="tags">${tags.join("")}</div>` : ""}
      <div class="card-foot">
        ${priceHtml}
        ${p.depositAmount ? `<span class="text-muted" style="font-size:12px">Προκατ. ${formatCurrency(p.depositAmount, currency)}</span>` : `<span></span>`}
      </div>
    </article>`;
}

export function taskRow(task, { showProperty = true, currency = "EUR" } = {}) {
  const due = dueInfo(task.due);
  return `
    <div class="task-item ${task.done ? "done" : ""}" data-task-prop="${escapeHtml(task.propId)}" data-task-index="${task.index}">
      <button class="check" data-toggle-task="1" aria-label="Ολοκληρώθηκε">${task.done ? "✓" : ""}</button>
      <div class="t-main">
        <div class="t-title">${escapeHtml(task.title)}</div>
        <div class="t-sub">
          ${showProperty && task.propId ? `<a class="t-link" data-open="${escapeHtml(task.propId)}">${task.propCode ? escapeHtml(task.propCode) + " · " : ""}${escapeHtml(task.propTitle || "")}</a>` : ""}
          ${task.owner ? `<span class="t-owner">👤 ${escapeHtml(task.owner)}</span>` : ""}
          ${task.due ? `<span class="due ${due.cls}">📅 ${escapeHtml(due.label)}</span>` : ""}
          ${task.note ? `<span class="text-muted">${escapeHtml(task.note)}</span>` : ""}
        </div>
      </div>
    </div>`;
}

export function miniStatCard({ label, value, sub, icon, accent, currency }) {
  const val = typeof value === "number" && currency ? formatCurrency(value, currency) : (typeof value === "number" ? formatNumber(value) : value);
  return `
    <div class="stat ${accent ? "accent-" + accent : ""}">
      ${icon ? `<span class="st-ico">${icon}</span>` : ""}
      <div class="st-label">${escapeHtml(label)}</div>
      <div class="st-value">${escapeHtml(String(val))}</div>
      ${sub ? `<div class="st-sub">${escapeHtml(sub)}</div>` : ""}
    </div>`;
}

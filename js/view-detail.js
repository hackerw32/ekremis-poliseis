import {
  escapeHtml,
  statusClass,
  formatCurrency,
  formatDate,
  firstPhone,
  phoneLink,
  normalizePhone,
  dueInfo,
  sum,
} from "./utils.js";

function contactRow(c, currency) {
  const tel = phoneLink(firstPhone(c.phone));
  const mail = c.email ? `mailto:${c.email}` : "";
  return `
    <div class="contact">
      <div>
        <div class="c-role">${escapeHtml(c.role || "Επαφή")}</div>
        <div class="c-name">${escapeHtml(c.name || "—")} ${c.phone ? `<span class="text-muted">· ${escapeHtml(c.phone)}</span>` : ""}</div>
        ${c.note ? `<div class="c-role">${escapeHtml(c.note)}</div>` : ""}
      </div>
      <div class="c-actions">
        ${tel ? `<a class="mini-btn" href="${tel}" title="Κλήση">📞</a>` : ""}
        ${tel ? `<a class="mini-btn" href="viber://chat?number=${encodeURIComponent(normalizePhone(firstPhone(c.phone)))}" title="Viber">💬</a>` : ""}
        ${mail ? `<a class="mini-btn" href="${mail}" title="Email">✉️</a>` : ""}
      </div>
    </div>`;
}

export function propertyDetailBody(p, ctx) {
  const cur = ctx.currency;
  const buyerTel = phoneLink(firstPhone(p.buyerPhone));
  const sellerTel = phoneLink(firstPhone(p.sellerPhone));
  const openDebts = (p.debts || []).filter((d) => !d.settled);
  const debtTotal = sum(openDebts, (d) => d.amount);

  const contactList = [];
  if (p.seller || p.sellerPhone) {
    contactList.push({ role: "Πωλητής", name: p.seller || "—", phone: p.sellerPhone, email: p.sellerEmail });
  }
  if (p.buyer || p.buyerPhone) {
    contactList.push({ role: "Αγοραστής", name: p.buyer || "—", phone: p.buyerPhone, email: p.buyerEmail });
  }
  (p.contacts || []).forEach((c) => contactList.push(c));

  const tasksHtml = (p.tasks || []).length
    ? p.tasks.map((t, i) => `
        <div class="task-item ${t.done ? "done" : ""}">
          <button class="check" data-detail-toggle-task="${i}">${t.done ? "✓" : ""}</button>
          <div class="t-main">
            <div class="t-title">${escapeHtml(t.title)}</div>
            <div class="t-sub">
              ${t.owner ? `<span>👤 ${escapeHtml(t.owner)}</span>` : ""}
              ${t.due ? `<span class="due ${dueInfo(t.due).cls}">📅 ${escapeHtml(dueInfo(t.due).label)}</span>` : ""}
              ${t.note ? `<span>${escapeHtml(t.note)}</span>` : ""}
            </div>
          </div>
        </div>`).join("")
    : `<div class="text-muted" style="padding:8px 0">Δεν υπάρχουν εκκρεμότητες.</div>`;

  const debtsHtml = (p.debts || []).length
    ? p.debts.map((d, i) => `
        <div class="debt ${d.settled ? "settled" : ""}">
          <button class="check" data-detail-toggle-debt="${i}" style="${d.settled ? "background:var(--success);border-color:var(--success);color:#fff" : ""}">${d.settled ? "✓" : ""}</button>
          <span class="d-label">${escapeHtml(d.label || "Οφειλή")}${d.note ? ` <span class="text-muted" style="font-size:12px">(${escapeHtml(d.note)})</span>` : ""}</span>
          <span class="d-amt">${formatCurrency(d.amount, cur)}</span>
        </div>`).join("")
    : `<div class="text-muted" style="padding:8px 0">Δεν υπάρχουν οφειλές.</div>`;

  const interestedHtml = (p.interested || []).length
    ? p.interested.map((c) => contactRow({
        role: "Ενδιαφερόμενος",
        name: c.name,
        phone: c.phone,
        email: c.email,
        note: c.note,
      }, cur)).join("")
    : `<div class="text-muted" style="padding:8px 0">Δεν υπάρχουν ενδιαφερόμενοι.</div>`;

  return `
    ${ctx.readOnly ? "" : ""}
    <div class="pill-row" style="margin-bottom:16px;flex-wrap:wrap">
      <span class="pill ${statusClass(p.status)}">${escapeHtml(p.status)}</span>
      ${p.code ? `<span class="pill soft">Κωδικός ${escapeHtml(p.code)}</span>` : ""}
      ${p.type ? `<span class="pill soft">${escapeHtml(p.type)}</span>` : ""}
      ${p.availability ? `<span class="pill st-anamoni">Διαθέσιμο: ${escapeHtml(p.availability)}</span>` : ""}
    </div>

    <div class="pill-row" style="margin-bottom:16px;flex-wrap:wrap">
      ${sellerTel ? `<a class="btn sm" href="${sellerTel}">📞 Πωλητής</a>` : ""}
      ${buyerTel ? `<a class="btn sm" href="${buyerTel}">📞 Αγοραστής</a>` : ""}
      ${buyerTel ? `<a class="btn sm" href="viber://chat?number=${encodeURIComponent(normalizePhone(firstPhone(p.buyerPhone)))}">💬 Viber</a>` : ""}
    </div>

    <div class="sec-title">Οικονομικά</div>
    <div class="info-block">
      <div class="kv">
        <span class="k">Τίμημα</span><span class="v">${formatCurrency(p.price, cur)}</span>
        <span class="k">Προκαταβολή</span><span class="v">${p.depositAmount ? formatCurrency(p.depositAmount, cur) : "—"}${p.depositDate ? ` (${escapeHtml(formatDate(p.depositDate))})` : ""}</span>
        ${p.depositNote ? `<span class="k">Σημείωση</span><span class="v">${escapeHtml(p.depositNote)}</span>` : ""}
        <span class="k">Ανοιχτές οφειλές</span><span class="v">${formatCurrency(debtTotal, cur)}</span>
      </div>
    </div>

    <div class="sec-title">Επαφές</div>
    <div class="info-block">${contactList.length ? contactList.map((c) => contactRow(c, cur)).join("") : '<div class="text-muted">—</div>'}</div>

    <div class="sec-title">Ενδιαφερόμενοι (${(p.interested || []).length})</div>
    <div class="info-block">${interestedHtml}</div>

    <div class="sec-title">Εκκρεμότητες</div>
    <div class="info-block" style="padding:6px 12px">${tasksHtml}</div>

    <div class="sec-title">Οφειλές</div>
    <div class="info-block" style="padding:6px 12px">${debtsHtml}</div>

    ${p.notes ? `<div class="sec-title">Σημειώσεις</div><div class="notes-box">${escapeHtml(p.notes)}</div>` : ""}
  `;
}

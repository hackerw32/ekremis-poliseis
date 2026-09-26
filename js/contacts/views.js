import * as store from "./store.js";
import { deburr, formatCurrency, formatDate, escapeHtml } from "../utils.js";

export function viewPeople(ctx, kind) {
  const cur = ctx.currency;
  const q = deburr(ctx.ui.query).trim();
  const isPartner = kind === "partner";
  const kindLabel = isPartner ? "Συνεργάτες" : "Πελάτες";

  let list = store.listPeople(kind);
  if (q) list = list.filter((p) => store.personHaystack(p).includes(q));

  const ledgerMap = {};
  store.listPeople(kind).forEach((p) => {
    ledgerMap[p.id] = store.ledger(kind, p.id);
  });
  list = list
    .slice()
    .sort((a, b) => (ledgerMap[b.id]?.owed || 0) - (ledgerMap[a.id]?.owed || 0) || String(a.name || "").localeCompare(String(b.name || ""), "el"));

  const totalOwed = store.totalObligations(kind);
  const rows = list.length
    ? list.map((p) => {
        const l = ledgerMap[p.id] || { owed: 0, total: 0, txns: [] };
        return `
          <div class="trow">
            <span class="t-badge out">${isPartner ? "👷" : "👤"}</span>
            <div class="t-main" data-person="open" data-id="${escapeHtml(p.id)}" style="cursor:pointer">
              <div class="t-title">${escapeHtml(p.name || "")}</div>
              <div class="t-sub">${p.code_technical ? "Α/Π " + escapeHtml(p.code_technical) + " · " : ""}${p.code_realestate ? escapeHtml(p.code_realestate) + " · " : ""}${escapeHtml(p.specialty || "")}${p.specialty && p.phone ? " · " : ""}${escapeHtml(p.phone || "")}${p.tax_id ? " · ΑΦΜ " + escapeHtml(p.tax_id) : ""}</div>
            </div>
            ${l.owed > 0.004 ? `<span class="tag-mini" style="background:var(--danger-soft);color:var(--danger)">${isPartner ? "Οφείλουμε" : "Μας οφείλει"} ${formatCurrency(l.owed, cur)}</span>` : ""}
            <span class="t-amt text-muted" style="font-weight:600;font-size:12px">${formatCurrency(l.total, cur)}</span>
          </div>`;
      }).join("")
    : `<div class="empty"><span class="big">${isPartner ? "👷" : "👤"}</span>Δεν βρέθηκαν εγγραφές</div>`;

  return `
    <div class="view-head">
      <div><h1>${kindLabel}</h1><p>${list.length} εγγραφές · ${isPartner ? "οφείλουμε" : "μας οφείλουν"} συνολικά ${formatCurrency(totalOwed, cur)}</p></div>
      <button class="btn primary" data-person-action="add">＋ ${isPartner ? "Νέος συνεργάτης" : "Νέος πελάτης"}</button>
    </div>
    <div class="tlist">${rows}</div>
  `;
}

export function personDetailBody(person, kind, data) {
  const cur = data.currency;
  const isPartner = kind === "partner";
  const { txns, jobs, total, owed } = data.ledger;

  const obligations = jobs.filter((j) => j.pending > 0.004);
  const obligationsHtml = obligations.length
    ? obligations.map((j) => `
        <div class="debt" data-person="job" data-id="${escapeHtml(j.id)}" style="cursor:pointer">
          <span class="card-code">${escapeHtml(j.protocol_number || "—")}</span>
          <span class="d-label">${escapeHtml(j.title || j.owner || "Υπόθεση")}</span>
          <span class="d-amt text-danger">${formatCurrency(j.pending, cur)}</span>
        </div>`).join("")
    : `<div class="text-muted" style="padding:8px 0">Καμία εκκρεμής οφειλή.</div>`;

  const txnHtml = txns.length
    ? txns.slice(0, 12).map((t) => `
        <div class="debt">
          <span class="t-badge ${t.txn_type === "Έσοδο" ? "in" : "out"}">${t.txn_type === "Έσοδο" ? "＋" : "－"}</span>
          <span class="d-label">${escapeHtml(t.description || t.category || "")} <span class="text-muted" style="font-size:12px">${escapeHtml(formatDate(t.txn_date))}</span></span>
          <span class="d-amt">${formatCurrency(t.amount, cur)}</span>
        </div>`).join("")
    : `<div class="text-muted" style="padding:8px 0">Καμία συναλλαγή.</div>`;

  const leads = data.relatedLeads;
  const leadsHtml = leads.length
    ? leads.slice(0, 6).map((l) => `<div class="debt"><span class="d-label">${escapeHtml(l.name || "")}</span><span class="d-amt text-muted" style="font-weight:500;font-size:12px">${escapeHtml(l.search_type || "")} ${escapeHtml(l.property_type || "")}</span></div>`).join("")
    : `<div class="text-muted" style="padding:8px 0">—</div>`;

  const props = data.relatedProperties;
  const propsHtml = props.length
    ? props.slice(0, 6).map((p) => `<div class="debt"><span class="card-code">${escapeHtml(p.code || "—")}</span><span class="d-label">${escapeHtml(p.title || "")}</span></div>`).join("")
    : `<div class="text-muted" style="padding:8px 0">—</div>`;

  return `
    <div class="pill-row" style="margin-bottom:14px">
      <span class="pill ${isPartner ? "st-ekkremotita" : "st-ok"}">${isPartner ? "Συνεργάτης" : "Πελάτης"}</span>
      ${person.specialty ? `<span class="pill soft">${escapeHtml(person.specialty)}</span>` : ""}
    </div>
    <div class="pill-row" style="margin-bottom:16px">
      ${person.phone ? `<a class="btn sm" href="tel:${escapeHtml(String(person.phone).replace(/[^\d+]/g, ""))}">📞 Κλήση</a>` : ""}
      ${person.phone ? `<a class="btn sm" href="viber://chat?number=${encodeURIComponent(String(person.phone).replace(/[^\d+]/g, ""))}">💬 Viber</a>` : ""}
      ${isPartner ? `<button class="btn sm primary" data-person-action="pay">＋ Πληρωμή</button>` : `<button class="btn sm primary" data-person-action="collect">＋ Είσπραξη</button>`}
      <button class="btn sm" data-person-action="new-job">＋ Υπόθεση</button>
    </div>

    <div class="stat-grid" style="margin-bottom:16px">
      <div class="stat ${owed > 0.004 ? "accent-danger" : "accent-success"}">
        <div class="st-label">${isPartner ? "Οφείλουμε" : "Μας οφείλει"}</div>
        <div class="st-value">${formatCurrency(owed, cur)}</div>
      </div>
      <div class="stat">
        <div class="st-label">${isPartner ? "Σύνολο πληρωμών" : "Σύνολο εισπράξεων"}</div>
        <div class="st-value">${formatCurrency(total, cur)}</div>
      </div>
    </div>

    <div class="sec-title">${isPartner ? "Υποχρεώσεις προς αυτόν" : "Απαιτήσεις από αυτόν"}</div>
    <div class="info-block" style="padding:6px 12px">${obligationsHtml}</div>

    <div class="sec-title">Ιστορικό συναλλαγών</div>
    <div class="info-block" style="padding:6px 12px">${txnHtml}</div>

    <div class="sec-title">Σχετικοί ενδιαφερόμενοι</div>
    <div class="info-block" style="padding:6px 12px">${leadsHtml}</div>

    <div class="sec-title">Σχετικές υποθέσεις πωλήσεων</div>
    <div class="info-block" style="padding:6px 12px">${propsHtml}</div>

    ${person.notes ? `<div class="sec-title">Σημειώσεις</div><div class="notes-box">${escapeHtml(person.notes)}</div>` : ""}
  `;
}

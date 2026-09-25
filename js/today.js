import * as ekremis from "./store.js";
import { allTasks } from "./insights.js";
import * as leads from "./leads/store.js";
import * as tameio from "./tameio/store.js";
import { pendingTotals } from "./tameio/insights.js";
import * as contacts from "./contacts/store.js";
import * as aggelies from "./aggelies/store.js";
import { formatCurrency, formatDate, dueInfo, escapeHtml } from "./utils.js";

function stat(label, value, sub, icon, accent, currency) {
  const val = currency ? formatCurrency(value, currency) : value;
  return `<div class="stat ${accent ? "accent-" + accent : ""}">
    <span class="st-ico">${icon}</span>
    <div class="st-label">${escapeHtml(label)}</div>
    <div class="st-value">${escapeHtml(String(val))}</div>
    ${sub ? `<div class="st-sub">${escapeHtml(sub)}</div>` : ""}
  </div>`;
}

export function renderToday(container, ctx) {
  const cur = ctx.currency;
  const props = ekremis.getState().properties || [];
  const tasks = allTasks(props).filter((t) => !t.done);
  const leadList = leads.listLeads();
  const noProposal = leadList.filter((l) => !l.proposal_sent);
  const newLeads = leadList.filter((l) => l.status === "Νέο");
  const p = pendingTotals();
  const listings = aggelies.listListings();
  const available = listings.filter((l) => l.status === "available");
  const callList = listings.filter((l) => l.status === "pending" || l.status === "not_sure");
  const partnersOwed = contacts.totalObligations("partner");
  const clientsOwed = contacts.totalObligations("client");

  const dueTasks = tasks
    .slice()
    .sort((a, b) => String(a.due || "9999").localeCompare(String(b.due || "9999")))
    .slice(0, 6);

  const tasksHtml = dueTasks.length
    ? dueTasks.map((t) => `
        <div class="debt">
          <span class="d-label">${escapeHtml(t.title)}${t.owner ? ` <span class="text-muted">(${escapeHtml(t.owner)})</span>` : ""}</span>
          ${t.due ? `<span class="d-amt due ${dueInfo(t.due).cls}" style="font-size:12px">${escapeHtml(dueInfo(t.due).label)}</span>` : ""}
        </div>`).join("")
    : '<div class="text-muted" style="padding:8px 0">Καμία εκκρεμότητα 🎉</div>';

  const newLeadsHtml = newLeads.slice(0, 6).map((l) => `
    <div class="debt">
      <span class="d-label">${escapeHtml(l.name || "")}</span>
      <span class="d-amt text-muted" style="font-weight:500;font-size:12px">${escapeHtml(l.search_type || "")} ${escapeHtml(l.property_type || "")}</span>
    </div>`).join("") || '<div class="text-muted" style="padding:8px 0">Κανένα νέο αίτημα</div>';

  const obligations = contacts.allObligations("partner").slice(0, 8);
  const obligationsHtml = obligations.length
    ? obligations.map((j) => `
        <div class="debt" data-today-job="${escapeHtml(j.id)}" style="cursor:pointer">
          <span class="card-code">${escapeHtml(j.protocol_number || "—")}</span>
          <span class="d-label">${escapeHtml(j.title || "")} <span class="text-muted">→ ${escapeHtml(j.partner_name || "")}</span></span>
          <span class="d-amt text-danger">${formatCurrency(j.pending, cur)}</span>
        </div>`).join("")
    : '<div class="text-muted" style="padding:8px 0">Καθόλου οφειλές 🎉</div>';

  container.innerHTML = `
    <div class="view-head">
      <div><h1>Επισκόπηση</h1><p>${new Date().toLocaleDateString("el-GR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div>
      <div class="pill-row">
        <a class="btn" href="#/leads/list">🎯 Ενδιαφερόμενοι</a>
        <a class="btn" href="#/aggelies/list">📢 Αγγελίες</a>
      </div>
    </div>

    <div class="stat-grid">
      ${stat("Νέα αιτήματα", newLeads.length, `${noProposal.length} χωρίς πρόταση`, "🆕", newLeads.length ? "warn" : "success")}
      ${stat("Προς κλήση", callList.length, "αγγελίες σε αναμονή", "📞", callList.length ? "warn" : "success")}
      ${stat("Οφείλουμε σε συνεργάτες", partnersOwed, "", "👷", partnersOwed > 0 ? "danger" : "success", cur)}
      ${stat("Μας οφείλουν πελάτες", clientsOwed, "", "💳", clientsOwed > 0 ? "purple" : "success", cur)}
      ${stat("Εκκρεμότητες", tasks.length, "ανοιχτές εργασίες", "⏳", tasks.length ? "warn" : "success")}
      ${stat("Διαθέσιμες αγγελίες", available.length, `από ${listings.length}`, "📢", "primary")}
    </div>

    <div class="grid-2">
      <section class="panel">
        <div class="panel-head"><h2>⏳ Εκκρεμότητες</h2><a class="muted t-link" href="#/ekremis/tasks">Όλες →</a></div>
        <div class="panel-body" style="padding-top:4px;padding-bottom:4px">${tasksHtml}</div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>💸 Οφείλουμε σε συνεργάτες</h2><a class="muted t-link" href="#/partners/list">Συνεργάτες →</a></div>
        <div class="panel-body" style="padding-top:4px;padding-bottom:4px">${obligationsHtml}</div>
      </section>
    </div>

    <div class="grid-2">
      <section class="panel">
        <div class="panel-head"><h2>🆕 Νέα αιτήματα</h2><a class="muted t-link" href="#/leads/list">Όλα →</a></div>
        <div class="panel-body" style="padding-top:4px;padding-bottom:4px">${newLeadsHtml}</div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>⚡ Γρήγορες ενέργειες</h2></div>
        <div class="panel-body">
          <div class="pill-row">
            <a class="btn block" href="#/leads/import">📥 Εισαγωγή αιτημάτων</a>
            <a class="btn block" href="#/aggelies/list">📢 Νέες αγγελίες</a>
            <a class="btn block" href="#/tameio/transactions">🧾 Νέα συναλλαγή</a>
            <a class="btn block" href="#/texnikos/list">📐 Τεχνικός έλεγχος</a>
          </div>
        </div>
      </section>
    </div>
  `;
}

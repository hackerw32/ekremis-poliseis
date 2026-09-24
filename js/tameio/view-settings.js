import * as store from "./store.js";
import { getOffice } from "./office.js";
import { formatCurrency, escapeHtml } from "../utils.js";

export function viewSettings(ctx) {
  const o = getOffice();
  const cur = ctx.currency;
  const counts = {
    clients: store.clients().length,
    partners: store.partners().length,
    jobs: store.jobs().length,
    transactions: store.transactions().length,
  };
  const t = store.sum(store.transactions(), (x) => (x.txn_type === "Έσοδο" ? x.amount : -x.amount));

  return `
    <div class="view-head"><div><h1>Ρυθμίσεις ταμείου</h1><p>Στοιχεία γραφείου και δεδομένα</p></div></div>

    <section class="panel">
      <div class="panel-head"><h2>🏢 Στοιχεία γραφείου</h2></div>
      <div class="panel-body">
        <div class="form-grid">
          <div class="field full"><label>Επωνυμία</label><input class="input" data-office="name" value="${escapeHtml(o.name)}" /></div>
          <div class="field"><label>Ιδιοκτήτης</label><input class="input" data-office="owner" value="${escapeHtml(o.owner)}" /></div>
          <div class="field"><label>Ιδιότητα</label><input class="input" data-office="title" value="${escapeHtml(o.title)}" /></div>
          <div class="field"><label>Τηλέφωνα</label><input class="input" data-office="phone" value="${escapeHtml(o.phone)}" /></div>
          <div class="field"><label>Email</label><input class="input" data-office="email" value="${escapeHtml(o.email)}" /></div>
          <div class="field full"><label>Διεύθυνση</label><input class="input" data-office="address" value="${escapeHtml(o.address)}" /></div>
          <div class="field full"><label>ΑΦΜ / ΔΟΥ</label><input class="input" data-office="tax_id" value="${escapeHtml(o.tax_id)}" /></div>
        </div>
        <div class="pill-row" style="margin-top:12px">
          <button class="btn primary" data-tameio-action="save-office">💾 Αποθήκευση στοιχείων</button>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><h2>💾 Δεδομένα</h2><span class="muted">${counts.transactions} κινήσεις</span></div>
      <div class="panel-body">
        <div class="setting-row">
          <div><div class="s-title">Σύνοψη</div><div class="s-desc">${counts.clients} πελάτες · ${counts.partners} συνεργάτες · ${counts.jobs} υποθέσεις · Υπόλοιπο ${formatCurrency(t, cur)}</div></div>
        </div>
        <div class="setting-row">
          <div><div class="s-title">Εξαγωγή (backup)</div><div class="s-desc">Κατέβασε όλα τα δεδομένα του ταμείου σε JSON.</div></div>
          <button class="btn" data-tameio-action="export">⬇️ Εξαγωγή JSON</button>
        </div>
        <div class="setting-row">
          <div><div class="s-title">Εισαγωγή</div><div class="s-desc">Φόρτωσε δεδομένα από αρχείο JSON (αντικαθιστά τα υπάρχοντα).</div></div>
          <button class="btn" data-tameio-action="import">⬆️ Εισαγωγή JSON</button>
        </div>
        <div class="setting-row">
          <div><div class="s-title text-danger">Διαγραφή όλων</div><div class="s-desc">Αφαιρεί πελάτες, συνεργάτες, υποθέσεις και κινήσεις.</div></div>
          <button class="btn danger" data-tameio-action="clear-all">🗑️ Διαγραφή όλων</button>
        </div>
      </div>
    </section>
  `;
}

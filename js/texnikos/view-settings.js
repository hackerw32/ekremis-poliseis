import { getSettings } from "./settings.js";
import { listDocs } from "./store.js";
import { escapeHtml } from "../utils.js";

export function viewSettings() {
  const s = getSettings();
  const co = s.company;
  const le = s.letter;
  return `
    <div class="view-head"><div><h1>Ρυθμίσεις — Τεχνικός Έλεγχος</h1><p>Στοιχεία γραφείου για τα έγγραφα</p></div></div>

    <section class="panel">
      <div class="panel-head"><h2>🏢 Επικεφαλίδα εγγράφου</h2></div>
      <div class="panel-body">
        <div class="form-grid">
          <div class="field full"><label>Γραμμή 1</label><input class="input" data-tset="company.line1" value="${escapeHtml(co.line1)}" /></div>
          <div class="field full"><label>Γραμμή 2</label><input class="input" data-tset="company.line2" value="${escapeHtml(co.line2)}" /></div>
          <div class="field"><label>Από έτος</label><input class="input" data-tset="company.since" value="${escapeHtml(co.since)}" /></div>
          <div class="field"><label>Μηχανικός</label><input class="input" data-tset="company.engineer" value="${escapeHtml(co.engineer)}" /></div>
          <div class="field full"><label>Ιδιότητα μηχανικού</label><input class="input" data-tset="company.engineer_title" value="${escapeHtml(co.engineer_title)}" /></div>
          <div class="field full"><label>Διεύθυνση</label><input class="input" data-tset="company.address" value="${escapeHtml(co.address)}" /></div>
          <div class="field"><label>ΑΦΜ / ΔΟΥ</label><input class="input" data-tset="company.afm" value="${escapeHtml(co.afm)}" /></div>
          <div class="field"><label>Τηλέφωνα</label><input class="input" data-tset="company.phones" value="${escapeHtml(co.phones)}" /></div>
          <div class="field full"><label>Email</label><input class="input" data-tset="company.email" value="${escapeHtml(co.email)}" /></div>
          <div class="field full"><label>Slogan</label><input class="input" data-tset="letter.slogan" value="${escapeHtml(le.slogan)}" /></div>
          <div class="field"><label>Τράπεζα</label><input class="input" data-tset="letter.bank_name" value="${escapeHtml(le.bank_name)}" /></div>
          <div class="field"><label>IBAN</label><input class="input" data-tset="letter.bank_iban" value="${escapeHtml(le.bank_iban)}" /></div>
          <div class="field full"><label>Κατακλείδα</label><input class="input" data-tset="letter.closing" value="${escapeHtml(le.closing)}" /></div>
        </div>
        <div class="pill-row" style="margin-top:12px">
          <button class="btn primary" data-tex-action="save-settings">💾 Αποθήκευση</button>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><h2>💾 Δεδομένα</h2><span class="muted">${listDocs().length} έγγραφα</span></div>
      <div class="panel-body">
        <div class="setting-row">
          <div><div class="s-title">Εξαγωγή εγγράφων</div><div class="s-desc">Κατέβασε όλα τα έγγραφα σε JSON.</div></div>
          <button class="btn" data-tex-action="export">⬇️ Εξαγωγή JSON</button>
        </div>
        <div class="setting-row">
          <div><div class="s-title text-danger">Διαγραφή όλων</div><div class="s-desc">Αφαιρεί όλα τα αποθηκευμένα έγγραφα.</div></div>
          <button class="btn danger" data-tex-action="clear-docs">🗑️ Διαγραφή όλων</button>
        </div>
      </div>
    </section>
  `;
}

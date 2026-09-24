import { listLeads } from "./store.js";
import { escapeHtml } from "../utils.js";

export function viewImport(ctx) {
  const f = ctx.leads;
  const pending = f.pending || [];
  const preview = pending.slice(0, 6);

  return `
    <div class="view-head">
      <div><h1>Εισαγωγή ενδιαφερομένων</h1><p>Από Google Forms / Excel / CSV — με έξυπνη αναγνώριση στηλών</p></div>
    </div>

    <section class="panel">
      <div class="panel-head"><h2>📥 Από αρχείο (CSV ή Excel .xlsx)</h2></div>
      <div class="panel-body">
        <p class="text-muted" style="margin-top:0">Κατέβασε τις απαντήσεις της Google Form ως .csv ή .xlsx και ανέβασέ τις εδώ.</p>
        <div class="pill-row">
          <button class="btn primary" data-lead-action="pick-file">📎 Επιλογή αρχείου</button>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><h2>🔗 Απευθείας από Google Sheet</h2></div>
      <div class="panel-body">
        <p class="text-muted" style="margin-top:0">Βάλε το link του Google Sheet των απαντήσεων (ή το «Publish to web → CSV» link). Το φύλλο πρέπει να είναι κοινόχρηστο («Anyone with the link → Viewer»).</p>
        <div class="form-grid">
          <div class="field full"><label>Link ή ID φύλλου</label><input class="input" data-lead-sheet placeholder="https://docs.google.com/spreadsheets/d/...." value="${escapeHtml(f.sheetUrl || "")}" /></div>
        </div>
        <div class="pill-row" style="margin-top:10px">
          <button class="btn primary" data-lead-action="fetch-sheet">🔄 Συγχρονισμός από φύλλο</button>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><h2>📋 Ή επικόλλησε κείμενο</h2></div>
      <div class="panel-body">
        <textarea class="textarea" rows="5" data-lead-paste placeholder="Επικόλλησε εδώ τις γραμμές (CSV) από Excel/Sheets..."></textarea>
        <div class="pill-row" style="margin-top:10px">
          <button class="btn" data-lead-action="parse-paste">👁️ Ανάλυση</button>
        </div>
      </div>
    </section>

    ${pending.length ? `
    <section class="panel" style="border-color:var(--primary)">
      <div class="panel-head"><h2>✅ Βρέθηκαν ${pending.length} εγγραφές</h2></div>
      <div class="panel-body">
        <div class="tlist" style="margin-bottom:12px">
          ${preview.map((l) => `
            <div class="trow">
              <span class="t-badge out">👤</span>
              <div class="t-main">
                <div class="t-title">${escapeHtml(l.name || "—")}</div>
                <div class="t-sub">${escapeHtml(l.phone || "")} · ${escapeHtml(l.search_type || "")} ${escapeHtml(l.property_type || "")} ${l.price_max ? "· έως " + escapeHtml(String(l.price_max)) + "€" : ""}</div>
              </div>
            </div>`).join("")}
        </div>
        <div class="pill-row">
          <button class="btn primary" data-lead-action="import-add">⬆️ Προσθήκη (χωρίς διπλότυπα)</button>
          <button class="btn danger" data-lead-action="import-replace">♻️ Αντικατάσταση όλων</button>
          <button class="btn" data-lead-action="import-cancel">Άκυρο</button>
        </div>
      </div>
    </section>` : ""}

    ${f.message ? `<div class="note-box" style="margin-bottom:16px">${escapeHtml(f.message)}</div>` : ""}

    <section class="panel">
      <div class="panel-head"><h2>💾 Δεδομένα</h2><span class="muted">${listLeads().length} ενδιαφερόμενοι</span></div>
      <div class="panel-body">
        <div class="setting-row">
          <div><div class="s-title">Εξαγωγή</div><div class="s-desc">Κατέβασε όλους τους ενδιαφερόμενους σε JSON.</div></div>
          <button class="btn" data-lead-action="export">⬇️ Εξαγωγή JSON</button>
        </div>
        <div class="setting-row">
          <div><div class="s-title text-danger">Διαγραφή όλων</div><div class="s-desc">Αφαιρεί όλους τους ενδιαφερόμενους.</div></div>
          <button class="btn danger" data-lead-action="clear">🗑️ Διαγραφή όλων</button>
        </div>
      </div>
    </section>
  `;
}

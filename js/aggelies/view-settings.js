import { stats, TYPES } from "./store.js";
import { escapeHtml } from "../utils.js";

export function viewSettings(ctx) {
  const s = stats();
  const f = ctx.aggelies;
  return `
    <div class="view-head"><div><h1>Αγγελίες — Δεδομένα</h1><p>Εισαγωγή, εξαγωγή και καθαρισμός</p></div></div>

    <section class="panel">
      <div class="panel-head"><h2>📥 Εισαγωγή αγγελιών</h2><span class="muted">${s.total} αγγελίες</span></div>
      <div class="panel-body">
        <p class="text-muted" style="margin-top:0">Δέχεται <b>JSON</b> (π.χ. το backup του xe.gr) ή <b>CSV/Excel</b> με στήλες: Κωδικός, Τύπος, τ.μ., Τιμή, Διεύθυνση, Τηλέφωνο, Κατάσταση, Σημειώσεις.</p>
        <div class="pill-row">
          <button class="btn primary" data-agg-action="pick-file">📎 Επιλογή αρχείου (JSON / CSV / Excel)</button>
        </div>
        ${f.message ? `<div class="note-box" style="margin-top:12px">${escapeHtml(f.message)}</div>` : ""}
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><h2>💾 Δεδομένα</h2></div>
      <div class="panel-body">
        <div class="setting-row">
          <div><div class="s-title">Εξαγωγή</div><div class="s-desc">Κατέβασε όλες τις αγγελίες σε JSON.</div></div>
          <button class="btn" data-agg-action="export">⬇️ Εξαγωγή JSON</button>
        </div>
        <div class="setting-row">
          <div><div class="s-title text-danger">Διαγραφή όλων</div><div class="s-desc">Αφαιρεί όλες τις αγγελίες.</div></div>
          <button class="btn danger" data-agg-action="clear">🗑️ Διαγραφή όλων</button>
        </div>
      </div>
    </section>
  `;
}

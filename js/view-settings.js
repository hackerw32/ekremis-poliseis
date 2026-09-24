import { isFirebaseConfigured } from "./config.js";
import { escapeHtml } from "./utils.js";

export function viewSettings(ctx) {
  const { state, ui } = ctx;
  const fb = isFirebaseConfigured();

  const modeBadge = fb
    ? `<span class="pill st-ok">Firebase (συγχρονισμός)</span>`
    : `<span class="pill st-anamoni">Τοπική αποθήκευση (localStorage)</span>`;

  return `
    <div class="view-head">
      <div><h1>Ρυθμίσεις</h1><p>Δεδομένα, συγχρονισμός και εμφάνιση</p></div>
    </div>

    <section class="panel">
      <div class="panel-head"><h2>🔄 Συγχρονισμός δεδομένων</h2>${modeBadge}</div>
      <div class="panel-body">
        <div class="setting-row">
          <div>
            <div class="s-title">Κατάσταση</div>
            <div class="s-desc">
              ${fb
                ? "Τα δεδομένα συγχρονίζονται αυτόματα σε όλες τις συσκευές μέσω Firebase Firestore."
                : "Η εφαρμογή αποθηκεύει τα δεδομένα τοπικά στον browser. Για συγχρονισμό κινητού & υπολογιστή, σύνδεσε το Firebase (οδηγίες στο README.md)."}
            </div>
          </div>
          ${state.error ? `<span class="pill danger">Σφάλμα</span>` : `<span class="pill st-ok">OK</span>`}
        </div>
        ${state.error ? `<div class="note-box" style="margin-top:10px">${escapeHtml(state.error)}</div>` : ""}
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><h2>💾 Δεδομένα</h2><span class="muted">${state.properties.length} υποθέσεις</span></div>
      <div class="panel-body">
        <div class="setting-row">
          <div>
            <div class="s-title">Εξαγωγή (backup)</div>
            <div class="s-desc">Κατέβασε όλα τα δεδομένα σε αρχείο JSON.</div>
          </div>
          <button class="btn" data-action="export">⬇️ Εξαγωγή JSON</button>
        </div>
        <div class="setting-row">
          <div>
            <div class="s-title">Εισαγωγή</div>
            <div class="s-desc">Φόρτωσε δεδομένα από αρχείο JSON (προστίθενται ή αντικαθιστούν τα υπάρχοντα).</div>
          </div>
          <div class="pill-row">
            <button class="btn" data-action="import-add">➕ Προσθήκη</button>
            <button class="btn" data-action="import-replace">♻️ Αντικατάσταση</button>
          </div>
        </div>
        <div class="setting-row">
          <div>
            <div class="s-title">Επαναφορά αρχικών δεδομένων</div>
            <div class="s-desc">Επαναφέρει τις υποθέσεις από το αρχικό αρχείο. Οι τρέχουσες αλλαγές διαγράφονται.</div>
          </div>
          <button class="btn" data-action="reset-seed">🔄 Επαναφορά</button>
        </div>
        <div class="setting-row">
          <div>
            <div class="s-title text-danger">Διαγραφή όλων</div>
            <div class="s-desc">Αφαιρεί όλες τις υποθέσεις. Δεν αναιρείται.</div>
          </div>
          <button class="btn danger" data-action="clear-all">🗑️ Διαγραφή όλων</button>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><h2>🎨 Εμφάνιση</h2></div>
      <div class="panel-body">
        <div class="setting-row">
          <div><div class="s-title">Θέμα</div><div class="s-desc">Φωτεινό ή σκούρο θέμα.</div></div>
          <div class="pill-row">
            <button class="chip ${ui.theme === "light" ? "active" : ""}" data-theme-set="light">☀️ Φωτεινό</button>
            <button class="chip ${ui.theme === "dark" ? "active" : ""}" data-theme-set="dark">🌙 Σκούρο</button>
          </div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><h2>ℹ️ Σχετικά</h2></div>
      <div class="panel-body">
        <div class="setting-row">
          <div>
            <div class="s-title">Εκκρεμείς Πωλήσεις — Dashboard</div>
            <div class="s-desc">Εφαρμογή διαχείρισης εκκρεμών πωλήσεων. Λειτουργεί σε κινητό και υπολογιστή. Hosted στο GitHub Pages.</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

import { escapeHtml, formatDate } from "../utils.js";

function section(title, body) {
  if (!body) return "";
  return `<div class="doc-section"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body).replace(/\n/g, "<br>")}</p></div>`;
}

export function buildDocHTML(doc, s) {
  const co = s.company || {};
  const le = s.letter || {};
  const bankName = doc.bank_name || le.bank_name || "";
  const bankIban = doc.bank_iban || le.bank_iban || "";
  const closing = doc.closing || le.closing || "";

  const works = (doc.works || []).filter(Boolean);
  const worksHtml = works.length
    ? `<div class="doc-section"><h3>${escapeHtml(doc.works_intro || "ΕΡΓΑΣΙΑΙ ΜΗΧΑΝΙΚΟΥ")}</h3>
        <ol class="works">${works.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ol></div>`
    : "";

  const areaRows = [
    ["Συμβόλαιο / τίτλος", doc.area_contract],
    ["Έκταση ακινήτου", doc.area_property],
    ["Ανοχή", doc.tolerance],
  ].filter(([, v]) => v);

  const feeHtml = doc.fee
    ? `<div class="doc-section fee">
        <p><strong>ΑΜΟΙΒΗ:</strong> ${escapeHtml(doc.fee)} ${escapeHtml(doc.fee_note || "")}</p>
        ${doc.installments ? `<p>${escapeHtml(doc.installments)}</p>` : ""}
        ${s.appearance && s.appearance.show_bank && (bankName || bankIban) ? `<p class="bank">${escapeHtml(bankName)} ${bankIban ? "· IBAN " + escapeHtml(bankIban) : ""}</p>` : ""}
      </div>`
    : "";

  return `
  <div class="doc">
    <header class="doc-head">
      <div>
        <h1>${escapeHtml(co.line1 || "")}</h1>
        <h2>${escapeHtml(co.line2 || "")}</h2>
        <div class="since">${escapeHtml(co.since || "")}</div>
      </div>
      <div class="doc-head-right">
        ${escapeHtml(co.engineer || "")}<br>
        <small>${escapeHtml(co.engineer_title || "")}</small>
      </div>
    </header>
    <div class="slogan">${escapeHtml(le.slogan || "")}</div>
    <hr>

    <h2 class="doc-title">${escapeHtml(doc.doc_type || "")}</h2>

    <table class="doc-meta">
      ${doc.protocol ? `<tr><td>Α/Π:</td><td>${escapeHtml(doc.protocol)}</td></tr>` : ""}
      ${doc.doc_date ? `<tr><td>Ημερομηνία:</td><td>${escapeHtml(formatDate(doc.doc_date))}</td></tr>` : ""}
      ${doc.recipient ? `<tr><td>Προς:</td><td>${escapeHtml((doc.recipient_prefix ? doc.recipient_prefix + " " : "") + doc.recipient)}</td></tr>` : ""}
      ${doc.property_location ? `<tr><td>Θέση:</td><td>${escapeHtml(doc.property_location)}${doc.municipality ? " — Δήμος " + escapeHtml(doc.municipality) : ""}</td></tr>` : ""}
    </table>

    ${section("", doc.intro)}
    ${areaRows.length ? `<div class="doc-section"><h3>ΣΤΟΙΧΕΙΑ ΑΚΙΝΗΤΟΥ</h3><table class="doc-meta">${areaRows.map(([k, v]) => `<tr><td>${escapeHtml(k)}:</td><td>${escapeHtml(v)}</td></tr>`).join("")}</table></div>` : ""}
    ${section("ΣΤΟΙΧΕΙΑ ΙΔΙΟΚΤΗΣΙΑΣ", doc.ownership)}
    ${section("ΠΟΛΕΟΔΟΜΙΚΟΣ - ΚΤΗΜΑΤΟΛΟΓΙΚΟΣ - ΔΑΣΙΚΟΣ ΕΛΕΓΧΟΣ", doc.control)}
    ${worksHtml}
    ${section("ΠΑΡΑΤΗΡΗΣΕΙΣ / ΥΠΟΧΡΕΩΣΕΙΣ", doc.notes)}
    ${feeHtml}
    ${closing ? `<p class="closing">${escapeHtml(closing)}</p>` : ""}

    <div class="sign">
      <div class="sign-line"></div>
      <div>${escapeHtml(co.engineer || "")}</div>
      <div class="sign-sub">${escapeHtml(co.engineer_title || "")}</div>
    </div>

    <footer class="doc-foot">
      ${escapeHtml(co.address || "")}<br>
      ${escapeHtml(co.afm || "")} · ${escapeHtml(co.phones || "")}${co.email ? " · " + escapeHtml(co.email) : ""}
    </footer>
  </div>`;
}

export function printDoc(doc, s) {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(`<!doctype html><html lang="el"><head><meta charset="utf-8"><title>${escapeHtml(doc.doc_type || "Τεχνικός Έλεγχος")}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:Arial,"Segoe UI",sans-serif;color:#1a1a1a;margin:0;padding:18mm 16mm;font-size:12.5px;line-height:1.5}
    .doc{max-width:190mm;margin:0 auto}
    .doc-head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #C6951E;padding-bottom:10px}
    .doc-head h1{margin:0;font-size:19px;color:#1A1A1A;letter-spacing:.5px}
    .doc-head h2{margin:2px 0;font-size:12px;font-weight:400;color:#5A5A5A;letter-spacing:2px}
    .since{font-size:10px;color:#8a7a4a}
    .doc-head-right{text-align:right;font-size:12px;font-weight:700;color:#1A1A1A}
    .doc-head-right small{font-weight:400;color:#5A5A5A;font-size:10px}
    .slogan{text-align:center;font-size:10.5px;color:#8a7a4a;letter-spacing:1px;margin:8px 0}
    hr{border:none;border-top:1px solid #D8CEB6;margin:6px 0 18px}
    .doc-title{text-align:center;font-size:15px;letter-spacing:1px;margin:0 0 16px;color:#1A1A1A}
    .doc-meta{width:100%;border-collapse:collapse;margin:0 0 10px}
    .doc-meta td{padding:2px 6px;font-size:12px;vertical-align:top}
    .doc-meta td:first-child{color:#5A5A5A;width:130px;font-weight:700}
    .doc-section{margin:0 0 12px}
    .doc-section h3{font-size:12px;color:#8a6d1a;margin:0 0 4px;letter-spacing:.5px}
    .doc-section p{margin:0;text-align:justify}
    ol.works{margin:4px 0 0 18px;padding:0}
    ol.works li{margin-bottom:3px}
    .fee{background:#F7F3E8;border:1px solid #D8CEB6;padding:10px 12px;border-radius:6px}
    .bank{color:#5A5A5A}
    .closing{margin-top:18px}
    .sign{margin-top:40px;text-align:center;width:70mm;margin-left:auto}
    .sign-line{border-top:1px solid #1A1A1A;margin-bottom:4px}
    .sign-sub{font-size:10px;color:#5A5A5A}
    .doc-foot{margin-top:34px;border-top:1px solid #D8CEB6;padding-top:8px;font-size:10px;color:#5A5A5A;text-align:center}
    @media print{@page{size:A4;margin:0}}
  </style></head><body>${buildDocHTML(doc, s)}</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 350);
  return true;
}

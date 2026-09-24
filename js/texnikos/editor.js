import { DOC_TYPES, WORK_LIBRARY, INTRO_TEMPLATES, OWNERSHIP_TEMPLATES, CONTROL_TEMPLATES, NOTE_TEMPLATES, FULL_PRESETS, FEE_NOTES, fillTemplate } from "./presets.js";
import { escapeHtml } from "../utils.js";

function workRow(value) {
  return `<div class="work-item" data-work-row>
    <input class="input" data-work value="${escapeHtml(value)}" />
    <button type="button" class="mini-btn" data-work-up title="Πάνω">↑</button>
    <button type="button" class="mini-btn" data-work-down title="Κάτω">↓</button>
    <button type="button" class="mini-btn danger" data-work-del title="Αφαίρεση">✕</button>
  </div>`;
}

function tmplButtons(kind, map) {
  return `<div class="tmpl-row">${Object.keys(map).map((k) => `<button type="button" class="chip" data-tmpl="${kind}" data-tmpl-key="${escapeHtml(k)}">${escapeHtml(k)}</button>`).join("")}</div>`;
}

export function editorBody(doc) {
  const v = (k, d = "") => escapeHtml(doc[k] ?? d);
  return `
    <form id="tex-form" autocomplete="off">
      <div class="sec-title">Στοιχεία εγγράφου</div>
      <div class="form-grid">
        <div class="field"><label>Α/Π</label><input class="input" data-field="protocol" value="${v("protocol")}" /></div>
        <div class="field"><label>Ημ/νία εγγράφου</label><input class="input" type="date" data-field="doc_date" value="${v("doc_date")}" /></div>
        <div class="field"><label>Ημ/νία συζήτησης</label><input class="input" data-field="talk_date" value="${v("talk_date")}" placeholder="π.χ. 12/05/2026" /></div>
        <div class="field"><label>Τύπος εγγράφου</label><select class="select" data-field="doc_type">
          ${DOC_TYPES.map((t) => `<option ${doc.doc_type === t ? "selected" : ""}>${escapeHtml(t)}</option>`).join("")}
        </select></div>
        <div class="field"><label>Θέση ακινήτου</label><input class="input" data-field="property_location" value="${v("property_location")}" /></div>
        <div class="field"><label>Δήμος</label><input class="input" data-field="municipality" value="${v("municipality")}" /></div>
        <div class="field"><label>Προσφώνηση</label><select class="select" data-field="recipient_prefix">
          ${["Κον", "Κα", "Κο", "Κύριο", "Κυρία"].map((p) => `<option ${doc.recipient_prefix === p ? "selected" : ""}>${p}</option>`).join("")}
        </select></div>
        <div class="field"><label>Παραλήπτης</label><input class="input" data-field="recipient" value="${v("recipient")}" /></div>
      </div>

      <div class="sec-title">Εισαγωγή</div>
      ${tmplButtons("intro", INTRO_TEMPLATES)}
      <textarea class="textarea" rows="4" data-field="intro">${v("intro")}</textarea>

      <div class="sec-title">Στοιχεία ιδιοκτησίας</div>
      ${tmplButtons("ownership", OWNERSHIP_TEMPLATES)}
      <textarea class="textarea" rows="4" data-field="ownership">${v("ownership")}</textarea>
      <div class="form-grid" style="margin-top:10px">
        <div class="field"><label>Συμβόλαιο / τίτλος</label><input class="input" data-field="area_contract" value="${v("area_contract")}" /></div>
        <div class="field"><label>Έκταση ακινήτου</label><input class="input" data-field="area_property" value="${v("area_property")}" /></div>
        <div class="field"><label>Ανοχή</label><input class="input" data-field="tolerance" value="${v("tolerance")}" /></div>
      </div>

      <div class="sec-title">Πολεοδομικός - Κτηματολογικός - Δασικός έλεγχος</div>
      ${tmplButtons("control", CONTROL_TEMPLATES)}
      <textarea class="textarea" rows="4" data-field="control">${v("control")}</textarea>

      <div class="sec-title">Εργασίες μηχανικού</div>
      <div class="form-grid">
        <div class="field full"><label>Τίτλος εργασιών</label><input class="input" data-field="works_intro" value="${v("works_intro")}" /></div>
        <div class="field full"><label>Έτοιμο πακέτο</label><select class="select" data-works-preset>
          <option value="">— επιλογή —</option>
          ${Object.keys(FULL_PRESETS).map((k) => `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join("")}
        </select></div>
      </div>
      <div data-works>${(doc.works || []).map(workRow).join("")}</div>
      <div class="work-add">
        <input class="input" list="work-lib" data-works-new placeholder="Προσθήκη εργασίας..." />
        <button type="button" class="btn sm" data-work-add>＋</button>
      </div>
      <datalist id="work-lib">${WORK_LIBRARY.map((w) => `<option value="${escapeHtml(w)}"></option>`).join("")}</datalist>

      <div class="sec-title">Παρατηρήσεις / Υποχρεώσεις</div>
      ${tmplButtons("notes", NOTE_TEMPLATES)}
      <textarea class="textarea" rows="3" data-field="notes">${v("notes")}</textarea>

      <div class="sec-title">Αμοιβή</div>
      <div class="form-grid">
        <div class="field"><label>Ποσό (€)</label><input class="input" data-field="fee" value="${v("fee")}" /></div>
        <div class="field"><label>Σημείωση αμοιβής</label><select class="select" data-field="fee_note">
          ${FEE_NOTES.map((f) => `<option ${doc.fee_note === f ? "selected" : ""}>${escapeHtml(f)}</option>`).join("")}
        </select></div>
        <div class="field"><label>Δόσεις / ευκολίες</label><input class="input" data-field="installments" value="${v("installments")}" /></div>
        <div class="field"><label>Τράπεζα</label><input class="input" data-field="bank_name" value="${v("bank_name")}" /></div>
        <div class="field"><label>IBAN</label><input class="input" data-field="bank_iban" value="${v("bank_iban")}" /></div>
        <div class="field"><label>Κατακλείδα</label><input class="input" data-field="closing" value="${v("closing")}" placeholder="προαιρετικό" /></div>
      </div>
    </form>`;
}

function tplValues(root) {
  const g = (k) => {
    const el = root.querySelector(`[data-field="${k}"]`);
    const val = el ? el.value.trim() : "";
    return val || "………";
  };
  return { talk_date: g("talk_date"), location: g("property_location"), municipality: g("municipality"), contract: g("protocol") };
}

export function bindEditor(root) {
  const setVal = (key, text) => {
    const el = root.querySelector(`[data-field="${key}"]`);
    if (el) el.value = text;
  };

  root.querySelectorAll("[data-tmpl]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const map = { intro: INTRO_TEMPLATES, ownership: OWNERSHIP_TEMPLATES, control: CONTROL_TEMPLATES, notes: NOTE_TEMPLATES }[btn.dataset.tmpl];
      const key = btn.dataset.tmplKey;
      const target = btn.dataset.tmpl === "notes" ? "notes" : btn.dataset.tmpl;
      const values = tplValues(root);
      if (btn.dataset.tmpl === "notes") {
        const cur = root.querySelector('[data-field="notes"]');
        cur.value = (cur.value ? cur.value + "\n" : "") + map[key];
      } else {
        setVal(target, fillTemplate(map[key], values));
      }
    });
  });

  const presetSel = root.querySelector("[data-works-preset]");
  presetSel.addEventListener("change", () => {
    const p = FULL_PRESETS[presetSel.value];
    if (!p) return;
    root.querySelector("[data-field='works_intro']").value = p.works_intro || "";
    root.querySelector("[data-works]").innerHTML = (p.works || []).map(workRow).join("");
    if (p.fee) setVal("fee", String(p.fee));
    if (p.fee_note) setVal("fee_note", p.fee_note);
  });

  const addWork = () => {
    const input = root.querySelector("[data-works-new]");
    const val = input.value.trim();
    if (!val) return;
    root.querySelector("[data-works]").insertAdjacentHTML("beforeend", workRow(val));
    input.value = "";
    input.focus();
  };
  root.querySelector("[data-work-add]").addEventListener("click", addWork);
  root.querySelector("[data-works-new]").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addWork();
    }
  });

  root.addEventListener("click", (e) => {
    const row = e.target.closest("[data-work-row]");
    if (!row) return;
    if (e.target.closest("[data-work-del]")) row.remove();
    else if (e.target.closest("[data-work-up]")) {
      const prev = row.previousElementSibling;
      if (prev) prev.before(row);
    } else if (e.target.closest("[data-work-down]")) {
      const next = row.nextElementSibling;
      if (next) next.after(row);
    }
  });
}

export function readEditor(root) {
  const g = (k) => {
    const el = root.querySelector(`[data-field="${k}"]`);
    return el ? el.value.trim() : "";
  };
  const works = [];
  root.querySelectorAll("[data-work]").forEach((i) => {
    const val = i.value.trim();
    if (val) works.push(val);
  });
  return {
    protocol: g("protocol"),
    doc_date: g("doc_date"),
    talk_date: g("talk_date"),
    recipient_prefix: g("recipient_prefix"),
    recipient: g("recipient"),
    doc_type: g("doc_type"),
    property_location: g("property_location"),
    municipality: g("municipality"),
    intro: g("intro"),
    ownership: g("ownership"),
    control: g("control"),
    notes: g("notes"),
    area_contract: g("area_contract"),
    area_property: g("area_property"),
    tolerance: g("tolerance"),
    works_intro: g("works_intro"),
    works,
    fee: g("fee"),
    fee_note: g("fee_note"),
    installments: g("installments"),
    bank_name: g("bank_name"),
    bank_iban: g("bank_iban"),
    closing: g("closing"),
  };
}

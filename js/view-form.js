import { STATUSES, escapeHtml } from "./utils.js";

const TYPES = ["πώληση", "ενοικίαση", "αγορά", "εκτίμηση", "άλλο"];

const REPEAT = {
  contacts: {
    cls: "contacts-row",
    head: ["Ρόλος", "Όνομα", "Τηλέφωνο", "Email"],
    fields: [
      { k: "role", ph: "π.χ. Συμβολαιογράφος" },
      { k: "name", ph: "Όνομα" },
      { k: "phone", ph: "Τηλέφωνο" },
      { k: "email", ph: "Email" },
    ],
  },
  tasks: {
    cls: "tasks-row",
    head: ["Εργασία", "Υπεύθυνος", "Προθεσμία"],
    fields: [
      { k: "title", ph: "Περιγραφή εκκρεμότητας", full: true },
      { k: "owner", ph: "Υπεύθυνος" },
      { k: "due", ph: "", type: "date" },
    ],
    doneKey: "done",
  },
  debts: {
    cls: "debts-row",
    head: ["Περιγραφή", "Ποσό (€)", "Σημείωση"],
    fields: [
      { k: "label", ph: "π.χ. Αμοιβή μηχανικού" },
      { k: "amount", ph: "0", type: "number" },
      { k: "note", ph: "Σημείωση" },
    ],
    doneKey: "settled",
  },
  interested: {
    cls: "contacts-row",
    head: ["Όνομα", "Τηλέφωνο", "Email", "Σημείωση"],
    fields: [
      { k: "name", ph: "Όνομα" },
      { k: "phone", ph: "Τηλέφωνο" },
      { k: "email", ph: "Email" },
      { k: "note", ph: "π.χ. Προσφορά 65.000 €" },
    ],
  },
};

function rowHtml(group, item = {}) {
  const tpl = REPEAT[group];
  const fields = tpl.fields.map((f) => {
    const val = item[f.k] ?? "";
    const cls = f.full ? "class='input row-full'" : "class='input'";
    const type = f.type || "text";
    return `<input ${cls} type="${type}" data-field="${f.k}" placeholder="${escapeHtml(f.ph || "")}" value="${escapeHtml(val)}" />`;
  }).join("");
  const doneKey = tpl.doneKey;
  const doneAttr = doneKey && item[doneKey] ? `data-done="true"` : "";
  return `<div class="repeat-row ${tpl.cls}" data-row ${doneAttr}>${fields}<button type="button" class="remove-btn" data-remove-row="1" title="Αφαίρεση">✕</button></div>`;
}

export function repeatHead(group) {
  const tpl = REPEAT[group];
  return `<div class="repeat-head ${tpl.cls}">${tpl.head.map((h) => `<span>${escapeHtml(h)}</span>`).join("")}<span></span></div>`;
}

export function propertyFormBody(p) {
  const val = (k) => escapeHtml(p[k] ?? "");

  return `
    <form id="property-form" autocomplete="off">
      <div class="sec-title">Στοιχεία υπόθεσης</div>
      <div class="form-grid">
        <div class="field"><label>Κωδικός</label><input class="input" data-field="code" value="${val("code")}" placeholder="π.χ. 4036" /></div>
        <div class="field"><label>Τίτλος / Επωνυμία</label><input class="input" data-field="title" value="${val("title")}" placeholder="π.χ. Τσίρμπας Άγγελος" /></div>
        <div class="field"><label>Τύπος</label>
          <select class="select" data-field="type">
            ${TYPES.map((t) => `<option value="${escapeHtml(t)}" ${p.type === t ? "selected" : ""}>${escapeHtml(t)}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Κατάσταση</label>
          <select class="select" data-field="status">
            ${STATUSES.map((s) => `<option value="${escapeHtml(s.id)}" ${p.status === s.id ? "selected" : ""}>${escapeHtml(s.id)}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Διαθεσιμότητα</label><input class="input" data-field="availability" value="${val("availability")}" placeholder="π.χ. Σεπτέμβριος 2027" /></div>
        <div class="field"><label>Σημείωση διαθεσιμότητας</label><input class="input" data-field="availabilityNote" value="${val("availabilityNote")}" placeholder="προαιρετικό" /></div>
      </div>

      <div class="sec-title">Οικονομικά</div>
      <div class="form-grid">
        <div class="field"><label>Τίμημα (€)</label><input class="input" type="number" data-field="price" value="${val("price")}" placeholder="0" /></div>
        <div class="field"><label>Προκαταβολή (€)</label><input class="input" type="number" data-field="depositAmount" value="${val("depositAmount")}" placeholder="0" /></div>
        <div class="field"><label>Ημερομηνία προκαταβολής</label><input class="input" type="date" data-field="depositDate" value="${val("depositDate")}" /></div>
        <div class="field"><label>Σημείωση προκαταβολής</label><input class="input" data-field="depositNote" value="${val("depositNote")}" placeholder="π.χ. την έλαβε ο πωλητής" /></div>
      </div>

      <div class="sec-title">Πωλητής</div>
      <div class="form-grid">
        <div class="field"><label>Ονοματεπώνυμο</label><input class="input" data-field="seller" value="${val("seller")}" /></div>
        <div class="field"><label>Τηλέφωνο</label><input class="input" data-field="sellerPhone" value="${val("sellerPhone")}" /></div>
        <div class="field full"><label>Email</label><input class="input" data-field="sellerEmail" value="${val("sellerEmail")}" /></div>
      </div>

      <div class="sec-title">Αγοραστής</div>
      <div class="form-grid">
        <div class="field"><label>Ονοματεπώνυμο</label><input class="input" data-field="buyer" value="${val("buyer")}" /></div>
        <div class="field"><label>Τηλέφωνο</label><input class="input" data-field="buyerPhone" value="${val("buyerPhone")}" /></div>
        <div class="field full"><label>Email</label><input class="input" data-field="buyerEmail" value="${val("buyerEmail")}" /></div>
      </div>

      <div class="sec-title">Λοιπές επαφές (δικηγόροι, συμβολαιογράφοι, μηχανικοί)</div>
      ${repeatHead("contacts")}
      <div data-group="contacts">${(p.contacts || []).map((c) => rowHtml("contacts", c)).join("")}</div>
      <button type="button" class="add-repeat" data-add-row="contacts">+ Προσθήκη επαφής</button>

      <div class="sec-title">Ενδιαφερόμενοι</div>
      ${repeatHead("interested")}
      <div data-group="interested">${(p.interested || []).map((c) => rowHtml("interested", c)).join("")}</div>
      <button type="button" class="add-repeat" data-add-row="interested">+ Προσθήκη ενδιαφερόμενου</button>

      <div class="sec-title">Εκκρεμότητες</div>
      ${repeatHead("tasks")}
      <div data-group="tasks">${(p.tasks || []).map((t) => rowHtml("tasks", t)).join("")}</div>
      <button type="button" class="add-repeat" data-add-row="tasks">+ Προσθήκη εκκρεμότητας</button>

      <div class="sec-title">Οφειλές</div>
      ${repeatHead("debts")}
      <div data-group="debts">${(p.debts || []).map((d) => rowHtml("debts", d)).join("")}</div>
      <button type="button" class="add-repeat" data-add-row="debts">+ Προσθήκη οφειλής</button>

      <div class="sec-title">Σημειώσεις</div>
      <div class="field">
        <textarea class="textarea" data-field="notes" rows="4" placeholder="Ελεύθερες σημειώσεις...">${val("notes")}</textarea>
      </div>
    </form>
  `;
}

export function bindForm(root) {
  root.querySelectorAll("[data-add-row]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.dataset.addRow;
      const container = root.querySelector(`[data-group="${group}"]`);
      container.insertAdjacentHTML("beforeend", rowHtml(group, {}));
      const last = container.lastElementChild;
      const firstInput = last.querySelector("input");
      if (firstInput) firstInput.focus();
    });
  });

  root.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-remove-row]");
    if (rm) {
      const row = rm.closest("[data-row]");
      if (row) row.remove();
    }
  });
}

function readGroup(root, group, mapper) {
  const rows = root.querySelectorAll(`[data-group="${group}"] [data-row]`);
  const out = [];
  rows.forEach((row) => {
    const get = (k) => {
      const input = row.querySelector(`[data-field="${k}"]`);
      return input ? input.value.trim() : "";
    };
    const item = mapper(get, row);
    if (item) out.push(item);
  });
  return out;
}

function num(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(String(v).replace(",", "."));
  return isFinite(n) ? n : null;
}

export function readPropertyForm(root) {
  const form = root.querySelector("#property-form");
  const get = (k) => {
    const el = form.querySelector(`[data-field="${k}"]`);
    return el ? el.value.trim() : "";
  };

  return {
    code: get("code"),
    title: get("title"),
    type: get("type"),
    status: get("status"),
    availability: get("availability"),
    availabilityNote: get("availabilityNote"),
    price: num(get("price")),
    depositAmount: num(get("depositAmount")),
    depositDate: get("depositDate"),
    depositNote: get("depositNote"),
    seller: get("seller"),
    sellerPhone: get("sellerPhone"),
    sellerEmail: get("sellerEmail"),
    buyer: get("buyer"),
    buyerPhone: get("buyerPhone"),
    buyerEmail: get("buyerEmail"),
    notes: get("notes"),
    contacts: readGroup(root, "contacts", (g) => {
      const c = { role: g("role"), name: g("name"), phone: g("phone"), email: g("email") };
      return (c.role || c.name || c.phone || c.email) ? c : null;
    }),
    interested: readGroup(root, "interested", (g) => {
      const c = { name: g("name"), phone: g("phone"), email: g("email"), note: g("note") };
      return (c.name || c.phone || c.email) ? c : null;
    }),
    tasks: readGroup(root, "tasks", (g, row) => {
      const title = g("title");
      if (!title) return null;
      return { title, owner: g("owner"), due: g("due"), done: row.dataset.done === "true" };
    }),
    debts: readGroup(root, "debts", (g, row) => {
      const label = g("label");
      const amount = num(g("amount"));
      if (!label && !amount) return null;
      return { label, amount, note: g("note"), settled: row.dataset.done === "true" };
    }),
  };
}

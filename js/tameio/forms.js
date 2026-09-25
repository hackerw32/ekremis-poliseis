import * as store from "./store.js";
import { openDrawer, closeDrawer, confirmDialog } from "../modal.js";
import { toast } from "../toast.js";
import { PAYMENT_METHODS, INCOME_CATEGORIES, EXPENSE_CATEGORIES, JOB_STATUSES, SPECIALTIES } from "./constants.js";
import { formatCurrency, formatDate, todayISO, escapeHtml } from "../utils.js";

const opt = (list, sel, withEmpty = "—") => {
  const opts = list.map((o) => {
    const val = typeof o === "object" ? o.id : o;
    const label = typeof o === "object" ? o.label : o;
    return `<option value="${escapeHtml(val)}" ${String(sel) === String(val) ? "selected" : ""}>${escapeHtml(label)}</option>`;
  });
  return (withEmpty ? `<option value="">${escapeHtml(withEmpty)}</option>` : "") + opts.join("");
};

const get = (root, key) => {
  const el = root.querySelector(`[data-field="${key}"]`);
  return el ? el.value.trim() : "";
};
const num = (v) => {
  if (v === "" || v == null) return 0;
  const n = Number(String(v).replace(",", "."));
  return isFinite(n) ? n : 0;
};

function footer(saveLabel = "💾 Αποθήκευση") {
  return `<button class="btn" data-cancel>Άκυρο</button><span class="spacer"></span><button class="btn primary" data-save>${saveLabel}</button>`;
}

function bindFooter(root, onSave) {
  root.querySelector("[data-cancel]").addEventListener("click", closeDrawer);
  root.querySelector("[data-save]").addEventListener("click", async () => {
    try {
      await onSave();
    } catch (e) {
      toast("Σφάλμα: " + e.message, "err");
    }
  });
}

// ------------------------------- CLIENT / PARTNER --------------------------
function startArrow(cb) {
  cb();
}

export function openClientForm(client) {
  const isEdit = Boolean(client && client.id);
  const c = client || { name: "", phone: "", tax_id: "", address: "", notes: "" };
  startArrow(() => openDrawer({
    title: isEdit ? "Επεξεργασία πελάτη" : "Νέος πελάτης",
    body: `
      <div class="form-grid">
        <div class="field full"><label>Ονοματεπώνυμο</label><input class="input" data-field="name" value="${escapeHtml(c.name)}" /></div>
        <div class="field"><label>Τηλέφωνο</label><input class="input" data-field="phone" value="${escapeHtml(c.phone)}" /></div>
        <div class="field"><label>ΑΦΜ</label><input class="input" data-field="tax_id" value="${escapeHtml(c.tax_id)}" /></div>
        <div class="field full"><label>Διεύθυνση</label><input class="input" data-field="address" value="${escapeHtml(c.address)}" /></div>
        <div class="field full"><label>Σημειώσεις</label><textarea class="textarea" rows="3" data-field="notes">${escapeHtml(c.notes)}</textarea></div>
      </div>`,
    footer: footer(),
    onMount(root) {
      bindFooter(root, async () => {
        const data = { name: get(root, "name"), phone: get(root, "phone"), tax_id: get(root, "tax_id"), address: get(root, "address"), notes: get(root, "notes") };
        if (!data.name) return toast("Συμπλήρωσε όνομα", "err");
        if (isEdit) await store.updateClient(c.id, data);
        else await store.addClient(data);
        toast("Αποθηκεύτηκε", "ok");
        closeDrawer();
      });
    },
  }));
}

export function openPartnerForm(partner) {
  const isEdit = Boolean(partner && partner.id);
  const p = partner || { name: "", specialty: "", phone: "", tax_id: "", notes: "" };
  openDrawer({
    title: isEdit ? "Επεξεργασία συνεργάτη" : "Νέος συνεργάτης",
    body: `
      <div class="form-grid">
        <div class="field full"><label>Ονοματεπώνυμο</label><input class="input" data-field="name" value="${escapeHtml(p.name)}" /></div>
        <div class="field"><label>Ειδικότητα</label><select class="select" data-field="specialty">${opt(SPECIALTIES, p.specialty, "—")}</select></div>
        <div class="field"><label>Τηλέφωνο</label><input class="input" data-field="phone" value="${escapeHtml(p.phone)}" /></div>
        <div class="field"><label>ΑΦΜ</label><input class="input" data-field="tax_id" value="${escapeHtml(p.tax_id)}" /></div>
        <div class="field full"><label>Σημειώσεις</label><textarea class="textarea" rows="3" data-field="notes">${escapeHtml(p.notes)}</textarea></div>
      </div>`,
    footer: footer(),
    onMount(root) {
      bindFooter(root, async () => {
        const data = { name: get(root, "name"), specialty: get(root, "specialty"), phone: get(root, "phone"), tax_id: get(root, "tax_id"), notes: get(root, "notes") };
        if (!data.name) return toast("Συμπλήρωσε όνομα", "err");
        if (isEdit) await store.updatePartner(p.id, data);
        else await store.addPartner(data);
        toast("Αποθηκεύτηκε", "ok");
        closeDrawer();
      });
    },
  });
}

// ------------------------------- JOB ---------------------------------------
export function openJobForm(job) {
  const isEdit = Boolean(job && job.id);
  const j = job || { protocol_number: "", title: "", owner: "", location: "", client_id: "", partner_id: "", agreed_fee: 0, partner_fee: 0, status: "Εκκρεμεί", opened_date: todayISO(), notes: "" };
  const clientOpts = store.clients().map((c) => ({ id: c.id, label: c.name }));
  const partnerOpts = store.partners().map((p) => ({ id: p.id, label: p.name }));

  openDrawer({
    title: isEdit ? "Επεξεργασία υπόθεσης" : "Νέα υπόθεση (Α/Π)",
    body: `
      <div class="form-grid">
        <div class="field"><label>Α/Π (κωδικός)</label><input class="input" data-field="protocol_number" value="${escapeHtml(j.protocol_number)}" /></div>
        <div class="field"><label>Κατάσταση</label><select class="select" data-field="status">${opt(JOB_STATUSES, j.status, "")}</select></div>
        <div class="field full"><label>Τίτλος</label><input class="input" data-field="title" value="${escapeHtml(j.title)}" /></div>
        <div class="field"><label>Ιδιοκτήτης</label><input class="input" data-field="owner" value="${escapeHtml(j.owner)}" /></div>
        <div class="field"><label>Τοποθεσία</label><input class="input" data-field="location" value="${escapeHtml(j.location)}" /></div>
        <div class="field"><label>Πελάτης</label><select class="select" data-field="client_id">${opt(clientOpts, j.client_id, "—")}</select></div>
        <div class="field"><label>Συνεργάτης</label><select class="select" data-field="partner_id">${opt(partnerOpts, j.partner_id, "—")}</select></div>
        <div class="field"><label>Παίρνουμε από πελάτη (€)</label><input class="input" type="number" data-field="agreed_fee" value="${escapeHtml(j.agreed_fee)}" /></div>
        <div class="field"><label>Δίνουμε σε συνεργάτη (€)</label><input class="input" type="number" data-field="partner_fee" value="${escapeHtml(j.partner_fee)}" /></div>
        <div class="field full"><label>Καθαρό γραφείο</label><div class="net-box" data-net>—</div></div>
        <div class="field"><label>Ημ/νία έναρξης</label><input class="input" type="date" data-field="opened_date" value="${escapeHtml(j.opened_date)}" /></div>
        <div class="field full"><label>Σημειώσεις</label><textarea class="textarea" rows="3" data-field="notes">${escapeHtml(j.notes)}</textarea></div>
      </div>`,
    footer: footer(),
    onMount(root) {
      const agreedEl = root.querySelector('[data-field="agreed_fee"]');
      const partnerEl = root.querySelector('[data-field="partner_fee"]');
      const netEl = root.querySelector("[data-net]");
      const updNet = () => {
        const a = Number(agreedEl.value) || 0;
        const p = Number(partnerEl.value) || 0;
        netEl.textContent = `${(a - p).toLocaleString("el-GR")} €   ( παίρνουμε ${a.toLocaleString("el-GR")} − δίνουμε ${p.toLocaleString("el-GR")} )`;
      };
      agreedEl.addEventListener("input", updNet);
      partnerEl.addEventListener("input", updNet);
      updNet();

      bindFooter(root, async () => {
        const data = {
          protocol_number: get(root, "protocol_number"),
          title: get(root, "title"),
          owner: get(root, "owner"),
          location: get(root, "location"),
          client_id: get(root, "client_id") || null,
          partner_id: get(root, "partner_id") || null,
          agreed_fee: num(get(root, "agreed_fee")),
          partner_fee: num(get(root, "partner_fee")),
          status: get(root, "status") || "Εκκρεμεί",
          opened_date: get(root, "opened_date"),
          notes: get(root, "notes"),
        };
        if (isEdit) await store.updateJob(j.id, data);
        else await store.addJob(data);
        toast("Αποθηκεύτηκε", "ok");
        closeDrawer();
      });
    },
  });
}

// ------------------------------- TRANSACTION -------------------------------
export function openTransactionForm(preset = {}) {
  const t = preset.txn || null;
  const isEdit = Boolean(t && t.id);
  const base = t || {
    txn_date: todayISO(),
    txn_type: preset.type || "Έσοδο",
    amount: "",
    job_id: preset.jobId || "",
    client_id: preset.clientId || "",
    partner_id: preset.partnerId || "",
    category: "",
    payment_method: "Μετρητά",
    receipt_issued: false,
    description: "",
    notes: "",
  };
  const clientOpts = store.clients().map((c) => ({ id: c.id, label: c.name }));
  const partnerOpts = store.partners().map((p) => ({ id: p.id, label: p.name }));
  const jobOpts = store.jobs().map((j) => ({ id: j.id, label: [j.protocol_number, j.title].filter(Boolean).join(" · ") }));

  const catOptions = (type, sel) => opt(type === "Έσοδο" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES, sel, "—");

  openDrawer({
    title: isEdit ? "Επεξεργασία κίνησης" : (base.txn_type === "Έσοδο" ? "Νέα είσπραξη" : "Νέα πληρωμή"),
    body: `
      <div class="form-grid">
        <div class="field"><label>Τύπος</label><select class="select" data-field="txn_type">
          <option value="Έσοδο" ${base.txn_type === "Έσοδο" ? "selected" : ""}>Έσοδο (είσπραξη)</option>
          <option value="Έξοδο" ${base.txn_type === "Έξοδο" ? "selected" : ""}>Έξοδο (πληρωμή)</option>
        </select></div>
        <div class="field"><label>Ημ/νία</label><input class="input" type="date" data-field="txn_date" value="${escapeHtml(base.txn_date)}" /></div>
        <div class="field"><label>Ποσό (€)</label><input class="input" type="number" data-field="amount" value="${escapeHtml(base.amount)}" /></div>
        <div class="field"><label>Κατηγορία</label><select class="select" data-field="category" data-cat>${catOptions(base.txn_type, base.category)}</select></div>
        <div class="field"><label>Τρόπος πληρωμής</label><select class="select" data-field="payment_method">${opt(PAYMENT_METHODS, base.payment_method, "—")}</select></div>
        <div class="field"><label>Έκδοση απόδειξης</label>
          <label class="chip" style="justify-content:flex-start"><input type="checkbox" data-field="receipt_issued" ${base.receipt_issued ? "checked" : ""} /> Εκδόθηκε</label>
        </div>
        <div class="field full"><label>Πελάτης</label><select class="select" data-field="client_id">${opt(clientOpts, base.client_id, "—")}</select></div>
        <div class="field full"><label>Συνεργάτης</label><select class="select" data-field="partner_id">${opt(partnerOpts, base.partner_id, "—")}</select></div>
        <div class="field full"><label>Υπόθεση (Α/Π)</label><select class="select" data-field="job_id">${opt(jobOpts, base.job_id, "—")}</select></div>
        <div class="field full"><label>Περιγραφή</label><input class="input" data-field="description" value="${escapeHtml(base.description)}" /></div>
        <div class="field full"><label>Σημειώσεις</label><textarea class="textarea" rows="2" data-field="notes">${escapeHtml(base.notes)}</textarea></div>
      </div>`,
    footer: footer(),
    onMount(root) {
      const typeSel = root.querySelector('[data-field="txn_type"]');
      const catSel = root.querySelector('[data-cat]');
      typeSel.addEventListener("change", () => {
        catSel.innerHTML = catOptions(typeSel.value, "");
      });
      bindFooter(root, async () => {
        const data = {
          txn_date: get(root, "txn_date") || todayISO(),
          txn_type: get(root, "txn_type"),
          amount: num(get(root, "amount")),
          job_id: get(root, "job_id") || null,
          client_id: get(root, "client_id") || null,
          partner_id: get(root, "partner_id") || null,
          category: get(root, "category"),
          payment_method: get(root, "payment_method"),
          receipt_issued: root.querySelector('[data-field="receipt_issued"]').checked,
          description: get(root, "description"),
          notes: get(root, "notes"),
        };
        if (!data.amount) return toast("Συμπλήρωσε ποσό", "err");
        if (isEdit) await store.updateTransaction(t.id, data);
        else await store.addTransaction(data);
        toast("Αποθηκεύτηκε", "ok");
        closeDrawer();
      });
    },
  });
}

// ------------------------------- DETAIL / HISTORY --------------------------
export function openJobDetail(job) {
  const j = store.jobsWithMetrics().find((x) => x.id === job.id) || job;
  const txns = store.jobTxnCount(j.id);
  const txnHtml = txns.length
    ? txns.map((t) => `
        <div class="debt">
          <span class="t-badge ${t.txn_type === "Έσοδο" ? "in" : "out"}">${t.txn_type === "Έσοδο" ? "＋" : "－"}</span>
          <span class="d-label">${escapeHtml(t.description || t.category || t.txn_type)} <span class="text-muted" style="font-size:12px">${escapeHtml(formatDate(t.txn_date))}</span></span>
          <span class="d-amt">${formatCurrency(t.amount)}</span>
        </div>`).join("")
    : '<div class="text-muted" style="padding:8px 0">Καμία κίνηση.</div>';

  openDrawer({
    title: `${j.protocol_number ? j.protocol_number + " — " : ""}${j.title || j.owner || "Υπόθεση"}`,
    body: `
      <div class="pill-row" style="margin-bottom:14px">
        <span class="pill ${j.status === "Ολοκληρώθηκε" ? "st-ok" : "st-anamoni"}">${escapeHtml(j.status || "")}</span>
      </div>
      <div class="info-block"><div class="kv">
        <span class="k">Ιδιοκτήτης</span><span class="v">${escapeHtml(j.owner || "—")}</span>
        <span class="k">Τοποθεσία</span><span class="v">${escapeHtml(j.location || "—")}</span>
        <span class="k">Πελάτης</span><span class="v">${escapeHtml(j.client_name || "—")}</span>
        <span class="k">Συνεργάτης</span><span class="v">${escapeHtml(j.partner_name || "—")}</span>
        <span class="k">Παίρνουμε από πελάτη</span><span class="v">${formatCurrency(j.agreed_fee)}</span>
        <span class="k">Έχουμε εισπράξει</span><span class="v">${formatCurrency(j.received)}</span>
        <span class="k">Να εισπράξουμε</span><span class="v">${formatCurrency(j.client_pending)}</span>
        <span class="k">Δίνουμε σε συνεργάτη</span><span class="v">${formatCurrency(j.partner_fee)}</span>
        <span class="k">Έχουμε πληρώσει</span><span class="v">${formatCurrency(j.partner_paid)}</span>
        <span class="k">Να πληρώσουμε</span><span class="v text-danger">${formatCurrency(j.partner_pending)}</span>
        <span class="k">Καθαρό γραφείο</span><span class="v">${formatCurrency((Number(j.agreed_fee) || 0) - (Number(j.partner_fee) || 0))}</span>
      </div></div>
      ${j.notes ? `<div class="sec-title">Σημειώσεις</div><div class="notes-box">${escapeHtml(j.notes)}</div>` : ""}
      <div class="sec-title">Κινήσεις υπόθεσης</div>
      <div class="info-block" style="padding:6px 12px">${txnHtml}</div>`,
    footer: `
      <button class="btn" data-close>Κλείσιμο</button>
      <span class="spacer"></span>
      <button class="btn danger" data-del>🗑️</button>
      <button class="btn" data-income>＋ Είσπραξη</button>
      <button class="btn primary" data-edit>✏️ Επεξεργασία</button>`,
    onMount(root) {
      root.querySelector("[data-close]").addEventListener("click", closeDrawer);
      root.querySelector("[data-edit]").onclick = () => openJobForm(j);
      root.querySelector("[data-income]").onclick = () => openTransactionForm({ type: "Έσοδο", jobId: j.id, clientId: j.client_id });
      root.querySelector("[data-del]").onclick = async () => {
        const ok = await confirmDialog(`Να διαγραφεί η υπόθεση «${j.title || j.protocol_number}»;`);
        if (!ok) return;
        await store.removeJob(j.id);
        closeDrawer();
        toast("Διαγράφηκε", "ok");
      };
    },
  });
}

export function openPersonHistory(kind, id) {
  const isPartner = kind === "partners" || kind === "partner";
  const person = isPartner ? store.partners().find((p) => p.id === id) : store.clients().find((c) => c.id === id);
  if (!person) return;
  const txns = store.transactions().filter((t) => (isPartner ? t.partner_id : t.client_id) === id);
  const total = txns.reduce((a, t) => a + (t.txn_type === (isPartner ? "Έξοδο" : "Έσοδο") ? Number(t.amount) || 0 : 0), 0);
  const html = txns.length
    ? txns.map((t) => `
        <div class="debt">
          <span class="t-badge ${t.txn_type === "Έσοδο" ? "in" : "out"}">${t.txn_type === "Έσοδο" ? "＋" : "－"}</span>
          <span class="d-label">${escapeHtml(t.description || t.category || "")} <span class="text-muted" style="font-size:12px">${escapeHtml(formatDate(t.txn_date))}</span></span>
          <span class="d-amt">${formatCurrency(t.amount)}</span>
        </div>`).join("")
    : '<div class="text-muted" style="padding:8px 0">Καμία κίνηση.</div>';

  openDrawer({
    title: person.name,
    body: `
      <div class="info-block"><div class="kv">
        ${person.specialty ? `<span class="k">Ειδικότητα</span><span class="v">${escapeHtml(person.specialty)}</span>` : ""}
        <span class="k">Τηλέφωνο</span><span class="v">${escapeHtml(person.phone || "—")}</span>
        <span class="k">ΑΦΜ</span><span class="v">${escapeHtml(person.tax_id || "—")}</span>
        ${person.address ? `<span class="k">Διεύθυνση</span><span class="v">${escapeHtml(person.address)}</span>` : ""}
        <span class="k">${isPartner ? "Σύνολο πληρωμών" : "Σύνολο εισπράξεων"}</span><span class="v">${formatCurrency(total)}</span>
      </div></div>
      ${person.notes ? `<div class="sec-title">Σημειώσεις</div><div class="notes-box">${escapeHtml(person.notes)}</div>` : ""}
      <div class="sec-title">Ιστορικό κινήσεων (${txns.length})</div>
      <div class="info-block" style="padding:6px 12px">${html}</div>`,
    footer: `
      <button class="btn" data-close>Κλείσιμο</button><span class="spacer"></span>
      <button class="btn primary" data-edit>✏️ Επεξεργασία</button>`,
    onMount(root) {
      root.querySelector("[data-close]").addEventListener("click", closeDrawer);
      root.querySelector("[data-edit]").onclick = () => (isPartner ? openPartnerForm(person) : openClientForm(person));
    },
  });
}

// Απλή «Είσπραξη» που δημιουργεί σε ένα βήμα:
// συναλλαγή + υπόθεση + πωλητή/αγοραστή + υποχρέωση σε συνεργάτη.
import * as store from "./store.js";
import { openDrawer, closeDrawer } from "../modal.js";
import { toast } from "../toast.js";
import { INCOME_CATEGORIES, PAYMENT_METHODS } from "./constants.js";
import { formatCurrency, todayISO, escapeHtml } from "../utils.js";

const get = (root, k) => {
  const el = root.querySelector(`[data-field="${k}"]`);
  return el ? el.value.trim() : "";
};
const num = (v) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return isFinite(n) && v !== "" ? n : 0;
};
const opts = (list, sel, empty) =>
  (empty ? `<option value="">${escapeHtml(empty)}</option>` : "") +
  list
    .map((o) => {
      const val = typeof o === "object" ? o.id : o;
      const label = typeof o === "object" ? o.label : o;
      return `<option value="${escapeHtml(val)}" ${String(sel) === String(val) ? "selected" : ""}>${escapeHtml(label)}</option>`;
    })
    .join("");

export function openIncomeWizard(preset = {}) {
  const clientOptions = store.clients().map((c) => ({
    id: c.id,
    label: `${c.name}${c.code_technical ? " · Α/Π " + c.code_technical : ""}${c.code_realestate ? " · " + c.code_realestate : ""}`,
  }));
  const partnerOptions = store.partners().map((p) => ({ id: p.id, label: p.name }));

  openDrawer({
    title: "＋ Είσπραξη",
    body: `
      <div class="form-grid">
        <div class="field"><label>Ημερομηνία</label><input class="input" type="date" data-field="txn_date" value="${escapeHtml(preset.date || todayISO())}" /></div>
        <div class="field"><label>Ποσό που παίρνουμε (€)</label><input class="input" type="number" data-field="amount" value="${preset.amount || ""}" placeholder="150" /></div>
        <div class="field"><label>Κατηγορία</label><select class="select" data-field="category">${opts(INCOME_CATEGORIES, preset.category || "Αμοιβή τεχνικού ελέγχου", "")}</select></div>
        <div class="field"><label>Τρόπος πληρωμής</label><select class="select" data-field="payment_method">${opts(PAYMENT_METHODS, "Μετρητά", "—")}</select></div>
        <div class="field"><label>Κωδικός</label><input class="input" data-field="code" value="${escapeHtml(preset.code || "")}" placeholder="π.χ. 1234" /></div>
        <div class="field"><label>Τύπος κωδικού</label><select class="select" data-field="code_type">
          <option value="technical" ${preset.code_type === "technical" ? "selected" : ""}>Τεχνικό (Α/Π 1234)</option>
          <option value="realestate" ${preset.code_type === "realestate" ? "selected" : ""}>Μεσιτικό (1234)</option>
        </select></div>
        <div class="field"><label>Συνεργάτης που το αναλαμβάνει</label><select class="select" data-field="partner_id">${opts(partnerOptions, preset.partner_id || "", "—")}</select></div>
        <div class="field"><label>Ποσό για συνεργάτη (€) = υπόλοιπο</label><input class="input" type="number" data-field="partner_amount" value="${preset.partner_amount || ""}" placeholder="50" /></div>
        <div class="field full"><label>Καθαρό γραφείο</label><div class="net-box" data-net>—</div></div>
        <div class="field full"><label><input type="checkbox" data-field="receipt_issued" ${preset.receipt ? "checked" : ""} /> Κόπηκε απόδειξη</label></div>
      </div>

      <div class="sec-title">Πωλητής (σταθερός πελάτης γραφείου)</div>
      <div class="form-grid">
        <div class="field full"><label>Υπάρχων πελάτης</label><select class="select" data-field="seller_id">${opts(clientOptions, "", "— νέος πωλητής —")}</select></div>
        <div class="field"><label>ή Νέος πωλητής (όνομα)</label><input class="input" data-field="seller_new" placeholder="Όνομα πωλητή" /></div>
        <div class="field"><label>Τηλέφωνο πωλητή</label><input class="input" data-field="seller_phone" /></div>
      </div>

      <div class="sec-title">Αγοραστής (περιστασιακός)</div>
      <div class="form-grid">
        <div class="field"><label>Όνομα αγοραστή</label><input class="input" data-field="buyer_name" /></div>
        <div class="field"><label>Τηλέφωνο αγοραστή</label><input class="input" data-field="buyer_phone" /></div>
        <div class="field full"><label>Email αγοραστή</label><input class="input" data-field="buyer_email" /></div>
      </div>

      <div class="sec-title">Περιγραφή / Σημειώσεις</div>
      <div class="field"><textarea class="textarea" rows="3" data-field="notes" placeholder="π.χ. τεχνικός έλεγχος οικοπέδου κ. Β, ενδιαφέρεται ο κ. Α"></textarea></div>
    `,
    footer: `<button class="btn" data-cancel>Άκυρο</button><span class="spacer"></span><button class="btn primary" data-save>💾 Καταχώρηση</button>`,
    onMount(root) {
      const amountEl = root.querySelector('[data-field="amount"]');
      const partnerAmtEl = root.querySelector('[data-field="partner_amount"]');
      const netEl = root.querySelector("[data-net]");
      const updNet = () => {
        const a = num(amountEl.value);
        const p = num(partnerAmtEl.value);
        netEl.textContent = `${(a - p).toLocaleString("el-GR")} €   ( παίρνουμε ${a.toLocaleString("el-GR")} − δίνουμε ${p.toLocaleString("el-GR")} )`;
      };
      amountEl.addEventListener("input", updNet);
      partnerAmtEl.addEventListener("input", updNet);
      updNet();

      root.querySelector("[data-cancel]").addEventListener("click", closeDrawer);
      root.querySelector("[data-save]").addEventListener("click", async () => {
        const amount = num(get(root, "amount"));
        if (!amount) return toast("Συμπλήρωσε ποσό", "err");
        const codeType = get(root, "code_type");
        const rawCode = get(root, "code");
        const code = codeType === "technical" && rawCode ? `Α/Π ${rawCode}` : rawCode;
        const sellerId0 = get(root, "seller_id");
        const sellerNew = get(root, "seller_new");
        const buyerName = get(root, "buyer_name");
        const buyerPhone = get(root, "buyer_phone");

        try {
          let sellerId = sellerId0 || null;
          if (!sellerId && sellerNew) {
            sellerId = await store.addClient({
              name: sellerNew,
              phone: get(root, "seller_phone"),
              code_technical: codeType === "technical" ? rawCode : "",
              code_realestate: codeType === "realestate" ? rawCode : "",
              notes: "",
            });
          } else if (sellerId && rawCode) {
            const patch = codeType === "technical" ? { code_technical: rawCode } : { code_realestate: rawCode };
            await store.updateClient(sellerId, patch);
          }

          let buyerId = null;
          if (buyerName || buyerPhone) {
            buyerId = await store.addClient({ name: buyerName || buyerPhone, phone: buyerPhone, email: get(root, "buyer_email"), notes: "Αγοραστής (περιστασιακός)" });
          }

          const jobId = await store.addJob({
            protocol_number: code,
            title: get(root, "notes") || `Είσπραξη ${code}`,
            owner: sellerNew || "",
            location: "",
            client_id: buyerId,
            partner_id: get(root, "partner_id") || null,
            agreed_fee: amount,
            partner_fee: num(get(root, "partner_amount")),
            status: "Σε εξέλιξη",
            opened_date: get(root, "txn_date"),
            notes: "",
          });

          await store.addTransaction({
            txn_date: get(root, "txn_date") || todayISO(),
            txn_type: "Έσοδο",
            amount,
            job_id: jobId,
            client_id: buyerId,
            partner_id: null,
            category: get(root, "category") || "Άλλο",
            payment_method: get(root, "payment_method"),
            receipt_issued: root.querySelector('[data-field="receipt_issued"]').checked,
            description: get(root, "notes") || `Είσπραξη ${code}`,
            notes: "",
          });

          toast(`Καταχωρήθηκε ${formatCurrency(amount)}${code ? " — " + code : ""}`, "ok");
          closeDrawer();
        } catch (e) {
          toast("Σφάλμα: " + e.message, "err");
        }
      });
    },
  });
}

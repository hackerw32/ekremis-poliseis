import * as store from "./store.js";
import { TYPES, STATUS, statusLabel } from "./store.js";
import { openDrawer, closeDrawer, confirmDialog } from "../modal.js";
import { toast } from "../toast.js";
import { formatCurrency, escapeHtml } from "../utils.js";

const get = (root, k) => {
  const el = root.querySelector(`[data-field="${k}"]`);
  return el ? el.value.trim() : "";
};
const num = (v) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return isFinite(n) && v !== "" ? n : null;
};
const options = (list, sel, empty) =>
  (empty ? `<option value="">${empty}</option>` : "") +
  list.map((o) => `<option value="${escapeHtml(o)}" ${sel === o ? "selected" : ""}>${escapeHtml(o)}</option>`).join("");

export function openListingForm(listing) {
  const isEdit = Boolean(listing && listing.id);
  const l = store.normalize(listing || {});
  openDrawer({
    title: isEdit ? "Επεξεργασία αγγελίας" : "Νέα αγγελία",
    body: `
      <div class="form-grid">
        <div class="field"><label>Κωδικός</label><input class="input" data-field="code" value="${escapeHtml(l.code)}" /></div>
        <div class="field"><label>Κατάσταση</label><select class="select" data-field="status">
          ${Object.keys(STATUS).map((s) => `<option value="${s}" ${l.status === s ? "selected" : ""}>${escapeHtml(STATUS[s])}</option>`).join("")}
        </select></div>
        <div class="field"><label>Τύπος</label><select class="select" data-field="type">${options(TYPES, l.type, "")}</select></div>
        <div class="field"><label>Τετραγωνικά</label><input class="input" type="number" data-field="sqm" value="${l.sqm ?? ""}" /></div>
        <div class="field"><label>Τιμή (€)</label><input class="input" type="number" data-field="price" value="${l.price ?? ""}" /></div>
        <div class="field"><label>Τηλέφωνο</label><input class="input" data-field="phone" value="${escapeHtml(l.phone)}" /></div>
        <div class="field full"><label>Διεύθυνση / Περιοχή</label><input class="input" data-field="address" value="${escapeHtml(l.address)}" /></div>
        <div class="field full"><label>Σημειώσεις</label><textarea class="textarea" rows="4" data-field="notes">${escapeHtml(l.notes)}</textarea></div>
      </div>`,
    footer: `<button class="btn" data-cancel>Άκυρο</button><span class="spacer"></span><button class="btn primary" data-save>💾 Αποθήκευση</button>`,
    onMount(root) {
      root.querySelector("[data-cancel]").addEventListener("click", closeDrawer);
      root.querySelector("[data-save]").addEventListener("click", async () => {
        const data = {
          code: get(root, "code"),
          type: get(root, "type"),
          sqm: num(get(root, "sqm")),
          price: num(get(root, "price")),
          address: get(root, "address"),
          phone: get(root, "phone"),
          status: get(root, "status") || "available",
          notes: get(root, "notes"),
          extraPhones: l.extraPhones || [],
          calls: l.calls || [],
          maps: l.maps || "",
          isNew: l.isNew || false,
          source: l.source || "xe.gr",
        };
        if (isEdit) await store.updateListing(l.id, data);
        else await store.addListing(data);
        toast("Αποθηκεύτηκε", "ok");
        closeDrawer();
      });
    },
  });
}

export function openListingDetail(listing) {
  const l = store.getListing(listing.id) || listing;
  const cur = "EUR";
  const calls = (l.calls || []).slice().reverse();
  const callsHtml = calls.length
    ? calls.map((c) => `<div class="debt"><span class="d-label">${escapeHtml(c.note || "")}</span><span class="d-amt text-muted" style="font-weight:500;font-size:12px">${escapeHtml(c.when || "")}</span></div>`).join("")
    : '<div class="text-muted" style="padding:6px 0">Καμία κλήση.</div>';

  openDrawer({
    className: "detail-drawer",
    title: `${l.code ? l.code + " — " : ""}${l.type || "Αγγελία"}`,
    body: `
      <div class="pill-row" style="margin-bottom:14px">
        <span class="pill st-ok">${escapeHtml(statusLabel(l.status))}</span>
        ${l.source ? `<span class="pill soft">${escapeHtml(l.source)}</span>` : ""}
      </div>
      <div class="pill-row" style="margin-bottom:16px">
        ${l.phone ? `<a class="btn sm" href="tel:${escapeHtml(l.phone.replace(/[^\d+]/g, ""))}">📞 Κλήση</a>` : ""}
        ${l.phone ? `<a class="btn sm" href="viber://chat?number=${encodeURIComponent(l.phone.replace(/[^\d+]/g, ""))}">💬 Viber</a>` : ""}
        ${l.maps ? `<a class="btn sm" href="${escapeHtml(l.maps)}" target="_blank">🗺️ Χάρτης</a>` : ""}
      </div>
      <div class="info-block"><div class="kv">
        <span class="k">Τύπος</span><span class="v">${escapeHtml(l.type || "—")}</span>
        <span class="k">Εμβαδόν</span><span class="v">${l.sqm ? l.sqm + " τ.μ." : "—"}</span>
        <span class="k">Τιμή</span><span class="v">${Number(l.price) ? formatCurrency(l.price, cur) : "—"}</span>
        ${l.price && l.sqm ? `<span class="k">€/τ.μ.</span><span class="v">${Math.round(l.price / l.sqm).toLocaleString("el-GR")}</span>` : ""}
        <span class="k">Διεύθυνση</span><span class="v">${escapeHtml(l.address || "—")}</span>
        <span class="k">Τηλέφωνο</span><span class="v">${escapeHtml(l.phone || "—")}</span>
      </div></div>
      ${l.notes ? `<div class="sec-title">Σημειώσεις</div><div class="notes-box">${escapeHtml(l.notes)}</div>` : ""}
      <div class="sec-title">Ιστορικό κλήσεων</div>
      <div class="info-block" style="padding:6px 12px">${callsHtml}</div>`,
    footer: `
      <button class="btn" data-close>Κλείσιμο</button>
      <span class="spacer"></span>
      <button class="btn danger" data-del>🗑️</button>
      <button class="btn primary" data-edit>✏️ Επεξεργασία</button>`,
    onMount(root) {
      root.querySelector("[data-close]").addEventListener("click", closeDrawer);
      root.querySelector("[data-edit]").onclick = () => openListingForm(l);
      root.querySelector("[data-del]").onclick = async () => {
        const ok = await confirmDialog("Να διαγραφεί η αγγελία;");
        if (ok) {
          await store.removeListing(l.id);
          closeDrawer();
          toast("Διαγράφηκε", "ok");
        }
      };
    },
  });
}

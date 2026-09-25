import * as store from "./store.js";
import { LEAD_STATUSES } from "./store.js";
import { SEARCH_TYPES, PROPERTY_TYPES } from "./parse.js";
import { matchLead } from "./match.js";
import { buildProposalEmail, mailtoLink } from "./email.js";
import { openDrawer, closeDrawer, confirmDialog } from "../modal.js";
import { toast } from "../toast.js";
import * as db from "../core/db.js";
import { catalog } from "../aggelies/store.js";
import { formatCurrency, escapeHtml, formatDate } from "../utils.js";

const get = (root, k) => {
  const el = root.querySelector(`[data-field="${k}"]`);
  return el ? el.value.trim() : "";
};
const num = (v) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return isFinite(n) && v !== "" ? n : null;
};
const options = (list, sel, empty = "—") =>
  (empty ? `<option value="">${empty}</option>` : "") +
  list.map((o) => `<option value="${escapeHtml(o)}" ${sel === o ? "selected" : ""}>${escapeHtml(o)}</option>`).join("");

function statusPill(s) {
  const map = { "Νέο": "st-anamoni", "Σε επικοινωνία": "st-ekkremotita", "Ταιριάστηκε": "st-ok", "Ολοκληρώθηκε": "st-ok", "Ακυρώθηκε": "st-akyro" };
  return `<span class="pill ${map[s] || "st-akyro"}">${escapeHtml(s || "—")}</span>`;
}

function catalogItems() {
  return catalog(db.list("properties"));
}

// ------------------------------ FORM ---------------------------------------
export function openLeadForm(lead) {
  const isEdit = Boolean(lead && lead.id);
  const l = store.normalize(lead || {});
  openDrawer({
    title: isEdit ? "Επεξεργασία ενδιαφερόμενου" : "Νέος ενδιαφερόμενος",
    body: `
      <div class="form-grid">
        <div class="field full"><label>Ονοματεπώνυμο</label><input class="input" data-field="name" value="${escapeHtml(l.name)}" /></div>
        <div class="field"><label>Τηλέφωνο</label><input class="input" data-field="phone" value="${escapeHtml(l.phone)}" /></div>
        <div class="field"><label>Email</label><input class="input" data-field="email" value="${escapeHtml(l.email)}" /></div>
        <div class="field"><label>Τι ψάχνει (ελεύθερο)</label><input class="input" data-field="wants" value="${escapeHtml(l.wants)}" placeholder="π.χ. Ενοικίαση μονοκατοικίας" /></div>
        <div class="field"><label>Συναλλαγή</label><select class="select" data-field="search_type">${options(SEARCH_TYPES, l.search_type, "—")}</select></div>
        <div class="field"><label>Τύπος ακινήτου</label><select class="select" data-field="property_type">${options(PROPERTY_TYPES, l.property_type, "—")}</select></div>
        <div class="field"><label>Περιοχή</label><input class="input" data-field="area" value="${escapeHtml(l.area)}" /></div>
        <div class="field"><label>Κατάσταση</label><select class="select" data-field="status">${options(LEAD_STATUSES, l.status, "")}</select></div>
        <div class="field"><label>Ελάχιστη τιμή (€)</label><input class="input" type="number" data-field="price_min" value="${l.price_min ?? ""}" /></div>
        <div class="field"><label>Μέγιστη τιμή (€)</label><input class="input" type="number" data-field="price_max" value="${l.price_max ?? ""}" /></div>
        <div class="field"><label>Ελάχιστα τ.μ.</label><input class="input" type="number" data-field="sqm_min" value="${l.sqm_min ?? ""}" /></div>
        <div class="field"><label>Μέγιστα τ.μ.</label><input class="input" type="number" data-field="sqm_max" value="${l.sqm_max ?? ""}" /></div>
        <div class="field full"><label>Σημειώσεις</label><textarea class="textarea" rows="3" data-field="notes">${escapeHtml(l.notes)}</textarea></div>
      </div>`,
    footer: `<button class="btn" data-cancel>Άκυρο</button><span class="spacer"></span><button class="btn primary" data-save>💾 Αποθήκευση</button>`,
    onMount(root) {
      root.querySelector("[data-cancel]").addEventListener("click", closeDrawer);
      root.querySelector("[data-save]").addEventListener("click", async () => {
        const data = {
          name: get(root, "name"),
          phone: get(root, "phone"),
          email: get(root, "email"),
          wants: get(root, "wants"),
          search_type: get(root, "search_type"),
          property_type: get(root, "property_type"),
          area: get(root, "area"),
          status: get(root, "status") || "Νέο",
          price_min: num(get(root, "price_min")),
          price_max: num(get(root, "price_max")),
          sqm_min: num(get(root, "sqm_min")),
          sqm_max: num(get(root, "sqm_max")),
          notes: get(root, "notes"),
          source: l.source || "Χειροκίνητη",
          created: l.created || "",
        };
        if (!data.name && !data.phone && !data.email) return toast("Συμπλήρωσε όνομα ή τηλέφωνο", "err");
        if (isEdit) await store.updateLead(l.id, data);
        else await store.addLead(data);
        toast("Αποθηκεύτηκε", "ok");
        closeDrawer();
      });
    },
  });
}

// ------------------------------ DETAIL -------------------------------------
export function openLeadDetail(lead) {
  const l = store.getLead(lead.id) || lead;
  const cur = "EUR";
  const matches = matchLead(l, catalogItems(), { minScore: 30, limit: 10 });

  const matchRows = matches.length
    ? matches.map((m, i) => {
        const p = m.property;
        return `
          <label class="match-row">
            <input type="checkbox" data-match="${i}" checked />
            <div class="m-main">
              <div class="m-title">${p.code ? `<span class="card-code">${escapeHtml(p.code)}</span> ` : ""}${escapeHtml(p.title || "")}</div>
              <div class="t-sub">
                ${Number(p.price) ? formatCurrency(p.price, cur) : "—"}
                ${p.type ? " · " + escapeHtml(p.type) : ""}
                ${p.status ? " · " + escapeHtml(p.status) : ""}
                · <span class="text-muted">${escapeHtml(m.reasons.join(", "))}</span>
              </div>
            </div>
            <span class="match-score">${m.score}</span>
          </label>`;
      }).join("")
    : `<div class="empty" style="border:none;padding:22px">Δεν βρέθηκαν ταιριάσματα στις υποθέσεις πωλήσεων.</div>`;

  const criteria = [
    l.search_type && ["Συναλλαγή", l.search_type],
    l.property_type && ["Τύπος", l.property_type],
    l.area && ["Περιοχή", l.area],
    l.price_max && ["Budget", formatCurrency(l.price_max, cur) + (l.price_min ? " - " : "")],
    l.sqm_max && ["Εμβαδόν", `${l.sqm_min || ""}${l.sqm_max && l.sqm_max !== l.sqm_min ? "-" + l.sqm_max : ""} τ.μ.`],
    l.wants && ["Ζητάει", l.wants],
    (l.price_text || l.sqm_text) && ["Από φόρμα", [l.price_text, l.sqm_text].filter(Boolean).join(" · ")],
  ].filter(Boolean);

  openDrawer({
    className: "detail-drawer",
    title: l.name || "Ενδιαφερόμενος",
    body: `
      <div class="pill-row" style="margin-bottom:14px">
        ${statusPill(l.status)}
        ${l.search_type ? `<span class="pill soft">${escapeHtml(l.search_type)}</span>` : ""}
        ${l.property_type ? `<span class="pill soft">${escapeHtml(l.property_type)}</span>` : ""}
        ${l.source ? `<span class="pill soft">${escapeHtml(l.source)}</span>` : ""}
      </div>
      <div class="pill-row" style="margin-bottom:16px">
        ${l.phone ? `<a class="btn sm" href="tel:${escapeHtml(l.phone.replace(/[^\d+]/g, ""))}">📞 Κλήση</a>` : ""}
        ${l.phone ? `<a class="btn sm" href="viber://chat?number=${encodeURIComponent(l.phone.replace(/[^\d+]/g, ""))}">💬 Viber</a>` : ""}
        ${l.email ? `<a class="btn sm" href="mailto:${escapeHtml(l.email)}">✉️ Email</a>` : ""}
      </div>
      <div class="info-block"><div class="kv">
        ${l.phone ? `<span class="k">Τηλέφωνο</span><span class="v">${escapeHtml(l.phone)}</span>` : ""}
        ${l.email ? `<span class="k">Email</span><span class="v">${escapeHtml(l.email)}</span>` : ""}
        ${criteria.map(([k, v]) => `<span class="k">${escapeHtml(k)}</span><span class="v">${escapeHtml(String(v))}</span>`).join("")}
        ${l.created ? `<span class="k">Υποβολή</span><span class="v">${escapeHtml(l.created)}</span>` : ""}
      </div></div>

      <div class="sec-title">🔎 Πιθανά ταιριάσματα (${matches.length})</div>
      <div class="match-list">${matchRows}</div>
      ${matches.length ? `<button class="btn primary block" style="margin-top:10px" data-gen-email>✉️ Δημιουργία email πρότασης</button>` : ""}

      <div class="sec-title">Σημειώσεις</div>
      <textarea class="textarea" rows="3" data-field="notes">${escapeHtml(l.notes)}</textarea>
      <div class="pill-row" style="margin-top:8px">
        <button class="btn sm" data-save-notes>💾 Αποθήκευση σημειώσεων</button>
      </div>`,
    footer: `
      <button class="btn" data-close>Κλείσιμο</button>
      <span class="spacer"></span>
      <button class="btn danger" data-del>🗑️</button>
      <button class="btn primary" data-edit>✏️ Επεξεργασία</button>`,
    onMount(root) {
      root.querySelector("[data-close]").addEventListener("click", closeDrawer);
      root.querySelector("[data-edit]").onclick = () => openLeadForm(l);
      root.querySelector("[data-del]").onclick = async () => {
        const ok = await confirmDialog("Να διαγραφεί ο ενδιαφερόμενος;");
        if (ok) {
          await store.removeLead(l.id);
          closeDrawer();
          toast("Διαγράφηκε", "ok");
        }
      };
      root.querySelector("[data-save-notes]").onclick = async () => {
        await store.updateLead(l.id, { notes: get(root, "notes") });
        toast("Οι σημειώσεις αποθηκεύτηκαν", "ok");
      };
      const gen = root.querySelector("[data-gen-email]");
      if (gen) {
        gen.onclick = () => {
          const selected = [...root.querySelectorAll("[data-match]")]
            .filter((c) => c.checked)
            .map((c) => matches[Number(c.dataset.match)])
            .filter(Boolean);
          openEmailModal(l, selected);
        };
      }
    },
  });
}

// ------------------------------ EMAIL --------------------------------------
export function openEmailModal(lead, matches) {
  const { to, subject, body } = buildProposalEmail(lead, matches, "EUR");
  openDrawer({
    title: "Email πρότασης",
    body: `
      <div class="form-grid">
        <div class="field"><label>Προς</label><input class="input" data-email-to value="${escapeHtml(to)}" placeholder="email παραλήπτη" /></div>
        <div class="field full"><label>Θέμα</label><input class="input" data-email-subject value="${escapeHtml(subject)}" /></div>
        <div class="field full"><label>Κείμενο</label><textarea class="textarea" rows="14" data-email-body>${escapeHtml(body)}</textarea></div>
      </div>
      <p class="text-muted" style="font-size:12px">Διορθώσεις ελεύθερα πριν το στείλεις.</p>`,
    footer: `
      <button class="btn" data-copy>📋 Αντιγραφή</button>
      <span class="spacer"></span>
      <button class="btn" data-close>Κλείσιμο</button>
      <button class="btn primary" data-send>✉️ Άνοιγμα email</button>`,
    onMount(root) {
      const read = () => ({
        to: root.querySelector("[data-email-to]").value.trim(),
        subject: root.querySelector("[data-email-subject]").value.trim(),
        body: root.querySelector("[data-email-body]").value,
      });
      root.querySelector("[data-close]").addEventListener("click", closeDrawer);
      root.querySelector("[data-copy]").onclick = async () => {
        const { subject: s, body: b } = read();
        try {
          await navigator.clipboard.writeText(`Θέμα: ${s}\n\n${b}`);
          toast("Αντιγράφηκε", "ok");
        } catch {
          toast("Δεν ήταν δυνατή η αντιγραφή", "err");
        }
      };
      root.querySelector("[data-send]").onclick = () => {
        const { to: t, subject: s, body: b } = read();
        if (!t) return toast("Συμπλήρωσε email παραλήπτη", "err");
        window.open(mailtoLink(t, s, b), "_blank");
        store.updateLead(lead.id, {
          proposal_sent: true,
          proposal_sent_at: new Date().toISOString(),
          proposal_count: (lead.proposal_count || 0) + 1,
          status: lead.status === "Νέο" ? "Σε επικοινωνία" : lead.status,
        }).catch(() => {});
      };
    },
  });
}

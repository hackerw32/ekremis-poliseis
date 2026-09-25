import * as db from "./core/db.js";
import { openDrawer, closeDrawer } from "./modal.js";
import { debounce, deburr, escapeHtml, formatCurrency } from "./utils.js";

function hit(hay, q) {
  return deburr(hay || "").includes(q);
}

function searchAll(raw) {
  const q = deburr(raw).trim();
  const qd = raw.replace(/\D/g, "");
  if (q.length < 2) return [];

  const groups = [];
  const add = (title, items) => {
    if (items.length) groups.push({ title, items });
  };

  add("📢 Αγγελίες", db.list("listings").filter((l) => hit(`${l.code} ${l.type} ${l.address} ${l.phone} ${l.notes}`, q) || (qd.length > 4 && String(l.phone || "").replace(/\D/g, "").includes(qd))).slice(0, 6)
    .map((l) => ({ label: `${l.code || ""} · ${l.type || ""}`, sub: `${l.sqm ? l.sqm + " τ.μ. · " : ""}${Number(l.price) ? formatCurrency(l.price) : ""} ${l.address || ""}`, app: "aggelies", route: "list", query: l.code || "" })));

  add("🎯 Ενδιαφερόμενοι", db.list("leads").filter((l) => hit(`${l.name} ${l.email} ${l.wants} ${l.property_type} ${l.area}`, q) || (qd.length > 4 && String(l.phone || "").replace(/\D/g, "").includes(qd))).slice(0, 6)
    .map((l) => ({ label: l.name || "—", sub: `${l.search_type || ""} ${l.property_type || ""} ${l.phone || ""}`, app: "leads", route: "list", query: l.name || l.phone || "" })));

  add("👤 Πελάτες", db.list("tameio_clients").filter((c) => hit(`${c.name} ${c.phone} ${c.tax_id}`, q) || (qd.length > 4 && String(c.phone || "").replace(/\D/g, "").includes(qd))).slice(0, 6)
    .map((c) => ({ label: c.name || "—", sub: c.phone || "", app: "clients", route: "list", query: c.name || "" })));

  add("👷 Συνεργάτες", db.list("tameio_partners").filter((c) => hit(`${c.name} ${c.phone} ${c.specialty}`, q) || (qd.length > 4 && String(c.phone || "").replace(/\D/g, "").includes(qd))).slice(0, 6)
    .map((c) => ({ label: c.name || "—", sub: `${c.specialty || ""} ${c.phone || ""}`, app: "partners", route: "list", query: c.name || "" })));

  add("📁 Υποθέσεις (Α/Π)", db.list("tameio_jobs").filter((j) => hit(`${j.protocol_number} ${j.title} ${j.owner} ${j.location}`, q)).slice(0, 6)
    .map((j) => ({ label: `${j.protocol_number ? j.protocol_number + " · " : ""}${j.title || j.owner || ""}`, sub: j.location || "", app: "tameio", route: "jobs", query: j.protocol_number || j.title || "" })));

  add("🧾 Συναλλαγές", db.list("tameio_transactions").filter((t) => hit(`${t.description} ${t.category} ${t.notes} ${t.txn_date}`, q)).slice(0, 6)
    .map((t) => ({ label: `${t.txn_date || ""} · ${t.description || t.category || ""}`, sub: `${t.txn_type} ${formatCurrency(t.amount)}`, app: "tameio", route: "transactions", query: t.description || "" })));

  add("🏠 Εκκρεμείς πωλήσεις", db.list("properties").filter((p) => hit(`${p.code} ${p.title} ${p.buyer} ${p.seller} ${p.notes}`, q)).slice(0, 6)
    .map((p) => ({ label: `${p.code ? p.code + " · " : ""}${p.title || ""}`, sub: p.buyer || p.seller || "", app: "ekremis", route: "properties", query: p.code || p.title || "" })));

  add("📐 Τεχνικοί έλεγχοι", db.list("texnikos_docs").filter((d) => hit(`${d.protocol} ${d.recipient} ${d.doc_type} ${d.property_location}`, q)).slice(0, 6)
    .map((d) => ({ label: d.doc_type || "Έγγραφο", sub: `${d.protocol || ""} ${d.recipient || ""}`, app: "texnikos", route: "list", query: d.protocol || d.recipient || "" })));

  return groups;
}

export function openGlobalSearch(onPick) {
  openDrawer({
    title: "🔎 Αναζήτηση παντού",
    body: `
      <input class="input" data-search-input placeholder="Κωδικός, όνομα, τηλέφωνο, διεύθυνση, ποσό..." autocomplete="off" />
      <div class="search-results" data-search-results style="margin-top:12px"></div>`,
    onMount(root) {
      const input = root.querySelector("[data-search-input]");
      const results = root.querySelector("[data-search-results]");

      const renderResults = (q) => {
        const groups = searchAll(q);
        if (!q || q.trim().length < 2) {
          results.innerHTML = '<p class="text-muted" style="padding:14px 0">Γράψε τουλάχιστον 2 χαρακτήρες.</p>';
          return;
        }
        if (!groups.length) {
          results.innerHTML = '<p class="text-muted" style="padding:14px 0">Δεν βρέθηκαν αποτελέσματα.</p>';
          return;
        }
        results.innerHTML = groups.map((g) => `
          <div class="sec-title" style="margin:14px 0 6px">${escapeHtml(g.title)}</div>
          <div class="search-group">
            ${g.items.map((it) => `
              <div class="search-hit" data-result
                   data-app="${escapeHtml(it.app)}" data-route="${escapeHtml(it.route)}" data-query="${escapeHtml(it.query)}">
                <div class="sh-label">${escapeHtml(it.label)}</div>
                <div class="sh-sub">${escapeHtml(it.sub || "")}</div>
              </div>`).join("")}
          </div>`).join("");
      };

      const onInput = debounce(() => renderResults(input.value), 180);
      input.addEventListener("input", onInput);
      input.focus();

      results.addEventListener("click", (e) => {
        const it = e.target.closest("[data-result]");
        if (!it) return;
        closeDrawer();
        onPick({ app: it.dataset.app, route: it.dataset.route, query: it.dataset.query });
      });
    },
  });
}

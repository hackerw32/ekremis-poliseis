import * as store from "./store.js";
import { viewPeople, personDetailBody } from "./views.js";
import { openClientForm, openPartnerForm, openJobForm, openTransactionForm, openJobDetail } from "../tameio/forms.js";
import * as tameio from "../tameio/store.js";
import { openDrawer, closeDrawer, confirmDialog } from "../modal.js";
import { toast } from "../toast.js";
import { formatCurrency } from "../utils.js";

export function makeApp(kind) {
  const isPartner = kind === "partner";
  const meta = isPartner
    ? {
        id: "partners",
        title: "Συνεργάτες",
        icon: "👷",
        tagline: "Στοιχεία, υποχρεώσεις και πληρωμές συνεργατών (μηχανικοί, δικηγόροι κ.λπ.)",
        color: "warn",
        defaultRoute: "list",
        primaryLabel: "Νέος συνεργάτης",
      }
    : {
        id: "clients",
        title: "Πελάτες",
        icon: "👤",
        tagline: "Στοιχεία πελατών, απαιτήσεις, συναλλαγές και σχετικές υποθέσεις",
        color: "info",
        defaultRoute: "list",
        primaryLabel: "Νέος πελάτης",
      };

  let currentPersonId = null;

  function nav() {
    return [
      { route: "list", label: isPartner ? "Συνεργάτες" : "Πελάτες", icon: isPartner ? "👷" : "👤", badge: store.listPeople(kind).length },
    ];
  }

  function render(container, subroute, ctx) {
    container.innerHTML = viewPeople({ ui: { query: ctx.ui.query }, currency: ctx.currency }, kind);
  }

  function openForm(person) {
    return isPartner ? openPartnerForm(person) : openClientForm(person);
  }

  async function openDetail(id) {
    currentPersonId = id;
    const person = store.getPerson(kind, id);
    if (!person) return;
    const data = {
      currency: "EUR",
      ledger: store.ledger(kind, id),
      relatedLeads: store.relatedLeads(person),
      relatedProperties: store.relatedProperties(person),
    };
    openDrawer({
      className: "detail-drawer",
      title: person.name || (isPartner ? "Συνεργάτης" : "Πελάτης"),
      body: personDetailBody(person, kind, data),
      footer: `
        <button class="btn" data-close>Κλείσιμο</button>
        <span class="spacer"></span>
        <button class="btn danger" data-del>🗑️</button>
        <button class="btn primary" data-edit>✏️ Επεξεργασία</button>`,
      onMount(root) {
        root.querySelector("[data-close]").addEventListener("click", closeDrawer);
        root.querySelector("[data-edit]").onclick = () => openForm(person);
        root.querySelector("[data-del]").onclick = async () => {
          const ok = await confirmDialog(`Να διαγραφεί ο/η «${person.name}»;`);
          if (!ok) return;
          await store.removePerson(kind, id);
          closeDrawer();
          toast("Διαγράφηκε", "ok");
        };
      },
    });
  }

  async function handleAction(action, el) {
    switch (action) {
      case "add":
        openForm(null);
        break;
      case "pay":
        openTransactionForm({ type: "Έξοδο", partnerId: el.dataset.id });
        break;
      case "collect":
        openTransactionForm({ type: "Έσοδο", clientId: el.dataset.id });
        break;
      case "new-job": {
        const preset = isPartner
          ? { protocol_number: "", title: "", owner: "", location: "", client_id: "", partner_id: el.dataset.id, agreed_fee: 0, partner_fee: 0, status: "Εκκρεμεί", opened_date: "", notes: "" }
          : { protocol_number: "", title: "", owner: "", location: "", client_id: el.dataset.id, partner_id: "", agreed_fee: 0, partner_fee: 0, status: "Εκκρεμεί", opened_date: "", notes: "" };
        openJobForm(preset);
        break;
      }
    }
  }

  async function onClick(e, ctx) {
    const action = e.target.closest("[data-person-action]");
    if (action) {
      const el = action;
      if (el.dataset.personAction === "pay" || el.dataset.personAction === "collect" || el.dataset.personAction === "new-job") {
        const id = el.dataset.id || currentPersonId;
        await handleAction(el.dataset.personAction, { dataset: { id } });
      } else {
        await handleAction(el.dataset.personAction, el);
      }
      return true;
    }
    const open = e.target.closest('[data-person="open"]');
    if (open) {
      window.__personDetailId = open.dataset.id;
      await openDetail(open.dataset.id);
      return true;
    }
    const job = e.target.closest('[data-person="job"]');
    if (job) {
      const j = tameio.jobs().find((x) => x.id === job.dataset.id);
      if (j) openJobDetail(j);
      return true;
    }
    return false;
  }

  return { meta, nav, render, onClick, onChange: () => false, onPrimary: () => openForm(null) };
}

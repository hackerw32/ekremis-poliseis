import * as store from "./store.js";
import { viewList } from "./view-list.js";
import { viewSettings } from "./view-settings.js";
import { editorBody, bindEditor, readEditor } from "./editor.js";
import { printDoc } from "./print.js";
import { getSettings, saveSettings } from "./settings.js";
import { openDrawer, closeDrawer, confirmDialog } from "../modal.js";
import { toast } from "../toast.js";
import { download, todayISO } from "../utils.js";

export const meta = {
  id: "texnikos",
  title: "Τεχνικός Έλεγχος",
  icon: "📐",
  tagline: "Δημιουργία εγγράφων τεχνικού ελέγχου με πρότυπα και εκτύπωση/PDF",
  color: "info",
  defaultRoute: "list",
  primaryLabel: "Νέος έλεγχος",
};

const VIEWS = { list: viewList, settings: viewSettings };

export function nav() {
  return [
    { route: "list", label: "Έγγραφα", icon: "📄", badge: store.listDocs().length },
    { route: "settings", label: "Ρυθμίσεις", icon: "⚙️" },
  ];
}

export function render(container, subroute, ctx) {
  const view = VIEWS[subroute] || viewList;
  container.innerHTML = view({ ui: { query: ctx.ui.query } });
}

function openEditor(id) {
  const isEdit = Boolean(id);
  const doc = isEdit ? store.getDoc(id) : store.emptyDoc();
  if (!doc) return;
  openDrawer({
    title: isEdit ? "Επεξεργασία εγγράφου" : "Νέος τεχνικός έλεγχος",
    body: editorBody(doc),
    footer: `
      <button class="btn" data-cancel>Άκυρο</button>
      <span class="spacer"></span>
      <button class="btn" data-print>🖨️ Εκτύπωση / PDF</button>
      <button class="btn primary" data-save>💾 Αποθήκευση</button>`,
    onMount(root) {
      bindEditor(root);
      root.querySelector("[data-cancel]").addEventListener("click", closeDrawer);
      root.querySelector("[data-print]").addEventListener("click", () => {
        const data = readEditor(root);
        printDoc(data, getSettings());
      });
      root.querySelector("[data-save]").addEventListener("click", async () => {
        const data = readEditor(root);
        if (!data.recipient && !data.protocol) {
          toast("Συμπλήρωσε Α/Π ή παραλήπτη", "err");
          return;
        }
        try {
          if (isEdit) await store.updateDoc(id, data);
          else await store.addDoc(data);
          toast("Αποθηκεύτηκε", "ok");
          closeDrawer();
        } catch (e) {
          toast("Σφάλμα: " + e.message, "err");
        }
      });
    },
  });
}

function setDotted(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]]) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

async function handleAction(action) {
  switch (action) {
    case "new":
      openEditor(null);
      break;
    case "save-settings": {
      const s = getSettings();
      document.querySelectorAll("[data-tset]").forEach((i) => setDotted(s, i.dataset.tset, i.value.trim()));
      saveSettings(s);
      toast("Οι ρυθμίσεις αποθηκεύτηκαν", "ok");
      return "refresh";
    }
    case "export":
      download(`texnikos-eggrafa-${todayISO()}.json`, store.docsJSON());
      toast("Έγινε εξαγωγή", "ok");
      break;
    case "clear-docs": {
      const ok = await confirmDialog("Διαγραφή όλων των εγγράφων; Δεν αναιρείται.", { confirmText: "Διαγραφή" });
      if (ok) {
        await store.clearDocs();
        toast("Διαγράφηκαν όλα", "ok");
      }
      break;
    }
  }
  return null;
}

export function onPrimary() {
  openEditor(null);
}

export async function onClick(e, ctx) {
  const actionEl = e.target.closest("[data-tex-action]");
  if (actionEl) {
    const res = await handleAction(actionEl.dataset.texAction);
    if (res === "refresh") ctx.refresh();
    return true;
  }
  const openDoc = e.target.closest('[data-tex="doc"]');
  if (openDoc) {
    openEditor(openDoc.dataset.id);
    return true;
  }
  const printEl = e.target.closest('[data-tex="doc-print"]');
  if (printEl) {
    const d = store.getDoc(printEl.dataset.id);
    if (d) printDoc(d, getSettings());
    return true;
  }
  const delEl = e.target.closest('[data-tex="doc-del"]');
  if (delEl) {
    const ok = await confirmDialog("Να διαγραφεί το έγγραφο;");
    if (ok) {
      await store.removeDoc(delEl.dataset.id);
      toast("Διαγράφηκε", "ok");
    }
    return true;
  }
  return false;
}

export function onChange() {
  return false;
}

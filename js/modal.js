import { escapeHtml } from "./utils.js";

const root = () => document.getElementById("modal-root");

let escHandler = null;

export function openDrawer({ title, body, footer, onMount, className = "" }) {
  const el = root();
  el.innerHTML = `
    <div class="modal-scrim" data-close="1"></div>
    <aside class="drawer ${className}" role="dialog" aria-modal="true">
      <header class="drawer-head">
        <button class="icon-btn" data-close="1" aria-label="Κλείσιμο">✕</button>
        <h2>${escapeHtml(title || "")}</h2>
      </header>
      <div class="drawer-body">${body || ""}</div>
      ${footer ? `<footer class="drawer-foot">${footer}</footer>` : ""}
    </aside>
  `;
  el.classList.add("open");
  el.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  el.querySelectorAll("[data-close]").forEach((n) =>
    n.addEventListener("click", closeDrawer)
  );

  escHandler = (e) => {
    if (e.key === "Escape") closeDrawer();
  };
  document.addEventListener("keydown", escHandler);

  if (onMount) onMount(el);
  return el;
}

export function closeDrawer() {
  const el = root();
  if (!el) return;
  el.classList.remove("open");
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = "";
  document.body.style.overflow = "";
  if (escHandler) {
    document.removeEventListener("keydown", escHandler);
    escHandler = null;
  }
}

export function confirmDialog(message, { confirmText = "Διαγραφή", danger = true } = {}) {
  return new Promise((resolve) => {
    const el = root();
    el.innerHTML = `
      <div class="modal-scrim" data-close="1"></div>
      <aside class="drawer" role="dialog" style="width:min(420px,100%)">
        <header class="drawer-head"><h2>Επιβεβαίωση</h2></header>
        <div class="drawer-body"><p style="margin:0;font-size:15px">${escapeHtml(message)}</p></div>
        <footer class="drawer-foot">
          <button class="btn block" data-close="1">Άκυρο</button>
          <button class="btn ${danger ? "danger" : "primary"} block" data-confirm="1">${escapeHtml(confirmText)}</button>
        </footer>
      </aside>`;
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const done = (val) => {
      closeDrawer();
      resolve(val);
    };
    el.querySelectorAll("[data-close]").forEach((n) => n.addEventListener("click", () => done(false)));
    el.querySelector("[data-confirm]").addEventListener("click", () => done(true));
  });
}

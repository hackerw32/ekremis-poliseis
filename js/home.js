import { escapeHtml } from "./utils.js";

export function renderHome(container, apps, ctx) {
  const cards = apps.map((a) => `
    <a class="app-card app-accent-${a.meta.color || "primary"}" href="#/${a.meta.id}/${a.defaultRoute}">
      <div class="app-ico">${a.meta.icon}</div>
      <div class="app-card-body">
        <h3>${escapeHtml(a.meta.title)}</h3>
        <p>${escapeHtml(a.meta.tagline)}</p>
      </div>
      <span class="app-go">Άνοιγμα →</span>
    </a>`).join("");

  const soon = (ctx.comingSoon || []).map((s) => `
    <div class="app-card soon">
      <div class="app-ico">${s.icon}</div>
      <div class="app-card-body">
        <h3>${escapeHtml(s.title)}</h3>
        <p>${escapeHtml(s.tagline)}</p>
      </div>
      <span class="app-go">Σύντομα</span>
    </div>`).join("");

  container.innerHTML = `
    <div class="home">
      <div class="home-hero">
        <div>
          <h1>Καλώς ήρθες${ctx.user ? ", " + escapeHtml(ctx.user) : ""} 👋</h1>
          <p>${escapeHtml(ctx.agency)} — διάλεξε εφαρμογή για να ξεκινήσεις.</p>
        </div>
        <div class="home-hero-right">
          ${ctx.user ? `<div class="home-user"><span>👤</span>${escapeHtml(ctx.user)}<button class="mini-btn" data-hub-action="logout" title="Έξοδος">Έξοδος</button></div>` : ""}
          <div class="home-sync ${ctx.syncClass}"><span class="dot"></span>${escapeHtml(ctx.syncText)}</div>
        </div>
      </div>
      <div class="app-grid">${cards}${soon}</div>
      <p class="home-hint">Όλα τα δεδομένα είναι ξεχωριστά για κάθε χρήστη και συγχρονίζονται αυτόματα. Νέες εφαρμογές θα προστίθενται εδώ.</p>
    </div>`;
}

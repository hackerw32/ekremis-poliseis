import { signIn, signUp, resetPassword, describeError } from "./core/auth.js";
import { escapeHtml } from "./utils.js";

let mode = "login";

export function renderAuth(root) {
  root.classList.add("open");
  root.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="auth-brand">
          <div class="auth-logo">🏠</div>
          <h1>Γραφείο</h1>
          <p>Σύνδεση για να συνεχίσεις</p>
        </div>
        <div class="auth-tabs">
          <button class="auth-tab ${mode === "login" ? "active" : ""}" data-mode="login">Σύνδεση</button>
          <button class="auth-tab ${mode === "signup" ? "active" : ""}" data-mode="signup">Εγγραφή</button>
        </div>
        <form id="auth-form" autocomplete="on">
          ${mode === "signup" ? `
            <div class="field"><label>Ονοματεπώνυμο</label><input class="input" name="name" autocomplete="name" placeholder="π.χ. Γιώργος" /></div>` : ""}
          <div class="field"><label>Email</label><input class="input" type="email" name="email" autocomplete="email" required /></div>
          <div class="field"><label>Κωδικός</label><input class="input" type="password" name="password" autocomplete="${mode === "signup" ? "new-password" : "current-password"}" required /></div>
          <div class="auth-error" id="auth-error" hidden></div>
          <button class="btn primary block auth-submit" type="submit">${mode === "signup" ? "Δημιουργία λογαριασμού" : "Σύνδεση"}</button>
        </form>
        <button class="auth-link" id="auth-forgot" type="button">Ξέχασα τον κωδικό</button>
      </div>
      <p class="auth-foot">Τα δεδομένα κάθε χρήστη είναι ξεχωριστά και συγχρονίζονται αυτόματα.</p>
    </div>`;

  root.querySelectorAll("[data-mode]").forEach((b) =>
    b.addEventListener("click", () => {
      mode = b.dataset.mode;
      renderAuth(root);
    })
  );

  const form = root.querySelector("#auth-form");
  const errEl = root.querySelector("#auth-error");

  const showError = (msg) => {
    errEl.hidden = !msg;
    errEl.textContent = msg || "";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");
    const btn = form.querySelector(".auth-submit");
    btn.disabled = true;
    const old = btn.textContent;
    btn.textContent = "Παρακαλώ περιμένετε…";
    const data = new FormData(form);
    try {
      if (mode === "signup") {
        await signUp(data.get("name") || "", data.get("email"), data.get("password"));
      } else {
        await signIn(data.get("email"), data.get("password"));
      }
      // onAuthStateChanged θα αναλάβει το υπόλοιπο
    } catch (err) {
      showError(describeError(err));
      btn.disabled = false;
      btn.textContent = old;
    }
  });

  root.querySelector("#auth-forgot").addEventListener("click", async () => {
    const email = form.querySelector('[name="email"]').value.trim();
    if (!email) {
      showError("Συμπλήρωσε πρώτα το email σου.");
      return;
    }
    try {
      await resetPassword(email);
      showError("");
      alert("Στάλθηκε email επαναφοράς κωδικού στο " + email);
    } catch (err) {
      showError(describeError(err));
    }
  });
}

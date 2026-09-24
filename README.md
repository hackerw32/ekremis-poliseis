# Γραφείο — Κεντρικό Dashboard

Ενιαία web εφαρμογή (hub) για **Τεχνικό & Μεσιτικό Γραφείο**, που λειτουργεί σε
**κινητό και υπολογιστή** και φιλοξενείται στο **GitHub Pages**. Στην εκκίνηση
ρωτάει ποια εφαρμογή θέλεις να ανοίξεις.

## Εφαρμογές

| Εφαρμογή | Περιεχόμενο |
|---|---|
| 🏠 **Εκκρεμείς Πωλήσεις** | Υποθέσεις πωλήσεων, επαφές, εκκρεμότητες, οφειλές, dashboard |
| 💰 **Ταμείο** | Έσοδα/έξοδα, υποθέσεις (Α/Π), πελάτες, συνεργάτες, αναφορές Excel/PDF |
| 📐 **Τεχνικός Έλεγχος** | Δημιουργία εγγράφων τεχνικού ελέγχου με πρότυπα, εκτύπωση/PDF |
| 🎯 **Ενδιαφερόμενοι (Leads)** | Εισαγωγή από Google Forms (CSV/Excel/φύλλο), έξυπνο ταίριασμα με ακίνητα, email πρότασης |

Σύντομα θα προστεθούν κι άλλα (π.χ. Αγγελίες xe.gr, Έντυπα/Εντολές).

## Χρήστες & ασφάλεια

- **Σύνδεση/Εγγραφή** με email + κωδικό (Firebase Authentication — Email/Password).
- **Ξεχωριστά δεδομένα ανά χρήστη**: `users/{uid}/{collection}`.
- Κανόνες Firestore (`firebase/firestore.rules`): κάθε χρήστης βλέπει μόνο τα δικά του δεδομένα.

## Δυνατότητες (σύνοψη)

- **Launcher** με κάρτες εφαρμογών, κοινό σκούρο/φωτεινό θέμα, responsive πλοήγηση.
- **Συγχρονισμός** σε όλες τις συσκευές μέσω Firebase Firestore (realtime).
- **Ταμείο**: έσοδα/έξοδα με κατηγορίες/τρόπους πληρωμής, σύνδεση με πελάτη/συνεργάτη/υπόθεση,
  αυτόματα υπόλοιπα (τι συμφωνήθηκε − τι εισπράχθηκε/πληρώθηκε), μηνιαίο γράφημα,
  αναφορές με εξαγωγή CSV (Excel) και εκτύπωση/PDF.
- **Τεχνικός Έλεγχος**: φόρμα με έτοιμα πρότυπα (εισαγωγή, ιδιοκτησία, έλεγχος, εργασίες,
  αμοιβή), λίστα εργασιών με σειρά, προεπισκόπηση/εκτύπωση σε A4 με τα στοιχεία του γραφείου.
- **Backup**: εξαγωγή/εισαγωγή JSON σε κάθε εφαρμογή.

## Τοπική εκτέλεση

```powershell
python -m http.server 8080
# άνοιξε http://localhost:8080
```

> Χρειάζεται http(s)· όχι άνοιγμα με διπλό κλικ (file://) λόγω ES modules.

## Firebase (συγχρονισμός)

Είναι ήδη ρυθμισμένο στο `js/config.js` για το project `ekremis-poliseis`.
Οι κανόνες βρίσκονται στο `firebase/firestore.rules` και ανεβαίνουν με:

```powershell
firebase deploy --only firestore:rules
```

Για **ασφάλεια**, αξίζει αργότερα να προστεθεί Firebase Authentication ώστε να
έχουν πρόσβαση μόνο συνδεδεμένοι χρήστες (ο κανόνας γίνεται
`allow read, write: if request.auth != null;`).

## Δομή αρχείων

```
index.html                # κέλυφος hub (launcher + nav)
styles.css                # κοινά responsive στυλ
firebase/firestore.rules  # κανόνες βάσης
firebase.json, .firebaserc
js/
  app.js                  # hub: routing, launcher, κοινό περιβάλλον
  home.js                 # οθόνη εκκίνησης με τις κάρτες εφαρμογών
  config.js               # ρυθμίσεις + firebaseConfig
  modal.js, toast.js, utils.js
  core/db.js              # layer δεδομένων (Firestore ή localStorage) για όλα τα apps
  # --- Εκκρεμείς Πωλήσεις ---
  ekremis-app.js, store.js, insights.js, cards.js, seed-data.js
  view-dashboard.js, view-properties.js, view-tasks.js, view-settings.js,
  view-detail.js, view-form.js
  # --- Ταμείο ---
  tameio/app.js, store.js, insights.js, forms.js, constants.js,
  office.js, view-dashboard.js, view-transactions.js, view-jobs.js,
  view-people.js, view-reports.js, view-settings.js
  # --- Τεχνικός Έλεγχος ---
  texnikos/app.js, store.js, editor.js, presets.js, print.js, settings.js,
  view-list.js, view-settings.js
```

Κάθε αρχείο κρατιέται κάτω από ~1000 γραμμές για εύκολη συντήρηση.

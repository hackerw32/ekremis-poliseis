# Εκκρεμείς Πωλήσεις — Dashboard

Εφαρμογή διαχείρισης εκκρεμών πωλήσεων μεσιτικού γραφείου. Λειτουργεί σε
**κινητό και υπολογιστή** (responsive) και φιλοξενείται δωρεάν στο **GitHub Pages**.

## Δυνατότητες

- **Dashboard** με στατιστικά: πλήθος υποθέσεων, ενεργές, εκκρεμότητες, αξία, προκαταβολές, οφειλές.
- **Υποθέσεις**: αναζήτηση (κωδικός, όνομα, τηλέφωνο), φίλτρα κατάστασης και σημάνσεων, ταξινόμηση.
- **Καρτέλα υπόθεσης**: οικονομικά, επαφές (με κλήση/Viber/email), ενδιαφερόμενοι, εκκρεμότητες, οφειλές, σημειώσεις.
- **Εκκρεμότητες**: ομαδοποίηση σε εκπρόθεσμες / επόμενες 7 ημέρες / αργότερα / χωρίς ημερομηνία, με υπεύθυνο και προθεσμία.
- **Πλήρης διαχείριση**: προσθήκη, επεξεργασία, διαγραφή, γρήγορη εναλλαγή ολοκλήρωσης εργασιών/οφειλών.
- **Συγχρονισμός** σε όλες τις συσκευές μέσω Firebase Firestore (προαιρετικό) ή τοπική αποθήκευση.
- Εξαγωγή/εισαγωγή δεδομένων σε JSON (backup), επαναφορά αρχικών δεδομένων.

## Τοπική εκτέλεση

Άνοιξε το `index.html` σε browser, ή σήκωσε έναν τοπικό server:

```powershell
# από τον φάκελο του project
python -m http.server 8080
# μετά άνοιξε http://localhost:8080
```

> Σημείωση: για σωστή λειτουργία των ES modules καλό είναι να τρέχει μέσω http(s),
> όχι με διπλό κλικ στο αρχείο (file://).

## Συγχρονισμός με Firebase (κινητό + υπολογιστής)

Χωρίς ρύθμιση, τα δεδομένα μένουν τοπικά στη συσκευή (localStorage). Για κοινά
δεδομένα σε όλες τις συσκευές:

1. Πήγαινε στο <https://console.firebase.google.com> → **Add project** (δωρεάν πλάνο Spark).
2. Μέσα στο project: **Build → Firestore Database → Create database** (Production mode ή Test mode).
3. **Project settings (⚙️) → Your apps → Web (`</>`)** → δημιούργησε app και αντίγραψε το `firebaseConfig`.
4. Άνοιξε το `js/config.js` και συμπλήρωσε το `firebaseConfig`:

```js
export const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "to-project.firebaseapp.com",
  projectId: "to-project",
  storageBucket: "to-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef",
};
```

5. Στο **Firestore → Rules** βάλε κανόνες (δες `firebase/firestore.rules`) και **Publish**.
6. Άνοιξε την εφαρμογή: στο πρώτο άνοιγμα θα περαστούν αυτόματα οι αρχικές υποθέσεις.

### Ασφάλεια

Οι κανόνες που δίνω επιτρέπουν πρόσβαση σε όποιον γνωρίζει το project. Είναι
ικανοποιητικό για προσωπική/εσωτερική χρήση. Για αυξημένη ασφάλεια μπορεί
αργότερα να προστεθεί Firebase Authentication (π.χ. email/κωδικός) και οι κανόνες
να απαιτούν συνδεδεμένο χρήστη.

## Δομή αρχείων

```
index.html            # κέλυφος εφαρμογής
styles.css            # responsive στυλ (φωτεινό/σκούρο θέμα)
js/
  app.js              # εκκίνηση, routing, event handling
  config.js           # ρυθμίσεις + firebaseConfig  ← πειράζεις μόνο αυτό
  store.js            # δεδομένα: localStorage ή Firestore (realtime)
  insights.js         # στατιστικά, ομαδοποίηση εργασιών, φίλτρα
  cards.js            # κάρτες υποθέσεων / εργασιών
  modal.js            # drawers & dialogs
  toast.js            # μηνύματα
  seed-data.js        # αρχικά δεδομένα από το αρχείο txt
  utils.js            # βοηθητικές συναρτήσεις
  view-dashboard.js   # προβολή Dashboard
  view-properties.js  # προβολή Υποθέσεων
  view-tasks.js       # προβολή Εκκρεμοτήτων
  view-settings.js    # προβολή Ρυθμίσεων
  view-detail.js      # καρτέλα υπόθεσης
  view-form.js        # φόρμα προσθήκης/επεξεργασίας
firebase/firestore.rules
```

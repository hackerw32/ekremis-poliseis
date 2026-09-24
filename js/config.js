// ---------------------------------------------------------------------------
// ΡΥΘΜΙΣΕΙΣ ΕΦΑΡΜΟΓΗΣ
// Αυτό το αρχείο είναι το μόνο που χρειάζεται να πειράξεις για να συνδέσεις
// το Firebase (συγχρονισμός σε κινητό + υπολογιστή). Δες το README.md.
// ---------------------------------------------------------------------------

export const appSettings = {
  agencyName: "Μεσιτικό Γραφείο",
  currency: "EUR",
  locale: "el-GR",
};

// ↓↓↓ Βάλε εδώ το config από το Firebase Console (Project settings → Your apps → Web) ↓↓↓
export const firebaseConfig = {
  apiKey: "AIzaSyBzgkl6ee5nkRwkDbXIvjkc9LPuRKGfHow",
  authDomain: "ekremis-poliseis.firebaseapp.com",
  projectId: "ekremis-poliseis",
  storageBucket: "ekremis-poliseis.firebasestorage.app",
  messagingSenderId: "924180352212",
  appId: "1:924180352212:web:3d61eba21f4394691dff41",
};

// Συλλογή στο Firestore όπου αποθηκεύονται οι υποθέσεις
export const COLLECTION = "properties";

let _fb = null;
let _loading = null;

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

export async function getFirebase() {
  if (!isFirebaseConfigured()) return null;
  if (_fb) return _fb;
  if (_loading) return _loading;
  _loading = (async () => {
    const V = "10.12.2";
    const [appMod, fsMod] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
    ]);
    const app = appMod.initializeApp(firebaseConfig);
    const db = fsMod.getFirestore(app);
    _fb = { app, db, fs: fsMod };
    return _fb;
  })();
  return _loading;
}

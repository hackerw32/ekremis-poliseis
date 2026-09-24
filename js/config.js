// ---------------------------------------------------------------------------
// ΡΥΘΜΙΣΕΙΣ ΕΦΑΡΜΟΓΗΣ
// ---------------------------------------------------------------------------

export const appSettings = {
  agencyName: "Μεσιτικό Γραφείο",
  currency: "EUR",
  locale: "el-GR",
};

// Firebase project: ekremis-poliseis
export const firebaseConfig = {
  apiKey: "AIzaSyBzgkl6ee5nkRwkDbXIvjkc9LPuRKGfHow",
  authDomain: "ekremis-poliseis.firebaseapp.com",
  projectId: "ekremis-poliseis",
  storageBucket: "ekremis-poliseis.firebasestorage.app",
  messagingSenderId: "924180352212",
  appId: "1:924180352212:web:3d61eba21f4394691dff41",
};

const SDK = "10.12.2";

let _app = null;
let _fb = null;
let _auth = null;
let _loading = null;

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

export async function getApp() {
  if (!isFirebaseConfigured()) return null;
  if (_app) return _app;
  const appMod = await import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-app.js`);
  _app = appMod.initializeApp(firebaseConfig);
  return _app;
}

export async function getFirebase() {
  if (!isFirebaseConfigured()) return null;
  if (_fb) return _fb;
  if (_loading) return _loading;
  _loading = (async () => {
    const app = await getApp();
    const fsMod = await import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-firestore.js`);
    const db = fsMod.getFirestore(app);
    _fb = { app, db, fs: fsMod };
    return _fb;
  })();
  return _loading;
}

export async function getAuthApi() {
  if (!isFirebaseConfigured()) return null;
  if (_auth) return _auth;
  const app = await getApp();
  const authMod = await import(`https://www.gstatic.com/firebasejs/${SDK}/firebase-auth.js`);
  const auth = authMod.getAuth(app);
  _auth = { auth, authMod };
  return _auth;
}

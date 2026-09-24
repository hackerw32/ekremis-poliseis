import { getAuthApi, isFirebaseConfigured } from "../config.js";

export function authAvailable() {
  return isFirebaseConfigured();
}

export async function onAuthChange(cb) {
  if (!authAvailable()) {
    cb(null);
    return () => {};
  }
  const { auth, authMod } = await getAuthApi();
  return authMod.onAuthStateChanged(auth, cb);
}

export async function signUp(name, email, password) {
  const { auth, authMod } = await getAuthApi();
  const cred = await authMod.createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name) {
    try {
      await authMod.updateProfile(cred.user, { displayName: name.trim() });
    } catch {}
  }
  return cred.user;
}

export async function signIn(email, password) {
  const { auth, authMod } = await getAuthApi();
  const cred = await authMod.signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function signOutUser() {
  const { auth, authMod } = await getAuthApi();
  await authMod.signOut(auth);
}

export async function resetPassword(email) {
  const { auth, authMod } = await getAuthApi();
  await authMod.sendPasswordResetEmail(auth, email.trim());
}

export function displayName(user) {
  if (!user) return "";
  return user.displayName || (user.email ? user.email.split("@")[0] : "Χρήστης");
}

export function describeError(err) {
  const code = (err && err.code) || "";
  const map = {
    "auth/email-already-in-use": "Το email χρησιμοποιείται ήδη.",
    "auth/invalid-email": "Μη έγκυρο email.",
    "auth/weak-password": "Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.",
    "auth/missing-password": "Συμπλήρωσε κωδικό.",
    "auth/user-not-found": "Δεν υπάρχει λογαριασμός με αυτό το email.",
    "auth/wrong-password": "Λάθος κωδικός.",
    "auth/invalid-credential": "Λάθος email ή κωδικός.",
    "auth/too-many-requests": "Πολλές προσπάθειες. Δοκίμασε αργότερα.",
    "auth/operation-not-allowed": "Η σύνδεση με email/password δεν είναι ενεργή. Ενεργοποίησέ την στο Firebase Console → Authentication → Sign-in method → Email/Password.",
    "auth/configuration-not-found": "Το Authentication δεν έχει ρυθμιστεί ακόμη. Άνοιξε Firebase Console → Authentication και πάτα «Ξεκινήστε», μετά ενεργοποίησε Email/Password.",
    "auth/network-request-failed": "Πρόβλημα δικτύου. Έλεγξε τη σύνδεση.",
  };
  return map[code] || (err && err.message) || "Κάτι πήγε στραβά.";
}

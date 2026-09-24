import { getFirebase, isFirebaseConfigured, COLLECTION } from "./config.js";
import { SEED_PROPERTIES } from "./seed-data.js";
import { uid } from "./utils.js";

const LS_KEY = "ekremis_poliseis_v1";
const LS_SEEDED = "ekremis_seeded_v1";

const state = {
  ready: false,
  mode: isFirebaseConfigured() ? "firebase" : "local",
  error: null,
  properties: [],
};

const listeners = new Set();

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (e) {
      console.error(e);
    }
  });
}

export function emptyProperty() {
  return {
    code: "",
    title: "",
    type: "πώληση",
    status: "Ενεργό",
    price: null,
    depositAmount: null,
    depositDate: "",
    depositNote: "",
    availability: "",
    seller: "",
    sellerPhone: "",
    sellerEmail: "",
    buyer: "",
    buyerPhone: "",
    buyerEmail: "",
    contacts: [],
    debts: [],
    tasks: [],
    interested: [],
    notes: "",
  };
}

export function normalizeProperty(p) {
  const base = emptyProperty();
  const out = { ...base, ...(p || {}) };
  out.contacts = Array.isArray(out.contacts) ? out.contacts : [];
  out.debts = Array.isArray(out.debts) ? out.debts : [];
  out.tasks = Array.isArray(out.tasks) ? out.tasks : [];
  out.interested = Array.isArray(out.interested) ? out.interested : [];
  return out;
}

function withSeedIds(list) {
  const now = new Date().toISOString();
  return list.map((p) => ({
    id: uid(),
    ...normalizeProperty(p),
    createdAt: now,
    updatedAt: now,
  }));
}

// ------------------------------- LOCAL -------------------------------------
function loadLocal() {
  let raw = null;
  try {
    raw = localStorage.getItem(LS_KEY);
  } catch {
    raw = null;
  }
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        state.properties = parsed.map(normalizeProperty);
        return;
      }
    } catch (e) {
      console.warn("localStorage parse error", e);
    }
  }
  state.properties = withSeedIds(SEED_PROPERTIES);
  persistLocal();
}

function persistLocal() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state.properties));
  } catch (e) {
    console.warn("localStorage write error", e);
  }
}

// ------------------------------ FIREBASE -----------------------------------
let fbSeenData = false;

async function initFirebase() {
  const fb = await getFirebase();
  if (!fb) {
    state.mode = "local";
    loadLocal();
    state.ready = true;
    emit();
    return;
  }
  const { db, fs } = fb;
  const col = fs.collection(db, COLLECTION);
  fs.onSnapshot(
    col,
    (snap) => {
      const arr = [];
      snap.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));
      state.properties = arr.map(normalizeProperty);
      state.error = null;
      state.ready = true;
      emit();
      if (arr.length) {
        fbSeenData = true;
      } else if (!fbSeenData && !localStorage.getItem(LS_SEEDED)) {
        seedFirebase(col, fs, db);
      }
    },
    (err) => {
      console.error(err);
      state.error = err.message || String(err);
      state.ready = true;
      emit();
    }
  );
}

async function seedFirebase(col, fs, db) {
  try {
    const batch = fs.writeBatch(db);
    withSeedIds(SEED_PROPERTIES).forEach((p) => {
      batch.set(fs.doc(db, COLLECTION, p.id), p);
    });
    await batch.commit();
    localStorage.setItem(LS_SEEDED, "1");
  } catch (e) {
    console.error("seed error", e);
  }
}

// ------------------------------- PUBLIC API --------------------------------
export async function initStore() {
  if (state.ready) return;
  if (state.mode === "firebase") {
    try {
      await initFirebase();
    } catch (e) {
      console.error("Firebase init failed, falling back to local", e);
      state.mode = "local";
      state.error = e.message || String(e);
      loadLocal();
      state.ready = true;
      emit();
    }
  } else {
    loadLocal();
    state.ready = true;
    emit();
  }
}

export function getProperty(id) {
  return state.properties.find((p) => p.id === id) || null;
}

export async function addProperty(data) {
  const now = new Date().toISOString();
  const id = uid();
  const record = { ...normalizeProperty(data), id, createdAt: now, updatedAt: now };
  if (state.mode === "firebase") {
    const { db, fs } = await getFirebase();
    await fs.setDoc(fs.doc(db, COLLECTION, id), record);
    return id;
  }
  state.properties = [record, ...state.properties];
  persistLocal();
  emit();
  return id;
}

export async function updateProperty(id, patch) {
  const now = new Date().toISOString();
  if (state.mode === "firebase") {
    const { db, fs } = await getFirebase();
    const clean = { ...patch };
    delete clean.id;
    clean.updatedAt = now;
    await fs.setDoc(fs.doc(db, COLLECTION, id), clean, { merge: true });
    return;
  }
  state.properties = state.properties.map((p) =>
    p.id === id ? { ...p, ...patch, updatedAt: now } : p
  );
  persistLocal();
  emit();
}

export async function deleteProperty(id) {
  if (state.mode === "firebase") {
    const { db, fs } = await getFirebase();
    await fs.deleteDoc(fs.doc(db, COLLECTION, id));
    return;
  }
  state.properties = state.properties.filter((p) => p.id !== id);
  persistLocal();
  emit();
}

export async function importProperties(list, { replace = false } = {}) {
  const incoming = (list || []).map((p) => normalizeProperty(p));
  if (state.mode === "firebase") {
    const { db, fs } = await getFirebase();
    const batch = fs.writeBatch(db);
    if (replace) {
      state.properties.forEach((p) => batch.delete(fs.doc(db, COLLECTION, p.id)));
    }
    incoming.forEach((p) => {
      const id = p.id || uid();
      batch.set(fs.doc(db, COLLECTION, id), { ...p, id });
    });
    await batch.commit();
    return incoming.length;
  }
  const now = new Date().toISOString();
  const mapped = incoming.map((p) => ({
    id: p.id || uid(),
    ...normalizeProperty(p),
    createdAt: p.createdAt || now,
    updatedAt: now,
  }));
  state.properties = replace ? mapped : [...mapped, ...state.properties];
  persistLocal();
  emit();
  return mapped.length;
}

export async function resetToSeed() {
  if (state.mode === "firebase") {
    const { db, fs } = await getFirebase();
    const batch = fs.writeBatch(db);
    state.properties.forEach((p) => batch.delete(fs.doc(db, COLLECTION, p.id)));
    withSeedIds(SEED_PROPERTIES).forEach((p) => batch.set(fs.doc(db, COLLECTION, p.id), p));
    await batch.commit();
    return;
  }
  state.properties = withSeedIds(SEED_PROPERTIES);
  persistLocal();
  emit();
}

export async function clearAll() {
  if (state.mode === "firebase") {
    const { db, fs } = await getFirebase();
    const batch = fs.writeBatch(db);
    state.properties.forEach((p) => batch.delete(fs.doc(db, COLLECTION, p.id)));
    await batch.commit();
    return;
  }
  state.properties = [];
  persistLocal();
  emit();
}

export function exportJSON() {
  return JSON.stringify(state.properties, null, 2);
}

// Κεντρικό layer δεδομένων. Τα δεδομένα κάθε χρήστη είναι ξεχωριστά:
//   Firebase: users/{uid}/{collection}
//   Τοπικά:   hub_v1_{uid}_{collection}

import { getFirebase, isFirebaseConfigured } from "../config.js";
import { SEED_PROPERTIES } from "../seed-data.js";
import { uid as newId } from "../utils.js";

export const COLLECTIONS = {
  properties: { seed: SEED_PROPERTIES },
  tameio_clients: { seed: [] },
  tameio_partners: { seed: [] },
  tameio_jobs: { seed: [] },
  tameio_transactions: { seed: [] },
  texnikos_docs: { seed: [] },
  leads: { seed: [] },
};

const LS = "hub_v1_";
const SEED_FLAG = "hub_v1_seeded_";

const listeners = new Set();
const state = {
  ready: false,
  mode: isFirebaseConfigured() ? "firebase" : "local",
  error: null,
  uid: null,
  data: {},
};
Object.keys(COLLECTIONS).forEach((c) => {
  state.data[c] = [];
});

let started = false;
let unsubs = [];

export function subscribe(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export function getState() {
  return state;
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

function collectionSeed(col) {
  const cfg = COLLECTIONS[col];
  return cfg && Array.isArray(cfg.seed) ? cfg.seed : [];
}

function withSeed(records) {
  const now = new Date().toISOString();
  return records.map((r) => ({ id: newId(), ...r, createdAt: r.createdAt || now, updatedAt: now }));
}

function emptyData() {
  const d = {};
  Object.keys(COLLECTIONS).forEach((c) => (d[c] = []));
  return d;
}

// ------------------------------- LOCAL -------------------------------------
function localKey(col) {
  return `${LS}${state.uid}_${col}`;
}

function persistLocal(col) {
  try {
    localStorage.setItem(localKey(col), JSON.stringify(state.data[col] || []));
  } catch (e) {
    console.warn("localStorage write error", col, e);
  }
}

function loadLocal() {
  Object.keys(COLLECTIONS).forEach((col) => {
    let stored = null;
    try {
      stored = localStorage.getItem(localKey(col));
    } catch {
      stored = null;
    }
    if (stored) {
      try {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) {
          state.data[col] = arr;
          return;
        }
      } catch (e) {
        console.warn("parse error", col, e);
      }
    }
    const seed = collectionSeed(col);
    state.data[col] = seed.length ? withSeed(seed) : [];
    persistLocal(col);
  });
}

// ------------------------------ FIREBASE -----------------------------------
async function seedFirebase(col, fs, db) {
  const seed = collectionSeed(col);
  if (!seed.length) return;
  try {
    const batch = fs.writeBatch(db);
    withSeed(seed).forEach((r) => batch.set(fs.doc(db, "users", state.uid, col, r.id), r));
    await batch.commit();
    localStorage.setItem(SEED_FLAG + state.uid + col, "1");
  } catch (e) {
    console.error("seed error", col, e);
  }
}

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
  const pending = new Set(Object.keys(COLLECTIONS));

  setTimeout(() => {
    if (!state.ready) {
      state.ready = true;
      emit();
    }
  }, 8000);

  Object.keys(COLLECTIONS).forEach((col) => {
    const ref = fs.collection(db, "users", state.uid, col);
    const unsub = fs.onSnapshot(
      ref,
      (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        state.data[col] = arr;
        pending.delete(col);
        state.error = null;
        if (pending.size === 0) state.ready = true;
        emit();
        if (arr.length) localStorage.setItem(SEED_FLAG + state.uid + col, "1");
        else if (!localStorage.getItem(SEED_FLAG + state.uid + col)) seedFirebase(col, fs, db);
      },
      (err) => {
        console.error("snapshot error", col, err);
        state.error = err.message || String(err);
        pending.delete(col);
        state.ready = true;
        emit();
      }
    );
    unsubs.push(unsub);
  });
}

export async function init(userId) {
  const target = userId || "local";
  if (started && state.uid === target) return;
  stop();
  state.uid = target;
  state.data = emptyData();
  state.ready = false;
  state.error = null;
  state.mode = isFirebaseConfigured() ? "firebase" : "local";
  started = true;

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

export function stop() {
  unsubs.forEach((u) => {
    try {
      u();
    } catch {}
  });
  unsubs = [];
  started = false;
}

// ------------------------------- CRUD --------------------------------------
export function list(col) {
  return state.data[col] || [];
}

export function get(col, id) {
  return list(col).find((r) => r.id === id) || null;
}

export async function add(col, record) {
  const now = new Date().toISOString();
  const id = record.id || newId();
  const rec = { ...record, id };
  if (!rec.createdAt) rec.createdAt = now;
  rec.updatedAt = now;
  if (state.mode === "firebase") {
    const { db, fs } = await getFirebase();
    await fs.setDoc(fs.doc(db, "users", state.uid, col, id), rec);
    return id;
  }
  state.data[col] = [rec, ...list(col)];
  persistLocal(col);
  emit();
  return id;
}

export async function update(col, id, patch) {
  const now = new Date().toISOString();
  if (state.mode === "firebase") {
    const { db, fs } = await getFirebase();
    const clean = { ...patch };
    delete clean.id;
    clean.updatedAt = now;
    await fs.setDoc(fs.doc(db, "users", state.uid, col, id), clean, { merge: true });
    return;
  }
  state.data[col] = list(col).map((r) => (r.id === id ? { ...r, ...patch, updatedAt: now } : r));
  persistLocal(col);
  emit();
}

export async function remove(col, id) {
  if (state.mode === "firebase") {
    const { db, fs } = await getFirebase();
    await fs.deleteDoc(fs.doc(db, "users", state.uid, col, id));
    return;
  }
  state.data[col] = list(col).filter((r) => r.id !== id);
  persistLocal(col);
  emit();
}

export async function replaceAll(col, records) {
  const now = new Date().toISOString();
  const mapped = (records || []).map((r) => ({ ...r, id: r.id || newId(), createdAt: r.createdAt || now, updatedAt: now }));
  if (state.mode === "firebase") {
    const { db, fs } = await getFirebase();
    const batch = fs.writeBatch(db);
    list(col).forEach((r) => batch.delete(fs.doc(db, "users", state.uid, col, r.id)));
    mapped.forEach((r) => batch.set(fs.doc(db, "users", state.uid, col, r.id), r));
    await batch.commit();
    return;
  }
  state.data[col] = mapped;
  persistLocal(col);
  emit();
}

export async function clear(col) {
  if (state.mode === "firebase") {
    const { db, fs } = await getFirebase();
    const batch = fs.writeBatch(db);
    list(col).forEach((r) => batch.delete(fs.doc(db, "users", state.uid, col, r.id)));
    await batch.commit();
    return;
  }
  state.data[col] = [];
  persistLocal(col);
  emit();
}

export function exportAll() {
  return JSON.stringify(state.data, null, 2);
}

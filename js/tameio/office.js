const KEY = "tameio_office_v1";

const DEFAULTS = {
  name: "ΤΕΧΝΙΚΟ ΚΑΙ ΜΕΣΙΤΙΚΟ ΓΡΑΦΕΙΟ",
  owner: "ΡΑΦΑΗΛΙΑ ΣΑΜΟΘΡΑΚΗ",
  title: "ΔΙΠΛΩΜΑΤΟΥΧΟΣ ΤΕΧΝΟΛΟΓΟΣ ΠΟΛΙΤΙΚΟΣ ΜΗΧΑΝΙΚΟΣ",
  address: "ΣΑΛΑΜΙΝΟΜΑΧΩΝ 46, ΠΑΛΟΥΚΙ ΣΑΛΑΜΙΝΑΣ",
  tax_id: "ΑΦΜ 104561830 - Δ.Ο.Υ. Ε' ΠΕΙΡΑΙΑ",
  phone: "697 791 7523 - 697 267 3964 - 210 467 1050",
  email: "",
  currency: "EUR",
};

export function getOffice() {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) || "{}") || {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveOffice(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.warn(e);
  }
}

export { DEFAULTS };

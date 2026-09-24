const KEY = "texnikos_settings_v1";

export const DEFAULT_SETTINGS = {
  company: {
    line1: "ΤΕΧΝΙΚΟ ΚΑΙ ΜΕΣΙΤΙΚΟ ΓΡΑΦΕΙΟ",
    line2: "ΛΕΚΑΝΟΠΕΔΙΟΥ ΑΤΤΙΚΗΣ",
    since: "ΕΤΟΣ ΙΔΡΥΣΕΩΣ 1975",
    engineer: "ΡΑΦΑΗΛΙΑ ΣΑΜΟΘΡΑΚΗ",
    engineer_title: "ΔΙΠΛΩΜΑΤΟΥΧΟΣ ΤΕΧΝΟΛΟΓΟΣ ΠΟΛΙΤΙΚΟΣ ΜΗΧΑΝΙΚΟΣ",
    address: "ΣΑΛΑΜΙΝΟΜΑΧΩΝ 46, ΠΑΛΟΥΚΙ ΣΑΛΑΜΙΝΑΣ",
    afm: "ΑΦΜ: 104561830 - Δ.Ο.Υ. Ε' ΠΕΙΡΑΙΑ",
    phones: "ΤΗΛ: 6972673964 - 697797523 - 2104671050 - 2155450650",
    email: "",
  },
  letter: {
    slogan: "ΤΕΧΝΙΚΟΣ ΕΛΕΓΧΟΣ ΑΚΙΝΗΤΩΝ - ΤΑΚΤΟΠΟΙΗΣΗ - ΕΚΔΟΣΗ ΔΙΚΑΙΟΛΟΓΗΤΙΚΩΝ",
    closing: "Σας ευχαριστούμε για τη συνεργασία.",
    bank_name: "ΕΘΝΙΚΗ ΤΡΑΠΕΖΑ",
    bank_iban: "GR-390-110-185-00000-18500-455433",
  },
  appearance: { show_bank: true, font_scale: 1 },
};

function deepMerge(base, override) {
  const out = { ...base };
  Object.keys(override || {}).forEach((k) => {
    if (override[k] && typeof override[k] === "object" && !Array.isArray(override[k])) {
      out[k] = deepMerge(base[k] || {}, override[k]);
    } else {
      out[k] = override[k];
    }
  });
  return out;
}

export function getSettings() {
  try {
    return deepMerge(DEFAULT_SETTINGS, JSON.parse(localStorage.getItem(KEY) || "{}"));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {
    console.warn(e);
  }
}

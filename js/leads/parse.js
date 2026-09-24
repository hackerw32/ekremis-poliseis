// Έξυπνη ανάγνωση απαντήσεων Google Forms (CSV/πίνακας) και μετατροπή σε leads.
import { deburr } from "../utils.js";

export const SEARCH_TYPES = ["Αγορά", "Ενοικίαση", "Πώληση", "Άλλο"];
export const PROPERTY_TYPES = [
  "Μονοκατοικία",
  "Διαμέρισμα",
  "Διπλοκατοικία",
  "Γκαρσονιέρα",
  "Οικόπεδο",
  "Αγροτεμάχιο",
  "Επαγγελματικός χώρος",
  "Άλλο",
];

// --------------------------- CSV parser ------------------------------------
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const s = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}

// --------------------------- column mapping --------------------------------
const HEADER_RULES = [
  ["timestamp", ["χρονικη", "σημανση", "timestamp"]],
  ["name", ["ονομα", "επωνυμο", "name"]],
  ["phone", ["τηλεφων", "phone", "κινητο"]],
  ["email", ["email", "mail", "ιμειλ"]],
  ["wants", ["τι ψαχνετε", "ψαχνετε", "ενδιαφερ"]],
  ["area", ["περιοχη", "area", "τοποθεσια"]],
  ["price", ["ενοικιο", "τιμη", "ποσο", "budget", "μεγιστο"]],
  ["sqm", ["τετραγων", "τμ", "εμβαδ"]],
  ["consent", ["συγκαταθεση", "αδεια", "consent"]],
];

function headerIndex(header) {
  const norm = header.map((h) => deburr(h));
  const map = {};
  norm.forEach((h, i) => {
    HEADER_RULES.forEach(([key, words]) => {
      if (map[key] !== undefined) return;
      if (words.some((w) => h.includes(w))) map[key] = i;
    });
  });
  return map;
}

function looksLikeHeader(row) {
  const h = headerIndex(row);
  return h.name !== undefined || h.phone !== undefined || h.wants !== undefined;
}

const POSITIONAL = {
  timestamp: 0,
  name: 1,
  phone: 2,
  email: 3,
  wants: 4,
  area: 5,
  price: 6,
  sqm: 7,
  consent: 8,
};

// --------------------------- value parsing ---------------------------------
function extractNumbers(text) {
  const cleaned = String(text || "")
    .replace(/€|euro|eur/gi, " ")
    .replace(/\u00a0/g, " ");
  const raw = cleaned.match(/\d[\d.,]*/g) || [];
  return raw
    .map((s) => {
      let t = s.replace(/\.(?=\d{3}(\D|$))/g, "").replace(/,(?=\d{3}(\D|$))/g, "");
      t = t.replace(/,/g, ".");
      const n = parseFloat(t);
      return isFinite(n) ? n : null;
    })
    .filter((n) => n !== null && n > 0);
}

export function parseNumberRange(text) {
  const nums = extractNumbers(text);
  if (!nums.length) return { min: null, max: null };
  if (nums.length === 1) {
    const v = nums[0];
    const n = deburr(text);
    if (/(εως|μεχρι|max|το πολυ|κατω απο|μεχρι και)/.test(n)) return { min: null, max: v };
    if (/(πανω απο|ανω|απο |τουλαχιστον|min|και πανω|>=)/.test(n)) return { min: v, max: null };
    return { min: v, max: v };
  }
  const sorted = nums.slice().sort((a, b) => a - b);
  return { min: sorted[0], max: sorted[sorted.length - 1] };
}

export function classifySearch(text) {
  const t = deburr(text);
  let search_type = "";
  if (t.includes("ενοικ")) search_type = "Ενοικίαση";
  else if (t.includes("πωλησ")) search_type = "Πώληση";
  else if (t.includes("αγορα") || t.includes("αγοραζ")) search_type = "Αγορά";

  let property_type = "";
  if (t.includes("μονοκατοικ")) property_type = "Μονοκατοικία";
  else if (t.includes("διαμερισμ")) property_type = "Διαμέρισμα";
  else if (t.includes("διπλοκατοικ")) property_type = "Διπλοκατοικία";
  else if (t.includes("γκαρσονιερ")) property_type = "Γκαρσονιέρα";
  else if (t.includes("αγροτεμαχ")) property_type = "Αγροτεμάχιο";
  else if (t.includes("οικοπεδ")) property_type = "Οικόπεδο";
  else if (t.includes("καταστημ") || t.includes("μαγαζ") || t.includes("επαγγελματ")) property_type = "Επαγγελματικός χώρος";
  else if (t.includes("σπιτι") || t.includes("κατοικ")) property_type = "Μονοκατοικία";
  return { search_type, property_type };
}

function cleanEmail(v) {
  return String(v || "").trim().replace(/\s+/g, "").toLowerCase();
}

export function leadFromRow(row, map) {
  const at = (key) => {
    const idx = map[key];
    return idx === undefined ? "" : String(row[idx] ?? "").trim();
  };
  const wants = at("wants");
  const { search_type, property_type } = classifySearch(wants);
  const price = parseNumberRange(at("price"));
  const sqm = parseNumberRange(at("sqm"));
  const email = cleanEmail(at("email"));
  const name = at("name");
  const phone = at("phone");
  if (!name && !phone && !email) return null;
  return {
    created: at("timestamp"),
    name,
    phone,
    email: email === "δενεχω" ? "" : email,
    consent: at("consent"),
    wants,
    search_type,
    property_type,
    area: at("area") || "Σαλαμίνα",
    price_min: price.min,
    price_max: price.max,
    price_text: at("price"),
    sqm_min: sqm.min,
    sqm_max: sqm.max,
    sqm_text: at("sqm"),
    status: "Νέο",
    source: "Google Form",
    notes: "",
  };
}

export function parseLeads(text) {
  const rows = parseCSV(text);
  if (!rows.length) return [];
  let map;
  let start = 0;
  if (looksLikeHeader(rows[0])) {
    map = headerIndex(rows[0]);
    start = 1;
  } else {
    map = { ...POSITIONAL };
  }
  // συμπλήρωση τυχών κενών θέσεων από τη προεπιλεγμένη χαρτογράφηση
  Object.keys(POSITIONAL).forEach((k) => {
    if (map[k] === undefined) map[k] = POSITIONAL[k];
  });
  const leads = [];
  for (let i = start; i < rows.length; i++) {
    const lead = leadFromRow(rows[i], map);
    if (lead) leads.push(lead);
  }
  return leads;
}

// Dedup: ίδιο τηλέφωνο+email+περιγραφή -> κρατάμε το τελευταίο
export function dedupeLeads(leads) {
  const seen = new Map();
  leads.forEach((l) => {
    const key = (l.phone || "") + "|" + (l.email || "") + "|" + deburr(l.wants || "");
    seen.set(key, l);
  });
  return [...seen.values()];
}

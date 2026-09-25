import { deburr, formatCurrency } from "../utils.js";

const TYPE_KEYWORDS = {
  "Μονοκατοικία": ["μονοκατοικ", "σπιτι", "κατοικ"],
  "Διαμέρισμα": ["διαμερισμ"],
  "Διπλοκατοικία": ["διπλοκατοικ"],
  "Γκαρσονιέρα": ["γκαρσονιερ", "στοντιο", "studio"],
  "Οικόπεδο": ["οικοπεδ", "οικοπεδο"],
  "Αγροτεμάχιο": ["αγροτεμαχ", "αγροτεμαχιο", "χωραφ"],
  "Επαγγελματικός χώρος": ["καταστημ", "μαγαζ", "επαγγελματ", "γραφει"],
};

const AREA_WORDS = ["σαλαμινα", "παλουκια", "αιαντιο", "σεληνια", "αμπελακια", "μποσκο", "βασικα", "βασιλικα", "ρεστη", "κακη βιγλα", "χαλικα"];

function itemText(p) {
  return deburr([p.title, p.notes, p.type, p.address, p.availability].filter(Boolean).join(" "));
}

export function scoreMatch(lead, p) {
  const text = itemText(p);
  const ptype = deburr(p.type || "");
  const price = Number(p.price) || 0;
  const sqm = Number(p.sqm) || 0;
  let score = 0;
  const reasons = [];

  // 1) Συναλλαγή
  if (lead.search_type === "Αγορά") {
    if (ptype.includes("ενοικ")) score -= 50;
    else { score += 25; reasons.push("προς πώληση"); }
  } else if (lead.search_type === "Ενοικίαση") {
    if (ptype.includes("πωλησ")) score -= 45;
    else { score += 40; reasons.push("προς ενοικίαση"); }
  } else {
    score += 10;
  }

  // 2) Τύπος ακινήτου
  if (lead.property_type && TYPE_KEYWORDS[lead.property_type]) {
    if (TYPE_KEYWORDS[lead.property_type].some((k) => text.includes(k))) { score += 25; reasons.push(lead.property_type); }
    else score -= 10;
  }

  // 3) Τιμή
  if (lead.price_max && price) {
    if (price <= lead.price_max * 1.05) { score += 30; reasons.push("εντός budget"); }
    else if (price <= lead.price_max * 1.15) { score += 12; reasons.push("λίγο πάνω"); }
    else score -= 40;
  }
  if (lead.price_min && price && price < lead.price_min * 0.75) score -= 8;

  // 4) Εμβαδόν
  if (lead.sqm_min && sqm) {
    if (sqm >= lead.sqm_min * 0.9) { score += 15; reasons.push("εμβαδόν"); }
    else score -= 5;
  }
  if (lead.sqm_max && sqm && sqm > lead.sqm_max * 1.25) score -= 8;

  // 5) Περιοχή
  if (lead.area && AREA_WORDS.some((w) => text.includes(w))) { score += 10; reasons.push("περιοχή"); }

  if (score <= 0) return null;
  return { score, reasons };
}

export function matchLead(lead, items, { minScore = 30, limit = 8 } = {}) {
  const out = [];
  (items || []).forEach((p) => {
    const r = scoreMatch(lead, p);
    if (r && r.score >= minScore) out.push({ property: p, score: r.score, reasons: r.reasons });
  });
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function matchLine(m, currency = "EUR") {
  const p = m.property;
  const price = Number(p.price) ? formatCurrency(p.price, currency) : "—";
  return `• ${p.code ? p.code + " — " : ""}${p.title || ""} (${price})`;
}

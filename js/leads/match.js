import { deburr, formatCurrency } from "../utils.js";

const TYPE_KEYWORDS = {
  "Μονοκατοικία": ["μονοκατοικ", "σπιτι", "κατοικ", "μονοκατοικια"],
  "Διαμέρισμα": ["διαμερισμ"],
  "Διπλοκατοικία": ["διπλοκατοικ"],
  "Γκαρσονιέρα": ["γκαρσονιερ", "στοντιο", "studio"],
  "Οικόπεδο": ["οικοπεδ", "οικοπεδο"],
  "Αγροτεμάχιο": ["αγροτεμαχ", "αγροτεμαχιο", "χωραφ"],
  "Επαγγελματικός χώρος": ["καταστημ", "μαγαζ", "επαγγελματ", "γραφει"],
};

const AREA_WORDS = ["σαλαμινα", "παλουκια", "αιαντιο", "σεληνια", "αμπελακια", "μποσκο", "βασιλικα", "ρεστη", "κακη βιγλα"];

function propertyText(p) {
  return deburr([
    p.title, p.notes, p.type, p.availability,
    (p.interested || []).map((i) => i.name || "").join(" "),
    p.seller,
  ].filter(Boolean).join(" "));
}

export function scoreMatch(lead, p, currency = "EUR") {
  if (["Ολοκληρώθηκε", "Ακυρώθηκε"].includes(p.status)) return null;
  const text = propertyText(p);
  const ptype = deburr(p.type || "");
  const price = Number(p.price) || 0;
  let score = 0;
  const reasons = [];

  // 1) Συμβατότητα συναλλαγής
  if (lead.search_type === "Αγορά") {
    if (ptype.includes("πωλησ")) { score += 40; reasons.push("Πώληση"); }
    else if (ptype.includes("ενοικ")) { score -= 50; }
  } else if (lead.search_type === "Ενοικίαση") {
    if (ptype.includes("ενοικ")) { score += 40; reasons.push("Ενοικίαση"); }
    else if (ptype.includes("πωλησ")) { score -= 45; }
  }

  // 2) Τύπος ακινήτου
  if (lead.property_type && TYPE_KEYWORDS[lead.property_type]) {
    if (TYPE_KEYWORDS[lead.property_type].some((k) => text.includes(k))) {
      score += 25;
      reasons.push(lead.property_type);
    } else {
      score -= 8;
    }
  }

  // 3) Τιμή
  if (lead.price_max && price) {
    if (price <= lead.price_max * 1.05) { score += 30; reasons.push("εντός budget"); }
    else if (price <= lead.price_max * 1.15) { score += 12; reasons.push("λίγο πάνω"); }
    else score -= 40;
  } else if (!price) {
    score += 3; // χωρίς τιμή -> ουδέτερο
  }
  if (lead.price_min && price && price < lead.price_min * 0.75) score -= 8;

  // 4) Περιοχή
  if (lead.area && AREA_WORDS.some((w) => deburr(lead.area).includes(w))) {
    if (AREA_WORDS.some((w) => text.includes(w))) { score += 10; reasons.push("περιοχή"); }
  }

  if (score <= 0) return null;
  return { score, reasons };
}

export function matchLead(lead, properties, { minScore = 30, limit = 8 } = {}) {
  const out = [];
  (properties || []).forEach((p) => {
    const r = scoreMatch(lead, p);
    if (r && r.score >= minScore) out.push({ property: p, score: r.score, reasons: r.reasons });
  });
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function matchSummary(lead, properties, currency = "EUR") {
  const matches = matchLead(lead, properties, { minScore: 30, limit: 999 });
  return { count: matches.length, matches };
}

export function matchLine(m, currency = "EUR") {
  const p = m.property;
  const price = Number(p.price) ? formatCurrency(p.price, currency) : "—";
  return `• ${p.code ? p.code + " — " : ""}${p.title || ""} (${price})${p.availability ? " — " + p.availability : ""}`;
}

import { getOffice } from "../tameio/office.js";
import { formatCurrency } from "../utils.js";

const GENITIVE = {
  "Μονοκατοικία": "μονοκατοικίας",
  "Διαμέρισμα": "διαμερίσματος",
  "Διπλοκατοικία": "διπλοκατοικίας",
  "Γκαρσονιέρα": "γκαρσονιέρας",
  "Οικόπεδο": "οικοπέδου",
  "Αγροτεμάχιο": "αγροτεμαχίου",
  "Επαγγελματικός χώρος": "επαγγελματικού χώρου",
};

function firstName(lead) {
  return (lead.name || "").trim().split(/\s+/)[0] || "κύριε/κυρία";
}

function subjectType(lead) {
  const src = lead.wants || "";
  const stripped = String(src).replace(/αγορά|αγορα|ενοικίαση|ενοικιαση/gi, "").trim();
  if (stripped) return stripped;
  return GENITIVE[lead.property_type] || "ακινήτου";
}

function requestDescription(lead) {
  let d = lead.wants || [lead.search_type, lead.property_type].filter(Boolean).join(" ");
  if (!d) d = "ακίνητο";
  if (lead.area) d += ` στη ${lead.area}`;
  if (lead.price_max) d += ` έως ${formatCurrency(lead.price_max)}`;
  if (lead.sqm_max || lead.sqm_min) {
    const sqm = lead.sqm_min && lead.sqm_max && lead.sqm_min !== lead.sqm_max ? `${lead.sqm_min}-${lead.sqm_max}` : (lead.sqm_max || lead.sqm_min);
    d += ` και ${sqm} τ.μ.`;
  }
  return d;
}

function adBlock(m) {
  const p = m.property;
  const bits = [];
  if (Number(p.price)) bits.push(formatCurrency(p.price));
  if (p.type) bits.push(p.type);
  if (p.sqm) bits.push(`${p.sqm} τ.μ.`);
  if (p.availability) bits.push(p.availability);
  const head = `${p.code ? p.code + " — " : ""}${p.title || ""}`;
  return `• ${head}${bits.length ? "\n   " + bits.join(" · ") : ""}`;
}

export function buildProposalEmail(lead, matches, currency = "EUR") {
  const o = getOffice();
  const n = matches.length;
  const subject = `Πρόταση ${subjectType(lead)} σύμφωνα με τα κριτήριά σας`;
  const phone = o.phone || "6977917523";

  let proposalText;
  if (n === 1) proposalText = "μία διαθέσιμη επιλογή που βρίσκεται πολύ κοντά στα κριτήριά σας:";
  else if (n === 2) proposalText = "δύο διαθέσιμες επιλογές που βρίσκονται πολύ κοντά στα κριτήριά σας:";
  else proposalText = "τις παρακάτω διαθέσιμες επιλογές που βρίσκονται πολύ κοντά στα κριτήριά σας:";

  const ads = matches.map(adBlock).join("\n\n");

  const lines = [
    `Καλησπέρα σας ${firstName(lead)},`,
    "",
    "Σας ευχαριστώ για τη συμπλήρωση της φόρμας και το ενδιαφέρον σας.",
    "",
    `Με βάση το αίτημά σας (${requestDescription(lead)}), σας προτείνω ${proposalText}`,
    "",
    ads,
    "",
    `Τηλέφωνο επικοινωνίας για τα παραπάνω ακίνητα: ${phone}`,
    "",
    "Αν ενδιαφέρεστε, μπορείτε να επικοινωνήσετε για ραντεβού ή για περισσότερες επιλογές που ταιριάζουν στα κριτήριά σας.",
    "",
    "Με εκτίμηση,",
    o.name || "Τεχνικό & Μεσιτικό Γραφείο",
    o.owner || "",
  ];

  return { to: lead.email || "", subject, body: lines.join("\n") };
}

export function mailtoLink(email, subject, body) {
  const params = [];
  if (subject) params.push("subject=" + encodeURIComponent(subject));
  if (body) params.push("body=" + encodeURIComponent(body));
  return `mailto:${encodeURIComponent(email || "")}${params.length ? "?" + params.join("&") : ""}`;
}

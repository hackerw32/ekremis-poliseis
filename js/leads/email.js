import { getOffice } from "../tameio/office.js";
import { matchLine } from "./match.js";
import { formatCurrency } from "../utils.js";

function greeting(lead) {
  return lead.name ? `Αγαπητέ/ή ${lead.name},` : "Καλησπέρα σας,";
}

function criteria(lead) {
  const parts = [];
  if (lead.search_type) parts.push(lead.search_type);
  if (lead.property_type) parts.push(lead.property_type);
  if (lead.area) parts.push(lead.area);
  if (lead.price_max) parts.push("έως " + formatCurrency(lead.price_max));
  if (lead.sqm_min || lead.sqm_max) {
    parts.push(`≈${lead.sqm_min || ""}${lead.sqm_max && lead.sqm_max !== lead.sqm_min ? "-" + lead.sqm_max : ""} τ.μ.`);
  }
  return parts.join(" · ");
}

export function buildProposalEmail(lead, matches, currency = "EUR") {
  const o = getOffice();
  const n = matches.length;

  const subject = n === 1
    ? "Πρόταση ακινήτου σύμφωνα με τα κριτήριά σας"
    : "Προτάσεις ακινήτων σύμφωνα με τα κριτήριά σας";

  let intro;
  if (n === 0) {
    intro = "Σχετικά με την αναζήτησή σας, αυτή τη στιγμή δεν υπάρχει διαθέσιμο ακίνητο που να ταιριάζει απόλυτα στα κριτήριά σας. Θα σας ενημερώσουμε άμεσα μόλις προκύψει κάτι νέο.";
  } else if (n === 1) {
    intro = "Σχετικά με την αναζήτησή σας, εντοπίσαμε ένα ακίνητο που πιστεύουμε ότι ταιριάζει στα κριτήριά σας:";
  } else if (n === 2) {
    intro = "Σχετικά με την αναζήτησή σας, εντοπίσαμε δύο ακίνητα που ταιριάζουν στα κριτήριά σας:";
  } else {
    intro = "Σχετικά με την αναζήτησή σας, εντοπίσαμε τις παρακάτω προτάσεις που ταιριάζουν στα κριτήριά σας:";
  }

  const lines = matches.map((m) => matchLine(m, currency)).join("\n");
  const crit = criteria(lead);

  const parts = [];
  parts.push(greeting(lead));
  parts.push("");
  parts.push(intro);
  if (n > 0) {
    parts.push("");
    parts.push(lines);
    parts.push("");
    parts.push("Για περισσότερες πληροφορίες ή για να κανονίσουμε επίσκεψη, μπορείτε να απαντήσετε στο email ή να μας καλέσετε.");
  }
  parts.push("");
  parts.push("Με εκτίμηση,");
  parts.push(o.name || "Τεχνικό & Μεσιτικό Γραφείο");
  if (o.owner) parts.push(o.owner);
  if (o.phone) parts.push("Τηλ: " + o.phone);
  if (o.email) parts.push("Email: " + o.email);
  if (crit) {
    parts.push("");
    parts.push("(Κριτήριά σας: " + crit + ")");
  }

  return { to: lead.email || "", subject, body: parts.join("\n") };
}

export function mailtoLink(email, subject, body) {
  const params = [];
  if (subject) params.push("subject=" + encodeURIComponent(subject));
  if (body) params.push("body=" + encodeURIComponent(body));
  return `mailto:${encodeURIComponent(email || "")}${params.length ? "?" + params.join("&") : ""}`;
}

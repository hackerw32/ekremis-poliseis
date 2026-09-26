// Popup του extension: μαζεύει αγγελίες από το xe.gr και τις εξάγει σε JSON.
let listings = [];

const $ = (s) => document.querySelector(s);

document.addEventListener("DOMContentLoaded", () => {
  $("#collect").addEventListener("click", collect);
  $("#download").addEventListener("click", download);
  $("#copy").addEventListener("click", copyJson);
  $("#copyText").addEventListener("click", copyPageText);
  updateButtons();
});

function setStatus(msg, cls) {
  const el = $("#status");
  el.textContent = msg || "";
  el.className = cls || "";
}

function updateButtons() {
  $("#download").disabled = !listings.length;
  $("#copy").disabled = !listings.length;
}

async function collect() {
  setStatus("Σαρώνω τη σελίδα…");
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !/xe\.gr/.test(tab.url || "")) {
      setStatus("Άνοιξε πρώτα μια σελίδα του xe.gr με τις αγγελίες σου.", "err");
      return;
    }
    const res = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractListingsPage });
    listings = (res && res[0] && res[0].result) || [];
    if (listings.length) {
      setStatus(`Βρέθηκαν ${listings.length} αγγελίες.`, "ok");
    } else {
      setStatus("Δεν βρέθηκαν αγγελίες αυτόματα. Δοκίμασε «Αντίγραφο όλης της σελίδας» και στείλε μου το κείμενο.", "err");
    }
    $("#preview").value = JSON.stringify(listings, null, 2).slice(0, 20000);
    updateButtons();
  } catch (e) {
    setStatus("Σφάλμα: " + e.message, "err");
  }
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function download() {
  const blob = new Blob([JSON.stringify(listings, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({ url, filename: `aggelies-xe-${todayISO()}.json`, saveAs: true }, () => {
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  });
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(listings, null, 2));
    setStatus("Αντιγράφηκε στο πρόχειρο. Επικόλλησέ το σε .txt / .json.", "ok");
  } catch (e) {
    setStatus("Δεν ήταν δυνατή η αντιγραφή.", "err");
  }
}

async function copyPageText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const res = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => document.body.innerText });
    await navigator.clipboard.writeText((res && res[0] && res[0].result) || "");
    setStatus("Αντιγράφηκε όλο το κείμενο της σελίδας.", "ok");
  } catch (e) {
    setStatus("Σφάλμα: " + e.message, "err");
  }
}

// ---------------------------------------------------------------------------
// Τρέχει ΜΕΣΑ στη σελίδα του xe.gr. Πρέπει να είναι αυτόνομη (χωρίς εξωτερικές αναφορές).
// ---------------------------------------------------------------------------
function extractListingsPage() {
  const TYPE_RE = /(Μονοκατοικία|Μονοκατοικια|Διαμέρισμα|Διαμερισμα|Μεζονέτα|Μεζονετα|Γκαρσονιέρα|Γκαρσονιερα|Οικόπεδο|Οικοπεδο|Αγροτεμάχιο|Αγροτεμαχιο|Επαγγελματικός\s*χώρος|Επαγγελματικος\s*χωρος|Κατάστημα|Καταστημα|Αποθήκη|Αποθηκη|Βίλα|Βιλα|Διπλοκατοικία|Διπλοκατοικια|Ακίνητο|Ακινητο)/i;

  const toNum = (s) => {
    if (!s) return null;
    const n = parseFloat(String(s).replace(/\./g, "").replace(",", "."));
    return isFinite(n) ? n : null;
  };

  const text = ((document.body && document.body.innerText) || "").replace(/\u00a0/g, " ");

  const out = [];
  const seen = new Set();

  const buildListing = (code, block) => {
    if (!code || seen.has(code)) return;
    const type = (block.match(TYPE_RE) || [""])[0].replace(/\s+/g, " ");
    const sqmM = block.match(/([\d.,]+)\s*τ\.?\s*μ/i) || block.match(/([\d.,]+)\s*m²/i) || block.match(/([\d.,]+)\s*τετρ/i);
    const priceMatches = [...block.matchAll(/([\d][\d.,]*)\s*€/g)];
    const priceM = priceMatches.length ? priceMatches[priceMatches.length - 1] : null;
    const phoneM = block.match(/\b(69\d{8}|2\d{9})\b/);
    const st = block.match(/Ενεργ[ήη]|Σε\s*αναμονή|Αποσύρθηκε|Πωλήθηκε|Ενοικιάστηκε|Ληγμένη|Ανενεργ[ήη]/i);
    let status = "available";
    if (st) {
      const s = st[0];
      if (/πωλ|ενοικιάστηκε/i.test(s)) status = "sold";
      else if (/αναμ/i.test(s)) status = "pending";
      else if (/αποσυρ|ληγ|ανενεργ/i.test(s)) status = "not_sure";
    }
    let address = "";
    for (const line of block.split("\n").map((x) => x.trim()).filter(Boolean)) {
      if (/^[\d.,\s€τμ²\-/]+$/i.test(line)) continue;
      if (TYPE_RE.test(line)) continue;
      if (/τ\.?\s*μ|€|Κωδικ|Αγγελ/i.test(line)) continue;
      if (line.length >= 4 && line.length <= 70) { address = line; break; }
    }
    seen.add(code);
    out.push({
      code,
      type,
      sqm: toNum(sqmM && sqmM[1]),
      price: toNum(priceM && priceM[1]),
      address,
      phone: phoneM ? phoneM[1] : "",
      status,
      notes: "",
      extraPhones: [],
      calls: [],
      maps: "",
      isNew: false,
      source: "xe.gr",
    });
  };

  // 1) Χωρισμός σε μπλοκ με βάση τον «Κωδικό»
  const codeRe = /(?:Κωδικός(?:\s*αναφοράς)?|Αριθμός(?:\s*αγγελίας)?|Αγγελία|Ref(?:erence)?)\s*[:#]?\s*(\d{3,7})/gi;
  const marks = [];
  let m;
  while ((m = codeRe.exec(text))) marks.push({ code: m[1], index: m.index });

  if (marks.length) {
    for (let i = 0; i < marks.length; i++) {
      const start = marks[i].index;
      const end = i + 1 < marks.length ? marks[i + 1].index : Math.min(text.length, start + 800);
      buildListing(marks[i].code, text.slice(start, end));
    }
  }

  // 2) Fallback: σάρωση γραμμών για «τ.μ.» + «€» + τύπο
  if (!out.length) {
    const blocks = text.split(/\n\s*\n/);
    const codeAny = /(?:^|\D)(\d{4,5})(?:\D|$)/;
    for (const block of blocks) {
      if (!/τ\.?\s*μ/i.test(block) || !/€/.test(block)) continue;
      const cm = block.match(codeAny);
      if (!cm) continue;
      buildListing(cm[1], block);
    }
  }

  // 3) Τελευταία προσπάθεια: έστω και χωρίς κωδικό (μόνο τύπος+τμ+τιμή)
  if (!out.length) {
    const blocks = text.split(/\n\s*\n/);
    let i = 0;
    for (const block of blocks) {
      if (!/τ\.?\s*μ/i.test(block) || !/€/.test(block) || !TYPE_RE.test(block)) continue;
      i += 1;
      buildListing("auto-" + i, block);
    }
  }

  return out;
}

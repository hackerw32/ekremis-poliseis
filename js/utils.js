export const STATUSES = [
  { id: "Ενεργό", cls: "st-energo" },
  { id: "Σε αναμονή", cls: "st-anamoni" },
  { id: "Εκκρεμότητα", cls: "st-ekkremotita" },
  { id: "Ολοκληρώθηκε", cls: "st-ok" },
  { id: "Ακυρώθηκε", cls: "st-akyro" },
];

export function statusClass(status) {
  const found = STATUSES.find((s) => s.id === status);
  return found ? found.cls : "st-akyro";
}

export function uid() {
  return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatNumber(n) {
  const num = Number(n);
  if (!isFinite(num) || n === null || n === "") return "—";
  return new Intl.NumberFormat("el-GR", { maximumFractionDigits: 0 }).format(num);
}

export function formatCurrency(n, currency = "EUR") {
  const num = Number(n);
  if (!isFinite(num) || n === null || n === "") return "—";
  try {
    return new Intl.NumberFormat("el-GR", { style: "currency", currency, maximumFractionDigits: 0 }).format(num);
  } catch {
    return formatNumber(num) + " €";
  }
}

export function formatSum(n, currency = "EUR") {
  return formatCurrency(n, currency);
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = parseDate(iso);
  if (!d) return iso;
  return d.toLocaleDateString("el-GR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("el-GR", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " +
    d.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" });
}

export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s.length === 10 ? s + "T00:00:00" : s);
    return isNaN(d) ? null : d;
  }
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let [, dd, mm, yy] = m;
    if (yy.length === 2) yy = "20" + yy;
    const d = new Date(Number(yy), Number(mm) - 1, Number(dd));
    return isNaN(d) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

export function toISODate(value) {
  const d = parseDate(value);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function daysUntil(iso) {
  const d = parseDate(iso);
  if (!d) return null;
  const diff = startOfDay(d) - startOfDay(new Date());
  return Math.round(diff / 86400000);
}

export function dueInfo(iso) {
  if (!iso) return { label: "Χωρίς ημερομηνία", cls: "" };
  const days = daysUntil(iso);
  if (days === null) return { label: iso, cls: "" };
  if (days < 0) return { label: `Εκπρόθεσμη ${Math.abs(days)} ημ.`, cls: "overdue" };
  if (days === 0) return { label: "Σήμερα", cls: "today" };
  if (days === 1) return { label: "Αύριο", cls: "today" };
  if (days <= 7) return { label: `Σε ${days} ημέρες`, cls: "" };
  return { label: formatDate(iso), cls: "" };
}

export function normalizePhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/[^\d+]/g, "").replace(/^00/, "+");
}

export function phoneLink(phone) {
  const p = normalizePhone(phone);
  return p ? "tel:" + p : "";
}

export function firstPhone(phone) {
  if (!phone) return "";
  return String(phone).split(/[,/]| και /)[0].trim();
}

export function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function sum(arr, pick) {
  return (arr || []).reduce((acc, item) => {
    const v = pick ? pick(item) : item;
    const n = Number(v);
    return acc + (isFinite(n) ? n : 0);
  }, 0);
}

export function deburr(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ς/g, "σ");
}

export function matchesSearch(haystack, query) {
  if (!query) return true;
  const q = deburr(query).trim();
  if (!q) return true;
  return deburr(haystack).includes(q) || String(haystack).replace(/\D/g, "").includes(q.replace(/\D/g, ""));
}

export function download(filename, text) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugify(str) {
  return deburr(str).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function propertyHaystack(p) {
  const parts = [
    p.code, p.title, p.type, p.status, p.seller, p.sellerPhone, p.buyer, p.buyerPhone,
    p.buyerEmail, p.availability, p.notes, p.depositNote,
    ...(p.contacts || []).flatMap((c) => [c.role, c.name, c.phone, c.email]),
    ...(p.interested || []).flatMap((c) => [c.name, c.phone, c.email, c.note]),
    ...(p.tasks || []).map((t) => t.title + " " + (t.owner || "")),
    ...(p.debts || []).map((d) => d.label),
  ];
  return parts.filter(Boolean).join(" ");
}

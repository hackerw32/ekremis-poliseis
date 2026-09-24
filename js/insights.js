import { STATUSES, parseDate, startOfDay, daysUntil, sum } from "./utils.js";

export function computeStats(properties) {
  const active = properties.filter((p) => p.status !== "Ολοκληρώθηκε" && p.status !== "Ακυρώθηκε");
  const withTasks = properties.filter((p) => (p.tasks || []).some((t) => !t.done));
  const withDebts = properties.filter((p) => (p.debts || []).some((d) => !d.settled));

  const totalValue = sum(active, (p) => p.price);
  const deposits = sum(properties, (p) => p.depositAmount);
  const openDebts = sum(
    properties.flatMap((p) => p.debts || []),
    (d) => (d.settled ? 0 : d.amount)
  );
  const completed = properties.filter((p) => p.status === "Ολοκληρώθηκε").length;

  return {
    total: properties.length,
    active: active.length,
    withTasks: withTasks.length,
    withDebts: withDebts.length,
    totalValue,
    deposits,
    openDebts,
    completed,
    avgValue: active.length ? Math.round(totalValue / active.length) : 0,
  };
}

export function statusBreakdown(properties) {
  const counts = new Map(STATUSES.map((s) => [s.id, 0]));
  properties.forEach((p) => {
    const key = p.status || "Ενεργό";
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const extras = [];
  counts.forEach((v, k) => {
    if (!STATUSES.find((s) => s.id === k)) extras.push([k, v]);
  });
  return [
    ...STATUSES.map((s) => ({ status: s.id, cls: s.cls, count: counts.get(s.id) || 0 })),
    ...extras.map(([status, count]) => ({ status, cls: "st-akyro", count })),
  ].filter((r) => r.count > 0);
}

export function allTasks(properties) {
  const out = [];
  properties.forEach((p) => {
    (p.tasks || []).forEach((t, i) => {
      out.push({
        ...t,
        propId: p.id,
        propCode: p.code,
        propTitle: p.title,
        propStatus: p.status,
        index: i,
      });
    });
  });
  return out;
}

export function taskBucket(task) {
  if (task.done) return "done";
  if (!task.due) return "nodate";
  const days = daysUntil(task.due);
  if (days === null) return "nodate";
  if (days < 0) return "overdue";
  if (days <= 7) return "soon";
  return "later";
}

export function groupTasks(tasks) {
  const groups = { overdue: [], soon: [], later: [], nodate: [], done: [] };
  tasks.forEach((t) => groups[taskBucket(t)].push(t));
  const byDue = (a, b) => {
    const da = parseDate(a.due);
    const db = parseDate(b.due);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da - db;
  };
  groups.overdue.sort(byDue);
  groups.soon.sort(byDue);
  groups.later.sort(byDue);
  return groups;
}

export function debtSummary(properties) {
  const open = [];
  let total = 0;
  properties.forEach((p) => {
    (p.debts || []).forEach((d, i) => {
      if (!d.settled) {
        total += Number(d.amount) || 0;
        open.push({ ...d, propId: p.id, propCode: p.code, propTitle: p.title, index: i });
      }
    });
  });
  return { open, total };
}

export function propertyUrgency(p) {
  const openTasks = (p.tasks || []).filter((t) => !t.done);
  const overdue = openTasks.filter((t) => {
    const d = parseDate(t.due);
    return d && startOfDay(d) < startOfDay(new Date());
  }).length;
  const openDebts = (p.debts || []).filter((d) => !d.settled).length;
  return overdue * 100 + openTasks.length * 5 + openDebts * 3 + (p.status === "Εκκρεμότητα" ? 10 : 0);
}

export function filterAndSort(properties, { query, status, flag, sort }) {
  let list = properties.slice();

  if (status && status !== "all") {
    list = list.filter((p) => p.status === status);
  }
  if (flag === "tasks") list = list.filter((p) => (p.tasks || []).some((t) => !t.done));
  if (flag === "debts") list = list.filter((p) => (p.debts || []).some((d) => !d.settled));
  if (flag === "value") list = list.filter((p) => Number(p.price) > 0);

  if (sort === "code") {
    list.sort((a, b) => String(a.code || "").localeCompare(String(b.code || ""), "el", { numeric: true }));
  } else if (sort === "price") {
    list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  } else if (sort === "title") {
    list.sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "el"));
  } else {
    list.sort((a, b) => propertyUrgency(b) - propertyUrgency(a));
  }
  return list;
}

export function recentProperties(properties, n = 5) {
  return properties
    .slice()
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))
    .slice(0, n);
}

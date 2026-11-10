import { CURRENCY } from "./config";

const nf = new Intl.NumberFormat("fr-FR");

export function formatAmount(n: number): string {
  return `${nf.format(n)} ${CURRENCY}`;
}

export function formatAmountShort(n: number): string {
  return nf.format(n);
}

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(ts: number): string {
  return dateFmt.format(new Date(ts));
}

export function formatDateTime(ts: number): string {
  return dateTimeFmt.format(new Date(ts));
}

/** Pour <input type="date" />. Attend un timestamp ms, renvoie YYYY-MM-DD. */
export function dateInputValue(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse une valeur de <input type="date" /> en timestamp ms (midi UTC). */
export function parseDateInput(v: string): number | null {
  if (!v) return null;
  const [y, m, d] = v.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d, 12, 0, 0);
}

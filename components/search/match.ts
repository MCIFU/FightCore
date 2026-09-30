/** Accent-insensitive, typo-tolerant-ish scorer for the search index. */
export const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").trim();

export function score(query: string, title: string, extra = ""): number {
  const q = norm(query);
  if (!q) return 0;
  const t = norm(title);
  const k = norm(extra);
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  const tokens = q.split(/\s+/);
  const words = t.split(/\s+/);
  let total = 0;
  for (const tok of tokens) {
    if (words.some((w) => w.startsWith(tok))) total += 30;
    else if (t.includes(tok)) total += 18;
    else if (k.split(/\s+/).some((w) => w.startsWith(tok))) total += 12;
    else if (tok.length >= 4 && words.some((w) => within1(w, tok) || within1(w.slice(0, tok.length), tok) || within1(w.slice(0, tok.length + 1), tok))) total += 8;
    else return 0; // every token must match somewhere
  }
  return total;
}

/** Levenshtein distance ≤ 1 (one typo). */
function within1(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

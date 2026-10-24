import { placeName, formatShortDate } from '../i18n';

/**
 * Whether a saved client matches a search query: any part of the name, the birth place, or the
 * birth date as typed in the app (24.10.1990, "окт 1990") or as stored (1990-10-24).
 */
export function clientMatches(client, query, lang, t) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const b = client.data.birth;
  const [y, m, d] = b.date.split('-');
  const text = [client.name, placeName(b, t), b.date, `${d}.${m}.${y}`, formatShortDate(b.date, lang)].join(' ').toLowerCase();
  return q.split(/\s+/).every((word) => text.includes(word));
}

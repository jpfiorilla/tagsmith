// Deterministic fast-path: strips well-known reissue/packaging tags without an AI call.
// This is the cheap, offline, predictable layer. It only removes a TRAILING
// (...) / [...] / " - ..." segment that contains a known packaging phrase, so it can
// never touch a real title (e.g. a song literally named "Mono") or a meaningful
// version tag (Live, Demo, Remix, Instrumental, feat., movement names).

const PHRASES: string[] = [
  'remaster(?:ed|ing)?',
  'digital\\s+remaster',
  'expanded\\s+edition',
  'deluxe\\s+edition',
  'anniversary\\s+edition',
  '\\d{2,3}\\s?rpm',
  'lp\\s+version',
];

const PH = `(?:${PHRASES.join('|')})`;
const reBracket = new RegExp(`\\s*[\\(\\[][^\\(\\)\\[\\]]*${PH}[^\\(\\)\\[\\]]*[\\)\\]]\\s*$`, 'i');
const reDash = new RegExp(`\\s+[-\\u2013]\\s+[^-\\u2013]*${PH}[^-\\u2013]*$`, 'i');

export interface FastPathResult {
  cleaned: string;
  changed: boolean;
}

/** Apply the deterministic whitelist strip + whitespace tidy to a title. */
export function fastPathClean(name: string): FastPathResult {
  let prev: string | null = null;
  let out = name;
  while (prev !== out) {
    prev = out;
    out = out.replace(reBracket, '').replace(reDash, '');
  }
  const cleaned = out.replace(/\s{2,}/g, ' ').trim();
  // Guard: never blank out a title (would only happen on a pathological input).
  if (cleaned.length === 0) {
    return { cleaned: name, changed: false };
  }
  return { cleaned, changed: cleaned !== name };
}

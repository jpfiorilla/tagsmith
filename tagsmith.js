'use strict';
// Tagsmith — a headless launchd agent that tidies Apple Music tags on newly-added tracks.
// Talks to Music.app through JavaScript for Automation (JXA), so it writes to the
// library Music actually shows and works for Apple Music / streaming additions too.
ObjC.import('Foundation');

// ============================ CONFIG ============================
const DRY_RUN = true;   // true = only LOG what it would change; false = actually rename.
const NOTIFY  = true;   // macOS notification when it acts.
// ================================================================

const HOME  = ObjC.unwrap($.NSHomeDirectory());
const BASE  = `${HOME}/Library/Application Support/Tagsmith`;
const STATE = `${BASE}/state.json`;
const LOG   = `${BASE}/changes.log`;

const ensureDir = (p) =>
  $.NSFileManager.defaultManager
    .createDirectoryAtPathWithIntermediateDirectoriesAttributesError(p, true, $(), null);

const readText = (p) => {
  const s = $.NSString.stringWithContentsOfFileEncodingError(p, $.NSUTF8StringEncoding, null);
  return (s && !s.isNil()) ? ObjC.unwrap(s) : null;
};

const writeText = (p, t) =>
  $(t).writeToFileAtomicallyEncodingError(p, true, $.NSUTF8StringEncoding, null);

const appendLog = (line) => writeText(LOG, `${readText(LOG) || ''}${line}\n`);

ensureDir(BASE);

// ------------------------------ state ------------------------------
let state = {};
try { const raw = readText(STATE); if (raw) state = JSON.parse(raw); } catch (e) {}
// High-water mark: only look at tracks added since the last run.
// First run has no lastRun, so we start "now" and DON'T touch the existing library.
const since    = state.lastRun ? new Date(state.lastRun) : new Date();
const runStart = new Date();

// --------------------- tag cleanup rule (agreed whitelist) ---------------------
// Only strips a TRAILING (...) / [...] / " - ..." tag that contains one of these
// phrases. Everything else (Live, Demo, Remix, Instrumental, feat., movement names,
// real titles like "Mono") is untouched.
const PHRASES = ['remaster(?:ed|ing)?', 'digital\\s+remaster', 'expanded\\s+edition',
                 'deluxe\\s+edition', 'anniversary\\s+edition', '\\d{2,3}\\s?rpm', 'lp\\s+version'];
const PH = `(?:${PHRASES.join('|')})`;
const reBracket = new RegExp(`\\s*[\\(\\[][^\\(\\)\\[\\]]*${PH}[^\\(\\)\\[\\]]*[\\)\\]]\\s*$`, 'i');
const reDash    = new RegExp(`\\s+[-\\u2013]\\s+[^-\\u2013]*${PH}[^-\\u2013]*$`, 'i');

const cleanName = (name) => {
  let prev = null;
  let out = name;
  while (prev !== out) { prev = out; out = out.replace(reBracket, '').replace(reDash, ''); }
  return out.replace(/\s{2,}/g, ' ').trim();
};

// --------------------- genre rules (STUB — pending John's approach) ---------------------
// Returns a genre string to set, or null to leave the track's genre unchanged.
// TODO: reconstruct the genre-massaging logic once the rules are shared.
const assignGenre = (name, artist, album, currentGenre) => null;

// ------------------------------ main ------------------------------
const Music = Application('Music');
const sys = Application.currentApplication();
sys.includeStandardAdditions = true;

let acted = 0;
try {
  const lib = Music.libraryPlaylists[0];
  const newTracks = lib.tracks.whose({ dateAdded: { '>': since } })();

  for (const t of newTracks) {
    let name, artist, album, genre;
    try { name = t.name(); artist = t.artist(); album = t.album(); genre = t.genre(); }
    catch (e) { continue; }

    // --- name cleanup ---
    const cleaned = cleanName(name);
    if (cleaned && cleaned !== name) {
      const stamp = new Date().toISOString();
      if (DRY_RUN) {
        appendLog(`${stamp}  [DRY-RUN name] ${album} :: "${name}" -> "${cleaned}"`);
      } else {
        try { t.name = cleaned; appendLog(`${stamp}  [RENAMED] ${album} :: "${name}" -> "${cleaned}"`); }
        catch (e) { appendLog(`${stamp}  [ERROR name] "${name}": ${e}`); }
      }
      acted++;
    }

    // --- genre (stub; no-op until rules are added) ---
    const newGenre = assignGenre(name, artist, album, genre);
    if (newGenre && newGenre !== genre) {
      const stamp = new Date().toISOString();
      if (DRY_RUN) {
        appendLog(`${stamp}  [DRY-RUN genre] ${album} :: "${genre}" -> "${newGenre}"`);
      } else {
        try { t.genre = newGenre; appendLog(`${stamp}  [GENRE] ${album} :: "${genre}" -> "${newGenre}"`); }
        catch (e) { appendLog(`${stamp}  [ERROR genre] "${name}": ${e}`); }
      }
      acted++;
    }
  }
} catch (e) {
  appendLog(`${new Date().toISOString()}  [FATAL] ${e}`);
}

if (acted > 0 && NOTIFY) {
  const verb = DRY_RUN ? 'would clean' : 'cleaned';
  try {
    sys.displayNotification(`${acted} newly-added item(s) ${verb}`, {
      withTitle: 'Tagsmith',
      subtitle: DRY_RUN ? 'Dry-run — see changes.log' : 'Tags updated',
    });
  } catch (e) {}
}

state.lastRun = runStart.toISOString();
state.lastActed = acted;
writeText(STATE, JSON.stringify(state, null, 2));

'use strict';
// Tagsmith — a headless launchd agent that tidies Apple Music tags on newly-added tracks.
// Talks to Music.app through JavaScript for Automation (JXA), so it writes to the
// library Music actually shows and works for Apple Music / streaming additions too.
ObjC.import('Foundation');

// ============================ CONFIG ============================
var DRY_RUN = true;   // true = only LOG what it would change; false = actually rename.
var NOTIFY  = true;   // macOS notification when it acts.
// ================================================================

var HOME  = ObjC.unwrap($.NSHomeDirectory());
var BASE  = HOME + '/Library/Application Support/Tagsmith';
var STATE = BASE + '/state.json';
var LOG   = BASE + '/changes.log';

function ensureDir(p) {
  $.NSFileManager.defaultManager
    .createDirectoryAtPathWithIntermediateDirectoriesAttributesError(p, true, $(), null);
}
function readText(p) {
  var s = $.NSString.stringWithContentsOfFileEncodingError(p, $.NSUTF8StringEncoding, null);
  return (s && !s.isNil()) ? ObjC.unwrap(s) : null;
}
function writeText(p, t) {
  $(t).writeToFileAtomicallyEncodingError(p, true, $.NSUTF8StringEncoding, null);
}
function appendLog(line) { writeText(LOG, (readText(LOG) || '') + line + '\n'); }

ensureDir(BASE);

// ------------------------------ state ------------------------------
var state = {};
try { var raw = readText(STATE); if (raw) state = JSON.parse(raw); } catch (e) {}
// High-water mark: only look at tracks added since the last run.
// First run has no lastRun, so we start "now" and DON'T touch the existing library.
var since    = state.lastRun ? new Date(state.lastRun) : new Date();
var runStart = new Date();

// --------------------- tag cleanup rule (agreed whitelist) ---------------------
// Only strips a TRAILING (...) / [...] / " - ..." tag that contains one of these
// phrases. Everything else (Live, Demo, Remix, Instrumental, feat., movement names,
// real titles like "Mono") is untouched.
var PHRASES = ['remaster(?:ed|ing)?', 'digital\\s+remaster', 'expanded\\s+edition',
               'deluxe\\s+edition', 'anniversary\\s+edition', '\\d{2,3}\\s?rpm', 'lp\\s+version'];
var PH = '(?:' + PHRASES.join('|') + ')';
var reBracket = new RegExp('\\s*[\\(\\[][^\\(\\)\\[\\]]*' + PH + '[^\\(\\)\\[\\]]*[\\)\\]]\\s*$', 'i');
var reDash    = new RegExp('\\s+[-\\u2013]\\s+[^-\\u2013]*' + PH + '[^-\\u2013]*$', 'i');

function cleanName(name) {
  var prev = null, out = name;
  while (prev !== out) { prev = out; out = out.replace(reBracket, ''); out = out.replace(reDash, ''); }
  return out.replace(/\s{2,}/g, ' ').trim();
}

// --------------------- genre rules (STUB — pending John's approach) ---------------------
// Returns a genre string to set, or null to leave the track's genre unchanged.
// TODO: reconstruct the genre-massaging logic once the rules are shared.
function assignGenre(name, artist, album, currentGenre) {
  return null;
}

// ------------------------------ main ------------------------------
var Music = Application('Music');
var sys = Application.currentApplication();
sys.includeStandardAdditions = true;

var acted = 0;
try {
  var lib = Music.libraryPlaylists[0];
  var newTracks = lib.tracks.whose({ dateAdded: { '>': since } })();

  for (var i = 0; i < newTracks.length; i++) {
    var t = newTracks[i];
    var name, artist, album, genre;
    try { name = t.name(); artist = t.artist(); album = t.album(); genre = t.genre(); }
    catch (e) { continue; }

    // --- name cleanup ---
    var cleaned = cleanName(name);
    if (cleaned && cleaned !== name) {
      var stamp = new Date().toISOString();
      if (DRY_RUN) {
        appendLog(stamp + '  [DRY-RUN name] ' + album + ' :: "' + name + '" -> "' + cleaned + '"');
      } else {
        try { t.name = cleaned; appendLog(stamp + '  [RENAMED] ' + album + ' :: "' + name + '" -> "' + cleaned + '"'); }
        catch (e) { appendLog(stamp + '  [ERROR name] "' + name + '": ' + e); }
      }
      acted++;
    }

    // --- genre (stub; no-op until rules are added) ---
    var newGenre = assignGenre(name, artist, album, genre);
    if (newGenre && newGenre !== genre) {
      var gstamp = new Date().toISOString();
      if (DRY_RUN) {
        appendLog(gstamp + '  [DRY-RUN genre] ' + album + ' :: "' + genre + '" -> "' + newGenre + '"');
      } else {
        try { t.genre = newGenre; appendLog(gstamp + '  [GENRE] ' + album + ' :: "' + genre + '" -> "' + newGenre + '"'); }
        catch (e) { appendLog(gstamp + '  [ERROR genre] "' + name + '": ' + e); }
      }
      acted++;
    }
  }
} catch (e) {
  appendLog(new Date().toISOString() + '  [FATAL] ' + e);
}

if (acted > 0 && NOTIFY) {
  var verb = DRY_RUN ? 'would clean' : 'cleaned';
  try {
    sys.displayNotification(acted + ' newly-added item(s) ' + verb, {
      withTitle: 'Tagsmith',
      subtitle: DRY_RUN ? 'Dry-run — see changes.log' : 'Tags updated'
    });
  } catch (e) {}
}

state.lastRun = runStart.toISOString();
state.lastActed = acted;
writeText(STATE, JSON.stringify(state, null, 2));

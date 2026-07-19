// JXA bridge: print JSON for every library track added AFTER the ISO timestamp arg.
// Invoked as: osascript -l JavaScript jxa/readNewTracks.js "<iso8601>"
function run(argv) {
  'use strict';
  const sinceIso = argv[0];
  if (!sinceIso) return '[]';

  const Music = Application('Music');
  const lib = Music.libraryPlaylists[0];
  const since = new Date(sinceIso);
  const tracks = lib.tracks.whose({ dateAdded: { '>': since } })();

  const out = [];
  for (const t of tracks) {
    try {
      out.push({
        persistentId: t.persistentID(),
        name: t.name(),
        artist: t.artist(),
        album: t.album(),
        genre: t.genre(),
      });
    } catch (e) {
      // skip anything unreadable
    }
  }
  return JSON.stringify(out);
}

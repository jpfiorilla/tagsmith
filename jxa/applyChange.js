// JXA bridge: apply ONE field change to a track, identified by persistent ID.
// Invoked as: osascript -l JavaScript jxa/applyChange.js "<persistentId>" "<field>" "<value>"
// field is "title" or "genre". Prints JSON {ok:boolean, error?:string}.
function run(argv) {
  'use strict';
  const persistentId = argv[0];
  const field = argv[1];
  const value = argv[2];

  const Music = Application('Music');
  const matches = Music.libraryPlaylists[0].tracks.whose({ persistentID: persistentId })();
  const t = matches[0];
  if (!t) return JSON.stringify({ ok: false, error: 'track not found' });

  try {
    if (field === 'title') t.name = value;
    else if (field === 'genre') t.genre = value;
    else return JSON.stringify({ ok: false, error: 'unknown field: ' + field });
  } catch (e) {
    return JSON.stringify({ ok: false, error: String(e) });
  }
  return JSON.stringify({ ok: true });
}

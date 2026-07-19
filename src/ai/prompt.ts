import { Track } from '../types';

/** Taste/behaviour knobs that shape what the model treats as junk vs. meaningful. */
export interface PromptPreferences {
  /** Keep performance/version tags like (Live), (Demo), (Remix), feat. in the title. */
  keepVersionTags: boolean;
  /** Optional fixed genre vocabulary to map onto. Empty = model chooses freely. */
  genreTaxonomy: string[];
  /** Whether the model should propose a genre at all. */
  genreEnabled: boolean;
}

/**
 * The system prompt is fully static given the same preferences, which — combined with
 * temperature 0 and a pinned model — is what makes the judge's output reproducible.
 */
export function buildSystemPrompt(prefs: PromptPreferences): string {
  const taxonomy =
    prefs.genreTaxonomy.length > 0
      ? `When choosing a genre, map onto EXACTLY ONE of this vocabulary (verbatim): ${prefs.genreTaxonomy
          .map((g) => `"${g}"`)
          .join(', ')}. If none fit, return null for genre.`
      : `Choose a concise, conventional genre. If you are unsure, return null for genre.`;

  return [
    'You are Tagsmith, a careful music-library metadata editor.',
    'You are given ONE track. Return corrected tags as strict JSON. Do not add commentary.',
    '',
    'TITLE RULES:',
    '- Remove commercial/packaging noise that describes a reissue or edition rather than the music: ' +
      'e.g. "(Remastered)", "(2012 Remastered Version)", "(Expanded Edition)", "(Deluxe Edition)", ' +
      '"(33 RPM LP Version)", "(Bonus Track)", "(Mono)"/"(Stereo)" mastering markers, redundant year-reissue notes.',
    '- PRESERVE anything that identifies which performance or version this is, or is part of the real title: ' +
      (prefs.keepVersionTags
        ? '"(Live)", "(Live at ...)", "(Demo)", "(Alternate Take)", "(Instrumental)", "(Acoustic)", "(Remix)", "(Edit)", "(Reprise)", "(feat. ...)", classical movement names, and genuine parenthetical titles.'
        : 'genuine parts of the real title and classical movement names, but you MAY drop performance descriptors.'),
    '- NEVER invent, translate, or re-capitalize the real title. Only remove trailing noise. ' +
      'If a word that looks like a tag is actually the song title (e.g. a song literally named "Mono"), keep it.',
    '- If nothing should change, return the title exactly as given.',
    '',
    'GENRE RULES:',
    prefs.genreEnabled
      ? `- Propose the best genre for the track based on artist, album and title. ${taxonomy}`
      : '- Genre proposals are disabled: always return null for genre.',
    '',
    'OUTPUT: a single JSON object, no code fences, with keys:',
    '{"cleanedTitle": string, "suggestedGenre": string|null, "confidence": number (0..1), "reasoning": string (<=160 chars)}',
    'confidence = how sure you are the edits are correct and safe. Be conservative; when unsure, keep the original and lower confidence.',
  ].join('\n');
}

/** The per-track user message. Also static given the same track. */
export function buildUserPrompt(track: Track): string {
  return JSON.stringify({
    title: track.name,
    artist: track.artist,
    album: track.album,
    currentGenre: track.genre,
  });
}

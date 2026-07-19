import { Track, ProposedChange, TagDecision } from './types';
import { fastPathClean } from './rules/fastPath';
import { Config } from './config';

/**
 * Produce the list of proposed changes for one track, combining the deterministic
 * fast-path with an optional AI decision.
 *
 * Strategy:
 *  - Title: the fast-path handles the common, obvious reissue tags with confidence 1.
 *    If it made no change, the AI's cleanedTitle is used for the arbitrary long tail.
 *    (We don't override a confident deterministic strip with a fuzzier AI guess.)
 *  - Genre: always comes from the AI, since it's pure judgment.
 *
 * `decision` may be null when AI is disabled or unavailable — the fast-path still runs.
 */
export function decideForTrack(
  track: Track,
  decision: TagDecision | null,
  config: Config,
): ProposedChange[] {
  const changes: ProposedChange[] = [];

  if (config.features.titleCleanup) {
    const fp = fastPathClean(track.name);
    if (fp.changed) {
      changes.push({
        persistentId: track.persistentId,
        field: 'title',
        from: track.name,
        to: fp.cleaned,
        source: 'fastpath',
        confidence: 1,
        reasoning: 'matched known reissue/edition tag',
      });
    } else if (decision && decision.cleanedTitle !== track.name) {
      changes.push({
        persistentId: track.persistentId,
        field: 'title',
        from: track.name,
        to: decision.cleanedTitle,
        source: 'ai',
        confidence: decision.confidence,
        reasoning: decision.reasoning,
      });
    }
  }

  if (config.features.genre && decision && decision.suggestedGenre) {
    if (decision.suggestedGenre !== track.genre) {
      changes.push({
        persistentId: track.persistentId,
        field: 'genre',
        from: track.genre,
        to: decision.suggestedGenre,
        source: 'ai',
        confidence: decision.confidence,
        reasoning: decision.reasoning,
      });
    }
  }

  return changes;
}

/** Does this track need the AI at all, given config? Lets us skip needless API calls. */
export function needsAI(track: Track, config: Config): boolean {
  if (config.features.genre) return true; // genre always needs judgment
  if (config.features.titleCleanup) {
    // Only consult AI for titles the deterministic layer couldn't confidently clean.
    return !fastPathClean(track.name).changed;
  }
  return false;
}

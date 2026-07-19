// Core domain types shared across Tagsmith.

/** A track as read from Apple Music. */
export interface Track {
  /** Music's stable per-track identifier; used to write changes back safely. */
  persistentId: string;
  name: string;
  artist: string;
  album: string;
  genre: string;
}

/** Which tag field a change targets. */
export type Field = 'title' | 'genre';

/** Where a proposed change came from. */
export type ChangeSource = 'fastpath' | 'ai';

/** A single proposed edit to one field of one track. */
export interface ProposedChange {
  persistentId: string;
  field: Field;
  from: string;
  to: string;
  source: ChangeSource;
  /** 0..1 — deterministic fast-path is always 1; AI reports its own certainty. */
  confidence: number;
  reasoning?: string;
}

/** What the AI returns for one track after reasoning about its tags. */
export interface TagDecision {
  cleanedTitle: string;
  suggestedGenre: string | null;
  confidence: number;
  reasoning: string;
}

/** Outcome of applying (or deferring) a change. */
export type Disposition = 'applied' | 'queued' | 'skipped-dry-run';

export interface AppliedResult {
  change: ProposedChange;
  disposition: Disposition;
}

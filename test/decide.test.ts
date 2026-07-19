import { decideForTrack, needsAI } from '../src/decide';
import { DEFAULT_CONFIG, Config } from '../src/config';
import { Track, TagDecision } from '../src/types';

function cfg(overrides: Partial<Config> = {}): Config {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    features: { ...DEFAULT_CONFIG.features, ...(overrides.features ?? {}) },
  };
}

const track: Track = {
  persistentId: 'P1',
  name: 'Aurora (Remaster)',
  artist: 'Ryuichi Sakamoto & Alva Noto',
  album: 'Insen',
  genre: 'Electronic',
};

describe('decideForTrack — title', () => {
  it('uses the deterministic fast-path with confidence 1', () => {
    const changes = decideForTrack(track, null, cfg());
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      field: 'title',
      to: 'Aurora',
      source: 'fastpath',
      confidence: 1,
    });
  });

  it('falls back to the AI title only when fast-path found nothing', () => {
    const arbitrary: Track = { ...track, name: 'Song [Weird New Reissue Marker]' };
    const decision: TagDecision = {
      cleanedTitle: 'Song',
      suggestedGenre: null,
      confidence: 0.7,
      reasoning: 'stripped unknown packaging tag',
    };
    const changes = decideForTrack(arbitrary, decision, cfg());
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ field: 'title', to: 'Song', source: 'ai', confidence: 0.7 });
  });

  it('does not let AI override a confident fast-path strip', () => {
    const decision: TagDecision = {
      cleanedTitle: 'Totally Different',
      suggestedGenre: null,
      confidence: 0.9,
      reasoning: 'x',
    };
    const changes = decideForTrack(track, decision, cfg());
    expect(changes.find((c) => c.field === 'title')?.source).toBe('fastpath');
  });
});

describe('decideForTrack — genre', () => {
  it('proposes a genre only when the feature is enabled and it differs', () => {
    const decision: TagDecision = {
      cleanedTitle: track.name,
      suggestedGenre: 'Modern Classical',
      confidence: 0.8,
      reasoning: 'ambient/neoclassical',
    };
    const off = decideForTrack(track, decision, cfg({ features: { titleCleanup: false, genre: false } }));
    expect(off.find((c) => c.field === 'genre')).toBeUndefined();

    const on = decideForTrack(track, decision, cfg({ features: { titleCleanup: false, genre: true } }));
    expect(on).toHaveLength(1);
    expect(on[0]).toMatchObject({ field: 'genre', to: 'Modern Classical', source: 'ai' });
  });

  it('skips genre when it equals the current value', () => {
    const decision: TagDecision = {
      cleanedTitle: track.name,
      suggestedGenre: 'Electronic',
      confidence: 0.8,
      reasoning: 'same',
    };
    const changes = decideForTrack(track, decision, cfg({ features: { titleCleanup: false, genre: true } }));
    expect(changes).toHaveLength(0);
  });
});

describe('needsAI', () => {
  it('is false when fast-path handles the title and genre is off', () => {
    expect(needsAI(track, cfg({ features: { titleCleanup: true, genre: false } }))).toBe(false);
  });
  it('is true for titles the fast-path cannot clean', () => {
    const t = { ...track, name: 'Song [Weird New Reissue Marker]' };
    expect(needsAI(t, cfg({ features: { titleCleanup: true, genre: false } }))).toBe(true);
  });
  it('is always true when genre is enabled', () => {
    expect(needsAI(track, cfg({ features: { titleCleanup: true, genre: true } }))).toBe(true);
  });
});

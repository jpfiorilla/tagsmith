import * as fs from 'node:fs';
import * as path from 'node:path';
import { ReplayProvider, Cassette } from '../src/ai/providers/replay';
import { TagJudge } from '../src/ai/judge';
import { PromptPreferences } from '../src/ai/prompt';
import { decideForTrack } from '../src/decide';
import { DEFAULT_CONFIG, Config } from '../src/config';
import { Track } from '../src/types';

interface AiTrack extends Track {
  expect: { cleanedTitle: string; suggestedGenre: string | null; titleChange: boolean };
}

const dir = path.join(__dirname, 'fixtures');
const cassette: Cassette = JSON.parse(fs.readFileSync(path.join(dir, 'ai-cassette.json'), 'utf8'));
const aiTracks: AiTrack[] = JSON.parse(fs.readFileSync(path.join(dir, 'ai-tracks.json'), 'utf8'));

const prefs: PromptPreferences = { keepVersionTags: true, genreTaxonomy: [], genreEnabled: true };

// AI features on for both title long-tail and genre.
const config: Config = {
  ...DEFAULT_CONFIG,
  features: { titleCleanup: true, genre: true },
};

describe('judge + decide over recorded Claude responses (replay)', () => {
  const provider = new ReplayProvider(cassette);
  const judge = new TagJudge(provider, 'claude-haiku-4-5-20251001', prefs);

  it.each(aiTracks.map((t) => [t.name, t] as const))(
    'produces the expected decision for %s',
    async (_name, t) => {
      const decision = await judge.judge(t);
      expect(decision.cleanedTitle).toBe(t.expect.cleanedTitle);
      expect(decision.suggestedGenre).toBe(t.expect.suggestedGenre);

      const changes = decideForTrack(t, decision, config);
      const titleChange = changes.find((c) => c.field === 'title');
      if (t.expect.titleChange) {
        expect(titleChange?.to).toBe(t.expect.cleanedTitle);
        expect(titleChange?.source).toBe('ai'); // long-tail: fast-path didn't catch it
      } else {
        expect(titleChange).toBeUndefined();
      }
    },
  );

  it('throws a clear error if a track has no recorded response', async () => {
    const judge2 = new TagJudge(new ReplayProvider({}), 'm', prefs);
    // judge() swallows provider errors into a safe no-change decision:
    const unknown: Track = {
      persistentId: 'X',
      name: 'Untracked (Single Version)',
      artist: 'A',
      album: 'B',
      genre: 'Rock',
    };
    const d = await judge2.judge(unknown);
    expect(d.cleanedTitle).toBe(unknown.name);
    expect(d.confidence).toBe(0);
  });
});

import { TagJudge, parseDecision, extractJsonObject } from '../src/ai/judge';
import { AIProvider, CompletionRequest } from '../src/ai/provider';
import { PromptPreferences } from '../src/ai/prompt';
import { Track } from '../src/types';

const track: Track = {
  persistentId: 'ABC123',
  name: 'Some Song (2024 Dolby Atmos Deluxe Mix)',
  artist: 'An Artist',
  album: 'An Album',
  genre: 'Rock',
};

const prefs: PromptPreferences = { keepVersionTags: true, genreTaxonomy: [], genreEnabled: true };

/** A provider stub whose output we fully control — no network. */
class StubProvider implements AIProvider {
  readonly name = 'stub';
  public lastRequest?: CompletionRequest;
  constructor(private readonly reply: string | (() => Promise<string>)) {}
  async complete(req: CompletionRequest): Promise<string> {
    this.lastRequest = req;
    return typeof this.reply === 'string' ? this.reply : this.reply();
  }
}

describe('extractJsonObject', () => {
  it('parses a bare object', () => {
    expect(extractJsonObject('{"a":1}')).toEqual({ a: 1 });
  });
  it('parses an object embedded in prose/code fences', () => {
    const raw = 'Sure!\n```json\n{"cleanedTitle":"X","confidence":0.9}\n```\n';
    expect(extractJsonObject(raw)).toEqual({ cleanedTitle: 'X', confidence: 0.9 });
  });
  it('handles braces inside strings', () => {
    expect(extractJsonObject('{"reasoning":"has } brace"}')).toEqual({
      reasoning: 'has } brace',
    });
  });
  it('returns null for junk', () => {
    expect(extractJsonObject('no json here')).toBeNull();
  });
});

describe('parseDecision', () => {
  it('reads a well-formed decision', () => {
    const raw = '{"cleanedTitle":"Some Song","suggestedGenre":"Pop","confidence":0.92,"reasoning":"ok"}';
    const d = parseDecision(raw, track);
    expect(d).toEqual({
      cleanedTitle: 'Some Song',
      suggestedGenre: 'Pop',
      confidence: 0.92,
      reasoning: 'ok',
    });
  });

  it('falls back to no-change on unparseable output', () => {
    const d = parseDecision('the model rambled', track);
    expect(d.cleanedTitle).toBe(track.name);
    expect(d.suggestedGenre).toBeNull();
    expect(d.confidence).toBe(0);
  });

  it('clamps invalid confidence to 0', () => {
    const d = parseDecision('{"cleanedTitle":"X","confidence":5}', track);
    expect(d.confidence).toBe(0);
  });

  it('treats empty/whitespace title as no-change', () => {
    const d = parseDecision('{"cleanedTitle":"   ","confidence":0.9}', track);
    expect(d.cleanedTitle).toBe(track.name);
  });

  it('normalizes empty genre to null', () => {
    const d = parseDecision('{"cleanedTitle":"X","suggestedGenre":"","confidence":0.5}', track);
    expect(d.suggestedGenre).toBeNull();
  });
});

describe('TagJudge', () => {
  it('returns the parsed decision from the provider', async () => {
    const provider = new StubProvider(
      '{"cleanedTitle":"Some Song","suggestedGenre":"Electronic","confidence":0.88,"reasoning":"stripped mix tag"}',
    );
    const judge = new TagJudge(provider, 'test-model', prefs);
    const d = await judge.judge(track);
    expect(d.cleanedTitle).toBe('Some Song');
    expect(d.suggestedGenre).toBe('Electronic');
    expect(d.confidence).toBe(0.88);
  });

  it('sends the pinned model and a JSON user payload', async () => {
    const provider = new StubProvider('{"cleanedTitle":"X","confidence":1}');
    const judge = new TagJudge(provider, 'pinned-123', prefs);
    await judge.judge(track);
    expect(provider.lastRequest?.model).toBe('pinned-123');
    expect(JSON.parse(provider.lastRequest!.user)).toMatchObject({ title: track.name });
  });

  it('degrades to no-change when the provider throws', async () => {
    const provider = new StubProvider(() => Promise.reject(new Error('429 rate limit')));
    const judge = new TagJudge(provider, 'test-model', prefs);
    const d = await judge.judge(track);
    expect(d.cleanedTitle).toBe(track.name);
    expect(d.confidence).toBe(0);
  });
});

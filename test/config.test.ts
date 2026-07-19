import { parseConfig, DEFAULT_CONFIG } from '../src/config';
import { DEFAULT_MODELS } from '../src/ai/provider';

describe('parseConfig', () => {
  it('returns defaults for empty input', () => {
    expect(parseConfig({})).toEqual(DEFAULT_CONFIG);
    expect(parseConfig(undefined)).toEqual(DEFAULT_CONFIG);
  });

  it('fills the pinned default model when only provider is given', () => {
    const c = parseConfig({ provider: 'anthropic' });
    expect(c.model).toBe(DEFAULT_MODELS.anthropic);
  });

  it('respects an explicit model override', () => {
    const c = parseConfig({ provider: 'anthropic', model: 'claude-custom-999' });
    expect(c.model).toBe('claude-custom-999');
  });

  it('deep-merges nested sections', () => {
    const c = parseConfig({ features: { genre: true }, autonomy: { mode: 'auto' } });
    expect(c.features.genre).toBe(true);
    expect(c.features.titleCleanup).toBe(true); // default preserved
    expect(c.autonomy.mode).toBe('auto');
    expect(c.autonomy.confidenceThreshold).toBe(DEFAULT_CONFIG.autonomy.confidenceThreshold);
  });

  it('rejects an unknown provider', () => {
    expect(() => parseConfig({ provider: 'grok' })).toThrow(/Invalid provider/);
  });

  it('rejects an unknown autonomy mode', () => {
    expect(() => parseConfig({ autonomy: { mode: 'yolo' } })).toThrow(/autonomy.mode/);
  });

  it('rejects an out-of-range confidence threshold', () => {
    expect(() => parseConfig({ autonomy: { confidenceThreshold: 2 } })).toThrow(/out of range/);
  });

  it('rejects a non-string genre taxonomy', () => {
    expect(() => parseConfig({ preferences: { genreTaxonomy: [1, 2] } })).toThrow(/genreTaxonomy/);
  });

  it('accepts a valid full config', () => {
    const c = parseConfig({
      provider: 'anthropic',
      apiKeyEnv: 'MY_KEY',
      features: { titleCleanup: true, genre: true },
      autonomy: { mode: 'confidence', confidenceThreshold: 0.7 },
      dryRun: false,
      pollIntervalSeconds: 120,
      preferences: { keepVersionTags: false, genreTaxonomy: ['Jazz', 'Ambient'] },
    });
    expect(c.apiKeyEnv).toBe('MY_KEY');
    expect(c.preferences.genreTaxonomy).toEqual(['Jazz', 'Ambient']);
    expect(c.pollIntervalSeconds).toBe(120);
  });
});

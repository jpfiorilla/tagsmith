import { disposition, planDispositions } from '../src/apply';
import { DEFAULT_CONFIG, Config } from '../src/config';
import { ProposedChange } from '../src/types';

function cfg(overrides: Partial<Config> = {}): Config {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    autonomy: { ...DEFAULT_CONFIG.autonomy, ...(overrides.autonomy ?? {}) },
  };
}

function change(confidence: number): ProposedChange {
  return {
    persistentId: 'P1',
    field: 'title',
    from: 'A (Remaster)',
    to: 'A',
    source: 'ai',
    confidence,
  };
}

describe('disposition', () => {
  it('dry-run overrides every mode', () => {
    expect(disposition(change(1), cfg({ dryRun: true, autonomy: { mode: 'auto', confidenceThreshold: 0 } }))).toBe(
      'skipped-dry-run',
    );
  });

  it('auto applies everything', () => {
    expect(disposition(change(0.1), cfg({ dryRun: false, autonomy: { mode: 'auto', confidenceThreshold: 0.9 } }))).toBe(
      'applied',
    );
  });

  it('review queues everything', () => {
    expect(disposition(change(1), cfg({ dryRun: false, autonomy: { mode: 'review', confidenceThreshold: 0 } }))).toBe(
      'queued',
    );
  });

  describe('confidence mode', () => {
    const c = cfg({ dryRun: false, autonomy: { mode: 'confidence', confidenceThreshold: 0.85 } });
    it('applies at/above threshold', () => {
      expect(disposition(change(0.85), c)).toBe('applied');
      expect(disposition(change(0.99), c)).toBe('applied');
    });
    it('queues below threshold', () => {
      expect(disposition(change(0.84), c)).toBe('queued');
    });
  });

  it('plans a batch', () => {
    const results = planDispositions(
      [change(0.9), change(0.5)],
      cfg({ dryRun: false, autonomy: { mode: 'confidence', confidenceThreshold: 0.85 } }),
    );
    expect(results.map((r) => r.disposition)).toEqual(['applied', 'queued']);
  });
});

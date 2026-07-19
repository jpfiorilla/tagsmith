import { DEFAULT_MODELS, ProviderName } from './ai/provider';

export type AutonomyMode = 'auto' | 'review' | 'confidence';

export interface Config {
  provider: ProviderName;
  /** Pinned model id; defaults to the provider's static snapshot. */
  model: string;
  /** Name of the environment variable that holds the API key (BYO key). */
  apiKeyEnv: string;
  features: {
    titleCleanup: boolean;
    genre: boolean;
  };
  autonomy: {
    mode: AutonomyMode;
    /** Used only when mode === 'confidence': apply at/above this, queue below. */
    confidenceThreshold: number;
  };
  /** Global override: when true, nothing is written — only logged. */
  dryRun: boolean;
  pollIntervalSeconds: number;
  preferences: {
    keepVersionTags: boolean;
    genreTaxonomy: string[];
  };
}

export const DEFAULT_CONFIG: Config = {
  provider: 'anthropic',
  model: DEFAULT_MODELS.anthropic,
  apiKeyEnv: 'ANTHROPIC_API_KEY',
  features: { titleCleanup: true, genre: false },
  autonomy: { mode: 'confidence', confidenceThreshold: 0.85 },
  dryRun: true,
  pollIntervalSeconds: 60,
  preferences: { keepVersionTags: true, genreTaxonomy: [] },
};

const PROVIDERS: ProviderName[] = ['anthropic', 'openai', 'gemini'];
const MODES: AutonomyMode[] = ['auto', 'review', 'confidence'];

/**
 * Validate and normalize an untrusted config object (e.g. parsed JSON) against the
 * defaults. Throws with a clear message on invalid input. Missing fields fall back to
 * defaults; if only the provider is given, its default pinned model is used.
 */
export function parseConfig(input: unknown): Config {
  const obj = (input ?? {}) as Record<string, unknown>;
  const d = DEFAULT_CONFIG;

  const provider = pickEnum(obj.provider, PROVIDERS, d.provider, 'provider');
  const model =
    typeof obj.model === 'string' && obj.model.trim().length > 0
      ? obj.model
      : DEFAULT_MODELS[provider];

  const features = asObject(obj.features);
  const autonomy = asObject(obj.autonomy);
  const preferences = asObject(obj.preferences);

  const mode = pickEnum(autonomy.mode, MODES, d.autonomy.mode, 'autonomy.mode');
  const threshold = pickNumber(
    autonomy.confidenceThreshold,
    d.autonomy.confidenceThreshold,
    0,
    1,
    'autonomy.confidenceThreshold',
  );

  return {
    provider,
    model,
    apiKeyEnv:
      typeof obj.apiKeyEnv === 'string' && obj.apiKeyEnv.length > 0 ? obj.apiKeyEnv : d.apiKeyEnv,
    features: {
      titleCleanup: pickBool(features.titleCleanup, d.features.titleCleanup),
      genre: pickBool(features.genre, d.features.genre),
    },
    autonomy: { mode, confidenceThreshold: threshold },
    dryRun: pickBool(obj.dryRun, d.dryRun),
    pollIntervalSeconds: pickNumber(
      obj.pollIntervalSeconds,
      d.pollIntervalSeconds,
      5,
      86_400,
      'pollIntervalSeconds',
    ),
    preferences: {
      keepVersionTags: pickBool(preferences.keepVersionTags, d.preferences.keepVersionTags),
      genreTaxonomy: pickStringArray(preferences.genreTaxonomy, d.preferences.genreTaxonomy),
    },
  };
}

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

function pickEnum<T extends string>(v: unknown, allowed: T[], fallback: T, label: string): T {
  if (v === undefined) return fallback;
  if (typeof v === 'string' && (allowed as string[]).includes(v)) return v as T;
  throw new Error(`Invalid ${label}: "${String(v)}". Allowed: ${allowed.join(', ')}`);
}

function pickBool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function pickNumber(v: unknown, fallback: number, min: number, max: number, label: string): number {
  if (v === undefined) return fallback;
  if (typeof v !== 'number' || Number.isNaN(v)) {
    throw new Error(`Invalid ${label}: expected a number, got ${String(v)}`);
  }
  if (v < min || v > max) {
    throw new Error(`Invalid ${label}: ${v} out of range [${min}, ${max}]`);
  }
  return v;
}

function pickStringArray(v: unknown, fallback: string[]): string[] {
  if (v === undefined) return fallback;
  if (Array.isArray(v) && v.every((x) => typeof x === 'string')) return v as string[];
  throw new Error('Invalid preferences.genreTaxonomy: expected an array of strings');
}

import { AIProvider } from './provider';
import { buildSystemPrompt, buildUserPrompt, PromptPreferences } from './prompt';
import { Track, TagDecision } from '../types';

/**
 * TagJudge is the higher-order interface over whatever provider is configured. It turns
 * a Track into a validated TagDecision. All the non-determinism is isolated to the
 * provider's `complete()`; everything else here (prompt building, JSON extraction,
 * validation, safe fallback) is pure and unit-tested.
 */
export class TagJudge {
  constructor(
    private readonly provider: AIProvider,
    private readonly model: string,
    private readonly prefs: PromptPreferences,
    private readonly maxTokens = 400,
  ) {}

  async judge(track: Track): Promise<TagDecision> {
    let raw: string;
    try {
      raw = await this.provider.complete({
        system: buildSystemPrompt(this.prefs),
        user: buildUserPrompt(track),
        model: this.model,
        maxTokens: this.maxTokens,
      });
    } catch {
      // Provider failed → make no claim, change nothing.
      return noChange(track, 'provider error');
    }
    return parseDecision(raw, track);
  }
}

/** A safe "do nothing" decision, used whenever we can't trust the model output. */
export function noChange(track: Track, reasoning: string): TagDecision {
  return { cleanedTitle: track.name, suggestedGenre: null, confidence: 0, reasoning };
}

/**
 * Robustly extract a JSON object from raw model text (tolerates stray prose or code
 * fences) and validate it. Any malformed / unsafe output degrades to no-change.
 */
export function parseDecision(raw: string, track: Track): TagDecision {
  const json = extractJsonObject(raw);
  if (!json) return noChange(track, 'unparseable output');

  const title =
    typeof json.cleanedTitle === 'string' && json.cleanedTitle.trim().length > 0
      ? json.cleanedTitle
      : track.name;

  const genre =
    typeof json.suggestedGenre === 'string' && json.suggestedGenre.trim().length > 0
      ? json.suggestedGenre
      : null;

  const confidence =
    typeof json.confidence === 'number' && json.confidence >= 0 && json.confidence <= 1
      ? json.confidence
      : 0;

  const reasoning = typeof json.reasoning === 'string' ? json.reasoning : '';

  return { cleanedTitle: title, suggestedGenre: genre, confidence, reasoning };
}

interface RawDecision {
  cleanedTitle?: unknown;
  suggestedGenre?: unknown;
  confidence?: unknown;
  reasoning?: unknown;
}

/** Find and parse the first balanced {...} object in a string. */
export function extractJsonObject(text: string): RawDecision | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const slice = text.slice(start, i + 1);
        try {
          return JSON.parse(slice) as RawDecision;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

// Provider-agnostic AI interface. Every backend (Claude, OpenAI, Gemini, local) is a
// thin adapter that turns a CompletionRequest into raw model text. Keeping this surface
// tiny is what makes the higher-order judge deterministic and unit-testable: tests mock
// `complete()` and never touch the network.

export interface CompletionRequest {
  system: string;
  user: string;
  model: string;
  /** Kept low + fixed for predictability; providers pass temperature 0. */
  maxTokens: number;
}

export interface AIProvider {
  readonly name: string;
  complete(req: CompletionRequest): Promise<string>;
}

export type ProviderName = 'anthropic' | 'openai' | 'gemini';

/**
 * Pinned, static default models per provider. Static snapshots (not floating
 * aliases like "latest") give reproducible output the test suite can rely on.
 * Users may override in config; verify the exact id is enabled for your account.
 */
export const DEFAULT_MODELS: Record<ProviderName, string> = {
  anthropic: 'claude-haiku-4-5-20251001',
  openai: 'gpt-4o-mini-2024-07-18',
  gemini: 'gemini-1.5-flash-002',
};

/** Thrown when a provider call fails; callers treat this as "no decision". */
export class ProviderError extends Error {
  constructor(
    public readonly provider: string,
    message: string,
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'ProviderError';
  }
}

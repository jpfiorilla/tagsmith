import { AIProvider } from './provider';
import { AnthropicProvider } from './providers/anthropic';
import { Config } from '../config';

/**
 * Build the configured AI provider. For now only Claude (Anthropic) is wired up; the
 * OpenAI and Gemini adapters exist and implement the same interface, but are held back
 * until we formally add multi-provider support. Adding one is: import it here + a case.
 */
export function createProvider(config: Config, apiKey: string): AIProvider {
  switch (config.provider) {
    case 'anthropic':
      return new AnthropicProvider(apiKey);
    case 'openai':
    case 'gemini':
      throw new Error(
        `Provider "${config.provider}" is planned but not yet supported. Set provider to "anthropic" for now.`,
      );
    default: {
      const _exhaustive: never = config.provider;
      throw new Error(`Unknown provider: ${String(_exhaustive)}`);
    }
  }
}
